const prisma = require('../../config/database');

class AiRepository {
  /**
   * Resolve patient record from a user_id (JWT-derived).
   * NEVER accept patient_id directly from the patient-facing chat endpoint.
   */
  async findPatientByUserId(userId) {
    return prisma.patient.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        allergies: true,
      },
    });
  }

  /**
   * Fetch patient by direct ID — used only by doctor-summary endpoint
   * (doctor supplies patient_id; role guard enforced at route level).
   */
  async findPatientById(patientId) {
    return prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        allergies: true,
      },
    });
  }

  /**
   * Full visit history for a patient including prescriptions, vitals, doctor info.
   * @param {string} patientId
   * @param {number} limit - max visits to return (default all)
   */
  async getVisitsForPatient(patientId, limit) {
    return prisma.visit.findMany({
      where: { patientId },
      orderBy: { visitDate: 'desc' },
      take: limit || undefined,
      include: {
        doctor: {
          select: { firstName: true, lastName: true, specialization: true },
        },
        prescriptions: {
          include: {
            medicine: {
              select: { name: true, genericName: true, dosageForm: true, strength: true },
            },
          },
        },
      },
    });
  }

  /**
   * Save a chat exchange for audit / history (optional table).
   * Fails silently — chat must still work even if logging fails.
   */
  async saveChatMessage({ patientId, message, reply }) {
    try {
      return await prisma.aIChatMessage.create({
        data: { patientId, message, reply },
      });
    } catch {
      // Table may not exist yet — non-fatal
      return null;
    }
  }
}

module.exports = new AiRepository();
