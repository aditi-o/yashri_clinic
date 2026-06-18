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

    // Revenue from actual payments collected (respects payment deletions)
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate },
        invoice: { visit: { doctorId } },
      },
      select: { paymentDate: true, amount: true },
    });

    // Patient count still comes from visits
    const visits = await prisma.visit.findMany({
      where: { doctorId, visitDate: { gte: startDate } },
      select: { visitDate: true, patientId: true },
    });

    const buckets = this._buildBuckets(days);
    for (const p of payments) {
      const key = new Date(p.paymentDate).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].revenue += Number(p.amount ?? 0);
    }
    for (const v of visits) {
      const key = new Date(v.visitDate).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].patients += 1;
    }
    return Object.values(buckets);
  }

  // ── Doctor: today's summary ──────────────────────────────────────────────
  async getDoctorTodaySummary(doctorId) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // Revenue from actual payments (respects deletions)
    const [payments, visits] = await Promise.all([
      prisma.payment.findMany({
        where: {
          paymentDate: { gte: todayStart, lte: todayEnd },
          invoice: { visit: { doctorId } },
        },
        select: { amount: true },
      }),
      prisma.visit.findMany({
        where: { doctorId, visitDate: { gte: todayStart, lte: todayEnd } },
        select: { id: true },
      }),
    ]);

    return {
      todayRevenue:  payments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      todayPatients: visits.length,
    };
  }

  // ── Doctor: monthly breakdown for current year ───────────────────────────
  async getDoctorMonthlyStats(doctorId) {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    // Revenue from actual payments (respects deletions)
    const [payments, visits] = await Promise.all([
      prisma.payment.findMany({
        where: {
          paymentDate: { gte: yearStart },
          invoice: { visit: { doctorId } },
        },
        select: { paymentDate: true, amount: true },
      }),
      prisma.visit.findMany({
        where: { doctorId, visitDate: { gte: yearStart } },
        select: { visitDate: true },
      }),
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('en-IN', { month: 'short' }),
      revenue: 0, patients: 0,
    }));
    for (const p of payments) {
      const m = new Date(p.paymentDate).getMonth();
      months[m].revenue += Number(p.amount ?? 0);
    }
    for (const v of visits) {
      const m = new Date(v.visitDate).getMonth();
      months[m].patients += 1;
    }
    return months;
  }

  // ── Admin: last N days (system-wide) ─────────────────────────────────────
  async getAdminDailyStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Revenue from actual payments (respects deletions)
    const [payments, visits] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: startDate } },
        select: { paymentDate: true, amount: true },
      }),
      prisma.visit.findMany({
        where: { visitDate: { gte: startDate } },
        select: { visitDate: true, patientId: true },
      }),
    ]);

    const buckets = this._buildBuckets(days);
    for (const p of payments) {
      const key = new Date(p.paymentDate).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].revenue += Number(p.amount ?? 0);
    }
    for (const v of visits) {
      const key = new Date(v.visitDate).toISOString().slice(0, 10);
      if (buckets[key]) buckets[key].patients += 1;
    }
    return Object.values(buckets);
  }

  // ── Admin: today's system-wide summary ───────────────────────────────────
  async getAdminTodaySummary() {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // Revenue from actual payments (respects deletions)
    const [todayPayments, allPayments, todayVisits, totalPatients, todayAppointments] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: todayStart, lte: todayEnd } },
        select: { amount: true },
      }),
      prisma.payment.findMany({ select: { amount: true } }),
      prisma.visit.findMany({
        where: { visitDate: { gte: todayStart, lte: todayEnd } },
        select: { id: true },
      }),
      prisma.patient.count(),
      prisma.appointment.count({ where: { appointmentDate: { gte: todayStart, lte: todayEnd } } }),
    ]);

    return {
      todayRevenue:      todayPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      todayPatients:     todayVisits.length,
      totalRevenue:      allPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0),
      totalPatients,
      todayAppointments,
    };
  }

  // ── Admin: monthly breakdown for current year ────────────────────────────
  async getAdminMonthlyStats() {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    // Revenue from actual payments (respects deletions)
    const [payments, visits] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: yearStart } },
        select: { paymentDate: true, amount: true },
      }),
      prisma.visit.findMany({
        where: { visitDate: { gte: yearStart } },
        select: { visitDate: true },
      }),
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString('en-IN', { month: 'short' }),
      revenue: 0, patients: 0,
    }));
    for (const p of payments) {
      const m = new Date(p.paymentDate).getMonth();
      months[m].revenue += Number(p.amount ?? 0);
    }
    for (const v of visits) {
      const m = new Date(v.visitDate).getMonth();
      months[m].patients += 1;
    }
    return months;
  }

  // ── Admin: top doctors by revenue ────────────────────────────────────────
  async getTopDoctorsByRevenue(limit = 5) {
    // Revenue from actual payments (respects deletions)
    const payments = await prisma.payment.findMany({
      select: {
        amount: true,
        invoice: {
          select: {
            visit: {
              select: {
                doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
              },
            },
          },
        },
      },
    });

    // Visit count still from actual visits
    const visits = await prisma.visit.findMany({
      select: {
        doctorId: true,
        doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
      },
    });

    const map = {};
    for (const v of visits) {
      const d = v.doctor;
      if (!map[d.id]) map[d.id] = { name: `Dr. ${d.firstName} ${d.lastName}`, specialization: d.specialization, revenue: 0, visits: 0 };
      map[d.id].visits += 1;
    }
    for (const p of payments) {
      const d = p.invoice?.visit?.doctor;
      if (!d) continue;
      if (!map[d.id]) map[d.id] = { name: `Dr. ${d.firstName} ${d.lastName}`, specialization: d.specialization, revenue: 0, visits: 0 };
      map[d.id].revenue += Number(p.amount ?? 0);
    }
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}

module.exports = new AnalyticsRepository();
