const { z } = require('zod');

const blankToUndefined = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const registerSchema = z.object({
  phone: z.preprocess(blankToUndefined, z.string().regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number').optional()),
  password: z.preprocess(blankToUndefined, z.string().min(6, 'Password must be at least 6 characters').optional()),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.preprocess(blankToUndefined, z.string().email('Invalid email format').optional()),
  dateOfBirth: z.preprocess(
    blankToUndefined,
    z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }).optional()
  ),
  gender: z.preprocess(blankToUndefined, z.enum(['MALE', 'FEMALE', 'OTHER']).optional()),
  address: z.preprocess(blankToUndefined, z.string().optional()),
  emergencyContact: z.preprocess(blankToUndefined, z.string().optional()),
  bloodGroup: z.preprocess(blankToUndefined, z.string().optional()),
  allergies: z.preprocess(blankToUndefined, z.string().optional()),
});

const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};
