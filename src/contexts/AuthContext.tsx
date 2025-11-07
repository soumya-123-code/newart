'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  isRoleSwitching: boolean;
  setCurrentRole: (role: 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN') => void;
  logout: (redirectUrl?: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const saveToLocalStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('localStorage save error:', error);
    }
  }
};

const loadFromLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('localStorage load error:', error);
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
    } catch (error) {
      console.error('localStorage clear error:', error);
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);
  const initialized = useRef(false);

  const fetchUserData = useCallback(async () => {
    try {
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

      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      setIsRoleSwitching(false);
    } catch (err: any) {
      console.error('fetchUserData error:', err);
      clearLocalStorage();
      setUser(null);
      setIsAuthenticated(false);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, []);

  const restoreAuth = useCallback(() => {
    const storedUser = loadFromLocalStorage('user');
    const storedAuthStatus = loadFromLocalStorage('isAuthenticated');
    const authTimestamp = loadFromLocalStorage('authTimestamp');
    const isExpired = authTimestamp && Date.now() - authTimestamp > 24 * 60 * 60 * 1000;

    if (storedUser && storedAuthStatus && !isExpired) {
      setUser(storedUser);
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
      if (isExpired) {
        clearLocalStorage();
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      restoreAuth();
      fetchUserData();
    }
  }, [restoreAuth, fetchUserData]);

  const setCurrentRole = useCallback((role: 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN') => {
    if (user && user.currentRole !== role) {
      const updatedUser = { ...user, currentRole: role };
      setUser(updatedUser);
      setIsRoleSwitching(true);
      saveToLocalStorage('user', updatedUser);

      setTimeout(() => {
        setIsRoleSwitching(false);
      }, 100);
    }
  }, [user]);

  const logout = useCallback((redirectUrl: string = '/') => {
    clearLocalStorage();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setLoading(false);
    setHydrated(true);
    setIsRoleSwitching(false);

    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    hydrated,
    isRoleSwitching,
    setCurrentRole,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
