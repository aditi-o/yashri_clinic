const prisma = require('../../config/database');

class PaymentRepository {
  /**
   * Create payment
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async createPayment(data) {
    return await prisma.payment.create({
      data,
      include: {
        invoice: {
          include: {
            visit: {
              select: {
                visitDate: true,
              },
            },
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object|null>} Payment object
   */
  async getPaymentById(paymentId) {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            patient: {
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
   * Get all payments
   * @returns {Promise<Array>} List of payments
   */
  async getAllPayments() {
    return await prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Get payments by invoice ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Array>} List of payments
   */
  async getPaymentsByInvoiceId(invoiceId) {
    return await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Get all payments for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of payments
   */
  async getPaymentsByPatientId(patientId) {
    return await prisma.payment.findMany({
      where: {
        invoice: {
          patientId,
        },
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            finalAmount: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Delete payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Deleted payment
   */
  async deletePayment(paymentId) {
    return await prisma.payment.delete({
      where: { id: paymentId },
    });
  }
}

module.exports = new PaymentRepository();
