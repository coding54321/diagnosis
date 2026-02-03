import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, ChevronRight, MapPin } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { fetchVehicle, fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { formatPrice } from '@/lib/utils';
import type { Vehicle, VerificationHistory } from '@/types';

const statusConfig = {
  appropriate: {
    label: '적정',
    variant: 'success' as const,
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '확인 필요',
    variant: 'warning' as const,
    Icon: AlertCircle,
  },
  recheck_recommended: {
    label: '재검토',
    variant: 'error' as const,
    Icon: XCircle,
  },
};

export default async function VehiclePage() {
  const user = await getCurrentUser();

  const vehicleResult = user ? await fetchVehicle() : { success: false, data: null };
  const historyResult = user ? await fetchRecentHistory(100) : { success: false, data: null };

  const vehicle: Vehicle | null = vehicleResult.success && vehicleResult.data
    ? {
        id: vehicleResult.data.id,
        manufacturer: vehicleResult.data.manufacturer,
        model: vehicleResult.data.model,
        variant: vehicleResult.data.variant || undefined,
        year: vehicleResult.data.year,
        mileage: vehicleResult.data.mileage,
        fuelType: vehicleResult.data.fuel_type,
      }
    : null;

  const history: VerificationHistory[] = historyResult.success && historyResult.data
    ? historyResult.data.map((item) => ({
        id: item.id,
        estimateId: item.estimateId || '',
        date: item.date,
        items: item.items,
        totalAmount: item.totalAmount,
        status: item.status as VerificationHistory['status'],
        shopName: item.shopName,
      }))
    : [];

  const totalSpent = history.reduce((sum, h) => sum + h.totalAmount, 0);
  const displayHistory = history.slice(0, 5);
  const hasMoreHistory = history.length > 5;

  return (
    <main className="min-h-[calc(100vh-52px)] bg-hyundai-gray-50">
      {/* 페이지 타이틀 — 헤더 바 없이 */}
      <div className="bg-white pb-1">
        <Container>
          <div className="pt-6 pb-5 px-1">
            <p className="text-xs text-hyundai-gray-400 mb-1">내 차 관리</p>

            {/* ===== 비로그인 상태 ===== */}
            {!user && (
              <>
                <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                  내 차량을 등록해보세요
                </h2>
                <p className="text-sm text-hyundai-gray-400 mt-1">
                  로그인하면 차량 정보와 정비 이력을 관리할 수 있어요
                </p>
              </>
            )}

            {/* ===== 로그인 + 차량 있음 ===== */}
            {user && vehicle && (
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                    {vehicle.manufacturer} {vehicle.model}
                    {vehicle.variant && ` ${vehicle.variant}`}
                  </h2>
                  <p className="text-sm text-hyundai-gray-400 mt-1">
                    {vehicle.year}년식 · {vehicle.mileage.toLocaleString('ko-KR')}km · {vehicle.fuelType}
                  </p>
                </div>
                <Link
                  href="/vehicle/edit"
                  className="text-xs text-hyundai-gray-400 font-medium flex items-center gap-0.5 shrink-0 mt-1"
                >
                  수정
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* ===== 로그인 + 차량 없음 ===== */}
            {user && !vehicle && (
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                    차량을 등록해주세요
                  </h2>
                  <p className="text-sm text-hyundai-gray-400 mt-1">
                    차종별 맞춤 가격으로 더 정확하게 검증해요
                  </p>
                </div>
                <Link
                  href="/vehicle/edit"
                  className="text-xs text-hyundai-gray-400 font-medium flex items-center gap-0.5 shrink-0 mt-1"
                >
                  등록
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-4 space-y-4">
          {/* 비로그인: 로그인 유도 */}
          {!user && (
            <Link href="/auth/login">
              <Card variant="default" padding="none">
                <div className="flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
                  <p className="text-sm font-medium text-hyundai-gray-900">로그인하기</p>
                  <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                </div>
              </Card>
            </Link>
          )}

          {/* 로그인: 정비 이력 */}
          {user && (
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-hyundai-gray-900">정비 이력</h3>
                  {history.length > 0 && (
                    <span className="text-xs text-hyundai-gray-400">
                      {history.length}건 · 누적 {formatCompact(totalSpent)}
                    </span>
                  )}
                </div>
                {hasMoreHistory && (
                  <Link href="/history" className="text-xs text-hyundai-gray-400 font-medium flex items-center gap-0.5">
                    전체보기
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {history.length === 0 ? (
                <Card variant="default" padding="none">
                  <div className="text-center px-5 py-8">
                    <p className="text-sm text-hyundai-gray-400">아직 정비 이력이 없어요</p>
                    <p className="text-xs text-hyundai-gray-300 mt-0.5">견적서를 검증하면 이력이 쌓여요</p>
                  </div>
                </Card>
              ) : (
                <Card variant="default" padding="none">
                  {displayHistory.map((item, index) => {
                    const config = statusConfig[item.status];
                    const StatusIcon = config.Icon;

                    return (
                      <React.Fragment key={item.id}>
                        {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                        <Link href={`/history/${item.id}`}>
                          <div className="px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-hyundai-gray-400">
                                    {formatHistoryDate(item.date)}
                                  </span>
                                  <Badge variant={config.variant} size="sm" className="flex items-center gap-0.5">
                                    <StatusIcon className="w-2.5 h-2.5" />
                                    {config.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-sm font-medium text-hyundai-gray-900 flex-1 mr-3 truncate">
                                    {item.items}
                                  </p>
                                  <p className="text-sm font-bold text-hyundai-gray-900 shrink-0">
                                    {formatPrice(item.totalAmount)}
                                  </p>
                                </div>
                                {item.shopName && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-hyundai-gray-300" strokeWidth={1.5} />
                                    <span className="text-xs text-hyundai-gray-400">{item.shopName}</span>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0 ml-2" strokeWidth={1.5} />
                            </div>
                          </div>
                        </Link>
                      </React.Fragment>
                    );
                  })}
                </Card>
              )}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

function formatCompact(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    return `${man}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
