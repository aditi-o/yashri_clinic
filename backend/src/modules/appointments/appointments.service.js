const appointmentRepository = require('./appointments.repository');
const patientRepository = require('../patients/patients.repository');
const doctorRepository = require('../doctors/doctors.repository');

class AppointmentService {
  /**
   * Create appointment.
   * PATIENT:      resolves own patientId from userId. doctorId must be supplied.
   * RECEPTIONIST: patientId and doctorId must be supplied in body.
   * DOCTOR:       patientId must be supplied; doctorId defaults to own profile if omitted.
   */
  async createAppointment(userId, role, data) {
    let patientId;
    let doctorId = data.doctorId;

    if (role === 'DOCTOR') {
      // Doctor MUST supply patientId
      if (!data.patientId) throw new Error('patientId is required when booking as a doctor.');
      patientId = data.patientId;
      // Auto-resolve doctorId from the logged-in doctor's profile if not supplied
      if (!doctorId) {
        const doctor = await doctorRepository.findDoctorByUserId(userId);
        if (!doctor) throw new Error('Doctor profile not found.');
        doctorId = doctor.id;
      }
    } else if (role === 'RECEPTIONIST' || role === 'ADMIN') {
      if (!data.patientId) throw new Error('patientId is required when booking as receptionist or admin.');
      if (!doctorId) throw new Error('doctorId is required when booking as receptionist or admin.');
      patientId = data.patientId;
    } else {
      // PATIENT
      const patient = await patientRepository.findPatientByUserId(userId);
      if (!patient) throw new Error('Patient profile not found');
      patientId = patient.id;
      if (!doctorId) throw new Error('doctorId is required.');
    }

    if (!doctorId) throw new Error('doctorId is required.');

    const overlapping = await appointmentRepository.findOverlappingAppointments(
      doctorId, data.appointmentDate, data.appointmentTime
    );
    const activeOverlaps = overlapping.filter(
      (appt) => !['CANCELLED', 'NO_SHOW'].includes(appt.status)
    );
    if (activeOverlaps.length > 0) {
      throw new Error('Doctor is not available at this time. Please choose another slot.');
    }

    return await appointmentRepository.createAppointment({ patientId, ...data, doctorId });
  }

  /**
   * Get appointments based on caller's role.
   */
  async getAppointments(userId, role) {
    if (role === 'ADMIN' || role === 'RECEPTIONIST') {
      return await appointmentRepository.getAllAppointments();
    }
    if (role === 'DOCTOR') {
      const doctor = await doctorRepository.findDoctorByUserId(userId);
      if (!doctor) throw new Error('Doctor profile not found');
      return await appointmentRepository.getDoctorAppointments(doctor.id);
    }
    // PATIENT
    const patient = await patientRepository.findPatientByUserId(userId);
    if (!patient) throw new Error('Patient profile not found');
    return await appointmentRepository.getPatientAppointments(patient.id);
  }

  /**
   * Get single appointment — receptionists can view any.
   */
  async getAppointmentById(appointmentId, userId, role) {
    const appointment = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    if (role === 'PATIENT') {
      const patient = await patientRepository.findPatientByUserId(userId);
      if (patient && appointment.patientId !== patient.id) throw new Error('Access denied');
    }
    return appointment;
  }

  /**
   * Update appointment — receptionists can update any.
   */
  async updateAppointment(appointmentId, userId, role, data) {
    const appointment = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    if (role === 'PATIENT') {
      const patient = await patientRepository.findPatientByUserId(userId);
      if (patient && appointment.patientId !== patient.id) throw new Error('Access denied');
    }

    if (data.appointmentDate || data.appointmentTime) {
      const dateToCheck = data.appointmentDate || appointment.appointmentDate;
      const timeToCheck = data.appointmentTime || appointment.appointmentTime;
      const overlapping = await appointmentRepository.findOverlappingAppointments(
        appointment.doctorId, dateToCheck, timeToCheck
      );
      if (overlapping.some(a => a.id !== appointmentId && !['CANCELLED', 'NO_SHOW'].includes(a.status))) {
        throw new Error('Doctor is not available at this time. Please choose another slot.');
      }
    }
    return await appointmentRepository.updateAppointment(appointmentId, data);
  }

  /**
   * Cancel appointment — admin and receptionists can cancel any.
   */
  async cancelAppointment(appointmentId, userId, role) {
    const appointment = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    if (role === 'PATIENT') {
      const patient = await patientRepository.findPatientByUserId(userId);
      if (patient && appointment.patientId !== patient.id) throw new Error('Access denied');
    }
    return await appointmentRepository.cancelAppointment(appointmentId);
  }

  // Legacy helper kept for doctor dashboard (called directly via api.get('/appointments'))
  async getDoctorAppointments(doctorId) {
    return await appointmentRepository.getDoctorAppointments(doctorId);
  }

  // Get all appointments for a specific patient (used by doctor/admin/receptionist detail views)
  async getAppointmentsByPatientId(patientId) {
    return await appointmentRepository.getPatientAppointments(patientId);
  }
}

module.exports = new AppointmentService();
