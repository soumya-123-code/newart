import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserInfo } from '@/services/auth/authentication.service';

interface User {
  userUuid: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string;
  availableRoles: Array<'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN'>;
  currentRole: 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN';
  fullName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  isRoleSwitching: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  hydrated: false,
  isRoleSwitching: false,
};

const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window !== 'undefined') {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    } catch (error) {
      // Cookie setting failed
    }
  }
};

const deleteCookie = (name: string) => {
  if (typeof window !== 'undefined') {
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    } catch (error) {
      // Cookie deletion failed
    }
  }
};

const saveToLocalStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Also set cookies for middleware
      if (key === 'user' || key === 'isAuthenticated') {
        setCookie(key, JSON.stringify(value), 1);
      }
    } catch (error) {
      // Storage failed
    }
  }
};

const loadFromLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      return null;
    }
  }
  return null;
};

const clearLocalStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authTimestamp');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      // Also clear cookies
      deleteCookie('user');
      deleteCookie('isAuthenticated');
    } catch (error) {
      // Cleanup failed
    }
  }
};

export const fetchUserData = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      // const response: any = await getUserInfo();
      // Mock data for testing:
      const response: any = {
        userUuid: 1024,
        firstName: 'Soumya',
        lastName: 'Nayak',
        email: 'sonayak.contractor@libertyglobal.com',
        roles: 'PREPARER,REVIEWER,ADMIN,DIRECTOR',
        changePassword: false,
        team: { teamUuid: 1, teamName: 'Mobile' },
        fullName: 'Soumya Nayak',
      };


      if (!response || !response.email) {
        throw new Error('Invalid user data');
      }

      const rolesArray = response.roles.split(',').map((r: string) => r.trim());
      const storedUser = loadFromLocalStorage('user');
      const currentRole = storedUser?.currentRole || rolesArray[0];

      const userData = {
        userUuid: response.userUuid,
        firstName: response.firstName,
        lastName: response.lastName,
        email: response.email,
        roles: response.roles,
        availableRoles: rolesArray,
        currentRole,
        fullName: response.fullName,
      };

      saveToLocalStorage('user', userData);
      saveToLocalStorage('isAuthenticated', true);
      saveToLocalStorage('authTimestamp', Date.now());

      return userData;
    } catch (error: any) {
      clearLocalStorage();
      return rejectWithValue(error.message || 'Authentication failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (redirectUrl: string) => {
    clearLocalStorage();
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreAuth(state) {
      const storedUser = loadFromLocalStorage('user');
      const storedAuthStatus = loadFromLocalStorage('isAuthenticated');
      const authTimestamp = loadFromLocalStorage('authTimestamp');
      const isExpired =
        authTimestamp && Date.now() - authTimestamp > 24 * 60 * 60 * 1000;

      if (storedUser && storedAuthStatus && !isExpired) {
        state.user = storedUser;
        state.isAuthenticated = true;
        state.loading = false;
      } else {
        state.loading = false;
        if (isExpired) {
          clearLocalStorage();
        }
      }
      state.hydrated = true;
    },

    setCurrentRole(
      state,
      action: PayloadAction<'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN'>
    ) {
      if (state.user && state.user.currentRole !== action.payload) {
        state.user.currentRole = action.payload;
        state.isRoleSwitching = true;
        saveToLocalStorage('user', state.user);
      }
    },

    completeRoleSwitch(state) {
      state.isRoleSwitching = false;
    },

    clearAuth(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.loading = false;
      state.hydrated = true;
      state.isRoleSwitching = false;
      clearLocalStorage();
    },

    // ✅ NEW: Add logout action
logout(state) {
  state.isAuthenticated = false;
  state.user = null;
  state.error = null;
  state.loading = false;
  state.hydrated = true;
  state.isRoleSwitching = false;
  clearLocalStorage();
}
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        if (!state.isRoleSwitching) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.hydrated = true;
        state.isRoleSwitching = false;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = (action.payload as string) || 'Failed to fetch user';
        state.hydrated = true;
        state.isRoleSwitching = false;
        clearLocalStorage();
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = null;
        state.hydrated = true;
        state.isRoleSwitching = false;
      });
  },
});

// ✅ UPDATED: Add logout to exports
export const { restoreAuth, setCurrentRole, clearAuth, completeRoleSwitch, logout } = authSlice.actions;
export default authSlice.reducer;
