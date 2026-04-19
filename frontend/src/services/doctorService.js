import api from './api';

const unwrap = (r) => ({ data: r.data?.data ?? r.data });

export const doctorService = {
  getAllDoctors:  ()       => api.get('/doctors').then(unwrap),
  getDoctorById: (id)     => api.get(`/doctors/${id}`).then(unwrap),
  getProfile:    ()       => api.get('/doctors/profile').then(unwrap),
  updateProfile: (data)   => api.put('/doctors/profile', data).then(unwrap),
  // Returns the logged-in doctor's appointments (role-aware, handled by backend)
  getAppointments: () => api.get('/appointments').then(r => ({
    data: Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []),
  })),
};
