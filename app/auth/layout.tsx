import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/auth-server';

/**
 * 로그인/회원가입 공통 레이아웃
 * 이미 로그인된 사용자는 메인으로 리다이렉트
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }
  return <>{children}</>;
}
