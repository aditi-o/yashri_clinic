const prisma = require('../../config/database');

class AppointmentRepository {
  async createAppointment(data) {
    return await prisma.appointment.create({
      data: { ...data, appointmentDate: new Date(data.appointmentDate) },
      include: {
        patient: { select: { firstName: true, lastName: true, user: { select: { phone: true } } } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
    });
  }

  async findOverlappingAppointments(doctorId, appointmentDate, appointmentTime) {
    return await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });
  }

  async getAllAppointments() {
    return await prisma.appointment.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true, user: { select: { phone: true } } } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        visit: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async getPatientAppointments(patientId) {
    return await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        visit: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async getDoctorAppointments(doctorId) {
    return await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: { select: { firstName: true, lastName: true, user: { select: { phone: true } } } },
        visit: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async getAppointmentById(appointmentId) {
    return await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true, visit: true },
    });
  }

  async updateAppointment(appointmentId, data) {
    const updateData = { ...data };
    if (data.appointmentDate) updateData.appointmentDate = new Date(data.appointmentDate);
    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
    });
  }

  async cancelAppointment(appointmentId) {
    return await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });
  }
}

module.exports = new AppointmentRepository();
