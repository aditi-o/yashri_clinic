const prisma = require('../../config/database');

const blankToNull = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

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
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            email: blankToNull(patientData.email),
            dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
            gender: blankToNull(patientData.gender),
            address: blankToNull(patientData.address),
            emergencyContact: blankToNull(patientData.emergencyContact),
            bloodGroup: blankToNull(patientData.bloodGroup),
            allergies: blankToNull(patientData.allergies),
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
