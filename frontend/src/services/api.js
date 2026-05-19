import axios from 'axios';

// Use env variable for production, fallback to relative path for local dev
const raw = import.meta.env.VITE_API_BASE_URL;
let API_BASE_URL;
if (raw) {
  const normalized = raw.replace(/\/+$/, '');
  API_BASE_URL = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
} else {
  API_BASE_URL = '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
