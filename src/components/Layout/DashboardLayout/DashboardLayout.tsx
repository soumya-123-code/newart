'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useAuth } from '@/hooks/useAuth';
import Header from '../Header/Header';
import GlobalMessage from '@/components/common/Message/GlobalMessage';
import GlobalLoader from '@/components/common/Loader/Loader';
import { useMessageStore } from '@/redux/messageStore/messageStore';
import { useLoaderStore } from '@/redux/loaderStore/loaderStore';

const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { message, hideMessage } = useMessageStore();
  const { showLoader, hideLoader } = useLoaderStore();

  useEffect(() => {
    if (loading) {
      showLoader('Authenticating...');
    } else {
      hideLoader();
    }

    return () => {
      hideLoader();
    };
  }, [loading, showLoader, hideLoader]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      hideLoader();
      router.push('/');
    }
  }, [loading, isAuthenticated, router, hideLoader]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <GlobalMessage
        isVisible={message.isVisible}
        message={message.text}
        type={message.type}
        onClose={hideMessage}
      />

      <GlobalLoader />

      <Header />

      <main className="container-xxl" style={{ paddingTop: '64px' }}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;