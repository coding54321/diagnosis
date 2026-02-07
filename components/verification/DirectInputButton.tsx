'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PenTool } from 'lucide-react';

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
      className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl border-2 border-hyundai-gray-200 bg-white px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors text-left"
    >
      <div className="w-9 h-9 rounded-full bg-hyundai-gray-100 flex items-center justify-center shrink-0">
        <PenTool className="w-4 h-4 text-hyundai-gray-600" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-hyundai-gray-900">견적 내용 직접 입력하기</p>
        <p className="text-xs text-hyundai-gray-400">날짜·정비소·항목을 직접 입력해 검증해요</p>
      </div>
    </button>
  );
}
