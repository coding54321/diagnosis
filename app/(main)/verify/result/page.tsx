'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Share2, Save, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';
import VerificationSummary from '@/components/verification/VerificationSummary';
import EstimateCard from '@/components/verification/EstimateCard';
import { mockVerificationResult } from '@/lib/mockData';
import { createVerificationResult, fetchVerificationResult } from '@/lib/supabase/actions';
import { copyLink, formatVerificationResultForShare, shareNative } from '@/lib/share';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import type { VerificationResult, ItemVerification } from '@/types';

const VerificationResultPage: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const isAuthenticated = !!authUser;
  const [isSaving, setIsSaving] = useState(false);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVerificationResult = async () => {
      const id = sessionStorage.getItem('currentEstimateId');
      if (id) {
        setEstimateId(id);

        const verificationResult = await fetchVerificationResult(id);
        if (verificationResult.success && verificationResult.data) {
          const dbResult = verificationResult.data;
          const nameMap: Record<string, string> = {};
          const items: ItemVerification[] = dbResult.items.map((item: any) => {
            const itemId = item.estimate_item_id || item.estimateItem?.id || '';
            const itemName = item.estimateItem?.name || item.estimate_items?.name || '';
            if (itemId && itemName) {
              nameMap[itemId] = itemName;
            }

            return {
              itemId,
              status: item.status as VerificationResult['status'],
              userPrice: item.user_price,
              averagePrice: item.average_price,
              priceRange: {
                min: item.min_price,
                max: item.max_price,
                median: item.median_price,
              },
              sampleCount: item.sample_count || 0,
              breakdown: {
                partCost: {
                  user: item.part_cost_user,
                  average: item.part_cost_average,
                },
                laborCost: {
                  user: item.labor_cost_user,
                  average: item.labor_cost_average,
                },
              },
            };
          });

          setItemNames(nameMap);
          setResult({
            estimateId: id,
            totalAmount: dbResult.result.total_amount,
            status: dbResult.result.status as VerificationResult['status'],
            items,
            confidence: dbResult.result.confidence || 0,
          });
        } else {
          setResult(mockVerificationResult);
        }
      } else {
        setResult(mockVerificationResult);
      }
      setIsLoading(false);
    };

    loadVerificationResult();
  }, []);

  if (isLoading || !result) {
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

  const itemCounts = {
    appropriate: result.items.filter((item) => item.status === 'appropriate').length,
    reviewNeeded: result.items.filter((item) => item.status === 'review_needed').length,
    recheckRecommended: result.items.filter((item) => item.status === 'recheck_recommended').length,
  };

  // 우선순위: 재검토 → 확인필요 → 적정 순으로 정렬
  const sortedItems = [...result.items].sort((a, b) => {
    const order = { recheck_recommended: 0, review_needed: 1, appropriate: 2 };
    return order[a.status] - order[b.status];
  });

  const handleShare = async () => {
    try {
      const shareData = formatVerificationResultForShare(result.totalAmount, result.status, itemCounts);
      const ok = await shareNative(shareData);
      if (ok) return;
      const copied = await copyLink(shareData.url);
      if (copied) toast.success('링크를 복사했어요.');
      else toast.error('링크 복사에 실패했어요.');
    } catch (e) {
      console.error('Share failed:', e);
      toast.error('공유 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!estimateId) {
      alert('견적서 정보를 찾을 수 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const saveResult = await createVerificationResult({
        estimateId,
        totalAmount: result.totalAmount,
        status: result.status,
        confidence: result.confidence,
        items: result.items.map((item) => ({
          estimateItemId: item.itemId,
          status: item.status,
          userPrice: item.userPrice,
          averagePrice: item.averagePrice,
          minPrice: item.priceRange.min,
          maxPrice: item.priceRange.max,
          medianPrice: item.priceRange.median,
          sampleCount: item.sampleCount,
          partCostUser: item.breakdown.partCost.user,
          partCostAverage: item.breakdown.partCost.average,
          laborCostUser: item.breakdown.laborCost.user,
          laborCostAverage: item.breakdown.laborCost.average,
        })),
      });

      if (saveResult.success) {
        toast.success('저장되었습니다.');
        router.push('/vehicle');
      } else {
        throw new Error(saveResult.error || '저장 실패');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-white pb-32">
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
          <div className="px-1 pt-4 pb-6">
            <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
              검증 결과
            </h1>
          </div>

          <div className="space-y-5">
            {/* 검증 결과 요약 */}
            <VerificationSummary
              totalAmount={result.totalAmount}
              status={result.status}
              itemCounts={itemCounts}
            />

            {/* 항목별 검증 결과 — 단일 카드 + 디바이더 */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-sm font-bold text-hyundai-gray-900">항목별 결과</h3>
                <span className="text-xs text-hyundai-gray-400">{result.items.length}건</span>
              </div>
              <Card variant="default" padding="none">
                {sortedItems.map((item, index) => (
                  <React.Fragment key={item.itemId}>
                    {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                    <EstimateCard
                      itemId={item.itemId}
                      itemName={itemNames[item.itemId] || '항목명'}
                      totalCost={item.userPrice}
                      status={item.status}
                      priceRange={item.priceRange}
                      userPrice={item.userPrice}
                    />
                  </React.Fragment>
                ))}
              </Card>
            </div>
          </div>
        </Container>

        {/* 하단 고정 바 */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100">
          <div className="max-w-lg mx-auto px-5 py-4 flex gap-2.5">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" strokeWidth={1.5} />
              공유
            </button>
            <button
              onClick={handleSave}
              disabled={!estimateId || isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-hyundai-gray-900 text-sm font-medium text-white active:bg-hyundai-gray-800 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                  {isAuthenticated ? '내 검증 내역에 저장' : '로그인하고 저장'}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default VerificationResultPage;
