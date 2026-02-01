/**
 * 서버 전용 Auth 함수
 * 'use server' 파일에서만 사용 가능
 */

import { createServerClient } from './server';

/**
 * 서버 사이드에서 현재 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
