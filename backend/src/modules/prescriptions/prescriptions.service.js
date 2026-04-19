const prescriptionRepository = require('./prescriptions.repository');
const visitRepository = require('../visits/visits.repository');

class PrescriptionService {
  /**
   * Add multiple medicines to a visit
   * @param {Object} data - Prescription data with visitId and medicines array
   * @returns {Promise<Array>} Created prescriptions
   */
  async createPrescriptions(data) {
    const { visitId, medicines } = data;

    // Check if visit exists
    const visit = await visitRepository.getVisitById(visitId);
    
    if (!visit) {
      throw new Error('Visit not found');
    }

    // Create prescriptions
    const prescriptions = await prescriptionRepository.createPrescriptions(visitId, medicines);

    return prescriptions;
  }

  /**
   * Get prescriptions for a visit
   * @param {string} visitId - Visit ID
   * @returns {Promise<Array>} List of prescriptions
   */
  async getPrescriptionsByVisitId(visitId) {
    return await prescriptionRepository.getPrescriptionsByVisitId(visitId);
  }

  /**
   * Get prescription by ID
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object>} Prescription details
   */
  async getPrescriptionById(prescriptionId) {
    const prescription = await prescriptionRepository.getPrescriptionById(prescriptionId);
    
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    return prescription;
  }

  /**
   * Update prescription
   * @param {string} prescriptionId - Prescription ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePrescription(prescriptionId, data) {
    const prescription = await prescriptionRepository.getPrescriptionById(prescriptionId);
    
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    return await prescriptionRepository.updatePrescription(prescriptionId, data);
  }

  /**
   * Delete prescription
   * @param {string} prescriptionId - Prescription ID
   * @returns {Promise<Object>} Deleted prescription
   */
  async deletePrescription(prescriptionId) {
    const prescription = await prescriptionRepository.getPrescriptionById(prescriptionId);
    
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    return await prescriptionRepository.deletePrescription(prescriptionId);
  }
}

module.exports = new PrescriptionService();
