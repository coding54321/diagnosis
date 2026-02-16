import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: '정비 견적 검증 서비스',
  description: '정비소에서 받은 견적의 적정성을 데이터로 검증하는 서비스',
  manifest: '/manifest.webmanifest',
  themeColor: '#4A83F0',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '정비검증',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
