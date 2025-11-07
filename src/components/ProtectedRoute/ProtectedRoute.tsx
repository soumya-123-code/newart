'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, redirecting to home');
      router.push('/');
      return;
    }

    // Check role-based access if allowedRoles is provided
    if (allowedRoles && !allowedRoles.includes(user.currentRole)) {
      console.log('User does not have required role, redirecting to unauthorized');
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.currentRole)) {
    return null;
  }

  return <>{children}</>;
}
