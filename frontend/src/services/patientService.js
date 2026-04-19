import api from './api';

// Backend envelope: { success: true, data: <payload> }
// All consumers do: response.data  → expects the payload directly
const unwrap = (r) => ({ data: r.data?.data ?? r.data });

export const patientService = {
  getProfile:    ()       => api.get('/patients/profile').then(unwrap),
  updateProfile: (data)   => api.put('/patients/profile', data).then(unwrap),
  getHistory:    ()       => api.get('/patients/history').then(unwrap),
  getFollowUps:  ()       => api.get('/patients/followups').then(unwrap),
  search:        (q)      => api.get(`/patients/search?q=${encodeURIComponent(q)}`).then(unwrap),
  getById:       (id)     => api.get(`/patients/${id}`).then(unwrap),
};
