const prisma = require('../../config/database');

class AnalyticsRepository {
  // ── Shared bucket builder ────────────────────────────────────────────────
  _buildBuckets(days) {
    const buckets = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, revenue: 0, patients: 0 };
    }
    return buckets;
  }

  // ── Doctor: last N days ──────────────────────────────────────────────────
  async getDoctorDailyStats(doctorId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const visits = await prisma.visit.findMany({
      where: { doctorId, visitDate: { gte: startDate } },
      select: { visitDate: true, patientId: true, visitFee: true },
    });

    const buckets = this._buildBuckets(days);
    for (const v of visits) {
      const key = new Date(v.visitDate).toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key].revenue  += Number(v.visitFee ?? 0);
        buckets[key].patients += 1;
      }
    }
    return Object.values(buckets);
  }

  // ── Doctor: today's summary ──────────────────────────────────────────────
  async getDoctorTodaySummary(doctorId) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const visits = await prisma.visit.findMany({
      where: { doctorId, visitDate: { gte: todayStart, lte: todayEnd } },
      select: { id: true, visitFee: true },
    });

    return {
      todayRevenue:  visits.reduce((s, v) => s + Number(v.visitFee ?? 0), 0),
      todayPatients: visits.length,
    };
  }

  // ── Doctor: monthly breakdown for current year ───────────────────────────
  async getDoctorMonthlyStats(doctorId) {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const visits = await prisma.visit.findMany({
      where: { doctorId, visitDate: { gte: yearStart } },
      select: { visitDate: true, visitFee: true },
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('en-IN', { month: 'short' }),
      revenue: 0, patients: 0,
    }));
    for (const v of visits) {
      const m = new Date(v.visitDate).getMonth();
      months[m].revenue  += Number(v.visitFee ?? 0);
      months[m].patients += 1;
    }
    return months;
  }

  // ── Admin: last N days (system-wide) ─────────────────────────────────────
  async getAdminDailyStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const visits = await prisma.visit.findMany({
      where: { visitDate: { gte: startDate } },
      select: { visitDate: true, patientId: true, visitFee: true },
    });

    const buckets = this._buildBuckets(days);
    for (const v of visits) {
      const key = new Date(v.visitDate).toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key].revenue  += Number(v.visitFee ?? 0);
        buckets[key].patients += 1;
      }
    }
    return Object.values(buckets);
  }

  // ── Admin: today's system-wide summary ───────────────────────────────────
  async getAdminTodaySummary() {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [todayVisits, totalPatients, todayAppointments, allVisits] = await Promise.all([
      prisma.visit.findMany({
        where: { visitDate: { gte: todayStart, lte: todayEnd } },
        select: { id: true, visitFee: true },
      }),
      prisma.patient.count(),
      prisma.appointment.count({ where: { appointmentDate: { gte: todayStart, lte: todayEnd } } }),
      prisma.visit.findMany({ select: { visitFee: true } }),
    ]);

    return {
      todayRevenue:      todayVisits.reduce((s, v) => s + Number(v.visitFee ?? 0), 0),
      todayPatients:     todayVisits.length,
      totalRevenue:      allVisits.reduce((s, v) => s + Number(v.visitFee ?? 0), 0),
      totalPatients,
      todayAppointments,
    };
  }

  // ── Admin: monthly breakdown for current year ────────────────────────────
  async getAdminMonthlyStats() {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const visits = await prisma.visit.findMany({
      where: { visitDate: { gte: yearStart } },
      select: { visitDate: true, visitFee: true },
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('en-IN', { month: 'short' }),
      revenue: 0, patients: 0,
    }));
    for (const v of visits) {
      const m = new Date(v.visitDate).getMonth();
      months[m].revenue  += Number(v.visitFee ?? 0);
      months[m].patients += 1;
    }
    return months;
  }

  // ── Admin: top doctors by revenue ────────────────────────────────────────
  async getTopDoctorsByRevenue(limit = 5) {
    const visits = await prisma.visit.findMany({
      select: {
        visitFee: true,
        doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
      },
    });

    const map = {};
    for (const v of visits) {
      const d = v.doctor;
      if (!map[d.id]) map[d.id] = { name: `Dr. ${d.firstName} ${d.lastName}`, specialization: d.specialization, revenue: 0, visits: 0 };
      map[d.id].revenue += Number(v.visitFee ?? 0);
      map[d.id].visits  += 1;
    }
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}

module.exports = new AnalyticsRepository();
