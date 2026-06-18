const prisma = require('../../config/database');

class BillingRepository {
  /**
   * Create invoice
   * @param {Object} data - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(data) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const invoiceNumber = data.invoiceNumber || await this._generateInvoiceNumberTx(tx);
          return tx.invoice.create({
            data: {
              ...data,
              invoiceNumber,
            },
          });
        }, { maxWait: 10000, timeout: 15000 });

        return this.getInvoiceById(created.id);
      } catch (error) {
        const isUniqueViolation = error.code === 'P2002';
        if (!isUniqueViolation || attempt === maxRetries) {
          throw error;
        }
      }
    }
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object|null>} Invoice object
   */
  async getInvoiceById(invoiceId) {
    return await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        visit: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                consultationFee: true,
              },
            },
            prescriptions: {
              include: {
                medicine: true,
              },
            },
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
    });
  }

  /**
   * Get invoice by visit ID
   * @param {string} visitId - Visit ID
   * @returns {Promise<Object|null>} Invoice object
   */
  async getInvoiceByVisitId(visitId) {
    return await prisma.invoice.findUnique({
      where: { visitId },
      include: {
        visit: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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
    });
  }

  /**
   * Get invoices by patient ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of invoices
   */
  async getInvoicesByPatientId(patientId) {
    return await prisma.invoice.findMany({
      where: { patientId },
      include: {
        visit: {
          select: {
            visitDate: true,
            diagnosis: true,
          },
        },
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  /**
   * Update invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInvoice(invoiceId, data) {
    return await prisma.invoice.update({
      where: { id: invoiceId },
      data,
      include: {
        visit: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Generate unique invoice number
   * @returns {Promise<string>} Invoice number
   */
  async generateInvoiceNumber() {
    return prisma.$transaction(async (tx) => this._generateInvoiceNumberTx(tx), {
      maxWait: 10000,
      timeout: 15000,
    });
  }

  async _generateInvoiceNumberTx(tx) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}-`;

    const latest = await tx.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    const latestSeq = latest ? Number(latest.invoiceNumber.slice(prefix.length)) || 0 : 0;
    return `${prefix}${String(latestSeq + 1).padStart(5, '0')}`;
  }
}

module.exports = new BillingRepository();
