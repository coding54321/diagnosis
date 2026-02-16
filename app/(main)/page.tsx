import React from 'react';
import Link from 'next/link';
import { fetchRecentHistory } from '@/lib/supabase/actions';
import { ChevronRight, Bell } from 'lucide-react';
import DirectInputButton from '@/components/verification/DirectInputButton';
import AlbumPickerCard from '@/components/verification/AlbumPickerCard';
import { formatPrice } from '@/lib/utils';
import type { VerificationHistory } from '@/types';

export default async function HomePage() {
  const historyResult = await fetchRecentHistory(3);
  const recentHistory: VerificationHistory[] = historyResult.success && historyResult.data
    ? historyResult.data.map((item) => ({
        id: item.id,
        estimateId: item.estimateId || '',
        date: item.date,
        items: item.items,
        totalAmount: item.totalAmount,
        status: item.status as VerificationHistory['status'],
        shopName: item.shopName,
        vehicleLabel: item.vehicleLabel,
      }))
    : [];

  return (
    <main className="flex-1 bg-white flex flex-col">
      <div className="flex-1 max-w-lg mx-auto w-full px-5 pt-[env(safe-area-inset-top,0px)] pb-8 animate-fade-in-up">
        {/* 상단: 브랜드 + 알림 · 히어로 */}
        <div className="pt-6 pb-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold tracking-tight text-hyundai-primary">카비</p>
            <Link
              href="/notifications"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
              aria-label="알림"
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} />
            </Link>
          </div>
          <h1 className="text-[28px] font-bold text-hyundai-gray-900 leading-tight tracking-tight mt-6">
            지금 받은 견적서
            <br />
            1분만에 검증하기
          </h1>
          <p className="mt-3 text-sm text-hyundai-gray-500">
            내 차와 동일한 실제 정비 데이터로 비교해요
          </p>
        </div>

        {/* 액션 2열 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/verify/camera" className="block active:opacity-90 transition-opacity">
            <div className="h-[160px] rounded-2xl bg-hyundai-gray-900 p-5 flex flex-col justify-end">
              <p className="text-[20px] font-bold leading-[1.25] tracking-tight text-white">
                견적서
                <br />
                촬영하기
              </p>
            </div>
          </Link>
          <AlbumPickerCard />
        </div>

        {/* 직접입력 */}
        <div className="mt-3">
          <DirectInputButton />
        </div>

        {/* 최근 검증 */}
        {recentHistory.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-hyundai-gray-900 leading-tight">최근 검증</h3>
              <Link
                href="/vehicle"
                className="text-sm font-medium text-hyundai-primary flex items-center gap-0.5 active:opacity-70"
                aria-label="내 차 탭에서 차량별 검증 이력 보기"
              >
                내 차에서 보기
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
            <div className="rounded-2xl bg-hyundai-gray-50 overflow-hidden">
              {recentHistory.slice(0, 2).map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <div className="border-b border-hyundai-gray-100" />}
                  <Link href={`/history/${item.id}`} className="block active:bg-hyundai-gray-100/50 transition-colors">
                    <div className="px-5 py-4">
                      {/* 1행: 날짜(좌) · chevron(우) */}
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-xs text-hyundai-gray-400">{formatHistoryDate(item.date)}</span>
                        <ChevronRight className="w-5 h-5 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                      </div>
                      {/* 2행: 항목 요약 (메인 타이틀) */}
                      <p className="text-[15px] font-bold text-hyundai-gray-900 leading-snug truncate mb-1">
                        {item.items}
                      </p>
                      {/* 3행: 정비소·차량(좌) / 금액(우) */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-hyundai-gray-400 truncate min-w-0 flex-1">
                          {[item.shopName, item.vehicleLabel].filter(Boolean).join(' · ')}
                        </p>
                        <p className="text-base font-bold text-hyundai-gray-900 shrink-0 tabular-nums">
                          {formatPrice(item.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
