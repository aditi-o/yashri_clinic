const { z } = require('zod');

const ALLOWED_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
];

const createAppointmentSchema = z.object({
  // patientId is optional here — PATIENT role ignores it (resolved from JWT),
  // RECEPTIONIST / DOCTOR must supply it.
  patientId: z.string().min(1).optional().or(z.literal('').transform(() => undefined)),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentDate: z.string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date format' })
    .refine((d) => {
      const selected = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, { message: 'Appointment date cannot be in the past' }),
  appointmentTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .refine((t) => ALLOWED_SLOTS.includes(t), {
      message: `Time must be one of the allowed slots: ${ALLOWED_SLOTS.join(', ')}`,
    }),
  reason: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  appointmentDate: z.string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date format' })
    .refine((d) => {
      const selected = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, { message: 'Appointment date cannot be in the past' })
    .optional(),
  appointmentTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .refine((t) => ALLOWED_SLOTS.includes(t), {
      message: `Time must be one of the allowed slots: ${ALLOWED_SLOTS.join(', ')}`,
    })
    .optional(),
  reason: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});

module.exports = { createAppointmentSchema, updateAppointmentSchema };
