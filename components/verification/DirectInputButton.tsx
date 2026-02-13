'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * 홈 등에서 사용 — 클릭 시 directInput 플래그 설정 후 /verify/review(Step 2)로 이동
 */
export default function DirectInputButton() {
  const router = useRouter();

  const handleClick = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('directInput', 'true');
    }
    router.push('/verify/review');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full min-h-[56px] rounded-2xl bg-hyundai-gray-50 px-5 py-4 text-left active:bg-hyundai-gray-100 transition-colors touch-manipulation"
    >
      <p className="text-[15px] font-bold text-hyundai-gray-900">견적 내용 직접 입력하기</p>
      <p className="mt-1 text-xs text-hyundai-gray-500">날짜·정비소·항목을 직접 입력해 검증해요</p>
    </button>
  );
}
