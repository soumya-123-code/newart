import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

let isInterceptorSetup = false;

/**
 * Setup unified API interceptor for all axios instances
 * Handles authentication, error responses, and redirects
 */
export const setupApiInterceptor = () => {
  // Prevent multiple initializations
  if (isInterceptorSetup) {
    return;
  }

  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  // REQUEST INTERCEPTOR - Add authentication tokens
  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = process.env.NEXT_PUBLIC_AUTH_TOKEN || localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // RESPONSE INTERCEPTOR - Handle errors globally
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError) => {
      // Handle network errors
      if (!error.response) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/unauthorized')) {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized - Session expired
      if (error.response.status === 401) {
        // Clear authentication data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authTimestamp');
          localStorage.removeItem('authToken');
          sessionStorage.clear();

          // Prevent redirect loop
          if (!window.location.pathname.includes('/unauthorized')) {
            window.location.href = '/unauthorized?error=401';
          }
        }
      }

      // Handle 403 Forbidden - Access denied
      if (error.response.status === 403) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/unauthorized')) {
          window.location.href = '/unauthorized?error=403';
        }
      }

      return Promise.reject(error);
    }
  );

  isInterceptorSetup = true;
};

/**
 * Create axios instance with interceptor for specific base URL
 */
export const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for instance
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = process.env.NEXT_PUBLIC_AUTH_TOKEN || localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }
  );

  // Response interceptor for instance
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (!error.response) {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/unauthorized')) {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      if (error.response.status === 401 || error.response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('authTimestamp');
          localStorage.removeItem('authToken');
          sessionStorage.clear();

          if (!window.location.pathname.includes('/unauthorized')) {
            window.location.href = `/unauthorized?error=${error.response.status}`;
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default setupApiInterceptor;
