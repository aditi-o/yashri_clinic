const { z } = require('zod');

const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'INSURANCE']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

module.exports = {
  createPaymentSchema,
};
