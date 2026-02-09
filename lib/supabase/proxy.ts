/**
 * Middleware(Proxy)에서 세션 갱신용 Supabase 클라이언트
 * Server Components는 쿠키를 설정할 수 없으므로, middleware에서 토큰 갱신 후 쿠키를 응답에 반영
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // JWT 검증 및 만료 시 토큰 갱신 → 쿠키 업데이트
  const { data: { user } } = await supabase.auth.getUser();

  // 세션이 없으면 익명 로그인 → 서버 컴포넌트에서도 user 사용 가능
  if (!user) {
    await supabase.auth.signInAnonymously();
  }

  return supabaseResponse;
}
