const billingService = require('./billing.service');
const { createInvoiceSchema, updateInvoiceSchema } = require('./billing.validator');

class BillingController {
  /**
   * Create invoice
   * POST /billing/invoices
   */
  async createInvoice(req, res) {
    try {
      const validatedData = createInvoiceSchema.parse(req.body);
      const invoice = await billingService.createInvoice(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
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
   * Get invoice by ID
   * GET /billing/invoices/:id
   */
  async getInvoiceById(req, res) {
    try {
      const invoice = await billingService.getInvoiceById(req.params.id);

      return res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get invoice by visit ID
   * GET /billing/invoices/visit/:visitId
   */
  async getInvoiceByVisitId(req, res) {
    try {
      const invoice = await billingService.getInvoiceByVisitId(req.params.visitId);

      return res.status(200).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update invoice
   * PUT /billing/invoices/:id
   */
  async updateInvoice(req, res) {
    try {
      const validatedData = updateInvoiceSchema.parse(req.body);
      const invoice = await billingService.updateInvoice(req.params.id, validatedData);

      return res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
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
}

module.exports = new BillingController();
