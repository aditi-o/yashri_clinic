const analyticsRepository = require('./analytics.repository');
const doctorRepository    = require('../doctors/doctors.repository');

class AnalyticsController {
  // GET /analytics/doctor/overview  — Doctor-scoped
  async getDoctorOverview(req, res) {
    try {
      const doctor = await doctorRepository.findDoctorByUserId(req.user.id);
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

      const [summary, dailyStats, monthlyStats] = await Promise.all([
        analyticsRepository.getDoctorTodaySummary(doctor.id),
        analyticsRepository.getDoctorDailyStats(doctor.id, 7),
        analyticsRepository.getDoctorMonthlyStats(doctor.id),
      ]);

      return res.status(200).json({ success: true, data: { summary, dailyStats, monthlyStats } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /analytics/admin/overview  — Admin-scoped
  async getAdminOverview(req, res) {
    try {
      const [summary, dailyStats, monthlyStats, topDoctors] = await Promise.all([
        analyticsRepository.getAdminTodaySummary(),
        analyticsRepository.getAdminDailyStats(7),
        analyticsRepository.getAdminMonthlyStats(),
        analyticsRepository.getTopDoctorsByRevenue(5),
      ]);

      return res.status(200).json({ success: true, data: { summary, dailyStats, monthlyStats, topDoctors } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AnalyticsController();
