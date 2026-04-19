const prescriptionService = require('./prescriptions.service');
const { createPrescriptionSchema, updatePrescriptionSchema } = require('./prescriptions.validator');

class PrescriptionController {
  /**
   * Create prescriptions
   * POST /prescriptions
   */
  async createPrescriptions(req, res) {
    try {
      const validatedData = createPrescriptionSchema.parse(req.body);
      const prescriptions = await prescriptionService.createPrescriptions(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Prescriptions created successfully',
        data: prescriptions,
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
   * Get prescriptions by visit ID
   * GET /prescriptions/visit/:visitId
   */
  async getPrescriptionsByVisitId(req, res) {
    try {
      const prescriptions = await prescriptionService.getPrescriptionsByVisitId(req.params.visitId);

      return res.status(200).json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get prescription by ID
   * GET /prescriptions/:id
   */
  async getPrescriptionById(req, res) {
    try {
      const prescription = await prescriptionService.getPrescriptionById(req.params.id);

      return res.status(200).json({
        success: true,
        data: prescription,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update prescription
   * PUT /prescriptions/:id
   */
  async updatePrescription(req, res) {
    try {
      const validatedData = updatePrescriptionSchema.parse(req.body);
      const prescription = await prescriptionService.updatePrescription(
        req.params.id,
        validatedData
      );

      return res.status(200).json({
        success: true,
        message: 'Prescription updated successfully',
        data: prescription,
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
   * Delete prescription
   * DELETE /prescriptions/:id
   */
  async deletePrescription(req, res) {
    try {
      await prescriptionService.deletePrescription(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Prescription deleted successfully',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PrescriptionController();
