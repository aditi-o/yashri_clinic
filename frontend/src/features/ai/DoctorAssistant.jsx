import { useEffect, useState } from 'react';
import aiApi from './ai.api';

// ── Skeleton loader ────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'var(--surface-2)' }}
    />
  );
}

function SummarySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-2 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ── Vital signs mini-grid ──────────────────────────────────────────────────
function VitalsGrid({ vitals }) {
  if (!vitals) return null;
  const items = [
    { label: 'Temp',   value: vitals.temperature ? `${vitals.temperature}°F` : null },
    { label: 'BP',     value: vitals.bloodPressure || null },
    { label: 'Pulse',  value: vitals.pulse ? `${vitals.pulse} bpm` : null },
    { label: 'Weight', value: vitals.weight ? `${vitals.weight} kg` : null },
  ].filter((v) => v.value);

  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg px-2.5 py-1.5"
          style={{ background: 'var(--azure-light)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-xs font-semibold" style={{ color: 'var(--azure-dark)' }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
/**
 * DoctorAssistant
 *
 * Props:
 *   patientId {string} — required. Passed from CreateVisit / appointment context.
 */
export default function DoctorAssistant({ patientId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const result = await aiApi.doctorSummary(patientId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load patient summary.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSummary();
    return () => { cancelled = true; };
  }, [patientId]);

  if (!patientId) return null;

  const structured = data?.structured;
  const patient    = structured?.patient;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ border: '1px solid var(--border)', background: 'white' }}
    >
      {/* ── Panel header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ background: 'linear-gradient(135deg, #1a6cf5 0%, #5b4af5 100%)', color: 'white' }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <div>
            <p className="font-semibold text-sm" style={{ fontFamily: 'Sora,sans-serif' }}>
              AI Patient Summary
            </p>
            {patient && (
              <p className="text-xs opacity-80">
                {patient.name} · {patient.age ? `${patient.age} yrs` : ''} · {patient.gender}
              </p>
            )}
          </div>
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Panel body ── */}
      {!collapsed && (
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>

          {/* Loading */}
          {loading && (
            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Generating summary…
              </p>
              <SummarySkeleton />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'var(--danger-light)', color: '#b91c1c' }}
            >
              <p className="font-semibold mb-1">⚠️ Could not load summary</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          )}

          {/* Data loaded */}
          {data && !loading && (
            <>
              {/* AI Narrative Summary */}
              <Section icon="📋" title="AI Summary">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}
                >
                  {data.summary}
                </p>
              </Section>

              {/* Patient Flags */}
              {patient && (patient.allergies !== 'None recorded' || patient.bloodGroup !== 'Unknown') && (
                <Section icon="⚠️" title="Patient Flags">
                  <div className="space-y-1.5">
                    {patient.allergies && patient.allergies !== 'None recorded' && (
                      <div
                        className="flex items-start gap-2 rounded-lg px-3 py-2"
                        style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
                      >
                        <span className="text-orange-500 text-xs font-bold mt-0.5">ALLERGY</span>
                        <span className="text-xs" style={{ color: 'var(--text)' }}>{patient.allergies}</span>
                      </div>
                    )}
                    {patient.bloodGroup && patient.bloodGroup !== 'Unknown' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Blood Group:</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--danger-light)', color: '#b91c1c' }}
                        >
                          {patient.bloodGroup}
                        </span>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Recent Visits */}
              {structured.recentVisits?.length > 0 && (
                <Section icon="🗓️" title="Recent Visits">
                  <div className="space-y-3">
                    {structured.recentVisits.map((v, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{ background: 'white', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                            {v.diagnosis}
                          </p>
                          <span
                            className="text-xs shrink-0 px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                          >
                            {v.date}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Chief complaint: {v.chiefComplaint}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
                          {v.doctor}
                        </p>
                        <VitalsGrid vitals={v.vitalSigns} />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Current Medications */}
              {structured.currentMedications?.length > 0 && (
                <Section icon="💊" title="Recent Medications">
                  <div className="space-y-2">
                    {structured.currentMedications.map((m, i) => (
                      <div
                        key={i}
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: 'white', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                            {m.name}
                            {m.genericName && (
                              <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                                ({m.genericName})
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {m.dosage} · {m.frequency} · {m.duration}
                        </p>
                        {m.instructions && (
                          <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-light)' }}>
                            {m.instructions}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>
                          Prescribed {m.prescribedOn}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* All diagnoses tag cloud */}
              {structured.allDiagnoses?.length > 0 && (
                <Section icon="🩺" title="Diagnosis History">
                  <div className="flex flex-wrap gap-1.5">
                    {structured.allDiagnoses.map((d, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--azure-light)', color: 'var(--azure-dark)' }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* No history */}
              {structured.recentVisits?.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No prior visit history for this patient.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
