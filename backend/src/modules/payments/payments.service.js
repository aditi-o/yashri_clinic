const paymentRepository = require('./payments.repository');
const billingRepository = require('../billing/billing.repository');
const { Decimal } = require('@prisma/client/runtime/library');

class PaymentService {
  /**
   * Add payment to invoice
   * CRITICAL: Updates invoice status dynamically based on total payments
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Created payment with updated invoice status
   */
  async createPayment(data) {
    // Check if invoice exists
    const invoice = await billingRepository.getInvoiceById(data.invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate current total paid
    const currentTotalPaid = invoice.payments.reduce(
      (sum, payment) => sum.plus(new Decimal(payment.amount)),
      new Decimal(0)
    );

    // Check if payment amount is valid
    const invoiceFinalAmount = new Decimal(invoice.finalAmount);
    const paymentAmount = new Decimal(data.amount);
    const remainingAmount = invoiceFinalAmount.minus(currentTotalPaid);

    if (paymentAmount.greaterThan(remainingAmount)) {
      throw new Error(
        `Payment amount exceeds remaining balance. Remaining: ${remainingAmount.toFixed(2)}`
      );
    }

    // Create payment
    const payment = await paymentRepository.createPayment(data);

    // Calculate new status dynamically
    const newTotalPaid = currentTotalPaid.plus(paymentAmount);
    let status;

    if (newTotalPaid.equals(0)) {
      status = 'UNPAID';
    } else if (newTotalPaid.lessThan(invoiceFinalAmount)) {
      status = 'PARTIAL';
    } else {
      status = 'PAID';
    }

    return {
      ...payment,
      invoice: {
        ...payment.invoice,
        totalPaid: Number(newTotalPaid.toFixed(2)),
        status,
        remainingAmount: Number(invoiceFinalAmount.minus(newTotalPaid).toFixed(2)),
      },
    };
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentById(paymentId) {
    const payment = await paymentRepository.getPaymentById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  /**
   * Get payments by invoice ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} List of payments
   */
  async getPaymentsByInvoiceId(invoiceId) {
    const invoice = await billingRepository.getInvoiceById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payments = await paymentRepository.getPaymentsByInvoiceId(invoiceId);

    // Calculate totals
    const invoiceFinalAmount = new Decimal(invoice.finalAmount);
    const totalPaidDecimal = payments.reduce(
      (sum, payment) => sum.plus(new Decimal(payment.amount)),
      new Decimal(0)
    );
    const remainingAmountDecimal = invoiceFinalAmount.minus(totalPaidDecimal);
    const totalPaid = Number(totalPaidDecimal.toFixed(2));
    const remainingAmount = Number(remainingAmountDecimal.toFixed(2));

    return {
      payments,
      summary: {
        totalAmount: Number(invoiceFinalAmount.toFixed(2)),
        totalPaid,
        remainingAmount,
        status: totalPaidDecimal.equals(0)
          ? 'UNPAID'
          : totalPaidDecimal.lessThan(invoiceFinalAmount)
            ? 'PARTIAL'
            : 'PAID',
      },
    };
  }

  /**
   * Get payments by patient ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of payments
   */
  async getPaymentsByPatientId(patientId) {
    return await paymentRepository.getPaymentsByPatientId(patientId);
  }
}

module.exports = new PaymentService();
