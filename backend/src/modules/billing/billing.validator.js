const { z } = require('zod');

const createInvoiceSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  medicineCharges: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  medicineCharges: z.number().min(0).optional(),
  otherCharges: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceSchema,
};
