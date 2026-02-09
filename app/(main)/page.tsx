import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout';
import { fetchVehicles, fetchRecentHistory } from '@/lib/supabase/actions';
import { Camera, Image as ImageIcon, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import DirectInputButton from '@/components/verification/DirectInputButton';
import { formatPrice } from '@/lib/utils';
import type { Vehicle, VerificationHistory } from '@/types';

// 2단계 상태: 적정 / 확인필요
const statusConfig = {
  appropriate: { label: '적정', variant: 'success' as const, Icon: CheckCircle2 },
  review_needed: { label: '확인필요', variant: 'warning' as const, Icon: AlertCircle },
};

export default async function HomePage() {
  const historyResult = await fetchRecentHistory(3);
  const vehiclesResult = await fetchVehicles();
  const vehicles = vehiclesResult.success && vehiclesResult.data ? vehiclesResult.data : [];
  const first = vehicles[0];
  const vehicle: Vehicle | null = first
    ? {
        id: first.id,
        manufacturer: first.manufacturer,
        model: first.model,
        variant: first.variant || undefined,
        year: first.year,
        mileage: first.mileage,
        fuelType: first.fuel_type,
        registration_number: first.registration_number ?? undefined,
        nickname: first.nickname ?? undefined,
      }
    : null;

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
    <main className="min-h-[calc(100vh-60px)] bg-hyundai-gray-50 pt-[env(safe-area-inset-top,0px)]">
      <Container>
        <div className="pb-8">
          {/* 브랜드 + 히어로 카피 */}
          <div className="px-1 pt-7">
            <p className="text-xl font-bold tracking-tight text-hyundai-blue-600">카비</p>
          </div>
          <div className="px-1 pb-6 pt-5">
            <h1 className="text-[34px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
              지금 견적서
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
              <div className="h-[180px] rounded-2xl bg-hyundai-gray-900 p-5 active:opacity-90 transition-opacity">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                    <Camera className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-[28px] font-bold leading-[1.1] tracking-tight text-white">
                    견적서
                    <br />
                    촬영하기
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/verify/album">
              <div className="h-[180px] rounded-2xl border border-hyundai-gray-300 bg-white p-5 active:bg-hyundai-gray-50 transition-colors">
                <div className="flex h-full flex-col justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hyundai-gray-100">
                    <ImageIcon className="h-5 w-5 text-hyundai-gray-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-[28px] font-bold leading-[1.1] tracking-tight text-hyundai-gray-700">
                    앨범에서
                    <br />
                    가져오기
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* 직접입력 */}
          <div className="mt-3">
            <DirectInputButton />
          </div>

          {/* 내 차량 미니 요약 (등록된 경우만) */}
          {vehicle && (
            <Link href="/vehicle" className="block mt-4">
              <Card variant="default" padding="none">
                <div className="flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
                  <div>
                    <p className="text-xs text-hyundai-gray-400 mb-0.5">내 차량</p>
                    <p className="text-sm font-medium text-hyundai-gray-900">
                      {vehicle.nickname
                        ? vehicle.nickname
                        : `${vehicle.manufacturer} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''} · ${vehicle.year}년식`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                </div>
              </Card>
            </Link>
          )}

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
              <Card variant="default" padding="none">
                {recentHistory.slice(0, 2).map((item, index) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.Icon;
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <Link href={`/history/${item.id}`}>
                        <div className="flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium text-hyundai-gray-900 truncate">{item.items}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-hyundai-gray-400">{formatHistoryDate(item.date)}</span>
                              <Badge variant={config.variant} size="sm" className="flex items-center gap-0.5">
                                <StatusIcon className="w-2.5 h-2.5" />
                                {config.label}
                              </Badge>
                              {item.vehicleLabel && (
                                <span className="text-xs text-hyundai-gray-500 truncate">
                                  {item.vehicleLabel}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-hyundai-gray-900 shrink-0">
                            {formatPrice(item.totalAmount)}
                          </p>
                        </div>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </Card>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}.${day}`;
}
