import axios from 'axios';
import { setupApiInterceptor, createAxiosInstance } from '../apiInterceptor';

// Mock window.location
delete (window as any).location;
window.location = { href: '', pathname: '' } as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

describe('API Interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    window.location.pathname = '/dashboard';
  });

  describe('setupApiInterceptor', () => {
    it('should setup axios interceptors', () => {
      setupApiInterceptor();
      expect(axios.interceptors.request.handlers.length).toBeGreaterThan(0);
      expect(axios.interceptors.response.handlers.length).toBeGreaterThan(0);
    });

    it('should not setup multiple times', () => {
      const initialRequestHandlers = axios.interceptors.request.handlers.length;
      setupApiInterceptor();
      setupApiInterceptor();
      expect(axios.interceptors.request.handlers.length).toBe(initialRequestHandlers + 1);
    });
  });

  describe('createAxiosInstance', () => {
    it('should create axios instance with base URL', () => {
      const instance = createAxiosInstance('http://localhost:3000');
      expect(instance.defaults.baseURL).toBe('http://localhost:3000');
    });

    it('should set default timeout', () => {
      const instance = createAxiosInstance('http://localhost:3000');
      expect(instance.defaults.timeout).toBe(30000);
    });

    it('should set default headers', () => {
      const instance = createAxiosInstance('http://localhost:3000');
      expect(instance.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Request Interceptor', () => {
    it('should add auth token from environment', () => {
      process.env.NEXT_PUBLIC_AUTH_TOKEN = 'test-token';
      const instance = createAxiosInstance('http://localhost:3000');

      const config: any = { headers: {} };
      const interceptor = instance.interceptors.request.handlers[0];

      if (interceptor && typeof interceptor.fulfilled === 'function') {
        const result = interceptor.fulfilled(config);
        expect(result.headers.Authorization).toBe('Bearer test-token');
      }
    });

    it('should add auth token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      const instance = createAxiosInstance('http://localhost:3000');

      const config: any = { headers: {} };
      const interceptor = instance.interceptors.request.handlers[0];

      if (interceptor && typeof interceptor.fulfilled === 'function') {
        const result = interceptor.fulfilled(config);
        expect(result.headers.Authorization).toBe('Bearer stored-token');
      }
    });
  });
});
