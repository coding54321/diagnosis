'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import { signIn } from '@/lib/supabase/auth-client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  message = '이 기능을 사용하려면 로그인이 필요합니다.',
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        onSuccess?.();
        onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card variant="default" padding="lg" className="w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-hyundai-gray-900">로그인 필요</h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-hyundai-gray-600 hover:bg-hyundai-gray-100 active:bg-hyundai-gray-100 transition-colors -mr-2"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-body-2 text-hyundai-gray-600 mb-6">{message}</p>

        {error && (
          <div className="p-4 rounded-lg bg-semantic-error-light border border-semantic-error-main mb-4">
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
            >
              취소
            </Button>
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
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-body-2 text-hyundai-gray-600">
            계정이 없으신가요?{' '}
            <button
              onClick={() => {
                onClose();
                router.push('/auth/signup');
              }}
              className="text-hyundai-blue-600 font-medium hover:underline"
            >
              회원가입
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginModal;
