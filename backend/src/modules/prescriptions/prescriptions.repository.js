const prisma = require('../../config/database');

class PrescriptionRepository {
  /**
   * Create multiple prescriptions for a visit
   * @param {string} visitId - Visit ID
   * @param {Array} medicines - Array of medicine prescriptions
   * @returns {Promise<Array>} Created prescriptions
   */
  async createPrescriptions(visitId, medicines) {
    const prescriptions = await prisma.$transaction(
      medicines.map((med) =>
        prisma.prescription.create({
          data: {
            visitId,
            medicineId: med.medicineId,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
          },
          include: {
            medicine: true,
          },
        })
      )
    );

    return prescriptions;
  }

  /**
   * Get prescriptions by visit ID
   * @param {string} visitId - Visit ID
   * @returns {Promise<Array>} List of prescriptions
   */
  async getPrescriptionsByVisitId(visitId) {
    return await prisma.prescription.findMany({
      where: { visitId },
      include: {
        medicine: true,
      },
    });
  }

  /**
   * Get prescription by ID
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object|null>} Prescription object
   */
  async getPrescriptionById(prescriptionId) {
    return await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        medicine: true,
        visit: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            doctor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePrescription(prescriptionId, data) {
    return await prisma.prescription.update({
      where: { id: prescriptionId },
      data,
      include: {
        medicine: true,
      },
    });
  }

  /**
   * Delete prescription
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object>} Deleted prescription
   */
  async deletePrescription(prescriptionId) {
    return await prisma.prescription.delete({
      where: { id: prescriptionId },
    });
  }
}

module.exports = new PrescriptionRepository();
