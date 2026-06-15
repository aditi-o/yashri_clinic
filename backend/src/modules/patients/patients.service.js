const patientRepository = require('./patients.repository');

class PatientService {
  async searchPatients(query) {
    return await patientRepository.searchPatients(query);
  }

  async getAllPatients() {
    return await patientRepository.getAllPatients();
  }

  async getProfile(userId) {
    const patient = await patientRepository.findPatientByUserId(userId);
    if (!patient) throw new Error('Patient profile not found');
    return patient;
  }

  async updateProfile(userId, data) {
    const patient = await patientRepository.findPatientByUserId(userId);
    if (!patient) throw new Error('Patient profile not found');
    return await patientRepository.updatePatient(patient.id, data);
  }

  async getPatientById(patientId) {
    const patient = await patientRepository.findPatientById(patientId);
    if (!patient) throw new Error('Patient not found');
    return patient;
  }

  async deletePatient(patientId) {
    const patient = await patientRepository.findPatientById(patientId);
    if (!patient) throw new Error('Patient not found');
    return await patientRepository.deletePatient(patientId);
  }

  async getPatientHistory(userId) {
    const patient = await patientRepository.findPatientByUserId(userId);
    if (!patient) throw new Error('Patient profile not found');
    const history = await patientRepository.getPatientHistory(patient.id);
    return {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
      },
      ...history,
    };
  }

  async getPatientFollowUps(userId) {
    const patient = await patientRepository.findPatientByUserId(userId);
    if (!patient) throw new Error('Patient profile not found');
    return await patientRepository.getPatientFollowUps(patient.id);
  }
}

module.exports = new PatientService();
