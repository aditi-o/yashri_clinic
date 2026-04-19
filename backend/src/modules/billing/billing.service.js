const billingRepository = require('./billing.repository');
const visitRepository = require('../visits/visits.repository');
const { Decimal } = require('@prisma/client/runtime/library');

class BillingService {
  /**
   * Auto-create invoice after visit completion
   * Calculates total based on consultation fee + medicine charges
   * @param {Object} data - Invoice data with visitId
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(data) {
    const { visitId, medicineCharges = 0, otherCharges = 0, discount = 0, notes } = data;

    // Check if visit exists
    const visit = await visitRepository.getVisitById(visitId);

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Check if invoice already exists for this visit
    const existingInvoice = await billingRepository.getInvoiceByVisitId(visitId);

    if (existingInvoice) {
      throw new Error('Invoice already exists for this visit');
    }

    // Prefer explicit visit fee (if present and > 0), fallback to doctor's consultation fee.
    const resolvedConsultationFee =
      visit.visitFee !== undefined && visit.visitFee !== null && Number(visit.visitFee) > 0
        ? visit.visitFee
        : visit.doctor?.consultationFee;

    if (resolvedConsultationFee === undefined || resolvedConsultationFee === null) {
      throw new Error('Consultation fee is not configured for this visit/doctor');
    }

    const consultationFee = new Decimal(resolvedConsultationFee);
    const medicineChargesDecimal = new Decimal(medicineCharges);
    const otherChargesDecimal = new Decimal(otherCharges);
    const discountDecimal = new Decimal(discount);

    // Calculate total
    const totalAmount = consultationFee.plus(medicineChargesDecimal).plus(otherChargesDecimal);
    const finalAmount = totalAmount.minus(discountDecimal);

    // Create invoice
    const invoice = await billingRepository.createInvoice({
      visitId,
      patientId: visit.patientId,
      consultationFee: consultationFee.toNumber(),
      medicineCharges: medicineChargesDecimal.toNumber(),
      otherCharges: otherChargesDecimal.toNumber(),
      totalAmount: totalAmount.toNumber(),
      discount: discountDecimal.toNumber(),
      finalAmount: finalAmount.toNumber(),
      status: 'UNPAID',
      notes,
    });

    return invoice;
  }

  /**
   * Get invoice by ID
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice with payment status
   */
  async getInvoiceById(invoiceId) {
    const invoice = await billingRepository.getInvoiceById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate payment status dynamically
    return this._calculateInvoiceStatus(invoice);
  }

  /**
   * Get invoice by visit ID
   * @param {string} visitId - Visit ID
   * @returns {Promise<Object>} Invoice with payment status
   */
  async getInvoiceByVisitId(visitId) {
    const invoice = await billingRepository.getInvoiceByVisitId(visitId);

    if (!invoice) {
      throw new Error('Invoice not found for this visit');
    }

    return this._calculateInvoiceStatus(invoice);
  }

  /**
   * Get invoices by patient ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} List of invoices with payment status
   */
  async getInvoicesByPatientId(patientId) {
    const invoices = await billingRepository.getInvoicesByPatientId(patientId);

    return invoices.map((invoice) => this._calculateInvoiceStatus(invoice));
  }

  /**
   * Update invoice
   * @param {string} invoiceId - Invoice ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInvoice(invoiceId, data) {
    const invoice = await billingRepository.getInvoiceById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Recalculate if any charges are updated
    let updateData = { ...data };

    if (data.medicineCharges !== undefined || data.otherCharges !== undefined || data.discount !== undefined) {
      const consultationFee = new Decimal(invoice.consultationFee);
      const medicineCharges = new Decimal(data.medicineCharges ?? invoice.medicineCharges);
      const otherCharges = new Decimal(data.otherCharges ?? invoice.otherCharges);
      const discount = new Decimal(data.discount ?? invoice.discount);

      const totalAmount = consultationFee.plus(medicineCharges).plus(otherCharges);
      const finalAmount = totalAmount.minus(discount);

      updateData = {
        ...updateData,
        medicineCharges: medicineCharges.toNumber(),
        otherCharges: otherCharges.toNumber(),
        discount: discount.toNumber(),
        totalAmount: totalAmount.toNumber(),
        finalAmount: finalAmount.toNumber(),
      };
    }

    const updatedInvoice = await billingRepository.updateInvoice(invoiceId, updateData);

    return this._calculateInvoiceStatus(updatedInvoice);
  }

  /**
   * CRITICAL FUNCTION: Calculate invoice status dynamically
   * ALWAYS derive from payments — do NOT set status manually.
   * Also persists the computed status back to the DB so the schema field stays in sync.
   * @private
   * @param {Object} invoice - Invoice object with payments
   * @returns {Object} Invoice with calculated status
   */
  _calculateInvoiceStatus(invoice) {
    // Calculate total paid from all payments
    const totalPaid = invoice.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0);

    // Determine status based on payment
    let status;
    if (totalPaid === 0) {
      status = 'UNPAID';
    } else if (totalPaid < Number(invoice.finalAmount)) {
      status = 'PARTIAL';
    } else {
      status = 'PAID';
    }

    // Persist computed status back to DB (fire-and-forget — non-blocking)
    if (invoice.status !== status) {
      billingRepository.updateInvoice(invoice.id, { status }).catch((error) => {
        // Keep response non-blocking, but never fail silently.
        console.error(`Failed to sync invoice status for ${invoice.id}:`, error.message);
      });
    }

    return {
      ...invoice,
      totalPaid,
      status,
      remainingAmount: Number(invoice.finalAmount) - totalPaid,
    };
  }
}

module.exports = new BillingService();
