/**
 * ✅ GLOBAL LOADER COMPONENT
 * Displays a centered loader from global store
 * Add to root layout once
 * 
 * Usage in parent layout:
 * <GlobalLoader />
 * 
 * Then anywhere in app:
 * const { showLoader, hideLoader } = useLoaderStore();
 * showLoader('Loading...');
 * hideLoader();
 */

'use client';

import React, { useEffect } from 'react';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';
import styles from './Loader.module.scss';

const GlobalLoader: React.FC = () => {
  const { isVisible, message } = useLoaderStore();

  // ✅ Prevent scroll when loader is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer}>
        {/* ✅ SPINNER */}
        <div className={styles.spinner}>
          <div className={styles.spinnerInner}></div>
        </div>

        {/* ✅ MESSAGE */}
        {message && (
          <p className={styles.message}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;