const visitRepository = require('./visits.repository');
const appointmentRepository = require('../appointments/appointments.repository');
const patientRepository = require('../patients/patients.repository');

class VisitService {
  // GET /visits?patientId=&doctorId=
  // For PATIENT role, userId is passed and we resolve their patientId
  async getVisits({ patientId, doctorId, userId, role } = {}) {
    if (role === 'PATIENT') {
      const patient = await patientRepository.findPatientByUserId(userId);
      if (!patient) throw new Error('Patient profile not found');
      return await visitRepository.getVisitsByPatientId(patient.id);
    }
    if (patientId) return await visitRepository.getVisitsByPatientId(patientId);
    if (doctorId)  return await visitRepository.getVisitsByDoctorId(doctorId);
    return await visitRepository.getAllVisits();
  }

  async createVisit(data) {
    const appointment = await appointmentRepository.getAppointmentById(data.appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const existingVisit = await visitRepository.getVisitByAppointmentId(data.appointmentId);
    if (existingVisit) throw new Error('Visit already exists for this appointment');

    const visit = await visitRepository.createVisit({
      ...data,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
    });

    await appointmentRepository.updateAppointment(data.appointmentId, { status: 'COMPLETED' });
    return visit;
  }

  async getVisitById(visitId) {
    const visit = await visitRepository.getVisitById(visitId);
    if (!visit) throw new Error('Visit not found');
    return visit;
  }

  async getVisitsByPatientId(patientId) {
    return await visitRepository.getVisitsByPatientId(patientId);
  }

  async getVisitsByDoctorId(doctorId) {
    return await visitRepository.getVisitsByDoctorId(doctorId);
  }

  async updateVisit(visitId, data) {
    const visit = await visitRepository.getVisitById(visitId);
    if (!visit) throw new Error('Visit not found');
    return await visitRepository.updateVisit(visitId, data);
  }

  async completeVisit(visitId) {
    const visit = await visitRepository.getVisitById(visitId);
    if (!visit) throw new Error('Visit not found');
    return await visitRepository.completeVisit(visitId);
  }

  async getPrescriptionHtml(visitId, userId, role) {
    const visit = await visitRepository.getVisitById(visitId);
    if (!visit) throw new Error('Visit not found');
    // If patient, verify they own this visit
    if (role === 'PATIENT') {
      const patient = await patientRepository.findPatientByUserId(userId);
      if (!patient || patient.id !== visit.patientId) throw new Error('Access denied');
    }
    return visit;
  }
}

module.exports = new VisitService();
