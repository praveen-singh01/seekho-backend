import api from './api';

export const authService = {
  // Admin login
  login: async (credentials) => {
    try {
      console.log('authService: Making login API call');
      const response = await api.post('/api/auth/admin/login', credentials);
      console.log('authService: Login API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('authService: Login API error:', error);
      throw error;
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      console.log('authService: Making token verification API call');
      const response = await api.get('/api/auth/admin/me');
      console.log('authService: Token verification API response:', response.data);
      return { success: true, data: { user: response.data.data.user } };
    } catch (error) {
      console.error('authService: Token verification API error:', error);
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
