'use client';

import { useEffect } from 'react';
import setupApiInterceptor from '@/services/apiInterceptor';

export default function ClientInitializer() {
  useEffect(() => {
    // Setup API interceptor on client side
    setupApiInterceptor();
  }, []);

  return null;
}
