'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <main className="flex-1 bg-hyundai-gray-50 flex flex-col overflow-hidden">
      {/* 상단: 흰색 헤더 (검증 결과·설정과 동일 톤) */}
      <div className="bg-white shrink-0 border-b border-hyundai-gray-100 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-lg mx-auto w-full px-5 pt-3 pb-3 flex flex-col justify-center min-h-[52px]">
          <div className="flex items-center min-h-[44px] relative">
            <button
              type="button"
              onClick={() => router.back()}
              className="min-h-[44px] min-w-[44px] -ml-4 flex items-center justify-center text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold text-hyundai-gray-900 tracking-tight">
              알림
            </h1>
          </div>
        </div>
      </div>

      {/* 본문: 토스 스타일 빈 상태 (세로 시각적 중앙) */}
      <div className="flex-1 max-w-lg mx-auto w-full px-5 pt-20 pb-12 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center translate-y-2 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-hyundai-gray-100 flex items-center justify-center mb-5">
            <Bell className="w-7 h-7 text-hyundai-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-[18px] font-bold text-hyundai-gray-900 text-center leading-snug mb-2">
            새로운 알림이 없습니다.
          </p>
          <p className="text-sm text-hyundai-gray-500 text-center">
            새로운 소식이 있으면 알려드릴게요.
          </p>
        </div>
      </div>
    </main>
  );
}
