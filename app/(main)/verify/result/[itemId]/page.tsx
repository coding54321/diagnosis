'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Loader2, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';
import PriceChart from '@/components/verification/PriceChart';
import { formatPrice } from '@/lib/utils';
import { fetchVerificationResult } from '@/lib/supabase/actions';
import { mockVerificationResult } from '@/lib/mockData';
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

const ItemDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId as string;

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showPartInfo, setShowPartInfo] = useState(false);

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
            return {
              itemId: id,
              status: item.status,
              userPrice: item.user_price,
              averagePrice: item.average_price,
              priceRange: {
                min: item.min_price,
                max: item.max_price,
                median: item.median_price,
              },
              sampleCount: item.sample_count || 0,
              breakdown: {
                partCost: { user: item.part_cost_user, average: item.part_cost_average },
                laborCost: { user: item.labor_cost_user, average: item.labor_cost_average },
              },
            };
          });
          setItemNames(nameMap);
          setResult({
            estimateId,
            totalAmount: dbResult.result.total_amount,
            status: dbResult.result.status as VerificationResult['status'],
            items,
            confidence: dbResult.result.confidence || 0,
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
      <main className="min-h-screen bg-white">
        <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 flex items-center text-hyundai-gray-700"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-hyundai-gray-300" strokeWidth={1.5} />
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 flex items-center text-hyundai-gray-700"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <Container>
          <div className="text-center px-5 py-16">
            <p className="text-sm text-hyundai-gray-400">항목을 찾을 수 없습니다</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-3 text-sm font-medium text-hyundai-gray-900"
            >
              돌아가기
            </button>
          </div>
        </Container>
      </main>
    );
  }

  const config = statusConfig[item.status];
  const StatusIcon = config.Icon;
  const partUser = item.breakdown.partCost.user;
  const partAvg = item.breakdown.partCost.average;
  const laborUser = item.breakdown.laborCost.user;
  const laborAvg = item.breakdown.laborCost.average;
  const diffPercent = item.averagePrice > 0
    ? Math.round(((item.userPrice - item.averagePrice) / item.averagePrice) * 100)
    : 0;

  return (
    <>
      <main className="min-h-screen bg-white pb-20">
        {/* 뒤로가기 헤더 */}
        <div className="flex items-center px-4 pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 flex items-center text-hyundai-gray-700"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <Container>
          <div className="px-1 pt-2 pb-2">
            <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
              {itemName || '항목 상세'}
            </h1>
          </div>

          <div className="space-y-4">
            {/* 상단 요약 — 금액 + 상태 + 평균 비교 */}
            <div className="px-1 text-center py-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} mb-3`}>
                <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} strokeWidth={1.5} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
              <p className="text-3xl font-bold text-hyundai-gray-900 tracking-tight">
                {formatPrice(item.userPrice)}
              </p>
              <p className="text-xs text-hyundai-gray-400 mt-1.5">
                시장 평균 {formatPrice(item.averagePrice)}
                {diffPercent !== 0 && (
                  <span className={`ml-1.5 ${diffPercent > 0 ? 'text-red-400' : 'text-green-500'}`}>
                    ({diffPercent > 0 ? '+' : ''}{diffPercent}%)
                  </span>
                )}
              </p>
            </div>

            {/* 가격 분포 차트 */}
            <PriceChart
              userPrice={item.userPrice}
              priceRange={item.priceRange}
              sampleCount={item.sampleCount}
            />

            {/* 비용 분해 — row+divider 패턴 */}
            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">비용 분해</p>
              <Card variant="default" padding="none">
                {/* 부품비 */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-hyundai-gray-900 font-medium">부품비</span>
                    <span className="text-sm font-bold text-hyundai-gray-900">
                      {formatPrice(partUser)}
                    </span>
                  </div>
                  {partAvg > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-hyundai-gray-400">시장 평균</span>
                      <span className="text-xs text-hyundai-gray-400">
                        {formatPrice(partAvg)}
                        {partUser > partAvg && (
                          <span className="text-red-400 ml-1">
                            +{formatPrice(partUser - partAvg)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mx-5 border-b border-hyundai-gray-100" />

                {/* 공임비 */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-hyundai-gray-900 font-medium">공임비</span>
                    <span className="text-sm font-bold text-hyundai-gray-900">
                      {formatPrice(laborUser)}
                    </span>
                  </div>
                  {laborAvg > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-hyundai-gray-400">시장 평균</span>
                      <span className="text-xs text-hyundai-gray-400">
                        {formatPrice(laborAvg)}
                        {laborUser > laborAvg && (
                          <span className="text-red-400 ml-1">
                            +{formatPrice(laborUser - laborAvg)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* 부품 설명 — 접히는 카드 */}
            <Card variant="default" padding="none">
              <button
                type="button"
                onClick={() => setShowPartInfo(!showPartInfo)}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-hyundai-gray-900">이 부품이 뭔가요?</span>
                {showPartInfo ? (
                  <ChevronUp className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
                ) : (
                  <ChevronDown className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
                )}
              </button>
              {showPartInfo && (
                <>
                  <div className="mx-5 border-b border-hyundai-gray-100" />
                  <div className="px-5 py-4">
                    <p className="text-xs text-hyundai-gray-500 leading-relaxed">
                      검증 결과는 블루핸즈 표준 공임 및 시장 데이터를 기준으로 합니다.
                      정확한 작업 내용·부품 설명은 정비소에 문의해 주세요.
                    </p>
                  </div>
                </>
              )}
            </Card>

            {/* 데이터 출처 */}
            <Card variant="default" padding="none">
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-hyundai-gray-900 mb-2">데이터 출처</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-hyundai-gray-400">표본 수</span>
                    <span className="text-xs text-hyundai-gray-600">{item.sampleCount}건</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-hyundai-gray-400">출처</span>
                    <span className="text-xs text-hyundai-gray-600">블루핸즈 정비 데이터</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-hyundai-gray-400">비교 기준</span>
                    <span className="text-xs text-hyundai-gray-600">동일 차종·유사 작업</span>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        </Container>
      </main>
    </>
  );
};

export default ItemDetailPage;
