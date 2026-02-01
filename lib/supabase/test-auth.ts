/**
 * 인증 연동 테스트 유틸리티
 * 개발 환경에서만 사용
 */

import { supabase } from './client';
import { getCurrentUser } from './auth-server';

/**
 * 현재 인증 상태 확인 (클라이언트)
 */
export async function checkAuthStatus() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    isAuthenticated: !!user,
    user: user,
    error: error,
  };
}

/**
 * 현재 인증 상태 확인 (서버)
 */
export async function checkAuthStatusServer() {
  const user = await getCurrentUser();
  return {
    isAuthenticated: !!user,
    user: user,
  };
}
