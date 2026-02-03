'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Container } from '@/components/layout';
import { Input } from '@/components/ui';
import { toast } from 'sonner';
import { signIn } from '@/lib/supabase/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-messages';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        toast.error(getAuthErrorMessage(result.error ?? undefined));
      }
    } catch {
      toast.error(getAuthErrorMessage(undefined));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* 뒤로가기만 있는 최소 헤더 */}
      <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 flex items-center text-hyundai-gray-700"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <Container>
        <div className="px-1 pt-4 pb-8">
          <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
            로그인
          </h1>
          <p className="text-sm text-hyundai-gray-400 mt-1.5">
            계정이 없으신가요?{' '}
            <button
              type="button"
              onClick={() => router.push('/auth/signup')}
              className="text-hyundai-gray-900 font-medium underline underline-offset-2"
            >
              회원가입
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pb-10">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-hyundai-gray-400 mb-1.5 px-0.5">이메일</p>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                fullWidth
                className="text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-hyundai-gray-400 mb-1.5 px-0.5">비밀번호</p>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                fullWidth
                className="text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>
      </Container>
    </main>
  );
};

export default LoginPage;
