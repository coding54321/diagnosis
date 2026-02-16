'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/notification';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
