const medicineService = require('./medicines.service');
const { createMedicineSchema, updateMedicineSchema } = require('./medicines.validator');

class MedicineController {
  /**
   * Create medicine
   * POST /medicines
   */
  async createMedicine(req, res) {
    try {
      const validatedData = createMedicineSchema.parse(req.body);
      const medicine = await medicineService.createMedicine(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Medicine created successfully',
        data: medicine,
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all medicines
   * GET /medicines
   */
  async getAllMedicines(req, res) {
    try {
      const activeOnly = req.query.active !== 'false';
      const medicines = await medicineService.getAllMedicines(activeOnly);

      return res.status(200).json({
        success: true,
        data: medicines,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get medicine by ID
   * GET /medicines/:id
   */
  async getMedicineById(req, res) {
    try {
      const medicine = await medicineService.getMedicineById(req.params.id);

      return res.status(200).json({
        success: true,
        data: medicine,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update medicine
   * PUT /medicines/:id
   */
  async updateMedicine(req, res) {
    try {
      const validatedData = updateMedicineSchema.parse(req.body);
      const medicine = await medicineService.updateMedicine(req.params.id, validatedData);

      return res.status(200).json({
        success: true,
        message: 'Medicine updated successfully',
        data: medicine,
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete medicine
   * DELETE /medicines/:id
   */
  async deleteMedicine(req, res) {
    try {
      await medicineService.deleteMedicine(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Medicine deactivated successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Search medicines
   * GET /medicines/search?q=searchTerm
   */
  async searchMedicines(req, res) {
    try {
      const { q } = req.query;
      const medicines = await medicineService.searchMedicines(q);

      return res.status(200).json({
        success: true,
        data: medicines,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MedicineController();
