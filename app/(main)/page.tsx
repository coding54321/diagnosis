import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout';
import { fetchRecentHistory } from '@/lib/supabase/actions';
import { ChevronRight } from 'lucide-react';
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
    <main className="flex-1 bg-white pt-[env(safe-area-inset-top,0px)]">
      <Container>
        <div className="pb-8">
          {/* 브랜드 + 히어로 카피 */}
          <div className="px-1 pt-7">
            <p className="text-xl font-bold tracking-tight text-hyundai-blue-600">카비</p>
          </div>
          <div className="px-1 pb-6 pt-5">
            <h1 className="text-[34px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
              지금 받은 견적서
              <br />
              1분만에 검증하기
            </h1>
            <p className="mt-3 text-base font-medium text-hyundai-gray-600">
              내 차와 동일한 실제 정비 데이터로 비교하기
            </p>
          </div>

          {/* 액션 2열 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/verify/camera">
              <div className="h-[180px] rounded-2xl bg-hyundai-gray-900 p-5 active:opacity-90 transition-opacity flex items-end">
                  <p className="text-[22px] font-bold leading-[1.2] tracking-tight text-white">
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

          {/* 최근 검증 내역 (최대 2건) */}
          {recentHistory.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="text-lg font-bold text-hyundai-gray-700">최근 검증</h3>
                <Link href="/vehicle" className="text-xs text-hyundai-gray-400 font-medium flex items-center gap-0.5">
                  전체보기
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="rounded-2xl bg-hyundai-gray-50 overflow-hidden">
                {recentHistory.slice(0, 2).map((item, index) => {
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <Link href={`/history/${item.id}`}>
                        <div className="px-5 py-3.5 active:bg-hyundai-gray-100 transition-colors">
                          <div className="flex items-center gap-2 mb-1 flex-wrap min-w-0">
                            <span className="text-xs text-hyundai-gray-400">{formatHistoryDate(item.date)}</span>
                            {item.shopName && (
                              <>
                                <span className="text-xs text-hyundai-gray-300">•</span>
                                <span className="text-xs text-hyundai-gray-400 truncate">
                                  {item.shopName}
                                </span>
                              </>
                            )}
                            {item.vehicleLabel && (
                              <>
                                <span className="text-xs text-hyundai-gray-300">•</span>
                                <span className="text-xs text-hyundai-gray-500 truncate">
                                  {item.vehicleLabel}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-hyundai-gray-900 flex-1 min-w-0 truncate">{item.items}</p>
                            <p className="text-sm font-bold text-hyundai-gray-900 shrink-0">
                              {formatPrice(item.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Container>
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
