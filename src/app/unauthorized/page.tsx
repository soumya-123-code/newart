'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [reason, setReason] = useState<'session' | 'permission'>('permission');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const authTimestamp = localStorage.getItem('authTimestamp');

    if (!isAuthenticated || (authTimestamp && Date.now() - parseInt(authTimestamp) > 24 * 60 * 60 * 1000)) {
      setReason('session');
    }
  }, []);

  const handleLogin = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTimestamp');
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          padding: '60px 50px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid #e5e5e5',
          animation: 'slideUp 0.6s ease-out',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 30px',
            background: reason === 'session' ? '#e74c3c' : '#f39c12',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
          }}
        >
          {reason === 'session' ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>

        {/* Error Code */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '700',
            color: reason === 'session' ? '#e74c3c' : '#f39c12',
            marginBottom: '16px',
            letterSpacing: '-1px',
          }}
        >
          {reason === 'session' ? '401' : '403'}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '26px',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '12px',
            lineHeight: '1.2',
            margin: '0 0 12px',
          }}
        >
          {reason === 'session' ? 'Session Expired' : 'Access Denied'}
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '32px',
            lineHeight: '1.6',
            margin: '0 0 32px',
          }}
        >
          {reason === 'session'
            ? 'Your session has expired for security reasons. Please log in again to continue.'
            : "You don't have permission to access this page. Please contact your administrator."}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {reason === 'session' ? (
            <button
              onClick={handleLogin}
              style={{
                background: '#5b3fbe',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(91, 63, 190, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 63, 190, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(91, 63, 190, 0.2)';
              }}
            >
              Login Again
            </button>
          ) : (
            <>
              <button
                onClick={handleGoBack}
                style={{
                  background: '#5b3fbe',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(91, 63, 190, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 63, 190, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(91, 63, 190, 0.2)';
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'transparent',
                  color: '#5b3fbe',
                  border: '2px solid #5b3fbe',
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#5b3fbe';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#5b3fbe';
                }}
              >
                Go Home
              </button>
            </>
          )}
        </div>

        {/* Info Box */}
        <div
          style={{
            marginTop: '32px',
            padding: '16px',
            background: '#f9f5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'left',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#5b3fbe' }}>
            {reason === 'session' ? '⏱️ Session Details:' : 'ℹ️ Common Reasons:'}
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
            {reason === 'session' ? (
              <>
                <li style={{ marginBottom: '4px' }}>Sessions expire after 24 hours</li>
                <li>Your credentials have been cleared</li>
              </>
            ) : (
              <>
                <li style={{ marginBottom: '4px' }}>You may not have required role</li>
                <li>Contact your administrator for access</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}
