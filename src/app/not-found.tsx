'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

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
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid #e5e5e5',
          animation: 'slideUp 0.6s ease-out',
        }}
      >
        {/* 404 Icon */}
     

        {/* Error Code */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '700',
            color: '#5b3fbe',
            marginBottom: '16px',
            letterSpacing: '-1px',
          }}
        >
          404
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: '12px',
            lineHeight: '1.2',
            margin: '0 0 12px',
          }}
        >
          Page Not Found
        </h1>

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
          Oops! We can't find the page you're looking for. It might have been moved or deleted.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.back()}
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
            ← Go Back
          </button>

          <Link
            href="/"
            style={{
              background: 'transparent',
              color: '#5b3fbe',
              border: '2px solid #5b3fbe',
              borderRadius: '8px',
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
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
            🏠 Return to Home
          </Link>
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
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#5b3fbe' }}>
            💡 What you can do:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px' }}>
            <li style={{ marginBottom: '4px' }}>Check the URL for typos</li>
            <li style={{ marginBottom: '4px' }}>Go back to the previous page</li>
            <li>Return to the home page</li>
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

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
