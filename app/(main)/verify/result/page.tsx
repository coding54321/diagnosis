'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, XCircle, CheckCircle2, MessageCircle, Save, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Button } from '@/components/ui';
import VerificationSummary from '@/components/verification/VerificationSummary';
import EstimateCard from '@/components/verification/EstimateCard';
import { mockVerificationResult } from '@/lib/mockData';
import { createVerificationResult, fetchVerificationResult } from '@/lib/supabase/actions';
import LoginModal from '@/components/auth/LoginModal';
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
  const [showLoginModal, setShowLoginModal] = useState(false);

  // sessionStorage에서 estimateId 가져오기 및 검증 결과 조회
  useEffect(() => {
    const loadVerificationResult = async () => {

      const id = sessionStorage.getItem('currentEstimateId');
      if (id) {
        setEstimateId(id);
        
        // Supabase에서 검증 결과 조회
        const verificationResult = await fetchVerificationResult(id);
        if (verificationResult.success && verificationResult.data) {
          // 데이터베이스 형식을 앱 형식으로 변환
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
          // 조회 실패 시 목업 데이터 사용
          setResult(mockVerificationResult);
        }
      } else {
        // estimateId가 없으면 목업 데이터 사용
        setResult(mockVerificationResult);
      }
      setIsLoading(false);
    };

    loadVerificationResult();
  }, []);

  // 로딩 중이거나 결과가 없으면 표시
  if (isLoading || !result) {
    return (
      <>
        <Header title="검증 결과" showBackButton onBack={() => router.back()} />
        <main className="min-h-screen bg-hyundai-gray-50 pb-20">
          <Container>
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-hyundai-blue-500" />
            </div>
          </Container>
        </main>
      </>
    );
  }

  const itemCounts = {
    appropriate: result.items.filter((item) => item.status === 'appropriate').length,
    reviewNeeded: result.items.filter((item) => item.status === 'review_needed').length,
    recheckRecommended: result.items.filter((item) => item.status === 'recheck_recommended')
      .length,
  };

  const appropriateItems = result.items.filter((item) => item.status === 'appropriate');
  const reviewNeededItems = result.items.filter((item) => item.status === 'review_needed');
  const recheckItems = result.items.filter(
    (item) => item.status === 'recheck_recommended'
  );

  return (
    <>
      <Header title="검증 결과" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-6">
            {/* 검증 결과 요약 */}
            <VerificationSummary
              totalAmount={result.totalAmount}
              status={result.status}
              itemCounts={itemCounts}
            />

            {/* 항목별 검증 결과 */}
            <div className="space-y-4">
              {reviewNeededItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-semantic-warning-main" />
                    <h3 className="text-h4 text-hyundai-gray-900">
                      확인 필요 ({reviewNeededItems.length}건)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {reviewNeededItems.map((item) => (
                      <EstimateCard
                        key={item.itemId}
                        itemId={item.itemId}
                        itemName={itemNames[item.itemId] || '항목명'}
                        totalCost={item.userPrice}
                        status={item.status}
                        priceRange={item.priceRange}
                        userPrice={item.userPrice}
                      />
                    ))}
                  </div>
                </div>
              )}

              {recheckItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-semantic-error-main" />
                    <h3 className="text-h4 text-hyundai-gray-900">
                      재검토 권장 ({recheckItems.length}건)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {recheckItems.map((item) => (
                      <EstimateCard
                        key={item.itemId}
                        itemId={item.itemId}
                        itemName={itemNames[item.itemId] || '항목명'}
                        totalCost={item.userPrice}
                        status={item.status}
                        priceRange={item.priceRange}
                        userPrice={item.userPrice}
                      />
                    ))}
                  </div>
                </div>
              )}

              {appropriateItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-semantic-success-main" />
                    <h3 className="text-h4 text-hyundai-gray-900">
                      적정 ({appropriateItems.length}건)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {appropriateItems.map((item) => (
                      <EstimateCard
                        key={item.itemId}
                        itemId={item.itemId}
                        itemName={itemNames[item.itemId] || '항목명'}
                        totalCost={item.userPrice}
                        status={item.status}
                        priceRange={item.priceRange}
                        userPrice={item.userPrice}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  // TODO: 정비 진행 로직
                  alert('정비 진행 기능은 추후 구현됩니다');
                }}
                className="flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                이 견적으로 진행할게요
              </Button>

              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => {
                  // TODO: 정비사 상담 가이드
                  router.push('/verify/result/guide');
                }}
                className="flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                정비사에게 물어볼 질문이 있어요
              </Button>

              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={async () => {
                  // 로그인 확인
                  if (!isAuthenticated) {
                    setShowLoginModal(true);
                    return;
                  }

                  if (!estimateId) {
                    alert('견적서 정보를 찾을 수 없습니다.');
                    return;
                  }

                  setIsSaving(true);

                  try {
                    // 검증 결과 저장
                    // TODO: 실제 검증 로직에서 받은 결과를 사용
                    // 현재는 목업 데이터를 기반으로 저장
                    const saveResult = await createVerificationResult({
                      estimateId,
                      totalAmount: result.totalAmount,
                      status: result.status,
                      confidence: result.confidence,
                      items: result.items.map((item) => ({
                        estimateItemId: item.itemId, // TODO: 실제 estimate_item_id 사용
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
                      alert('검증 결과가 저장되었습니다.');
                      router.push('/');
                    } else {
                      throw new Error(saveResult.error || '저장 실패');
                    }
                  } catch (error) {
                    console.error('Error saving verification result:', error);
                    alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={!estimateId || isSaving}
                className="flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    저장만 하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </Container>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => router.refresh()}
        message="검증 결과를 저장하려면 로그인이 필요합니다."
      />
    </>
  );
};

export default VerificationResultPage;
