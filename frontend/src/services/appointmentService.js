import api from './api';

export const appointmentService = {
  getAppointments: async () => {
    const response = await api.get('/appointments');
    // Returns list — normalise to array
    const list = Array.isArray(response.data)
      ? response.data
      : (response.data?.data ?? []);
    return { data: list };
  },

  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return { data: response.data?.data ?? response.data };
  },

  updateAppointment: async (id, data) => {
    const response = await api.put(`/appointments/${id}`, data);
    return { data: response.data?.data ?? response.data };
  },

  bookAppointment: async (data) => {
    const response = await api.post('/appointments', data);
    return { data: response.data?.data ?? response.data };
  },

  cancelAppointment: async (id) => {
    const response = await api.delete(`/appointments/${id}`);
    return { data: response.data?.data ?? response.data };
  },
};
