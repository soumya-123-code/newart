'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useLoader } from '@/stores/loaderStore';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import styles from './Header.module.scss';
import Image from 'next/image';

const Header: React.FC = () => {
  const { user, isRoleSwitching, setCurrentRole, logout } = useAuth();
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

  useEffect(() => {
    if (isRoleSwitching && targetPath && pathname === targetPath && !roleSwitchCompletedRef.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      hideLoader();
      setTargetPath(null);

      roleSwitchCompletedRef.current = true;
    }
  }, [pathname, isRoleSwitching, targetPath, hideLoader]);

  useEffect(() => {
    if (isRoleSwitching && !targetPath && !roleSwitchCompletedRef.current) {
      timeoutRef.current = setTimeout(() => {
        hideLoader();
        setTargetPath(null);
        roleSwitchCompletedRef.current = true;
      }, 10000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isRoleSwitching, targetPath, hideLoader]);

  useEffect(() => {
    if (!isRoleSwitching) {
      roleSwitchCompletedRef.current = false;
    }
  }, [isRoleSwitching]);

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

  const handleLogout = useCallback(async () => {
    try {
      sessionStorage.clear();
      localStorage.clear();

      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        } catch (error) {
          console.log('Cache clear skipped:', error);
        }
      }

      logout(ROUTES.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
      router.push(ROUTES.LOGOUT);
    }
  }, [logout, router]);

  const getHomeRoute = useCallback(() => {
    switch (userRole) {
      case 'preparer': return ROUTES.PREPARER_RECONCILIATIONS;
      case 'reviewer': return ROUTES.REVIEWER_ALL_RECONCILIATIONS;
      case 'director': return ROUTES.DIRECTOR_CURRENT_PERIOD;
      case 'admin': return ROUTES.ADMIN_DASHBOARD;
      default: return ROUTES.HOME;
    }
  }, [userRole]);

  const getRoleRoute = useCallback((role: string) => {
    switch (role.toUpperCase()) {
      case 'PREPARER': return ROUTES.PREPARER_RECONCILIATIONS;
      case 'REVIEWER': return ROUTES.REVIEWER_ALL_RECONCILIATIONS;
      case 'DIRECTOR': return ROUTES.DIRECTOR_CURRENT_PERIOD;
      case 'ADMIN': return ROUTES.ADMIN_DASHBOARD;
      default: return ROUTES.HOME;
    }
  }, []);

  const handleRoleChange = useCallback((role: 'PREPARER' | 'REVIEWER' | 'DIRECTOR' | 'ADMIN') => {
    if (isRoleSwitching || user?.currentRole === role) return;

    const route = getRoleRoute(role);

    roleSwitchCompletedRef.current = false;
    setTargetPath(route);

    showLoader(`Switching to ${role.toLowerCase()} role...`);
    setCurrentRole(role);
    setRoleDropdownOpen(false);
    router.push(route);
  }, [isRoleSwitching, user?.currentRole, getRoleRoute, showLoader, setCurrentRole, router]);

  const formatRoleName = useCallback((role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }, []);

  const isActiveRoute = useCallback((route: string): boolean => {
    if (!pathname) return false;
    if (pathname === route) return true;
    if (pathname.startsWith(route)) {
      const nextChar = pathname[route.length];
      return !nextChar || nextChar === '/';
    }
    return false;
  }, [pathname]);

  const AdminLinks = memo(() => (
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
  ));

  AdminLinks.displayName = 'AdminLinks';

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

export default memo(Header);
