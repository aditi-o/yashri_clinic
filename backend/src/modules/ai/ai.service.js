const aiRepository = require('./ai.repository');

// ---------------------------------------------------------------------------
// OpenRouter API caller
// ---------------------------------------------------------------------------

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

/**
 * Call OpenRouter with a system prompt + user message.
 * Uses fetch (Node 18+). Falls back gracefully on network errors.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>} AI reply text
 */
async function callAI(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it to your backend .env file.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30 s timeout

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'Clinic Management System',
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        temperature: 0.3, // low temperature = factual, consistent responses
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      if (response.status === 401) {
        throw new Error(
          'OpenRouter authentication failed. Check OPENROUTER_API_KEY and make sure it belongs to an active OpenRouter account.'
        );
      }
      throw new Error(`OpenRouter API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) throw new Error('Empty response from AI model');
    return reply.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Context builders
// ---------------------------------------------------------------------------

/**
 * Convert raw DB visits into a compact, token-efficient JSON string
 * suitable for embedding in an AI prompt.
 */
function buildVisitContext(visits) {
  return visits.map((v) => ({
    date: new Date(v.visitDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    }),
    doctor: `Dr. ${v.doctor.firstName} ${v.doctor.lastName} (${v.doctor.specialization})`,
    chiefComplaint: v.chiefComplaint,
    diagnosis: v.diagnosis,
    symptoms: v.symptoms || null,
    notes: v.notes || null,
    vitalSigns: v.vitalSigns || null,
    followUpDate: v.followUpDate
      ? new Date(v.followUpDate).toLocaleDateString('en-IN')
      : null,
    prescriptions: v.prescriptions.map((p) => ({
      medicine: p.medicine.name,
      genericName: p.medicine.genericName || null,
      dosage: p.dosage,
      frequency: p.frequency,
      duration: p.duration,
      instructions: p.instructions || null,
    })),
  }));
}

function buildPatientContext(patient) {
  const age = patient.dateOfBirth
    ? Math.floor(
      (Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000)
    )
    : null;

  return {
    name: `${patient.firstName} ${patient.lastName}`,
    age,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup || 'Unknown',
    allergies: patient.allergies || 'None recorded',
  };
}

// ---------------------------------------------------------------------------
// Feature 1: Patient Chat
// ---------------------------------------------------------------------------

/**
 * Handle a patient's conversational question about their own health records.
 *
 * Security: user_id is ALWAYS taken from JWT — never from frontend payload.
 *
 * @param {string} userId  - from req.user.id (JWT-derived)
 * @param {string} message - patient's question
 * @returns {{ reply: string }}
 */
async function patientChat(userId, message) {
  // 1. Resolve patient from JWT user_id
  const patient = await aiRepository.findPatientByUserId(userId);

  if (!patient) {
    return {
      reply:
        'I could not find your patient profile. Please contact the clinic reception.',
    };
  }

  // 2. Fetch visit + prescription history
  const visits = await aiRepository.getVisitsForPatient(patient.id);

  // 3. Fallback when no data exists yet
  if (visits.length === 0) {
    await aiRepository.saveChatMessage({
      patientId: patient.id,
      message,
      reply: 'No medical history found.',
    });
    return {
      reply:
        "You don't have any recorded visits or prescriptions yet. Once your doctor records a visit, I'll be able to answer questions about your health history.",
    };
  }

  // 4. Build AI context
  const patientCtx = buildPatientContext(patient);
  const visitCtx = buildVisitContext(visits);

  const systemPrompt = `You are a helpful medical assistant for a clinic management system.
You have access to a patient's real medical records and must answer ONLY based on that data.

STRICT RULES:
- Answer ONLY from the provided medical data below
- Never invent medications, diagnoses, or dates
- Be empathetic, clear, and concise
- If the question cannot be answered from the data, say so honestly
- Do not give general medical advice or diagnoses
- Keep responses under 150 words unless detail is specifically requested

PATIENT PROFILE:
${JSON.stringify(patientCtx, null, 2)}

MEDICAL HISTORY (${visits.length} visit${visits.length !== 1 ? 's' : ''}, most recent first):
${JSON.stringify(visitCtx, null, 2)}`;

  // 5. Call AI
  const reply = await callAI(systemPrompt, message);

  // 6. Persist for audit (non-blocking)
  aiRepository.saveChatMessage({ patientId: patient.id, message, reply });

  return { reply };
}

// ---------------------------------------------------------------------------
// Feature 2: Doctor Summary
// ---------------------------------------------------------------------------

/**
 * Generate a structured patient summary for a doctor about to start a visit.
 *
 * Security: Only doctors can call this endpoint (role guard on route).
 * patient_id is supplied by the doctor, not derived from JWT.
 *
 * @param {string} patientId - patient's DB id
 * @returns {{ summary: string, structured: object }}
 */
async function doctorSummary(patientId) {
  // 1. Fetch patient profile
  const patient = await aiRepository.findPatientById(patientId);

  if (!patient) {
    throw new Error('Patient not found');
  }

  // 2. Fetch last 5 visits (enough context, token-efficient)
  const visits = await aiRepository.getVisitsForPatient(patientId, 5);

  const patientCtx = buildPatientContext(patient);

  // 3. Build structured data for frontend cards (no AI needed for this part)
  const structured = {
    patient: patientCtx,
    recentVisits: visits.slice(0, 3).map((v) => ({
      date: new Date(v.visitDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
      diagnosis: v.diagnosis,
      chiefComplaint: v.chiefComplaint,
      doctor: `Dr. ${v.doctor.firstName} ${v.doctor.lastName}`,
      vitalSigns: v.vitalSigns || null,
    })),
    currentMedications: extractCurrentMedications(visits),
    allDiagnoses: [...new Set(visits.map((v) => v.diagnosis))],
  };

  // 4. If no visits, return structured data with a simple message
  if (visits.length === 0) {
    return {
      summary: `${patient.firstName} ${patient.lastName} has no prior visit history at this clinic.`,
      structured,
    };
  }

  // 5. Generate AI narrative summary
  const visitCtx = buildVisitContext(visits);

  const systemPrompt = `You are a clinical assistant helping a doctor prepare for a patient consultation.
Generate a concise pre-consultation briefing based ONLY on the patient's actual records.

FORMAT:
- Start with a 1-sentence patient overview
- List key diagnoses (bullet points)
- List current/recent medications
- Note any allergies or important flags
- End with a 1-sentence note about the most recent visit

RULES:
- Be clinical and precise
- Max 200 words
- No invented information
- Flag allergies prominently if present`;

  const userMessage = `Generate a pre-consultation summary for this patient:

PATIENT: ${JSON.stringify(patientCtx, null, 2)}
VISIT HISTORY: ${JSON.stringify(visitCtx, null, 2)}`;

  const summary = await callAI(systemPrompt, userMessage);

  return { summary, structured };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract unique medications from the most recent visits.
 * "Current" = prescribed in the last 3 visits.
 */
function extractCurrentMedications(visits) {
  const recent = visits.slice(0, 3);
  const seen = new Set();
  const meds = [];

  for (const visit of recent) {
    for (const p of visit.prescriptions) {
      const key = p.medicine.name;
      if (!seen.has(key)) {
        seen.add(key);
        meds.push({
          name: p.medicine.name,
          genericName: p.medicine.genericName || null,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions || null,
          prescribedOn: new Date(visit.visitDate).toLocaleDateString('en-IN'),
        });
      }
    }
  }

  return meds;
}

module.exports = { patientChat, doctorSummary };
