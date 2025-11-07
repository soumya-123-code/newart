import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

let isInterceptorSetup = false;

export const setupApiInterceptor = () => {
  // Prevent multiple initializations
  if (isInterceptorSetup) {
    console.log('⚠️ API Interceptor already initialized');
    return;
  }

  // Only run on client side
  if (typeof window === 'undefined') {
    console.log('⚠️ Skipping interceptor setup on server side');
    return;
  }

  console.log('🔧 Setting up Axios interceptors...');

  // REQUEST INTERCEPTOR (Optional - for adding auth tokens dynamically)
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add auth token from localStorage if available
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      console.log('📤 Outgoing Request:', config.url);
      return config;
    },
    (error: AxiosError) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // RESPONSE INTERCEPTOR (Main logic for 401 handling)
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      // Successful responses pass through
      console.log('✅ Response received:', response.config.url);
      return response;
    },
    (error: AxiosError) => {
      console.error('❌ Response Error:', error.response?.status);

      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        console.warn('🔒 401 Unauthorized - Session expired or invalid token');
        
        // Clear authentication data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        localStorage.removeItem('authToken');
        sessionStorage.clear();

        // Prevent redirect loop
        if (!window.location.pathname.includes('/unauthorized')) {
          console.log('🔀 Redirecting to /unauthorized');
          window.location.href = '/unauthorized';
        }
      }

      // Handle 403 Forbidden (optional)
      if (error.response?.status === 403) {
        console.warn('🚫 403 Forbidden - Access denied');
        if (!window.location.pathname.includes('/unauthorized')) {
          window.location.href = '/unauthorized';
        }
      }

      // Always reject the promise to stop further execution
      return Promise.reject(error);
    }
  );

  isInterceptorSetup = true;
  console.log('✅ Axios interceptors successfully configured');
};

export default setupApiInterceptor;
