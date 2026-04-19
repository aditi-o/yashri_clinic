import api from './api';

// authStore calls unwrap() on the returned value expecting:
//   response.data?.data ?? response.data
// Backend sends: { success, data: { user, token } }
// api.post() gives us the axios response, so response.data = { success, data: {...} }
// authService must return the raw axios response so authStore can unwrap correctly.

export const authService = {
  register: (data) => api.post('/auth/register', data),

  registerDoctor: (data) => api.post('/auth/register-doctor', data),

  login: (credentials) => api.post('/auth/login', credentials),

  changePassword: (passwords) => api.post('/auth/change-password', passwords),
};
