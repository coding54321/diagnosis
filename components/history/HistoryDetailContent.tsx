'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Share2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import VerificationSummary from '@/components/verification/VerificationSummary';
import PriceChart from '@/components/verification/PriceChart';
import { formatDate, formatPrice } from '@/lib/utils';
import { mockEstimate, mockVerificationResult } from '@/lib/mockData';
import { copyLink, formatVerificationResultForShare, shareNative } from '@/lib/share';
import { toast } from 'sonner';
import type { VerificationHistory } from '@/types';

interface HistoryDetailContentProps {
  history: VerificationHistory;
}

// 2단계 상태: 적정 / 확인필요
const statusConfig = {
  appropriate: {
    label: '적정',
    variant: 'success' as const,
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '확인필요',
    variant: 'warning' as const,
    Icon: AlertCircle,
  },
};

export default function HistoryDetailContent({ history }: HistoryDetailContentProps) {
  const router = useRouter();
  const config = statusConfig[history.status];
  const StatusIcon = config.Icon;
  const verificationResult = mockVerificationResult; // TODO: history.estimateId로 실제 검증 결과 조회

  // 현재는 목업 검증 결과 기준으로 항목 개수 계산
  const itemCounts = useMemo(() => {
    const items = verificationResult.items ?? [];
    return {
      appropriate: items.filter((item) => item.status === 'appropriate').length,
      reviewNeeded: items.filter((item) => item.status === 'review_needed').length,
    };
  }, [verificationResult.items]);

  const shareData = useMemo(() => {
    return formatVerificationResultForShare(history.totalAmount, history.status, itemCounts);
  }, [history.totalAmount, history.status, itemCounts]);

  const handleShare = async () => {
    try {
      const ok = await shareNative(shareData);
      if (ok) return;

      const copied = await copyLink(shareData.url);
      if (copied) toast.success('공유 기능을 지원하지 않아 링크를 복사했어요.');
      else toast.error('공유 기능을 지원하지 않아 링크 복사에 실패했어요.');
    } catch (e) {
      console.error('Share failed:', e);
      toast.error('공유 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <Header
        title="검증 내역 상세"
        showBackButton
        onBack={() => router.back()}
        rightAction={
          <button
            type="button"
            onClick={() => handleShare()}
            className="touch-target p-2 -mr-2 text-hyundai-gray-700 hover:text-hyundai-gray-900"
            aria-label="공유하기"
          >
            <Share2 className="w-5 h-5" />
          </button>
        }
      />

      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            {/* 기본 정보 카드 — 설정/리뷰와 동일한 스타일 */}
            <Card variant="default" padding="none">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-hyundai-gray-400">검증 일시</span>
                  <span className="text-sm font-medium text-hyundai-gray-900">
                    {formatDate(history.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-hyundai-gray-400">정비소</span>
                  <span className="text-sm font-medium text-hyundai-gray-900">
                    {mockEstimate.shopName}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-hyundai-gray-400">총 견적 금액</span>
                  <span className="text-lg font-bold text-hyundai-gray-900">
                    {formatPrice(history.totalAmount)}
                  </span>
                </div>
                <div className="pt-3 border-t border-hyundai-gray-100">
                  <Badge variant={config.variant} size="sm" className="flex items-center gap-1 w-fit">
                    <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {config.label}
                  </Badge>
                </div>
              </div>
            </Card>

            <VerificationSummary
              totalAmount={history.totalAmount}
              itemCounts={itemCounts}
            />

            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">항목별 상세</p>
              <div className="space-y-3">
                {verificationResult.items.map((item) => {
                  const itemConfig = statusConfig[item.status];
                  const ItemStatusIcon = itemConfig.Icon;
                  return (
                    <Card key={item.itemId} variant="default" padding="none">
                      <div className="px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-hyundai-gray-900">
                            브레이크 패드 교체 (전륜)
                          </p>
                          <Badge
                            variant={itemConfig.variant}
                            size="sm"
                            className="flex items-center gap-0.5"
                          >
                            <ItemStatusIcon className="w-2.5 h-2.5" strokeWidth={1.5} />
                            {itemConfig.label}
                          </Badge>
                        </div>
                        <PriceChart
                          userPrice={item.userPrice}
                          priceRange={item.priceRange}
                          sampleCount={item.sampleCount}
                        />
                        <div className="pt-3 mt-3 border-t border-hyundai-gray-100 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-hyundai-gray-400">부품비</span>
                            <span className="text-hyundai-gray-900">
                              {formatPrice(item.breakdown.partCost.user)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-hyundai-gray-400">공임비</span>
                            <span className="text-hyundai-gray-900">
                              {formatPrice(item.breakdown.laborCost.user)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-medium pt-2 border-t border-hyundai-gray-100">
                            <span className="text-hyundai-gray-900">소계</span>
                            <span className="text-hyundai-gray-900">
                              {formatPrice(item.userPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
