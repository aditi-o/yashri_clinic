const { z } = require('zod');

const createPrescriptionSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  medicines: z.array(
    z.object({
      // Accept UUID and non-UUID identifiers so custom medicine flows are not rejected at validation layer.
      medicineId: z.string().min(1, 'Medicine ID is required'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      duration: z.string().min(1, 'Duration is required'),
      instructions: z.string().optional(),
    })
  ).min(1, 'At least one medicine is required'),
});

const updatePrescriptionSchema = z.object({
  dosage: z.string().min(1).optional(),
  frequency: z.string().min(1).optional(),
  duration: z.string().min(1).optional(),
  instructions: z.string().optional(),
});

module.exports = {
  createPrescriptionSchema,
  updatePrescriptionSchema,
};
