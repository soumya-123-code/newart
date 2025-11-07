'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';

export default function LogoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    dispatch(logout());
    
    // ✅ Prevent back button after logout
    window.history.pushState(null, "null", window.location.href);
    
    const handlePopState = () => {
      // When back button is clicked, push forward again
      window.history.pushState(null, "null", window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dispatch]);

  const handleReturnHome = () => {
    router.push('/');
  };

  const handleCloseTab = () => {
    setIsClosing(true);
    setTimeout(() => {
      window.open('about:blank', '_self');
      window.close();
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          padding: '48px 40px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid #e8ecf1',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: '#5b3fbe',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: '600',
              color: '#1a202c',
              margin: '0',
              letterSpacing: '-0.3px',
            }}
          >
            Logged Out
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              margin: '8px 0 0',
              fontWeight: '400',
            }}
          >
            Your session has been closed securely
          </p>
        </div>

        {/* Closing Message */}
        {isClosing && (
          <div
            style={{
              padding: '12px 16px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
           <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  animation: 'spin 2s linear infinite',
                }}
              >
                <circle cx="12" cy="12" r="10" stroke="#5b3fbe" strokeWidth="2" fill="none" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="url(#grad)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="15.7"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5b3fbe" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#5b3fbe' }}>
              Closing...
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={handleReturnHome}
            disabled={isClosing}
            style={{
              flex: 1,
              background: '#5b3fbe',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isClosing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isClosing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isClosing) {
                e.currentTarget.style.background = '#4c2fa1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isClosing) {
                e.currentTarget.style.background = '#5b3fbe';
              }
            }}
          >
            Go Home
          </button>

          <button
            onClick={handleCloseTab}
            disabled={isClosing}
            style={{
              flex: 1,
              background: '#f1f5f9',
              color: '#5b3fbe',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isClosing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isClosing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isClosing) {
                e.currentTarget.style.background = '#e2e8f0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isClosing) {
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
          >
            Close Tab
          </button>
        </div>

        {/* Info Box */}
        <div
          style={{
            padding: '12px 14px',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#7f1d1d',
            lineHeight: '1.5',
          }}
        >
          <strong>🔒 Security:</strong> All session data has been cleared from your device.
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
