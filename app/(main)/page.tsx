import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout';
import { fetchVehicle, fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { Camera, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const user = await getCurrentUser();

  const historyResult = user ? await fetchRecentHistory(3) : { success: false, data: null };
  const vehicleResult = user ? await fetchVehicle() : { success: false, data: null };

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

  const recentHistory: VerificationHistory[] = historyResult.success && historyResult.data
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

  const userName = user
    ? (user.user_metadata?.name as string | undefined) || user.email?.split('@')[0] || '게스트'
    : null;

  return (
    <main className="min-h-[calc(100vh-60px)] bg-white pt-[env(safe-area-inset-top,0px)]">
      <Container>
        {user ? (
          /* ===== 로그인 사용자 ===== */
          <div className="pb-8">
            {/* 히어로 카피 */}
            <div className="px-1 pt-8 pb-6">
              <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                {userName}님,<br />
                견적서를 검증해볼까요?
              </h1>
            </div>

            {/* 히어로 액션 — 견적서 촬영 카드 */}
            <Link href="/verify/camera">
              <div className="relative overflow-hidden rounded-2xl bg-hyundai-gray-900 px-6 py-7 active:opacity-90 transition-opacity">
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-4">
                    <Camera className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-[15px] font-medium text-white mb-1">견적서 촬영하기</p>
                  <p className="text-xs text-white/50">사진 한 장으로 적정 가격을 확인하세요</p>
                </div>
                {/* 배경 장식 */}
                <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-white/[0.04]" />
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/[0.03]" />
              </div>
            </Link>
            <DirectInputButton />

            {/* 내 차량 미니 요약 (등록된 경우만) */}
            {vehicle && (
              <Link href="/vehicle" className="block mt-2">
                <Card variant="default" padding="none">
                  <div className="flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
                    <div>
                      <p className="text-xs text-hyundai-gray-400 mb-0.5">내 차량</p>
                      <p className="text-sm font-medium text-hyundai-gray-900">
                        {vehicle.manufacturer} {vehicle.model}
                        {vehicle.variant ? ` ${vehicle.variant}` : ''} · {vehicle.year}년식
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                  </div>
                </Card>
              </Link>
            )}

            {/* 최근 검증 내역 (최대 2건) */}
            {recentHistory.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-sm font-bold text-hyundai-gray-900">최근 검증</h3>
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
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-hyundai-gray-400">{formatHistoryDate(item.date)}</span>
                                <Badge variant={config.variant} size="sm" className="flex items-center gap-0.5">
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  {config.label}
                                </Badge>
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
        ) : (
          /* ===== 비로그인 사용자 ===== */
          <div className="pb-8">
            {/* 히어로 카피 */}
            <div className="px-1 pt-8 pb-7">
              <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                정비 견적,<br />
                적정 가격인지<br />
                바로 확인하세요
              </h1>
              <p className="text-sm text-hyundai-gray-400 mt-2">
                실제 정비 데이터로 견적을 검증·비교해드려요
              </p>
            </div>

            {/* 히어로 액션 — 견적서 촬영 카드 */}
            <Link href="/verify/camera">
              <div className="relative overflow-hidden rounded-2xl bg-hyundai-gray-900 px-6 py-7 active:opacity-90 transition-opacity">
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center mb-4">
                    <Camera className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-[15px] font-medium text-white mb-1">견적서 촬영하기</p>
                  <p className="text-xs text-white/50">로그인 없이 바로 사용할 수 있어요</p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-white/[0.04]" />
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/[0.03]" />
              </div>
            </Link>
            <DirectInputButton />

            {/* 로그인 유도 */}
            <div className="mt-3">
              <LoginPrompt />
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}

/* ===== 서브 컴포넌트 ===== */

function LoginPrompt() {
  return (
    <Link href="/auth/login">
      <Card variant="default" padding="none">
        <div className="flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
          <div>
            <p className="text-sm font-medium text-hyundai-gray-900">로그인하면 검증 이력이 저장돼요</p>
            <p className="text-xs text-hyundai-gray-400 mt-0.5">내 차량 맞춤 분석도 받을 수 있어요</p>
          </div>
          <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
        </div>
      </Card>
    </Link>
  );
}

function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}.${day}`;
}
