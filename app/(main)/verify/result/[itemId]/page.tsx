'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, XCircle, DollarSign, Info, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Badge, Button } from '@/components/ui';
import PriceChart from '@/components/verification/PriceChart';
import { formatPrice } from '@/lib/utils';
import { mockVerificationResult } from '@/lib/mockData';

const ItemDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId as string;

  const item = mockVerificationResult.items.find((i) => i.itemId === itemId);
  const [showPartInfo, setShowPartInfo] = useState(false);

  if (!item) {
    return (
      <>
        <Header title="항목 상세" showBackButton onBack={() => router.back()} />
        <main className="min-h-screen bg-hyundai-gray-50 pb-20">
          <Container>
            <div className="py-6">
              <p className="text-body-1 text-hyundai-gray-700">항목을 찾을 수 없습니다.</p>
            </div>
          </Container>
        </main>
      </>
    );
  }

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

  const config = statusConfig[item.status];
  const StatusIcon = config.Icon;

  return (
    <>
      <Header title="브레이크 패드 교체 (전륜)" showBackButton onBack={() => router.back()} />
      
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
                      {formatPrice(item.breakdown.partCost.user)}
                    </span>
                  </div>
                  <div className="text-body-2 text-hyundai-gray-600 space-y-1">
                    <p>• 품목: 순정 브레이크 패드 (전륜 1세트)</p>
                    <p>• 판정: 현대모비스 권장소비자가 기준 적정</p>
                  </div>
                  <div className="mt-3 p-3 bg-hyundai-gray-50 rounded-lg border border-hyundai-gray-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-hyundai-gray-600 mt-0.5 flex-shrink-0" />
                      <p className="text-body-2 text-hyundai-gray-700">
                        절감 팁: OEM 호환 부품 사용 시 약 85,000원 (35,000원 절감 가능)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body-1 text-hyundai-gray-700">공임비</span>
                    <span className="text-body-1 font-semibold text-hyundai-gray-900">
                      {formatPrice(item.breakdown.laborCost.user)}
                    </span>
                  </div>
                  <div className="text-body-2 text-hyundai-gray-600 space-y-1">
                    <p>• 작업시간: 0.8시간</p>
                    <p>• 시간당공임: 50,000원</p>
                    <p>• 판정: 표준정비시간(0.8H) 기준 적정</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 부품 설명 */}
            <Card variant="default" padding="md">
              <button
                onClick={() => setShowPartInfo(!showPartInfo)}
                className="w-full flex items-center justify-between"
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
                  <div className="text-center py-6 bg-hyundai-gray-50 rounded-lg border border-hyundai-gray-200">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-hyundai-gray-200 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-hyundai-gray-400" />
                    </div>
                    <p className="text-body-2 text-hyundai-gray-600">브레이크 패드 위치</p>
                  </div>

                  <div>
                    <h4 className="text-body-1 font-semibold text-hyundai-gray-900 mb-2">
                      브레이크 패드란?
                    </h4>
                    <p className="text-body-2 text-hyundai-gray-700 leading-relaxed">
                      브레이크를 밟으면 패드가 디스크(원판)를 눌러서 차를 멈추게 해요. 마찰로
                      닳기 때문에 주기적으로 교체가 필요한 소모품이에요.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-body-1 font-semibold text-hyundai-gray-900 mb-2">
                      일반적인 교체 주기
                    </h4>
                    <ul className="text-body-2 text-hyundai-gray-700 space-y-1">
                      <li>• 주행거리: 30,000~50,000km</li>
                      <li>• 기간: 약 2~3년</li>
                      <li>• 내 차: 45,000km → 교체 시기 도래</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-body-1 font-semibold text-hyundai-gray-900 mb-2">
                      교체하지 않으면?
                    </h4>
                    <ul className="text-body-2 text-hyundai-gray-700 space-y-1">
                      <li>• 제동 거리 증가 (안전 문제)</li>
                      <li>• 디스크 손상 → 더 큰 수리비 발생</li>
                    </ul>
                  </div>
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
                <p>• 비교 대상: 투싼 NX4 2021~2023년식</p>
                <p>• 표본 수: {item.sampleCount}건</p>
                <p>• 기간: 최근 6개월</p>
                <p>• 출처: 블루핸즈 정비 데이터</p>
                <p>• 지역: 수도권</p>
              </div>
            </Card>
          </div>
        </Container>
      </main>
    </>
  );
};

export default ItemDetailPage;
