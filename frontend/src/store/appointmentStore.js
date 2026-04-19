import { create } from 'zustand';
import { appointmentService } from '../services/appointmentService';

export const useAppointmentStore = create((set) => ({
  appointments: [],
  currentAppointment: null,
  loading: false,
  error: null,

  fetchAppointments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await appointmentService.getAppointments();
      // appointmentService returns { data: [...] } — response.data is already the array
      const list = Array.isArray(response.data) ? response.data : [];
      set({ appointments: list, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch appointments', loading: false });
    }
  },

  cancelAppointment: async (id) => {
    set({ loading: true, error: null });
    try {
      await appointmentService.cancelAppointment(id);
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, status: 'CANCELLED' } : a
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to cancel appointment', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
