import React from 'react';
import Link from 'next/link';
import { Header, Container } from '@/components/layout';
import UserMenu from '@/components/auth/UserMenu';
import VerificationCTA from '@/components/verification/VerificationCTA';
import RecentHistory from '@/components/verification/RecentHistory';
import VehicleInfo from '@/components/vehicle/VehicleInfo';
import { fetchVehicle, fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { Camera, Search, CheckCircle, Car, ChevronRight, Shield, Lightbulb } from 'lucide-react';
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
      }))
    : [];

  const userName = user
    ? (user.user_metadata?.name as string | undefined) || user.email?.split('@')[0] || '게스트'
    : null;

  // 검증 통계 계산
  const totalVerifications = recentHistory.length;
  const appropriateCount = recentHistory.filter(h => h.status === 'appropriate').length;

  // 다음 예상 정비 (차량 주행거리 기반 간단 추정)
  const nextMaintenance = vehicle
    ? getNextMaintenance(vehicle.mileage)
    : null;

  return (
    <>
      <Header title="정비 견적 검증" rightAction={<UserMenu />} />

      <main className="min-h-screen bg-hyundai-gray-50 pb-[76px]">
        <Container>
          <div className="py-5 space-y-5">
            {user ? (
              /* ===== 로그인 사용자 홈 ===== */
              <>
                {/* 인사말 + CTA */}
                <div>
                  <h2 className="text-2xl font-bold text-hyundai-gray-900 tracking-tight mb-1">
                    {userName}님,
                  </h2>
                  <p className="text-body-2 text-hyundai-gray-500 mb-4">
                    오늘도 안심 정비하세요
                  </p>
                  <VerificationCTA />
                </div>

                {/* 차량 정보 */}
                {vehicle ? (
                  <VehicleInfo vehicle={vehicle} nextMaintenance={nextMaintenance ?? undefined} />
                ) : (
                  <VehicleRegisterCard />
                )}

                {/* 검증 요약 통계 */}
                {totalVerifications > 0 && (
                  <VerificationStats
                    totalCount={totalVerifications}
                    appropriateCount={appropriateCount}
                  />
                )}

                {/* 최근 검증 내역 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-hyundai-gray-900">
                      최근 검증 내역
                    </h3>
                    {recentHistory.length > 0 && (
                      <Link href="/history" className="text-body-2 text-hyundai-gray-500 font-medium flex items-center gap-0.5">
                        전체보기
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  {recentHistory.length === 0 ? (
                    <EmptyHistoryCard />
                  ) : (
                    <RecentHistory items={recentHistory} />
                  )}
                </div>
              </>
            ) : (
              /* ===== 비로그인 사용자 홈 ===== */
              <>
                {/* 가치 제안 헤드카피 + CTA */}
                <div>
                  <h2 className="text-2xl font-bold text-hyundai-gray-900 tracking-tight leading-snug mb-1">
                    정비 견적,<br />
                    적정 가격인지 바로 확인하세요
                  </h2>
                  <p className="text-body-2 text-hyundai-gray-500 mb-4">
                    정비소에서 받은 견적서를 시장 평균가와 비교해드려요
                  </p>
                  <VerificationCTA />
                  <p className="text-caption text-center text-hyundai-gray-400 mt-2">
                    로그인 없이 바로 사용할 수 있어요
                  </p>
                </div>

                {/* 서비스 프로세스 안내 */}
                <HowItWorksSection />

                {/* 동기 부여 통계 */}
                <MotivationCard />

                {/* 하단 로그인 유도 */}
                <LoginBenefitsCard />
              </>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}

/* ===== 서브 컴포넌트 ===== */

/** 서비스 프로세스 3단계 안내 (비로그인) */
function HowItWorksSection() {
  const steps = [
    { icon: Camera, label: '견적서 촬영', desc: '사진 또는 직접 입력' },
    { icon: Search, label: '시세 분석', desc: '시장 평균가 비교' },
    { icon: CheckCircle, label: '결과 확인', desc: '항목별 적정성 판단' },
  ];

  return (
    <Card variant="default" padding="md">
      <p className="text-body-1 font-bold text-hyundai-gray-900 mb-4">
        이렇게 검증해드려요
      </p>
      <div className="flex items-start justify-between gap-2">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-hyundai-gray-50 flex items-center justify-center mb-2">
                <step.icon className="w-5 h-5 text-hyundai-gray-700" strokeWidth={1.5} />
              </div>
              <p className="text-body-2 font-medium text-hyundai-gray-900">{step.label}</p>
              <p className="text-caption text-hyundai-gray-400 mt-0.5">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="pt-5 shrink-0">
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

/** 동기 부여 통계 카드 (비로그인) */
function MotivationCard() {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-hyundai-gray-50 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-hyundai-gray-700" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-body-1 font-bold text-hyundai-gray-900 mb-1">
            알고 계셨나요?
          </p>
          <p className="text-body-2 text-hyundai-gray-600 leading-relaxed">
            자동차 정비 견적의 <span className="font-semibold text-hyundai-gray-900">약 30%</span>는
            시장 평균보다 높은 가격으로 책정됩니다.
            미리 확인하면 불필요한 비용을 줄일 수 있어요.
          </p>
        </div>
      </div>
    </Card>
  );
}

/** 하단 로그인 유도 카드 (비로그인) */
function LoginBenefitsCard() {
  return (
    <Card variant="default" padding="md">
      <p className="text-body-1 font-bold text-hyundai-gray-900 mb-2">
        로그인하면 더 편리해요
      </p>
      <ul className="space-y-1.5 mb-4">
        {[
          '검증 이력 자동 저장',
          '내 차량 정보 맞춤 분석',
          '다음 정비 시기 알림',
        ].map((text) => (
          <li key={text} className="flex items-center gap-2 text-body-2 text-hyundai-gray-600">
            <CheckCircle className="w-4 h-4 text-hyundai-gray-400 shrink-0" strokeWidth={1.5} />
            {text}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Link
          href="/auth/login"
          className="flex-1 py-3 rounded-xl bg-hyundai-gray-900 text-white text-body-2 font-medium text-center hover:bg-hyundai-gray-800 transition-colors"
        >
          로그인
        </Link>
        <Link
          href="/auth/signup"
          className="flex-1 py-3 rounded-xl bg-white text-hyundai-gray-900 border border-hyundai-gray-200 text-body-2 font-medium text-center hover:bg-hyundai-gray-50 transition-colors"
        >
          회원가입
        </Link>
      </div>
    </Card>
  );
}

/** 차량 미등록 상태 카드 */
function VehicleRegisterCard() {
  return (
    <Link href="/vehicle">
      <Card variant="default" padding="md" className="active:opacity-90">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 shrink-0 rounded-full bg-hyundai-gray-50 flex items-center justify-center">
            <Car className="w-6 h-6 text-hyundai-gray-700" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-1 font-medium text-hyundai-gray-900 mb-0.5">
              내 차량을 등록해보세요
            </p>
            <p className="text-body-2 text-hyundai-gray-400">
              차종별 맞춤 가격으로 더 정확하게 검증해요
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-hyundai-gray-300 shrink-0" />
        </div>
      </Card>
    </Link>
  );
}

/** 검증 요약 통계 카드 (로그인 사용자) */
function VerificationStats({ totalCount, appropriateCount }: { totalCount: number; appropriateCount: number }) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-hyundai-gray-700" strokeWidth={1.5} />
        <p className="text-body-1 font-bold text-hyundai-gray-900">검증 요약</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-hyundai-gray-50 p-3 text-center">
          <p className="text-2xl font-bold text-hyundai-gray-900">{totalCount}회</p>
          <p className="text-caption text-hyundai-gray-400 mt-0.5">총 검증</p>
        </div>
        <div className="rounded-xl bg-hyundai-gray-50 p-3 text-center">
          <p className="text-2xl font-bold text-hyundai-gray-900">{appropriateCount}건</p>
          <p className="text-caption text-hyundai-gray-400 mt-0.5">적정 판정</p>
        </div>
      </div>
    </Card>
  );
}

/** 빈 검증 이력 상태 카드 */
function EmptyHistoryCard() {
  return (
    <Link href="/verify">
      <Card variant="default" padding="md" className="active:opacity-90">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-hyundai-gray-50 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-hyundai-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-body-1 text-hyundai-gray-700 font-medium mb-1">
            아직 검증 내역이 없어요
          </p>
          <p className="text-body-2 text-hyundai-gray-400 font-medium">
            첫 견적서를 검증해보세요 →
          </p>
        </div>
      </Card>
    </Link>
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
