const paymentService = require('./payments.service');
const { createPaymentSchema } = require('./payments.validator');

class PaymentController {
  /**
   * Create payment
   * POST /payments
   */
  async createPayment(req, res) {
    try {
      const validatedData = createPaymentSchema.parse(req.body);
      const payment = await paymentService.createPayment(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
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
   * Get payment by ID
   * GET /payments/:id
   */
  async getPaymentById(req, res) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);

      return res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get all payments
   * GET /payments/admin/all
   */
  async getAllPayments(req, res) {
    try {
      const payments = await paymentService.getAllPayments();

      return res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get payments by invoice ID
   * GET /payments/invoice/:invoiceId
   */
  async getPaymentsByInvoiceId(req, res) {
    try {
      const result = await paymentService.getPaymentsByInvoiceId(req.params.invoiceId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete payment
   * DELETE /payments/:id
   */
  async deletePayment(req, res) {
    try {
      const result = await paymentService.deletePayment(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Payment deleted successfully',
        data: result,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();
