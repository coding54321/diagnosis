'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, XCircle, Share2 } from 'lucide-react';
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
      recheckRecommended: items.filter((item) => item.status === 'recheck_recommended').length,
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
          <div className="py-6 space-y-6">
            <Card variant="default" padding="md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-hyundai-gray-600">검증 일시</span>
                  <span className="text-body-1 text-hyundai-gray-900">
                    {formatDate(history.date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-hyundai-gray-600">정비소</span>
                  <span className="text-body-1 text-hyundai-gray-900">
                    {mockEstimate.shopName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-hyundai-gray-600">총 견적 금액</span>
                  <span className="text-h3 text-hyundai-blue-600 font-bold">
                    {formatPrice(history.totalAmount)}
                  </span>
                </div>
                <div className="pt-3 border-t border-hyundai-gray-200">
                  <Badge variant={config.variant} size="md" className="flex items-center gap-1 w-fit">
                    <StatusIcon className="w-4 h-4" />
                    {config.label}
                  </Badge>
                </div>
              </div>
            </Card>

            <VerificationSummary
              totalAmount={history.totalAmount}
              status={history.status}
              itemCounts={itemCounts}
            />

            <div className="space-y-4">
              <h3 className="text-h4 text-hyundai-gray-900">항목별 상세</h3>
              {verificationResult.items.map((item) => (
                <Card key={item.itemId} variant="default" padding="md">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-body-1 font-semibold text-hyundai-gray-900">
                        브레이크 패드 교체 (전륜)
                      </h4>
                      <Badge
                        variant={
                          item.status === 'appropriate'
                            ? 'success'
                            : item.status === 'review_needed'
                              ? 'warning'
                              : 'error'
                        }
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {(() => {
                          const ItemStatusIcon = statusConfig[item.status].Icon;
                          return (
                            <>
                              <ItemStatusIcon className="w-3 h-3" />
                              {statusConfig[item.status].label}
                            </>
                          );
                        })()}
                      </Badge>
                    </div>

                    <PriceChart
                      userPrice={item.userPrice}
                      priceRange={item.priceRange}
                      sampleCount={item.sampleCount}
                    />

                    <div className="pt-3 border-t border-hyundai-gray-200 space-y-2">
                      <div className="flex justify-between text-body-2">
                        <span className="text-hyundai-gray-600">부품비</span>
                        <span className="text-hyundai-gray-900">
                          {formatPrice(item.breakdown.partCost.user)}
                        </span>
                      </div>
                      <div className="flex justify-between text-body-2">
                        <span className="text-hyundai-gray-600">공임비</span>
                        <span className="text-hyundai-gray-900">
                          {formatPrice(item.breakdown.laborCost.user)}
                        </span>
                      </div>
                      <div className="flex justify-between text-body-1 font-semibold pt-2 border-t border-hyundai-gray-200">
                        <span className="text-hyundai-gray-900">소계</span>
                        <span className="text-hyundai-gray-900">
                          {formatPrice(item.userPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
