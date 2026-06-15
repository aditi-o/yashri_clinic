import api from './api';

const norm = r => ({ data: r.data?.data ?? r.data });

export const receptionistService = {
  // ── Admin / Doctor ─────────────────────────────────────────────────────
  list: () => api.get('/receptionists').then(norm),
  getById: (id) => api.get(`/receptionists/${id}`).then(norm),
  create: (data) => api.post('/receptionists', data).then(norm),
  update: (id, data) => api.put(`/receptionists/${id}`, data).then(norm),
  remove: (id) => api.delete(`/receptionists/${id}`).then(norm),
  updatePermissions: (id, permissions) =>
    api.patch(`/receptionists/${id}/permissions`, { permissions }).then(norm),

  // ── Receptionist self profile ──────────────────────────────────────────
  getProfile: () => api.get('/receptionists/profile/me').then(norm),
  updateProfile: (data) => api.put('/receptionists/profile/me', data).then(norm),

  // ── Admin management ───────────────────────────────────────────────────
  deactivate: (id) => api.put(`/receptionists/${id}`, { isActive: false }).then(norm),
  delete: (id) => api.delete(`/receptionists/${id}`).then(norm),

  // ── Patient registration (public endpoint, works for receptionist or doctor) ──
  registerPatient: (data) => api.post('/auth/register', data).then(norm),

  // ── Appointments (re-use existing endpoint) ───────────────────────────
  getAllAppointments: () =>
    api.get('/appointments').then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
      return { data: list };
    }),
  bookAppointment: (data) => api.post('/appointments', data).then(norm),
  cancelAppointment: (id) => api.delete(`/appointments/${id}`).then(norm),
  getDoctors: () => api.get('/doctors').then(norm),
  getPatients: () => api.get('/patients').then(r => ({
    data: Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
  })),
};

receptionistService.remove = receptionistService.deactivate;
