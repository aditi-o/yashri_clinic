const { z } = require('zod');

const createVisitSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  symptoms: z.string().optional(),
  vitalSigns: z.object({
    temperature: z.number().optional(),
    bloodPressure: z.string().optional(),
    pulse: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().optional(),
  followUpDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  visitFee: z.coerce.number().min(0, 'Fee cannot be negative').default(0),
});

const updateVisitSchema = z.object({
  chiefComplaint: z.string().min(1).optional(),
  symptoms: z.string().optional(),
  vitalSigns: z.object({
    temperature: z.number().optional(),
    bloodPressure: z.string().optional(),
    pulse: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  diagnosis: z.string().min(1).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  isCompleted: z.boolean().optional(),
  visitFee: z.coerce.number().min(0, 'Fee cannot be negative').optional(),
});

module.exports = {
  createVisitSchema,
  updateVisitSchema,
};
