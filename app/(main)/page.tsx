import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout';
import UserMenu from '@/components/auth/UserMenu';
import RecentHistory from '@/components/verification/RecentHistory';
import VehicleInfo from '@/components/vehicle/VehicleInfo';
import { fetchVehicle, fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { Camera, Search, CheckCircle, Car, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import type { Vehicle, VerificationHistory } from '@/types';

export default async function HomePage() {
  const user = await getCurrentUser();

  const vehicleResult = user ? await fetchVehicle() : { success: false, data: null };
  const historyResult = user ? await fetchRecentHistory(3) : { success: false, data: null };

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

  const totalVerifications = recentHistory.length;

  const nextMaintenance = vehicle
    ? getNextMaintenance(vehicle.mileage)
    : null;

  return (
    <>
      {/* 홈 전용 헤더 — 최소화 */}
      <header className="sticky top-0 z-50 bg-white border-b border-hyundai-gray-200 min-h-[56px] flex items-center justify-between px-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-hyundai-gray-900">
            정비 견적 검증
          </p>
        </div>
        <div className="shrink-0">
          <UserMenu />
        </div>
      </header>

      <main className="min-h-[calc(100vh-60px)] bg-hyundai-gray-50">
        <Container>
          {user ? (
            /* ===== 로그인 사용자 홈 ===== */
            <div className="py-5 space-y-4">
              {/* 인사말 */}
              <div className="px-1">
                <h2 className="text-xl font-bold text-hyundai-gray-900 tracking-tight">
                  {userName}님, 안녕하세요
                </h2>
                <p className="text-sm text-hyundai-gray-400 mt-0.5">
                  오늘도 안심 정비하세요
                </p>
              </div>

              {/* 차량 정보 통합 카드 */}
              {vehicle ? (
                <VehicleInfo
                  vehicle={vehicle}
                  nextMaintenance={nextMaintenance ?? undefined}
                  totalVerifications={totalVerifications}
                />
              ) : (
                <VehicleRegisterCard />
              )}

              {/* 최근 검증 내역 */}
              <div>
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-sm font-bold text-hyundai-gray-900">
                    최근 검증 내역
                  </h3>
                  {recentHistory.length > 0 && (
                    <Link href="/history" className="text-xs text-hyundai-gray-400 font-medium flex items-center gap-0.5">
                      전체보기
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                {recentHistory.length === 0 ? (
                  <EmptyHistoryCard />
                ) : (
                  <RecentHistory items={recentHistory} />
                )}
              </div>
            </div>
          ) : (
            /* ===== 비로그인 사용자 홈 ===== */
            <div className="py-5">
              {/* 히어로 영역 — 가치 제안 + CTA 묶음 */}
              <div className="space-y-4 mb-8">
                <div className="px-1 pt-2">
                  <h2 className="text-xl font-bold text-hyundai-gray-900 tracking-tight leading-snug">
                    정비 견적,<br />
                    적정 가격인지 바로 확인하세요
                  </h2>
                  <p className="text-sm text-hyundai-gray-400 mt-1">
                    정비소에서 받은 견적서를 시장 평균가와 비교해드려요
                  </p>
                </div>

                <Link href="/verify/camera">
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-[#002C5F] rounded-2xl active:opacity-90 transition-opacity">
                    <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                      <Camera className="w-4.5 h-4.5 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">견적서 검증하기</p>
                      <p className="text-[11px] text-white/60">로그인 없이 바로 사용할 수 있어요</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 shrink-0" strokeWidth={1.5} />
                  </div>
                </Link>
              </div>

              {/* 하단 정보 영역 — 간격 좁게 */}
              <div className="space-y-3">
                <HowItWorksSection />
                <LoginPrompt />
              </div>
            </div>
          )}
        </Container>
      </main>
    </>
  );
}

/* ===== 서브 컴포넌트 ===== */

/** 서비스 프로세스 3단계 — 아이콘 내 숫자, 영문 STEP 제거 */
function HowItWorksSection() {
  const steps = [
    { icon: Camera, num: '1', label: '견적서 촬영', desc: '사진 또는 직접 입력' },
    { icon: Search, num: '2', label: '시세 분석', desc: '시장 평균가 비교' },
    { icon: CheckCircle, num: '3', label: '결과 확인', desc: '항목별 적정성 판단' },
  ];

  return (
    <div>
      <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">
        이렇게 검증해드려요
      </p>
      <Card variant="default" padding="none">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            {i > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
            <div className="flex items-center gap-3.5 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-hyundai-gray-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-hyundai-gray-500">{step.num}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-hyundai-gray-900">{step.label}</p>
                <p className="text-xs text-hyundai-gray-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          </React.Fragment>
        ))}
      </Card>
    </div>
  );
}

/** 로그인 유도 — 간소화 row */
function LoginPrompt() {
  return (
    <Link href="/auth/login">
      <Card variant="default" padding="none">
        <div className="flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
          <div>
            <p className="text-sm font-medium text-hyundai-gray-900">
              로그인하면 검증 이력이 저장돼요
            </p>
            <p className="text-xs text-hyundai-gray-400 mt-0.5">
              내 차량 맞춤 분석도 받을 수 있어요
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
        </div>
      </Card>
    </Link>
  );
}

/** 차량 미등록 카드 */
function VehicleRegisterCard() {
  return (
    <Link href="/vehicle">
      <Card variant="default" padding="none">
        <div className="flex items-center gap-3.5 px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
          <div className="w-9 h-9 shrink-0 rounded-full bg-hyundai-gray-50 flex items-center justify-center">
            <Car className="w-4 h-4 text-hyundai-gray-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-hyundai-gray-900">
              내 차량을 등록해보세요
            </p>
            <p className="text-xs text-hyundai-gray-400 mt-0.5">
              차종별 맞춤 가격으로 더 정확하게 검증해요
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
        </div>
      </Card>
    </Link>
  );
}

/** 빈 검증 이력 */
function EmptyHistoryCard() {
  return (
    <Card variant="default" padding="none">
      <div className="text-center px-5 py-8">
        <p className="text-sm text-hyundai-gray-400">
          아직 검증 내역이 없어요
        </p>
        <p className="text-xs text-hyundai-gray-300 mt-0.5">
          첫 견적서를 검증해보세요
        </p>
      </div>
    </Card>
  );
}

/** 주행거리 기반 다음 정비 추정 */
function getNextMaintenance(mileage: number): { name: string; remainingKm: number } | null {
  const schedules = [
    { name: '엔진오일 교환', interval: 10000 },
    { name: '에어컨 필터 교체', interval: 15000 },
    { name: '브레이크 패드 점검', interval: 30000 },
    { name: '변속기 오일 교환', interval: 40000 },
  ];

  let nearest: { name: string; remainingKm: number } | null = null;

  for (const schedule of schedules) {
    const remaining = schedule.interval - (mileage % schedule.interval);
    if (!nearest || remaining < nearest.remainingKm) {
      nearest = { name: schedule.name, remainingKm: remaining };
    }
  }

  return nearest;
}
