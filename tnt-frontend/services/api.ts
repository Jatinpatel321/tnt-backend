import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Base URL configuration - can be changed for local IP or ngrok
const BASE_URL = 'http://localhost:8000'; // Update this for production/ngrok

// Create axios instance with production-ready configuration
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and handle network checks
// Interceptors are used instead of manual headers because:
// 1. Automatic attachment to all requests
// 2. Centralized token management
// 3. Easy to modify behavior globally
// 4. No need to pass token in every API call
api.interceptors.request.use(
  async (config) => {
    try {
      // Check network connectivity before making request
      const { networkService } = await import('./network');
      if (!networkService.isOnline()) {
        throw new Error('No internet connection');
      }

      // Attach JWT token
      const { getToken } = await import('./token');
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Request preparation failed:', error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and 401 handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Standardize error responses
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      if (status === 401) {
        // Handle unauthorized - clear auth state
        console.warn('Unauthorized access - clearing session');
        try {
          // Import auth store dynamically to avoid circular dependency
          const { useAuthStore } = await import('../store/authStore');
          await useAuthStore.getState().logout();
        } catch (storeError) {
          console.error('Failed to clear auth state:', storeError);
        }
      }
      throw new Error((data as any)?.detail || `Server error: ${status}`);
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your connection.');
    } else {
      // Other error
      throw new Error('An unexpected error occurred');
    }
  }
);

export default api;
