import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  fetchUserData,
  logoutUser,
  restoreAuth,
  setCurrentRole,
  clearAuth,
} from '../authSlice';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('authSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      expect(state.hydrated).toBe(false);
      expect(state.isRoleSwitching).toBe(false);
    });
  });

  describe('restoreAuth', () => {
    it('should restore auth from localStorage when valid', () => {
      const mockUser = {
        userUuid: 1024,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        roles: 'ADMIN,PREPARER',
        availableRoles: ['ADMIN', 'PREPARER'],
        currentRole: 'ADMIN',
        fullName: 'Test User',
      };

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockUser);
        if (key === 'isAuthenticated') return JSON.stringify(true);
        if (key === 'authTimestamp') return JSON.stringify(Date.now());
        return null;
      });

      store.dispatch(restoreAuth());
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
      expect(state.hydrated).toBe(true);
    });

    it('should clear auth when session is expired', () => {
      const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'authTimestamp') return JSON.stringify(expiredTimestamp);
        return null;
      });

      store.dispatch(restoreAuth());
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.hydrated).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('setCurrentRole', () => {
    it('should update current role and set isRoleSwitching', () => {
      const mockUser = {
        userUuid: 1024,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        roles: 'ADMIN,PREPARER',
        availableRoles: ['ADMIN', 'PREPARER'],
        currentRole: 'ADMIN',
        fullName: 'Test User',
      };

      store = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            isAuthenticated: true,
            user: mockUser,
            loading: false,
            error: null,
            hydrated: true,
            isRoleSwitching: false,
          },
        },
      });

      store.dispatch(setCurrentRole('PREPARER'));
      const state = store.getState().auth;

      expect(state.user?.currentRole).toBe('PREPARER');
      expect(state.isRoleSwitching).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('clearAuth', () => {
    it('should clear all auth state', () => {
      store.dispatch(clearAuth());
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.error).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.hydrated).toBe(true);
      expect(state.isRoleSwitching).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('fetchUserData', () => {
    it('should set loading to true when pending', () => {
      store.dispatch(fetchUserData.pending('', undefined));
      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should set user data when fulfilled', () => {
      const mockUserData = {
        userUuid: 1024,
        firstName: 'Soumya',
        lastName: 'Nayak',
        email: 'sonayak.contractor@libertyglobal.com',
        roles: 'PREPARER,REVIEWER,ADMIN,DIRECTOR',
        availableRoles: ['PREPARER', 'REVIEWER', 'ADMIN', 'DIRECTOR'],
        currentRole: 'PREPARER',
        fullName: 'Soumya Nayak',
      };

      store.dispatch(fetchUserData.fulfilled(mockUserData, '', undefined));
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUserData);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should set error when rejected', () => {
      const errorMessage = 'Authentication failed';
      store.dispatch(fetchUserData.rejected(new Error(errorMessage), '', undefined));
      const state = store.getState().auth;

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });
});
