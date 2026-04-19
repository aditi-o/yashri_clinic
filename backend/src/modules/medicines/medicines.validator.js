const { z } = require('zod');

const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  genericName: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  dosageForm: z.string().min(1, 'Dosage form is required'),
  strength: z.string().min(1, 'Strength is required'),
  price: z.number().min(0, 'Price must be positive'),
  stockQuantity: z.number().min(0, 'Stock quantity must be positive').optional(),
});

const updateMedicineSchema = z.object({
  name: z.string().min(1).optional(),
  genericName: z.string().optional(),
  manufacturer: z.string().optional(),
  category: z.string().optional(),
  dosageForm: z.string().min(1).optional(),
  strength: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  stockQuantity: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  createMedicineSchema,
  updateMedicineSchema,
};
