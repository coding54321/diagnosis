'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, X } from 'lucide-react';
import { Card, Button } from '@/components/ui';

interface LoginPromptProps {
  message?: string;
  onDismiss?: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({
  message = '이 기능을 사용하려면 로그인이 필요합니다.',
  onDismiss,
}) => {
  const router = useRouter();

  return (
    <Card variant="highlighted" padding="md" className="border-hyundai-blue-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-hyundai-blue-100 flex items-center justify-center">
          <LogIn className="w-5 h-5 text-hyundai-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-body-1 text-hyundai-gray-900 font-medium mb-1">
            로그인이 필요해요
          </h4>
          <p className="text-body-2 text-hyundai-gray-600 mb-3">
            {message}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/auth/login')}
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/auth/signup')}
            >
              회원가입
            </Button>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-hyundai-gray-400 hover:text-hyundai-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
};

export default LoginPrompt;
