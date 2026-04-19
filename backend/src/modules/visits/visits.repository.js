const prisma = require('../../config/database');

class VisitRepository {
  async createVisit(data) {
    const visitData = { ...data };
    if (data.followUpDate) visitData.followUpDate = new Date(data.followUpDate);
    if (visitData.visitFee !== undefined) visitData.visitFee = Number(visitData.visitFee);
    return await prisma.visit.create({
      data: visitData,
      include: {
        appointment: {
          include: { patient: { select: { firstName:true, lastName:true } } },
        },
        doctor: { select: { firstName:true, lastName:true, specialization:true } },
      },
    });
  }

  async getVisitById(visitId) {
    return await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        appointment: true,
        patient: { select: { id:true, firstName:true, lastName:true, dateOfBirth:true, gender:true, bloodGroup:true, allergies:true } },
        doctor:  { select: { firstName:true, lastName:true, specialization:true, consultationFee:true } },
        prescriptions: { include: { medicine: true } },
        invoice: { include: { payments: true } },
      },
    });
  }

  async getAllVisits() {
    return await prisma.visit.findMany({
      include: {
        patient: { select: { firstName:true, lastName:true } },
        doctor:  { select: { firstName:true, lastName:true, specialization:true } },
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async getVisitsByPatientId(patientId) {
    return await prisma.visit.findMany({
      where: { patientId },
      include: {
        doctor: { select: { firstName:true, lastName:true, specialization:true } },
        prescriptions: { include: { medicine: true } },
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async getVisitsByDoctorId(doctorId) {
    return await prisma.visit.findMany({
      where: { doctorId },
      include: {
        patient: { select: { firstName:true, lastName:true } },
        prescriptions: { include: { medicine: true } },
      },
      orderBy: { visitDate: 'desc' },
    });
  }

  async updateVisit(visitId, data) {
    const updateData = { ...data };
    if (data.followUpDate) updateData.followUpDate = new Date(data.followUpDate);
    if (updateData.visitFee !== undefined) updateData.visitFee = Number(updateData.visitFee);
    return await prisma.visit.update({
      where: { id: visitId },
      data: updateData,
      include: {
        appointment: true,
        patient: { select: { firstName:true, lastName:true } },
        doctor:  { select: { firstName:true, lastName:true } },
        prescriptions: { include: { medicine: true } },
      },
    });
  }

  async completeVisit(visitId) {
    return await prisma.visit.update({
      where: { id: visitId },
      data: { isCompleted: true },
    });
  }

  async getVisitByAppointmentId(appointmentId) {
    return await prisma.visit.findUnique({ where: { appointmentId } });
  }
}

module.exports = new VisitRepository();
