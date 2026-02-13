'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, ArrowLeft, Car, MessageCircleQuestion, Info } from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import PriceChart from '@/components/verification/PriceChart';
import CostComparisonChart, { getCostStatus } from '@/components/verification/CostComparisonChart';
import { formatPrice } from '@/lib/utils';
import { fetchVerificationResult } from '@/lib/supabase/actions';
import { mockVerificationResult, getSimilarRepairCases } from '@/lib/mockData';
import type { SimilarRepairCase } from '@/lib/mockData';
import type { VerificationResult, ItemVerification } from '@/types';

// 2단계 상태: 적정 / 확인필요
const statusConfig = {
  appropriate: {
    label: '적정',
    Icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  review_needed: {
    label: '확인필요',
    Icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
};

/** 부품비/공임비 상태에 따른 정비사 질문 목록 생성 */
function getMechanicQuestions(
  status: 'appropriate' | 'review_needed',
  partUser: number,
  partAvg: number,
  laborUser: number,
  laborAvg: number,
  itemName: string
): string[] {
  const questions: string[] = [];
  const isPartHigh = partUser > 0 && partAvg > 0 && partUser > partAvg * 1.1;
  const isLaborHigh = laborUser > 0 && laborAvg > 0 && laborUser > laborAvg * 1.1;

  if (status === 'review_needed') {
    if (isPartHigh && isLaborHigh) {
      questions.push(`이 작업에 순정 부품 대신 대체 부품을 사용하면 비용이 얼마나 줄어드나요?`);
      questions.push(`공임이 시장 평균보다 높은데, 추가 작업이 포함되어 있는 건가요?`);
      questions.push(`부품비와 공임을 나눠서 각각 할인받을 수 있는 방법이 있을까요?`);
    } else if (isPartHigh) {
      questions.push(`순정 부품 대신 호환 부품을 사용하면 비용이 얼마나 다른가요?`);
      questions.push(`이 부품이 순정인가요? 순정이라면 부품 번호를 알 수 있을까요?`);
      questions.push(`같은 부품을 다른 정비소에서 교체하면 가격 차이가 있을까요?`);
    } else if (isLaborHigh) {
      questions.push(`이 작업의 예상 소요 시간이 어떻게 되나요?`);
      questions.push(`공임에 포함된 세부 작업 내역을 알 수 있을까요?`);
      questions.push(`추가 탈착이나 관련 작업이 포함되어 있는 건가요?`);
    } else {
      questions.push(`이 작업이 지금 꼭 필요한 건가요, 아니면 다음 점검 때 해도 되나요?`);
      questions.push(`비용을 줄일 수 있는 다른 방법이 있을까요?`);
    }
  } else {
    // 적정 범위
    questions.push(`다음에 이 부품을 또 교체해야 하는 시기는 언제인가요?`);
    questions.push(`관련해서 함께 점검해두면 좋을 부분이 있나요?`);
    if (partUser > 0) {
      questions.push(`사용된 부품의 보증 기간은 어떻게 되나요?`);
    }
  }

  return questions;
}

const shopTypeColors: Record<string, string> = {
  '블루핸즈': 'bg-blue-100 text-blue-700',
  '오토큐': 'bg-purple-100 text-purple-700',
  '공임나라': 'bg-orange-100 text-orange-700',
  '스피드메이트': 'bg-red-100 text-red-700',
};

const ItemDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId as string;

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showPartInfo, setShowPartInfo] = useState(false);
  const [showSimilarSheet, setShowSimilarSheet] = useState(false);

  const similarCases = useMemo(() => getSimilarRepairCases(itemId), [itemId]);

  useEffect(() => {
    const load = async () => {
      const estimateId = sessionStorage.getItem('currentEstimateId');
      if (estimateId) {
        const verificationResult = await fetchVerificationResult(estimateId);
        if (verificationResult.success && verificationResult.data) {
          const dbResult = verificationResult.data;
          const nameMap: Record<string, string> = {};
          const items: ItemVerification[] = dbResult.items.map((item: any) => {
            const id = item.estimate_item_id || item.estimateItem?.id || '';
            const name = item.estimateItem?.name || item.estimate_items?.name || '';
            if (id && name) nameMap[id] = name;
            const userPrice = item.user_price ?? 0;
            const partUser = item.part_cost_user ?? 0;
            const laborUser = item.labor_cost_user ?? 0;
            let costType: 'part' | 'labor' | 'combined' = 'combined';
            if (partUser > 0 && laborUser === 0) costType = 'part';
            else if (partUser === 0 && laborUser > 0) costType = 'labor';
            return {
              itemId: id,
              status: item.status,
              userPrice,
              averagePrice: item.average_price,
              priceRange: {
                min: item.min_price,
                max: item.max_price,
                median: item.median_price,
              },
              sampleCount: item.sample_count || 0,
              breakdown: {
                partCost: {
                  user: partUser,
                  average: item.part_cost_average,
                  partPriceSource:
                    item.part_price_source === 'wpc' || item.part_price_source === 'market'
                      ? item.part_price_source
                      : undefined,
                },
                laborCost: { user: laborUser, average: item.labor_cost_average },
              },
              costType,
              isFreeRepair: userPrice === 0,
              ...(userPrice === 0 && {
                guide: {
                  partVerdict: 'no_data' as const,
                  laborVerdict: 'no_data' as const,
                  partMessage: '무상수리 항목으로 견적 비교 대상이 아닙니다.',
                },
              }),
            };
          });
          setItemNames(nameMap);
          const totalPartCost = items.reduce((s, i) => s + (i.breakdown.partCost.user ?? 0), 0);
          const totalLaborCost = items.reduce((s, i) => s + (i.breakdown.laborCost.user ?? 0), 0);
          const comparableItems = items.filter((i) => !i.isFreeRepair);
          const totalPartCostAverage = comparableItems.reduce((s, i) => s + (i.breakdown.partCost.average ?? 0), 0);
          const totalLaborCostAverage = comparableItems.reduce((s, i) => s + (i.breakdown.laborCost.average ?? 0), 0);
          const shopType = (dbResult.estimate?.shop_type as VerificationResult['shopType']) ?? 'other';
          setResult({
            estimateId,
            totalAmount: dbResult.result.total_amount,
            status: dbResult.result.status as VerificationResult['status'],
            items,
            confidence: dbResult.result.confidence || 0,
            shopType,
            totalPartCost,
            totalLaborCost,
            totalPartCostAverage,
            totalLaborCostAverage,
          });
        } else {
          setResult(mockVerificationResult);
          setItemNames(
            Object.fromEntries(
              mockVerificationResult.items.map((i) => [i.itemId, '항목'])
            )
          );
        }
      } else {
        setResult(mockVerificationResult);
        setItemNames({ 'item-1': '브레이크 패드 교체 (전륜)', 'item-2': '브레이크 디스크 연마 (전륜)' });
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const item = result?.items.find((i) => i.itemId === itemId);
  const itemName = item ? itemNames[itemId] || '항목' : '';

  if (isLoading) {
    return (
      <main className="min-h-screen bg-hyundai-gray-50 flex flex-col">
        <div className="bg-white shrink-0 px-5 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center min-h-[48px]">
            <button
              type="button"
              onClick={() => router.back()}
              className="min-h-[44px] min-w-[44px] -ml-4 flex items-center justify-center text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-hyundai-gray-300" strokeWidth={1.5} />
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-hyundai-gray-50 flex flex-col">
        <div className="bg-white shrink-0 px-5 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center min-h-[48px]">
            <button
              type="button"
              onClick={() => router.back()}
              className="min-h-[44px] min-w-[44px] -ml-4 flex items-center justify-center text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">
          <p className="text-sm text-hyundai-gray-400">항목을 찾을 수 없습니다</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-3 text-sm font-medium text-hyundai-gray-900"
          >
            돌아가기
          </button>
        </div>
      </main>
    );
  }

  const config = statusConfig[item.status];
  const StatusIcon = config.Icon;
  const partUser = item.breakdown.partCost.user;
  const partAvg = item.breakdown.partCost.average;
  const partPriceSource = item.breakdown.partCost.partPriceSource;
  const laborUser = item.breakdown.laborCost.user;
  const laborAvg = item.breakdown.laborCost.average;
  const isFreeRepair = item.isFreeRepair ?? item.userPrice === 0;
  const partRefLabel = partPriceSource === 'wpc' ? 'WPC 순정가' : '시장 평균';
  const partRefLabelShort = partPriceSource === 'wpc' ? 'WPC' : '평균';
  const diffPercent = !isFreeRepair && item.averagePrice > 0
    ? Math.round(((item.userPrice - item.averagePrice) / item.averagePrice) * 100)
    : 0;
  const isCombined = item.costType === 'combined';
  const partStatus = isCombined ? getCostStatus(partUser, partAvg) : null;
  const laborStatus = isCombined ? getCostStatus(laborUser, laborAvg) : null;

  return (
    <>
      <main className="min-h-screen bg-hyundai-gray-50 flex flex-col pb-20">
        {/* 상단: 흰색 — 뒤로가기 + 제목 */}
        <div className="bg-white shrink-0">
          <div className="px-5 pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center min-h-[48px]">
              <button
                type="button"
                onClick={() => router.back()}
                className="min-h-[44px] min-w-[44px] -ml-4 flex items-center justify-center text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="pt-2 pb-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} mb-2`}>
                <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} strokeWidth={1.5} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
              <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                {itemName || '항목 상세'}
              </h1>
            </div>
          </div>
        </div>

        {/* 요약 + 차트 + 버튼 + 질문 — 흰색 영역이 남는 공간 채워서 회색 노출 방지 */}
        <div className="flex-1 min-h-0 bg-white" style={{ minHeight: 'calc(100dvh - 220px)' }}>
          <div className="px-5 pt-3 pb-5">
            {/* 요약 블록: 라벨(좌) / 값(우) */}
            <div className="p-4 bg-hyundai-gray-50 rounded-2xl">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-hyundai-gray-500">내 견적</span>
                <span className="text-base font-bold text-hyundai-gray-900 tabular-nums">
                  {formatPrice(item.userPrice)}
                </span>
              </div>
              {isFreeRepair ? (
                <p className="text-xs text-hyundai-gray-500">무상수리 항목으로 견적 비교 대상이 아닙니다.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-hyundai-gray-500 inline-flex items-center gap-1">
                      {partRefLabel}
                      {partPriceSource === 'wpc' && (
                        <span
                          className="inline-flex shrink-0 text-hyundai-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-hyundai-primary/50 rounded"
                          title="현대모비스에서 공급하는 정품 부품가입니다."
                          role="img"
                          aria-label="WPC 순정가 설명"
                        >
                          <Info className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </span>
                      )}
                    </span>
                    <span className="text-hyundai-gray-900 tabular-nums">
                      {formatPrice(item.averagePrice)}
                      {diffPercent !== 0 && (
                        <span className={`ml-1 ${diffPercent > 0 ? 'text-red-500' : 'text-green-600'}`}>
                          ({diffPercent > 0 ? '+' : ''}{diffPercent}%)
                        </span>
                      )}
                    </span>
                  </div>
                  {isCombined && partStatus && laborStatus && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-hyundai-gray-200">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        partStatus === 'appropriate' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-500'
                      }`}>
                        부품비 {partStatus === 'appropriate' ? '적정' : '확인필요'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        laborStatus === 'appropriate' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-500'
                      }`}>
                        공임비 {laborStatus === 'appropriate' ? '적정' : '확인필요'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 비용 비교 차트 */}
            {!isFreeRepair && (
              <div className="mt-6">
                {isCombined ? (
                  <CostComparisonChart
                    partUser={partUser}
                    partAvg={partAvg}
                    laborUser={laborUser}
                    laborAvg={laborAvg}
                    partRefLabel={partRefLabelShort}
                  />
                ) : (
                  <PriceChart
                    userPrice={item.userPrice}
                    priceRange={item.priceRange}
                    sampleCount={item.sampleCount}
                  />
                )}
              </div>
            )}

            {/* 비슷한차 정비결과 버튼 */}
            {!isFreeRepair && (
              <button
                type="button"
                onClick={() => setShowSimilarSheet(true)}
                className="w-full mt-6 py-4 px-5 rounded-2xl bg-hyundai-gray-50 flex items-center justify-center gap-3 active:bg-hyundai-gray-100 transition-colors touch-manipulation"
              >
                <span className="text-sm font-semibold text-hyundai-gray-900">비슷한차 정비결과</span>
                <span className="flex items-center -space-x-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Car className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.5} />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <Car className="w-3.5 h-3.5 text-purple-600" strokeWidth={1.5} />
                  </span>
                </span>
                <span className="text-xs font-medium text-hyundai-gray-400">+{similarCases.length}</span>
              </button>
            )}

            {/* 정비사님께 질문 — 구분선 + 리스트 (카드 없음) */}
            {!isFreeRepair && (
              <div className="mt-8 pt-6 border-t border-hyundai-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircleQuestion className="w-4 h-4 text-hyundai-gray-700" strokeWidth={1.5} />
                  <p className="text-[15px] font-bold text-hyundai-gray-900">정비사님께 이렇게 질문해보세요!</p>
                </div>
                <div className="space-y-0">
                  {getMechanicQuestions(item.status, partUser, partAvg, laborUser, laborAvg, itemName).map((q, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 py-3 ${i > 0 ? 'border-t border-hyundai-gray-100' : ''}`}
                    >
                      <span className="text-xs text-hyundai-primary font-bold mt-0.5 shrink-0">Q</span>
                      <p className="text-sm text-hyundai-gray-700 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 비슷한차 정비결과 바텀시트 */}
      <BottomSheet
        isOpen={showSimilarSheet}
        onClose={() => setShowSimilarSheet(false)}
        title="비슷한차 정비결과"
      >
        <div className="mb-3">
          <p className="text-xs text-hyundai-gray-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
            주행거리 짧은 순
          </p>
        </div>

        <div className="space-y-3">
          {similarCases.map((c) => (
            <SimilarCaseCard key={c.id} caseData={c} userPrice={item.userPrice} costType={item.costType} />
          ))}
        </div>
      </BottomSheet>
    </>
  );
};

function SimilarCaseCard({ caseData, userPrice, costType }: { caseData: SimilarRepairCase; userPrice: number; costType: 'part' | 'labor' | 'combined' }) {
  const colorClass = shopTypeColors[caseData.shopType] || 'bg-hyundai-gray-100 text-hyundai-gray-700';
  const diff = caseData.totalCost - userPrice;
  const priceColor = diff > 0 ? 'text-red-500' : diff < 0 ? 'text-blue-600' : 'text-hyundai-gray-900';
  const showBreakdown = costType === 'combined' && (caseData.partCost > 0 || caseData.laborCost > 0);

  return (
    <div className="py-4 border-b border-hyundai-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-hyundai-gray-50 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-hyundai-gray-400" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-hyundai-gray-900">{caseData.year}년형</span>
            <span className="text-xs text-hyundai-gray-400">{caseData.mileage}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-hyundai-gray-500 truncate">{caseData.variant}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium shrink-0 ${colorClass}`}>
              {caseData.shopType}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold tabular-nums ${priceColor}`}>
            {formatPrice(caseData.totalCost)}
          </p>
        </div>
      </div>
      {showBreakdown && (
        <div className="flex items-center gap-3 mt-2 pl-[52px]">
          <span className="text-[11px] text-hyundai-gray-400">부품 {formatPrice(caseData.partCost)}</span>
          <span className="text-hyundai-gray-200">·</span>
          <span className="text-[11px] text-hyundai-gray-400">공임 {formatPrice(caseData.laborCost)}</span>
        </div>
      )}
    </div>
  );
}

export default ItemDetailPage;
