import axios from 'axios';

/**
 * Centralized Axios Instance for EduSec Labs
 * Automatically resolves the baseURL based on environment configuration
 * and injects JWT authorization bearer headers.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
});

// Request Interceptor: Inject JWT Token dynamically from LocalStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
