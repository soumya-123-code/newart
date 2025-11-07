'use client';

import { RootState } from '@/redux/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Image from "next/image";

export default function Page() {
  const { user, loading, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isRouting, setIsRouting] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setAuthProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setAuthProgress(100);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      console.log('User not authenticated');
      return;
    }

    console.log('Routing user based on role:', user.currentRole);
    setIsRouting(true);

    const timer = setTimeout(() => {
      switch (user.currentRole) {
        case 'PREPARER':
          router.replace('/dashboard/preparer/my-reconciliations');
          break;
        case 'REVIEWER':
          router.replace('/dashboard/reviewer/all-reconciliations');
          break;
        case 'DIRECTOR':
          router.replace('/dashboard/director/current-period');
          break;
        case 'ADMIN':
          router.replace('/dashboard/admin/dashboard');
          break;
        default:
          router.replace('/unauthorized');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, loading, isAuthenticated, router]);

  // ============================================================================
  // Loading State - Professional Authentication Screen
  // ============================================================================
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '20px',
      }}>
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '420px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '48px 32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e5e5',
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '36px',
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
               
                borderRadius: '10px',
                marginBottom: '20px',
        
              }}>
                  <Image
                  src={'/Logo.svg'}
                  width={100}
                  height={100}
                  alt="error"
                  style={{ flexShrink: 0 }}
                />
              </div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: '0',
                letterSpacing: '-0.3px',
              }}>
                Reconciliation Portal
              </h1>
              <p style={{
                fontSize: '13px',
                color: '#666',
                margin: '8px 0 0',
                fontWeight: '400',
              }}>
                Authenticating your session
              </p>
            </div>

            {/* Progress Info */}
            <div style={{
              marginBottom: '32px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#999',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  margin: 0,
                }}>
                  Authentication Progress
                </p>
                <p style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6366f1',
                }}>
                  {Math.round(authProgress)}%
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '4px',
                background: '#e5e5e5',
                borderRadius: '2px',
                overflow: 'hidden',
                marginBottom: '24px',
              }}>
                <div
                  style={{
                    width: `${authProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease-out',
                  }}
                />
              </div>

              {/* Steps */}
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}>
                {[
                  { num: 1, label: 'Verifying credentials', threshold: 25 },
                  { num: 2, label: 'Loading permissions', threshold: 50 },
                  { num: 3, label: 'Initializing session', threshold: 75 },
                ].map((step, idx) => (
                  <div key={idx} style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: authProgress >= step.threshold
                          ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)'
                          : '#f0f0f0',
                        border: `2px solid ${authProgress >= step.threshold
                          ? '#6366f1'
                          : '#e5e5e5'
                        }`,
                        transition: 'all 0.3s ease-out',
                        color: authProgress >= step.threshold ? 'white' : '#999',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}>
                        {authProgress >= step.threshold ? '✓' : step.num}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        color: authProgress >= step.threshold ? '#333' : '#999',
                        textAlign: 'center',
                        transition: 'color 0.3s ease-out',
                        lineHeight: '1.3',
                      }}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: '#f9f5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '8px',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#6366f1', flexShrink: 0 }}>
                <path d="M8 1L2 4V8C2 12.4 8 14.8 8 14.8C8 14.8 14 12.4 14 8V4L8 1ZM7 11L4 8L5.41 6.59L7 8.17L10.59 4.59L12 6L7 11Z" fill="currentColor" />
              </svg>
              <div>
                <p style={{
                  fontSize: '12px',
                  color: '#6366f1',
                  fontWeight: '500',
                  margin: 0,
                }}>
                  Secure Connection
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#999',
                  margin: '2px 0 0',
                }}>
                  Takes less than 10 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

// ============================================================================
// Not Authenticated State - Welcome Page
// ============================================================================
if (!isAuthenticated) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px 32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e5e5',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '60px',
              height: '60px',
           
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Image src="/Logo.svg" width={32} height={32} alt="Logo" />
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0',
            }}>
              Automated Reconciliation
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: '8px 0 0',
            }}>
              Enterprise Financial Management
            </p>
          </div>

          {/* Main Content */}
          <div style={{ marginBottom: '36px' }}>
            <p style={{
              fontSize: '14px',
              color: '#555',
              margin: '0 0 20px',
              lineHeight: '1.6',
            }}>
              Streamline your financial reconciliation processes with automated workflows, real-time analytics, and comprehensive audit trails.
            </p>

            {/* Key Features */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {[
                '✓ Automated Reconciliation',
                '✓ Real-Time Analytics',
                '✓ Secure & Compliant',
                '✓ Role-Based Access',
              ].map((feature, idx) => (
                <p key={idx} style={{
                  fontSize: '13px',
                  color: '#555',
                  margin: 0,
                  paddingLeft: '12px',
                }}>
                  {feature}
                </p>
              ))}
            </div>
          </div>

          {/* CTA Section with Refresh Button */}
          <div style={{
            padding: '20px',
            background: '#f9f5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#5b3fbe',
                margin: '0 0 8px',
              }}>
                Ready to get started?
              </p>
              <p style={{
                fontSize: '13px',
                color: '#666',
                margin: '0',
              }}>
                Sign in with your enterprise credentials
              </p>
            </div>

            {/* Loading Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '16px',
              color: '#5b3fbe',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#5b3fbe',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>
                Waiting for authentication...
              </span>
            </div>

            {/* Refresh Credentials Button - NEW */}
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                background: '#5b3fbe',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
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
              🔄 Refresh Credentials
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}


  // ============================================================================
  // Routing State - Professional Transition
  // ============================================================================
  if (isRouting) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '20px',
      }}>
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '380px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px 32px',
     
            border: '1px solid #e5e5e5',
            textAlign: 'center',
          }}>
            {/* Logo */}
         <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
               
                borderRadius: '10px',
                marginBottom: '20px',
        
              }}>
                  <Image
                  src={'/Logo.svg'}
                  width={100}
                  height={100}
                  alt="error"
                  style={{ flexShrink: 0 }}
                />
              </div>

            {/* Content */}
            <h1 style={{
              fontSize: '22px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
            }}>
              Loading Dashboard
            </h1>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: '0 0 28px',
              fontWeight: '400',
            }}>
              Welcome back, {user?.fullName}
            </p>

            {/* Loading Indicator */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '28px',
            }}>
              <div style={{
                position: 'relative',
                width: '48px',
                height: '48px',
              }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  style={{
                    animation: 'spin 2s linear infinite',
                  }}
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="rgba(99, 102, 241, 0.2)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeDasharray="31.4"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: 0,
                fontWeight: '400',
              }}>
                Initializing workspace...
              </p>
            </div>

            {/* Loading Tasks */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {[
                'Loading user preferences',
                'Syncing reconciliation data',
                'Preparing dashboard',
              ].map((task, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: '#f9f5ff',
                  border: '1px solid #e9d5ff',
                  borderRadius: '6px',
                  animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both`,
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                      <path d="M17 7L8 16L3 11" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: '#555',
                    fontWeight: '400',
                  }}>
                    {task}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p style={{
              fontSize: '11px',
              color: '#999',
              marginTop: '24px',
              marginBottom: 0,
              fontWeight: '400',
            }}>
              This typically takes 3-5 seconds
            </p>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // ============================================================================
  // Fallback
  // ============================================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <p style={{
        fontSize: '14px',
        color: '#666',
        fontWeight: '400',
      }}>
        Loading...
      </p>
    </div>
  );
}