const prisma = require('../../config/database');

class PatientRepository {
  async searchPatients(query) {
    const q = query?.trim() || '';
    return await prisma.patient.findMany({
      where: q ? {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { user: { phone: { contains: q } } },
        ],
      } : undefined,
      select: {
        id: true, firstName: true, lastName: true, email: true,
        dateOfBirth: true, gender: true, bloodGroup: true, allergies: true,
        user: { select: { phone: true } },
      },
      orderBy: { firstName: 'asc' },
      take: 20,
    });
  }

  async getAllPatients() {
    return await prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        user: { select: { phone: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findPatientByUserId(userId) {
    return await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: { select: { phone: true, role: true } },
      },
    });
  }

  async findPatientById(patientId) {
    return await prisma.patient.findUnique({ where: { id: patientId } });
  }

  async updatePatient(patientId, data) {
    return await prisma.patient.update({ where: { id: patientId }, data });
  }

  async deletePatient(patientId) {
    return await prisma.patient.delete({
      where: { id: String(patientId) },
    });
  }

  async getPatientHistory(patientId) {
    const visits = await prisma.visit.findMany({
      where: { patientId },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        prescriptions: { include: { medicine: true } },
        invoice: { include: { payments: true } },
      },
      orderBy: { visitDate: 'desc' },
    });

    const invoices = await prisma.invoice.findMany({
      where: { patientId },
      include: {
        payments: true,
        visit: { select: { visitDate: true, diagnosis: true } },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return { visits, invoices };
  }

  async getPatientFollowUps(patientId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await prisma.visit.findMany({
      where: {
        patientId,
        followUpDate: { gte: today },
      },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
      orderBy: { followUpDate: 'asc' },
    });
  }
}

module.exports = new PatientRepository();
