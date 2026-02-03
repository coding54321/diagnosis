'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Container } from '@/components/layout';
import { Input } from '@/components/ui';
import { signUp } from '@/lib/supabase/auth-client';

const SignupPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(email, password, { name });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-bold text-hyundai-gray-900 mb-1">회원가입 완료</h2>
          <p className="text-sm text-hyundai-gray-400">잠시 후 메인 페이지로 이동합니다</p>
        </div>
      </main>
    );
  }

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
            회원가입
          </h1>
          <p className="text-sm text-hyundai-gray-400 mt-1.5">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="text-hyundai-gray-900 font-medium underline underline-offset-2"
            >
              로그인
            </button>
          </p>
        </div>

        {error && (
          <div className="mx-1 mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pb-10">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-hyundai-gray-400 mb-1.5 px-0.5">이름</p>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                fullWidth
                className="text-sm"
              />
            </div>

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
                placeholder="최소 6자 이상"
                required
                fullWidth
                className="text-sm"
              />
            </div>

            <div>
              <p className="text-xs text-hyundai-gray-400 mb-1.5 px-0.5">비밀번호 확인</p>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
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
                회원가입 중...
              </>
            ) : (
              '회원가입'
            )}
          </button>
        </form>
      </Container>
    </main>
  );
};

export default SignupPage;
