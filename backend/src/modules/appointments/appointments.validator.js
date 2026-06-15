const { z } = require('zod');

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const pad = (value) => String(value).padStart(2, '0');

const getLocalDateString = (date = new Date()) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

const getLocalTimeString = (date = new Date()) => (
  `${pad(date.getHours())}:${pad(date.getMinutes())}`
);

const defaultAppointmentDate = (value) => {
  if (value === undefined || value === null) return getLocalDateString();
  if (typeof value === 'string' && value.trim() === '') return getLocalDateString();
  return value;
};

const defaultAppointmentTime = (value) => {
  if (value === undefined || value === null) return getLocalTimeString();
  if (typeof value === 'string' && value.trim() === '') return getLocalTimeString();
  return value;
};

const appointmentDateField = z.preprocess(
  defaultAppointmentDate,
  z.string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date format' })
    .refine((d) => {
      const selected = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }, { message: 'Appointment date cannot be in the past' })
);

const appointmentTimeField = z.preprocess(
  defaultAppointmentTime,
  z.string().regex(TIME_REGEX, 'Invalid time format (HH:MM)')
);

const createAppointmentSchema = z.object({
  // patientId is optional here — PATIENT role ignores it (resolved from JWT),
  // RECEPTIONIST / DOCTOR must supply it.
  patientId: z.string().min(1).optional().or(z.literal('').transform(() => undefined)),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentDate: appointmentDateField,
  appointmentTime: appointmentTimeField,
  reason: z.string().optional(),
});

const updateAppointmentSchema = z.object({
  appointmentDate: appointmentDateField.optional(),
  appointmentTime: appointmentTimeField.optional(),
  reason: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});

module.exports = { createAppointmentSchema, updateAppointmentSchema };
