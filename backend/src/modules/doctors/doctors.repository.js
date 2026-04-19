const prisma = require('../../config/database');

class DoctorRepository {
  /**
   * Find doctor by user ID.
   *
   * PRIMARY path  : prisma.doctor.findUnique({ where: { userId } })
   * FALLBACK path : if the primary returns null (e.g. a seed/registration
   *   race-condition left the userId column mismatched), traverse via the
   *   User record itself — prisma.user.findUnique({ include: { doctor:true } }).
   *   This second route always resolves as long as the User row exists.
   *
   * @param {string} userId - User ID from JWT
   * @returns {Promise<Object|null>} Doctor object or null
   */
  async findDoctorByUserId(userId) {
    // Primary lookup
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: { phone: true, role: true },
        },
      },
    });

    if (doctor) return doctor;

    // Fallback: traverse via User → doctor relation
    const userWithDoctor = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor: {
          include: {
            user: {
              select: { phone: true, role: true },
            },
          },
        },
      },
    });

    return userWithDoctor?.doctor ?? null;
  }

  /**
   * Get all active doctors
   * @returns {Promise<Array>} List of active doctors
   */
  async getAllDoctors() {
    return await prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        qualification: true,
        experience: true,
        consultationFee: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  /**
   * Get doctor by ID
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<Object|null>} Doctor object
   */
  async findDoctorById(doctorId) {
    return await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        qualification: true,
        experience: true,
        consultationFee: true,
        isActive: true,
      },
    });
  }

  /**
   * Update doctor profile
   * @param {string} doctorId - Doctor ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated doctor
   */
  async updateDoctor(doctorId, data) {
    // Whitelist only updatable fields to prevent Prisma errors from extra request body keys
    const { firstName, lastName, email, specialization, qualification, experience, consultationFee } = data;
    const safeData = {};
    if (firstName       !== undefined) safeData.firstName       = firstName;
    if (lastName        !== undefined) safeData.lastName        = lastName;
    if (email           !== undefined) safeData.email           = email;
    if (specialization  !== undefined) safeData.specialization  = specialization;
    if (qualification   !== undefined) safeData.qualification   = qualification;
    if (experience      !== undefined) safeData.experience      = Number(experience);
    if (consultationFee !== undefined) safeData.consultationFee = Number(consultationFee);
    return await prisma.doctor.update({
      where: { id: doctorId },
      data: safeData,
    });
  }

  /**
   * Toggle doctor active status
   * @param {string} doctorId - Doctor ID
   * @param {boolean} isActive - New status
   * @returns {Promise<Object>} Updated doctor
   */
  async setDoctorStatus(doctorId, isActive) {
    return await prisma.doctor.update({
      where: { id: doctorId },
      data: { isActive },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, specialization: true, isActive: true,
      },
    });
  }

  /**
   * Delete doctor and associated user account
   * @param {string} doctorId - Doctor ID
   */
  async deleteDoctorWithUser(doctorId) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { userId: true },
    });
    if (!doctor) throw new Error('Doctor not found');
    // Deleting the User cascades to Doctor (onDelete: Cascade)
    await prisma.user.delete({ where: { id: doctor.userId } });
  }

  /**
   * Get all doctors (active + inactive) for admin
   */
  async getAllDoctorsAdmin() {
    return await prisma.doctor.findMany({
      select: {
        id: true, firstName: true, lastName: true,
        email: true, specialization: true, qualification: true,
        experience: true, consultationFee: true, isActive: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}

module.exports = new DoctorRepository();
