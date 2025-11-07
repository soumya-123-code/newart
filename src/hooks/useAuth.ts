import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { logoutUser, clearAuth } from '@/redux/slices/authSlice';
import { useCallback } from 'react';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, user, hydrated } = useSelector(
    (state: RootState) => state.auth
  );

  const logout = useCallback((redirectUrl: string = '/logout') => {
    dispatch(logoutUser(redirectUrl));
  }, [dispatch]);

  const clearSession = useCallback(() => {
    dispatch(clearAuth());
  }, [dispatch]);

  return {
    isAuthenticated,
    loading: loading && hydrated,
    user,
    hydrated,
    logout,
    clearSession,
  };
};