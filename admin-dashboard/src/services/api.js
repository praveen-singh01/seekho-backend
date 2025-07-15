import axios from 'axios';

const API_BASE_URL =  'https://learner.netaapp.in';

// Helper function to get selected app from localStorage
const getSelectedApp = () => {
  return localStorage.getItem('selectedApp') || 'com.gumbo.learning';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and package ID
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add package ID header for multi-tenant support
    const selectedApp = getSelectedApp();
    config.headers['X-Package-ID'] = selectedApp;

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

// Utility function to create a request with specific package ID
export const createApiRequestWithPackage = (packageId) => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Package-ID': packageId,
    },
  });
};

// Utility function to get current package ID
export const getCurrentPackageId = getSelectedApp;

export default api;
