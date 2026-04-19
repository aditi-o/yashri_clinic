const doctorRepository = require('./doctors.repository');

class DoctorService {
  /**
   * Get all active doctors
   * @returns {Promise<Array>} List of doctors
   */
  async getAllDoctors() {
    return await doctorRepository.getAllDoctors();
  }

  /**
   * Get doctor by ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object>} Doctor details
   */
  async getDoctorById(doctorId) {
    const doctor = await doctorRepository.findDoctorById(doctorId);
    
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return doctor;
  }

  /**
   * Get doctor profile by user ID
   * @param {string} userId - User ID from JWT
   * @returns {Promise<Object>} Doctor profile
   */
  async getProfile(userId) {
    const doctor = await doctorRepository.findDoctorByUserId(userId);
    
    if (!doctor) {
      throw new Error('Doctor profile not found');
    }

    return doctor;
  }

  /**
   * Update doctor profile
   * @param {string} userId - User ID from JWT
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated doctor
   */
  async updateProfile(userId, data) {
    const doctor = await doctorRepository.findDoctorByUserId(userId);
    if (!doctor) throw new Error('Doctor profile not found');
    return await doctorRepository.updateDoctor(doctor.id, data);
  }

  /**
   * Toggle doctor active/inactive status (admin only)
   * @param {string} doctorId
   * @param {boolean} isActive
   */
  async setDoctorStatus(doctorId, isActive) {
    const doctor = await doctorRepository.findDoctorById(doctorId);
    if (!doctor) throw new Error('Doctor not found');
    return await doctorRepository.setDoctorStatus(doctorId, isActive);
  }

  /**
   * Permanently delete a doctor (admin only)
   * @param {string} doctorId
   */
  async deleteDoctor(doctorId) {
    const doctor = await doctorRepository.findDoctorById(doctorId);
    if (!doctor) throw new Error('Doctor not found');
    await doctorRepository.deleteDoctorWithUser(doctorId);
  }

  /**
   * Get all doctors including inactive (admin only)
   */
  async getAllDoctorsAdmin() {
    return await doctorRepository.getAllDoctorsAdmin();
  }
}

module.exports = new DoctorService();
