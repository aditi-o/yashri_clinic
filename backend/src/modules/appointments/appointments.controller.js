const appointmentService = require('./appointments.service');
const { createAppointmentSchema, updateAppointmentSchema } = require('./appointments.validator');

class AppointmentController {
  // POST /appointments  — PATIENT creates for themselves; RECEPTIONIST passes patientId in body
  async createAppointment(req, res) {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      const appointment = await appointmentService.createAppointment(
        req.user.id,
        req.user.role,
        validatedData
      );
      return res.status(201).json({ success: true, message: 'Appointment created successfully', data: appointment });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /appointments — role-aware: patient sees own, doctor sees own, receptionist sees all
  async getAppointments(req, res) {
    try {
      const appointments = await appointmentService.getAppointments(req.user.id, req.user.role);
      return res.status(200).json({ success: true, data: appointments });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // GET /appointments/:id
  async getAppointmentById(req, res) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id, req.user.id, req.user.role);
      return res.status(200).json({ success: true, data: appointment });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  // PUT /appointments/:id
  async updateAppointment(req, res) {
    try {
      const validatedData = updateAppointmentSchema.parse(req.body);
      const appointment = await appointmentService.updateAppointment(req.params.id, req.user.id, req.user.role, validatedData);
      return res.status(200).json({ success: true, message: 'Appointment updated successfully', data: appointment });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // DELETE /appointments/:id
  async cancelAppointment(req, res) {
    try {
      const appointment = await appointmentService.cancelAppointment(req.params.id, req.user.id, req.user.role);
      return res.status(200).json({ success: true, message: 'Appointment cancelled successfully', data: appointment });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // GET /appointments/patient/:patientId — doctor/admin/receptionist view a specific patient's appointments
  async getPatientAppointments(req, res) {
    try {
      const appointments = await appointmentService.getAppointmentsByPatientId(req.params.patientId);
      return res.status(200).json({ success: true, data: appointments });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AppointmentController();
