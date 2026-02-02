import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, ChevronRight, Wrench, MapPin } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import UserMenu from '@/components/auth/UserMenu';
import { Card, Badge, Button } from '@/components/ui';
import VehicleInfo from '@/components/vehicle/VehicleInfo';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { fetchVehicle, fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { mockVehicle, mockRecentHistory } from '@/lib/mockData';
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

  const vehicle: Vehicle = vehicleResult.success && vehicleResult.data
    ? {
        id: vehicleResult.data.id,
        manufacturer: vehicleResult.data.manufacturer,
        model: vehicleResult.data.model,
        variant: vehicleResult.data.variant || undefined,
        year: vehicleResult.data.year,
        mileage: vehicleResult.data.mileage,
        fuelType: vehicleResult.data.fuel_type,
      }
    : mockVehicle;

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
    : mockRecentHistory;

  // 통계 계산
  const totalSpent = history.reduce((sum, h) => sum + h.totalAmount, 0);
  const maintenanceCount = history.length;
  const averageSpent = maintenanceCount > 0 ? Math.floor(totalSpent / maintenanceCount) : 0;

  // 다음 예상 정비
  const nextMaintenance = getNextMaintenance(vehicle.mileage);

  return (
    <>
      <Header title="내 차 관리" rightAction={<UserMenu />} />

      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-5 space-y-5">
            {!user && (
              <LoginPrompt message="로그인하시면 차량 정보와 정비 통계를 저장하고 관리할 수 있어요" />
            )}

            {/* 차량 정보 */}
            <VehicleInfo vehicle={vehicle} nextMaintenance={nextMaintenance ?? undefined} />

            {/* 정비 통계 - 가로 3열 */}
            <div className="grid grid-cols-3 gap-3">
              <Card variant="default" padding="sm" className="text-center py-4">
                <p className="text-2xl font-bold text-hyundai-gray-900">{maintenanceCount}</p>
                <p className="text-caption text-hyundai-gray-400 mt-1">총 정비</p>
              </Card>
              <Card variant="default" padding="sm" className="text-center py-4">
                <p className="text-2xl font-bold text-hyundai-gray-900">{formatCompact(totalSpent)}</p>
                <p className="text-caption text-hyundai-gray-400 mt-1">누적 비용</p>
              </Card>
              <Card variant="default" padding="sm" className="text-center py-4">
                <p className="text-2xl font-bold text-hyundai-gray-900">{formatCompact(averageSpent)}</p>
                <p className="text-caption text-hyundai-gray-400 mt-1">평균 비용</p>
              </Card>
            </div>

            {/* 정비 이력 */}
            <div>
              <h3 className="text-lg font-bold text-hyundai-gray-900 mb-3">정비 이력</h3>
              {history.length === 0 ? (
                <Card variant="default" padding="md">
                  <div className="text-center py-8">
                    <Wrench className="w-8 h-8 text-hyundai-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-body-2 text-hyundai-gray-400">아직 정비 이력이 없어요</p>
                  </div>
                </Card>
              ) : (
                <Card variant="default" padding="none">
                  {history.map((item, index) => {
                    const config = statusConfig[item.status];
                    const StatusIcon = config.Icon;

                    return (
                      <Link key={item.id} href={`/history/${item.id}`}>
                        <div className={`px-5 py-4 active:bg-hyundai-gray-50 transition-colors ${
                          index < history.length - 1 ? 'border-b border-hyundai-gray-100' : ''
                        }`}>
                          {/* 상단: 날짜 + 상태 배지 */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-caption text-hyundai-gray-400">
                              {formatHistoryDate(item.date)}
                            </span>
                            <Badge variant={config.variant} size="sm" className="flex items-center gap-1">
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </div>

                          {/* 중간: 정비 항목 + 금액 */}
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-body-1 font-medium text-hyundai-gray-900 flex-1 mr-3">
                              {item.items}
                            </p>
                            <p className="text-body-1 font-bold text-hyundai-gray-900 shrink-0">
                              {formatPrice(item.totalAmount)}
                            </p>
                          </div>

                          {/* 하단: 정비소 이름 */}
                          {item.shopName && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-hyundai-gray-300" strokeWidth={1.5} />
                              <span className="text-caption text-hyundai-gray-400">
                                {item.shopName}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </Card>
              )}
            </div>

            {/* 다음 예상 정비 */}
            <div>
              <h3 className="text-lg font-bold text-hyundai-gray-900 mb-3">다음 예상 정비</h3>
              <Card variant="default" padding="none">
                {getUpcomingMaintenances(vehicle.mileage).map((item, index, arr) => (
                  <div
                    key={item.name}
                    className={`px-5 py-4 flex items-center justify-between ${
                      index < arr.length - 1 ? 'border-b border-hyundai-gray-100' : ''
                    }`}
                  >
                    <div>
                      <p className="text-body-1 font-medium text-hyundai-gray-900">
                        {item.name}
                      </p>
                      <p className="text-caption text-hyundai-gray-400 mt-0.5">
                        약 {item.remainingKm.toLocaleString('ko-KR')}km 후
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-hyundai-gray-300" />
                  </div>
                ))}
              </Card>
            </div>

            {/* 차량 정보 수정 */}
            {user && (
              <Link href="/vehicle/edit" className="block">
                <Button variant="outline" size="lg" fullWidth>
                  {vehicleResult.success && vehicleResult.data ? '차량 정보 수정' : '차량 등록'}
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}

/** 금액 축약 표시 (만원 단위) */
function formatCompact(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    return `${man}만`;
  }
  return amount.toLocaleString('ko-KR');
}

/** 정비 이력 날짜 포맷 (YYYY.MM.DD) */
function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 주행거리 기반 다음 정비 추정 */
function getNextMaintenance(mileage: number): { name: string; remainingKm: number } | null {
  const items = getUpcomingMaintenances(mileage);
  return items.length > 0 ? items[0] : null;
}

/** 예상 정비 목록 (가까운 순) */
function getUpcomingMaintenances(mileage: number): Array<{ name: string; remainingKm: number }> {
  const schedules = [
    { name: '엔진오일 교환', interval: 10000 },
    { name: '에어컨 필터 교체', interval: 15000 },
    { name: '브레이크 패드 점검', interval: 30000 },
    { name: '변속기 오일 교환', interval: 40000 },
  ];

  return schedules
    .map((s) => ({
      name: s.name,
      remainingKm: s.interval - (mileage % s.interval),
    }))
    .sort((a, b) => a.remainingKm - b.remainingKm);
}
