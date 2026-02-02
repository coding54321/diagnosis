'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, XCircle, DollarSign, Info, Database, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import PriceChart from '@/components/verification/PriceChart';
import { formatPrice } from '@/lib/utils';
import { fetchVerificationResult } from '@/lib/supabase/actions';
import { mockVerificationResult } from '@/lib/mockData';
import type { VerificationResult, ItemVerification } from '@/types';

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
    label: '재검토 권장',
    variant: 'error' as const,
    Icon: XCircle,
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
      <>
        <Header title="항목 상세" showBackButton onBack={() => router.back()} />
        <main className="min-h-screen bg-hyundai-gray-50 pb-20">
          <Container>
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-hyundai-blue-500" />
            </div>
          </Container>
        </main>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Header title="항목 상세" showBackButton onBack={() => router.back()} />
        <main className="min-h-screen bg-hyundai-gray-50 pb-20">
          <Container>
            <div className="py-6">
              <p className="text-body-1 text-hyundai-gray-700">항목을 찾을 수 없습니다.</p>
              <button
                type="button"
                onClick={() => router.back()}
                className="mt-4 text-body-1 text-hyundai-blue-500 font-medium"
              >
                검증 결과로 돌아가기
              </button>
            </div>
          </Container>
        </main>
      </>
    );
  }

  const config = statusConfig[item.status];
  const StatusIcon = config.Icon;
  const partUser = item.breakdown.partCost.user;
  const partAvg = item.breakdown.partCost.average;
  const laborUser = item.breakdown.laborCost.user;
  const laborAvg = item.breakdown.laborCost.average;

  return (
    <>
      <Header
        title={itemName.length > 12 ? `${itemName.slice(0, 12)}…` : itemName || '항목 상세'}
        showBackButton
        onBack={() => router.back()}
      />

      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-6">
            {/* 항목 요약 */}
            <Card variant="highlighted" padding="md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-h2 text-hyundai-gray-900 mb-2">
                    {formatPrice(item.userPrice)}
                  </h2>
                  <Badge variant={config.variant} size="md" className="flex items-center gap-1 w-fit">
                    <StatusIcon className="w-4 h-4" />
                    {config.label}
                  </Badge>
                </div>
              </div>
              <p className="text-body-2 text-hyundai-gray-600">
                시장 평균 {formatPrice(item.averagePrice)} · 표본 {item.sampleCount}건
              </p>
            </Card>

            {/* 가격 분포 차트 */}
            <PriceChart
              userPrice={item.userPrice}
              priceRange={item.priceRange}
              sampleCount={item.sampleCount}
            />

            {/* 비용 분해 */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">비용 분해</h3>
              </div>

              <div className="space-y-4">
                <div className="border-b border-hyundai-gray-200 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-1 text-hyundai-gray-700">부품비</span>
                    <span className="text-body-1 font-semibold text-hyundai-gray-900">
                      {formatPrice(partUser)}
                    </span>
                  </div>
                  {partAvg > 0 && (
                    <p className="text-body-2 text-hyundai-gray-600">
                      • 시장 평균: {formatPrice(partAvg)}
                      {partUser > partAvg && (
                        <span className="text-semantic-warning-main ml-1">
                          (평균 대비 +{formatPrice(partUser - partAvg)})
                        </span>
                      )}
                    </p>
                  )}
                  {partUser > partAvg && partAvg > 0 && (
                    <div className="mt-3 p-3 bg-hyundai-gray-50 rounded-lg border border-hyundai-gray-200">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-hyundai-gray-600 mt-0.5 flex-shrink-0" />
                        <p className="text-body-2 text-hyundai-gray-700">
                          호환 부품 또는 다른 정비소 견적을 비교해 보시면 절감할 수 있을 수 있어요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-1 text-hyundai-gray-700">공임비</span>
                    <span className="text-body-1 font-semibold text-hyundai-gray-900">
                      {formatPrice(laborUser)}
                    </span>
                  </div>
                  {laborAvg > 0 && (
                    <p className="text-body-2 text-hyundai-gray-600">
                      • 시장 평균: {formatPrice(laborAvg)}
                      {laborUser > laborAvg && (
                        <span className="text-semantic-warning-main ml-1">
                          (평균 대비 +{formatPrice(laborUser - laborAvg)})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* 부품 설명 */}
            <Card variant="default" padding="md">
              <button
                type="button"
                onClick={() => setShowPartInfo(!showPartInfo)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-hyundai-gray-600" />
                  <h3 className="text-h4 text-hyundai-gray-900">이 부품이 뭔가요?</h3>
                </div>
                {showPartInfo ? (
                  <ChevronUp className="w-5 h-5 text-hyundai-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-hyundai-gray-400" />
                )}
              </button>

              {showPartInfo && (
                <div className="mt-4 space-y-4 pt-4 border-t border-hyundai-gray-200">
                  <p className="text-body-2 text-hyundai-gray-700 leading-relaxed">
                    검증 결과는 블루핸즈 표준 공임 및 시장 데이터를 기준으로 합니다. 정확한
                    작업 내용·부품 설명은 정비소에 문의해 주세요.
                  </p>
                  <p className="text-caption text-hyundai-gray-500">
                    정비사에게 물어볼 질문이 있으면 [정비사에게 물어볼 질문이 있어요]에서
                    안내를 확인할 수 있어요.
                  </p>
                </div>
              )}
            </Card>

            {/* 데이터 출처 */}
            <Card variant="outlined" padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">데이터 출처</h3>
              </div>
              <div className="space-y-2 text-body-2 text-hyundai-gray-600">
                <p>• 표본 수: {item.sampleCount}건</p>
                <p>• 출처: 블루핸즈 정비 데이터</p>
                <p>• 비교: 동일 차종·유사 작업 견적 기준</p>
              </div>
            </Card>

            <button
              type="button"
              onClick={() => router.push('/verify/result')}
              className="w-full py-3 text-body-1 font-medium text-hyundai-blue-500 border border-hyundai-blue-500 rounded-xl"
            >
              검증 결과로 돌아가기
            </button>
          </div>
        </Container>
      </main>
    </>
  );
};

export default ItemDetailPage;
