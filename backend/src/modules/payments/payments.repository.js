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

  /**
   * Admin dashboard stats — visits (fees) + payment records + invoices
   */
  async getAdminPaymentStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      payments,
      todayPayments,
      allVisits,
      todayVisits,
      invoiceCounts,
      visitsWithoutInvoice,
    ] = await Promise.all([
      prisma.payment.findMany({ select: { amount: true } }),
      prisma.payment.findMany({
        where: { paymentDate: { gte: todayStart, lte: todayEnd } },
        select: { amount: true },
      }),
      prisma.visit.findMany({ select: { visitFee: true } }),
      prisma.visit.findMany({
        where: { visitDate: { gte: todayStart, lte: todayEnd } },
        select: { visitFee: true },
      }),
      prisma.invoice.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.visit.count({
        where: {
          visitFee: { gt: 0 },
          invoice: null,
        },
      }),
    ]);

    const sumAmount = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const sumFee = (rows) => rows.reduce((s, r) => s + Number(r.visitFee || 0), 0);

    const invoicesByStatus = invoiceCounts.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    return {
      paymentsCollected: sumAmount(payments),
      todayPaymentsCollected: sumAmount(todayPayments),
      paymentTransactions: payments.length,
      todayPaymentTransactions: todayPayments.length,
      visitRevenue: sumFee(allVisits),
      todayVisitRevenue: sumFee(todayVisits),
      totalVisits: allVisits.length,
      todayVisits: todayVisits.length,
      totalInvoices: Object.values(invoicesByStatus).reduce((s, n) => s + n, 0),
      unpaidInvoices: invoicesByStatus.UNPAID ?? 0,
      paidInvoices: invoicesByStatus.PAID ?? 0,
      visitsPendingBilling: visitsWithoutInvoice,
    };
  }

  /**
   * Visits with fees that have no invoice yet (for billing sync)
   */
  async getVisitsPendingBilling() {
    return prisma.visit.findMany({
      where: {
        visitFee: { gt: 0 },
        invoice: null,
      },
      select: {
        id: true,
        patientId: true,
        visitFee: true,
        visitDate: true,
      },
      orderBy: { visitDate: 'asc' },
    });
  }

  /**
   * Invoices with no payment records yet
   */
  async getInvoicesWithoutPayments() {
    return prisma.invoice.findMany({
      where: { payments: { none: {} } },
      include: { visit: { select: { visitFee: true } } },
    });
  }
}

module.exports = new PaymentRepository();
