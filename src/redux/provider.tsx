'use client';

import { Provider } from 'react-redux';
import { store, AppDispatch } from './store';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData, restoreAuth } from './slices/authSlice';
import { RootState } from './store';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const initialized = useRef(false);
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      dispatch(restoreAuth());
      dispatch(fetchUserData());
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </Provider>
  );
}