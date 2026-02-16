/**
 * 클라이언트 전용 Auth 함수
 * 클라이언트 컴포넌트에서 사용
 */

import { supabase } from './client';

/**
 * 클라이언트 사이드에서 현재 사용자 정보 가져오기
 */
export async function getCurrentUserClient() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

