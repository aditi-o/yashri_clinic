const prisma = require('../../config/database');

class AuthRepository {
  async createUserWithPatient(userData) {
    const { phone, password, ...patientData } = userData;
    return await prisma.user.create({
      data: {
        phone,
        password,
        role: 'PATIENT',
        patient: {
          create: {
            ...patientData,
            dateOfBirth: new Date(patientData.dateOfBirth),
          },
        },
      },
      include: { patient: true },
    });
  }

  async findUserByPhone(phone) {
    return await prisma.user.findUnique({
      where: { phone },
      include: {
        patient: true,
        doctor: true,
        receptionist: true,   // ← needed for receptionist login
      },
    });
  }

  async findUserById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true,
        receptionist: true,
      },
    });
  }

  async updatePassword(userId, hashedPassword) {
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async createUserWithDoctor(userData) {
    const { phone, password, email, ...doctorData } = userData;
    return await prisma.user.create({
      data: {
        phone,
        password,
        role: 'DOCTOR',
        doctor: {
          create: { email, ...doctorData },
        },
      },
      include: { doctor: true },
    });
  }
}

module.exports = new AuthRepository();
