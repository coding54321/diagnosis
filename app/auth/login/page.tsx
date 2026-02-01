'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Input, Button } from '@/components/ui';
import { signIn } from '@/lib/supabase/auth-client';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header title="로그인" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6">
            <Card variant="default" padding="lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-h2 text-hyundai-gray-900 mb-2">로그인</h2>
                  <p className="text-body-2 text-hyundai-gray-600">
                    계정이 없으신가요?{' '}
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="text-hyundai-blue-600 font-medium hover:underline"
                    >
                      회원가입
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
                    placeholder="비밀번호를 입력하세요"
                    required
                    fullWidth
                    icon={Lock}
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => router.push('/auth/forgot-password')}
                      className="text-body-2 text-hyundai-blue-600 hover:underline"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>

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
                        로그인 중...
                      </>
                    ) : (
                      '로그인'
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

export default LoginPage;
