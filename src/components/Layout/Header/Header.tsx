'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { setCurrentRole, completeRoleSwitch, clearAuth, logout } from '@/redux/slices/authSlice';
import { useRole } from '@/hooks/useRole';
import { useLoader } from '@/redux/loaderStore/loaderStore';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import Link from 'next/link';
import styles from './Header.module.scss';
import Image from 'next/image';

/**
 * ALTERNATIVE SOLUTION: Using ref to track completion status
 * 
 * This approach keeps the two separate useEffects but prevents
 * double-execution by tracking if role switch has already been completed.
 */

const Header: React.FC = () => {
  const { user, isRoleSwitching } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { userRole } = useRole();
  const { showLoader, hideLoader } = useLoader();

  const [open, setOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roleSwitchCompletedRef = useRef(false);

  // ✅ FIRST USEEFFECT - Watches for successful navigation
  // Only cleans up if we haven't already done so
  useEffect(() => {
    if (isRoleSwitching && targetPath && pathname === targetPath && !roleSwitchCompletedRef.current) {
      // Clear any pending timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Perform cleanup
      hideLoader();
      dispatch(completeRoleSwitch());
      setTargetPath(null);
      
      // Mark as completed to prevent second effect from running
      roleSwitchCompletedRef.current = true;
    }
  }, [pathname, isRoleSwitching, targetPath, hideLoader, dispatch]);

  // ✅ SECOND USEEFFECT - Timeout fallback
  // Only sets timeout if first effect hasn't already completed the switch
  useEffect(() => {
    if (isRoleSwitching && !targetPath && !roleSwitchCompletedRef.current) {
      timeoutRef.current = setTimeout(() => {
        hideLoader();
        dispatch(completeRoleSwitch());
        setTargetPath(null);
        roleSwitchCompletedRef.current = true;
      }, 10000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isRoleSwitching, targetPath, hideLoader, dispatch]);

  // Reset the completion flag when role switch finishes
  // This allows future role switches to work correctly
  useEffect(() => {
    if (!isRoleSwitching) {
      roleSwitchCompletedRef.current = false;
    }
  }, [isRoleSwitching]);

  // Handle clicking outside the role dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };

    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [roleDropdownOpen]);
const handleLogout = async () => {
  try {
    console.log('🚪 Starting logout...');

    // ✅ Step 1: Dispatch logout action to clear Redux state
    dispatch(logout());

    // ✅ Step 2: Clear all storage (localStorage, sessionStorage, cookies)
    sessionStorage.clear();
    localStorage.clear();

    // Clear cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });

    // Clear service worker cache
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (error) {
        console.log('Cache clear skipped:', error);
      }
    }

   

    // ✅ Step 4: Redirect to logout page using router.push
    console.log('🔀 Redirecting to logout page...');
    router.push(ROUTES.LOGOUT);

  } catch (error) {
    console.error('❌ Logout error:', error);
    // Fallback: redirect to logout page anyway
    router.push(ROUTES.LOGOUT);
  }
};
  const getHomeRoute = () => {
    switch (userRole) {
      case 'preparer': return ROUTES.PREPARER_RECONCILIATIONS;
      case 'reviewer': return ROUTES.REVIEWER_ALL_RECONCILIATIONS;
      case 'director': return ROUTES.DIRECTOR_CURRENT_PERIOD;
      case 'admin': return ROUTES.ADMIN_DASHBOARD;
      default: return ROUTES.HOME;
    }
  };

  const getRoleRoute = (role: string) => {
    switch (role.toUpperCase()) {
      case 'PREPARER': return ROUTES.PREPARER_RECONCILIATIONS;
      case 'REVIEWER': return ROUTES.REVIEWER_ALL_RECONCILIATIONS;
      case 'DIRECTOR': return ROUTES.DIRECTOR_CURRENT_PERIOD;
      case 'ADMIN': return ROUTES.ADMIN_DASHBOARD;
      default: return ROUTES.HOME;
    }
  };

  const handleRoleChange = (role: 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN') => {
    if (isRoleSwitching || user?.currentRole === role) return;

    const route = getRoleRoute(role);
    
    // Reset completion flag for new role switch
    roleSwitchCompletedRef.current = false;
    setTargetPath(route);
    
    showLoader(`Switching to ${role.toLowerCase()} role...`);
    dispatch(setCurrentRole(role));
    setRoleDropdownOpen(false);
    router.push(route);
  };

  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const isActiveRoute = (route: string): boolean => {
    if (!pathname) return false;
    if (pathname === route) return true;
    if (pathname.startsWith(route)) {
      const nextChar = pathname[route.length];
      return !nextChar || nextChar === '/';
    }
    return false;
  };

  const AdminLinks = () => (
    <>
      <Link href={ROUTES.ADMIN_DASHBOARD} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_DASHBOARD) ? styles.active : ''}`}>Rec control</Link>
      <Link href={ROUTES.ADMIN_ALL_RECONCILIATIONS} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_ALL_RECONCILIATIONS) ? styles.active : ''}`}>All recs</Link>
      <Link href={ROUTES.ADMIN_ROLL_FORWARD} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_ROLL_FORWARD) ? styles.active : ''}`}>Roll forward</Link>
      <Link href={ROUTES.ADMIN_MASTER_RECS} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_MASTER_RECS) ? styles.active : ''}`}>Master recs</Link>
      <Link href={ROUTES.ADMIN_REC_MANAGEMENT} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_REC_MANAGEMENT) ? styles.active : ''}`}>Rec management</Link>
      <Link href={ROUTES.ADMIN_LEDGER_MANAGEMENT} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_LEDGER_MANAGEMENT) ? styles.active : ''}`}>Ledger management</Link>
      <Link href={ROUTES.ADMIN_USER_MANAGEMENT} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_USER_MANAGEMENT) ? styles.active : ''}`}>User management</Link>
      <Link href={ROUTES.ADMIN_HISTORY} className={`${styles.navLink} ${isActiveRoute(ROUTES.ADMIN_HISTORY) ? styles.active : ''}`}>History</Link>
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className="d-flex align-items-center gap-2">
          <button className={styles.menuBtn} onClick={() => setOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className={styles.logo}>
            <Link href={getHomeRoute()}>
              <Image src="/assets/logo/logo.png" alt="ART" width={20} height={20} />
              <span>ART</span>
            </Link>
          </div>
        </div>

        <nav className={styles.navigation}>
          {userRole === 'preparer' && (
            <Link href={ROUTES.PREPARER_RECONCILIATIONS} className={`${styles.navLink} ${isActiveRoute(ROUTES.PREPARER_RECONCILIATIONS) ? styles.active : ''}`}>My reconciliations</Link>
          )}
          {userRole === 'reviewer' && (
            <Link href={ROUTES.REVIEWER_ALL_RECONCILIATIONS} className={`${styles.navLink} ${isActiveRoute(ROUTES.REVIEWER_ALL_RECONCILIATIONS) ? styles.active : ''}`}>My reconciliations</Link>
          )}
          {userRole === 'director' && (
            <>
              <Link href={ROUTES.DIRECTOR_CURRENT_PERIOD} className={`${styles.navLink} ${isActiveRoute(ROUTES.DIRECTOR_CURRENT_PERIOD) ? styles.active : ''}`}>Current period</Link>
              <Link href={ROUTES.DIRECTOR_PROCESSED} className={`${styles.navLink} ${isActiveRoute(ROUTES.DIRECTOR_PROCESSED) ? styles.active : ''}`}>Processed</Link>
            </>
          )}
          {userRole === 'admin' && <AdminLinks />}
        </nav>

        <div className={styles.userSection}>
          <span className={styles.userName}>{user?.fullName}</span>

          {user?.availableRoles && user.availableRoles.length > 1 && (
            <div className={styles.roleDropdown} ref={dropdownRef}>
              <button 
                className={styles.roleButton}
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                aria-label="Switch role"
                disabled={isRoleSwitching}
              >
                {formatRoleName(user.currentRole)}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: '6px', transition: 'transform 0.2s', transform: roleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {roleDropdownOpen && (
                <div className={styles.roleDropdownMenu}>
                  {user.availableRoles.map((role) => (
                    <button
                      key={role}
                      className={`${styles.roleDropdownItem} ${role === user.currentRole ? styles.active : ''}`}
                      onClick={() => handleRoleChange(role)}
                      disabled={isRoleSwitching}
                    >
                      {formatRoleName(role)}
                      {role === user.currentRole && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto' }}>
                          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className={styles.logoutButton} onClick={handleLogout} aria-label="Logout">
            <Image src="/assets/preparer/logout.svg" alt="" width={16} height={16} />
            Logout
          </button>
        </div>
      </div>

      <div className={`${styles.backdrop} ${open ? styles.show : ''}`} onClick={() => setOpen(false)} />
      <aside className={`${styles.mobileSidebar} ${open ? styles.open : ''}`} aria-hidden={!open}>
        <div className={styles.sideHeader}>
          <span className={styles.sideTitle}>Menu</span>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <div className={styles.sideLinks} onClick={() => setOpen(false)}>
          {userRole === 'preparer' && (
            <Link href={ROUTES.PREPARER_RECONCILIATIONS} className={`${styles.sideLink} ${isActiveRoute(ROUTES.PREPARER_RECONCILIATIONS) ? styles.active : ''}`}>My reconciliations</Link>
          )}
          {userRole === 'reviewer' && (
            <>
              <Link href={ROUTES.REVIEWER_ALL_RECONCILIATIONS} className={`${styles.sideLink} ${isActiveRoute(ROUTES.REVIEWER_ALL_RECONCILIATIONS) ? styles.active : ''}`}>All reconciliations</Link>
              <Link href={ROUTES.REVIEWER_DOWNLOAD} className={`${styles.sideLink} ${isActiveRoute(ROUTES.REVIEWER_DOWNLOAD) ? styles.active : ''}`}>Download</Link>
            </>
          )}
          {userRole === 'director' && (
            <>
              <Link href={ROUTES.DIRECTOR_CURRENT_PERIOD} className={`${styles.sideLink} ${isActiveRoute(ROUTES.DIRECTOR_CURRENT_PERIOD) ? styles.active : ''}`}>Current period</Link>
              <Link href={ROUTES.DIRECTOR_PROCESSED} className={`${styles.sideLink} ${isActiveRoute(ROUTES.DIRECTOR_PROCESSED) ? styles.active : ''}`}>Processed</Link>
            </>
          )}
          {userRole === 'admin' && (
            <>
              <Link href={ROUTES.ADMIN_DASHBOARD} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_DASHBOARD) ? styles.active : ''}`}>Rec control</Link>
              <Link href={ROUTES.ADMIN_ALL_RECONCILIATIONS} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_ALL_RECONCILIATIONS) ? styles.active : ''}`}>All recs</Link>
              <Link href={ROUTES.ADMIN_ROLL_FORWARD} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_ROLL_FORWARD) ? styles.active : ''}`}>Roll forward</Link>
              <Link href={ROUTES.ADMIN_MASTER_RECS} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_MASTER_RECS) ? styles.active : ''}`}>Master recs</Link>
              <Link href={ROUTES.ADMIN_REC_MANAGEMENT} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_REC_MANAGEMENT) ? styles.active : ''}`}>Rec management</Link>
              <Link href={ROUTES.ADMIN_LEDGER_MANAGEMENT} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_LEDGER_MANAGEMENT) ? styles.active : ''}`}>Ledger management</Link>
              <Link href={ROUTES.ADMIN_USER_MANAGEMENT} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_USER_MANAGEMENT) ? styles.active : ''}`}>User management</Link>
              <Link href={ROUTES.ADMIN_HISTORY} className={`${styles.sideLink} ${isActiveRoute(ROUTES.ADMIN_HISTORY) ? styles.active : ''}`}>History</Link>
            </>
          )}
        </div>
      </aside>
    </header>
  );
};

export default Header;