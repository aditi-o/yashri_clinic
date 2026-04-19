const prisma = require('../../config/database');

class MedicineRepository {
  /**
   * Create a new medicine
   * @param {Object} data - Medicine data
   * @returns {Promise<Object>} Created medicine
   */
  async createMedicine(data) {
    return await prisma.medicine.create({
      data,
    });
  }

  /**
   * Get all medicines
   * @param {boolean} activeOnly - Filter for active medicines only
   * @returns {Promise<Array>} List of medicines
   */
  async getAllMedicines(activeOnly = false) {
    return await prisma.medicine.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get medicine by ID
   * @param {string} medicineId - Medicine ID
   * @returns {Promise<Object|null>} Medicine object
   */
  async getMedicineById(medicineId) {
    return await prisma.medicine.findUnique({
      where: { id: medicineId },
    });
  }

  /**
   * Update medicine
   * @param {string} medicineId - Medicine ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated medicine
   */
  async updateMedicine(medicineId, data) {
    return await prisma.medicine.update({
      where: { id: medicineId },
      data,
    });
  }

  /**
   * Delete medicine (soft delete by setting isActive to false)
   * @param {string} medicineId - Medicine ID
   * @returns {Promise<Object>} Updated medicine
   */
  async deleteMedicine(medicineId) {
    return await prisma.medicine.update({
      where: { id: medicineId },
      data: { isActive: false },
    });
  }

  /**
   * Search medicines by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching medicines
   */
  async searchMedicines(searchTerm) {
    return await prisma.medicine.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { genericName: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = new MedicineRepository();
