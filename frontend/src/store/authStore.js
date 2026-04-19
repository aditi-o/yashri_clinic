import { create } from 'zustand';
import { authService } from '../services/authService';

// Unwrap the backend envelope which can be either:
//   { success, data: { user, token } }   ← standard
//   { user, token }                       ← fallback
const unwrap = (response) => {
  const payload = response.data?.data ?? response.data;
  return { user: payload.user, token: payload.token };
};

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const { user, token } = unwrap(response);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
      // Return a stable shape that Login.jsx can always read
      return { data: { user, token } };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed', loading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.register(data);
      const { user, token } = unwrap(response);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, loading: false });
      return { data: { user, token } };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Registration failed', loading: false });
      throw error;
    }
  },

  registerDoctor: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.registerDoctor(data);
      const payload = response.data?.data ?? response.data;
      // Creating a doctor account should not mutate the current admin session.
      set({ loading: false });
      return { data: payload };
    } catch (error) {
      set({ error: error.response?.data?.message || 'Registration failed', loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
