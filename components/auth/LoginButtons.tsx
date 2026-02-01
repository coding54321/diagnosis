'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const LoginButtons: React.FC = () => {
  const router = useRouter();

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card border border-hyundai-gray-100">
      <p className="text-body-1 text-hyundai-gray-900 font-medium mb-1">
        로그인하고 시작하세요
      </p>
      <p className="text-body-2 text-hyundai-gray-600 mb-4">
        로그인하시면 차량 정보를 저장하고 검증 내역을 관리할 수 있어요
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/auth/login')}
          className="flex-1 py-3 rounded-xl bg-hyundai-blue-500 text-white text-body-2 font-medium hover:bg-hyundai-blue-600 transition-colors"
        >
          로그인
        </button>
        <button
          onClick={() => router.push('/auth/signup')}
          className="flex-1 py-3 rounded-xl bg-white text-hyundai-blue-500 border border-hyundai-gray-200 text-body-2 font-medium hover:bg-hyundai-gray-50 transition-colors"
        >
          회원가입
        </button>
      </div>
    </div>
  );
};

export default LoginButtons;
