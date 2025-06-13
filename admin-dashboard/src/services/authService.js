import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Admin login
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/admin/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/api/auth/admin/me');
      return { success: true, data: { user: response.data.data.user } };
    } catch (error) {
      return { success: false };
    }
  },

  // Get current admin user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/admin/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
