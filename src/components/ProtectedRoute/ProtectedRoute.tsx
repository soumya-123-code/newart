'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.push('/');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.currentRole)) {
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
