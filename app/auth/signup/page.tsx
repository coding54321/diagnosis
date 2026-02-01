'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Input, Button } from '@/components/ui';
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
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Header title="회원가입" showBackButton onBack={() => router.back()} />
        <main className="min-h-screen bg-hyundai-gray-50 pb-20">
          <Container>
            <div className="py-6">
              <Card variant="default" padding="lg">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-semantic-success-light flex items-center justify-center">
                    <User className="w-8 h-8 text-semantic-success-main" />
                  </div>
                  <h2 className="text-h2 text-hyundai-gray-900">회원가입 완료!</h2>
                  <p className="text-body-2 text-hyundai-gray-600">
                    환영합니다! 잠시 후 메인 페이지로 이동합니다.
                  </p>
                </div>
              </Card>
            </div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="회원가입" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6">
            <Card variant="default" padding="lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-h2 text-hyundai-gray-900 mb-2">회원가입</h2>
                  <p className="text-body-2 text-hyundai-gray-600">
                    이미 계정이 있으신가요?{' '}
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="text-hyundai-blue-600 font-medium hover:underline"
                    >
                      로그인
                    </button>
                  </p>
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-semantic-error-light border border-semantic-error-main">
                    <p className="text-body-2 text-semantic-error-dark">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="이름"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    fullWidth
                    icon={User}
                  />

                  <Input
                    label="이메일"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    fullWidth
                    icon={Mail}
                  />

                  <Input
                    label="비밀번호"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    required
                    fullWidth
                    icon={Lock}
                  />

                  <Input
                    label="비밀번호 확인"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    fullWidth
                    icon={Lock}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        회원가입 중...
                      </>
                    ) : (
                      '회원가입'
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </Container>
      </main>
    </>
  );
};

export default SignupPage;
