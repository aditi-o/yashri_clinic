const medicineRepository = require('./medicines.repository');

class MedicineService {
  /**
   * Create a new medicine
   * @param {Object} data - Medicine data
   * @returns {Promise<Object>} Created medicine
   */
  async createMedicine(data) {
    return await medicineRepository.createMedicine(data);
  }

  /**
   * Get all medicines
   * @param {boolean} activeOnly - Filter for active medicines only
   * @returns {Promise<Array>} List of medicines
   */
  async getAllMedicines(activeOnly = true) {
    return await medicineRepository.getAllMedicines(activeOnly);
  }

  /**
   * Get medicine by ID
   * @param {string} medicineId - Medicine ID
   * @returns {Promise<Object>} Medicine details
   */
  async getMedicineById(medicineId) {
    const medicine = await medicineRepository.getMedicineById(medicineId);
    
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    return medicine;
  }

  /**
   * Update medicine
   * @param {string} medicineId - Medicine ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated medicine
   */
  async updateMedicine(medicineId, data) {
    const medicine = await medicineRepository.getMedicineById(medicineId);
    
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    return await medicineRepository.updateMedicine(medicineId, data);
  }

  /**
   * Delete medicine (soft delete)
   * @param {string} medicineId - Medicine ID
   * @returns {Promise<Object>} Updated medicine
   */
  async deleteMedicine(medicineId) {
    const medicine = await medicineRepository.getMedicineById(medicineId);
    
    if (!medicine) {
      throw new Error('Medicine not found');
    }

    return await medicineRepository.deleteMedicine(medicineId);
  }

  /**
   * Search medicines
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching medicines
   */
  async searchMedicines(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await this.getAllMedicines(true);
    }

    return await medicineRepository.searchMedicines(searchTerm);
  }
}

module.exports = new MedicineService();
