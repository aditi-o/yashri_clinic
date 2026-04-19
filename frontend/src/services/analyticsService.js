import api from './api';

export const analyticsService = {
  getDoctorOverview: async () => {
    const response = await api.get('/analytics/doctor/overview');
    // response.data = { success, data: { summary, dailyStats, monthlyStats } }
    const inner = response.data?.data ?? response.data;
    return { data: inner };
  },

  getAdminOverview: async () => {
    const response = await api.get('/analytics/admin/overview');
    const inner = response.data?.data ?? response.data;
    return { data: inner };
  },
};
