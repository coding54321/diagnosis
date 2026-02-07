'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Share2, Save, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';
import VerificationSummary from '@/components/verification/VerificationSummary';
import EstimateCard from '@/components/verification/EstimateCard';
import MileageEditModal from '@/components/verification/MileageEditModal';
import { mockVerificationResult, mockVehicle } from '@/lib/mockData';
import { createVerificationResult, fetchVerificationResult } from '@/lib/supabase/actions';
import { VerificationEngine } from '@/lib/verification/engine';
import { classifyShopType } from '@/lib/verification/shop-classifier';
import { parseFrtCsv } from '@/lib/data/frt-standards';
import { copyLink, formatVerificationResultForShare, shareNative } from '@/lib/share';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import type { VerificationResult, ItemVerification, EstimateItem, ShopType, CostType } from '@/types';

/** 차량 전체 정보 (주행거리 수정·재검증용) */
type FullVehicleInfo = {
  manufacturer: string;
  model: string;
  variant?: string;
  year: number;
  mileage: number;
  fuelType: string;
};

/** 필터 타입 */
type FilterType = 'all' | 'part' | 'labor' | 'review_needed';

/** 차량번호 포맷: 12가3456 → 12가 3456 */
function formatRegistrationDisplay(num: string): string {
  const s = num.replace(/\s|-/g, '').trim();
  if (s.length <= 4) return s;
  return `${s.slice(0, -4)} ${s.slice(-4)}`;
}

const VerificationResultPage: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const isAuthenticated = !!authUser;
  const [isSaving, setIsSaving] = useState(false);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleConditions, setVehicleConditions] = useState<{
    model?: string;
    variant?: string;
    mileage?: number;
  }>({});
  const [fullVehicleInfo, setFullVehicleInfo] = useState<FullVehicleInfo | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);
  const [mileageModalOpen, setMileageModalOpen] = useState(false);
  const [isReVerifying, setIsReVerifying] = useState(false);
  const [shopType, setShopType] = useState<ShopType>('other');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // FRT CSV 로드
  useEffect(() => {
    fetch('/bluehands_maintenance.csv')
      .then((res) => res.text())
      .then((csv) => parseFrtCsv(csv))
      .catch((err) => console.warn('FRT CSV 로드 실패:', err));
  }, []);

  useEffect(() => {
    const loadVerificationResult = async () => {
      const id = sessionStorage.getItem('currentEstimateId');
      const reg = sessionStorage.getItem('currentVehicleRegistration') || '';
      const savedShopName = sessionStorage.getItem('currentShopName') || '';
      setRegistrationNumber(reg);

      // 정비소 유형 분류
      if (savedShopName) {
        setShopType(classifyShopType(savedShopName));
      }

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

            // costType 추정 (DB에서 온 데이터)
            const partUser = item.part_cost_user ?? 0;
            const laborUser = item.labor_cost_user ?? 0;
            let costType: CostType = 'combined';
            if (partUser > 0 && laborUser === 0) costType = 'part';
            else if (partUser === 0 && laborUser > 0) costType = 'labor';

            const userPrice = item.user_price ?? 0;
            return {
              itemId,
              status: item.status as VerificationResult['status'],
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
                laborCost: {
                  user: laborUser,
                  average: item.labor_cost_average,
                },
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

          // 총 부품비/공임비 집계 (금액은 전체, 참고 평균은 무상수리 제외)
          const totalPartCost = items.reduce((sum, i) => sum + i.breakdown.partCost.user, 0);
          const totalLaborCost = items.reduce((sum, i) => sum + i.breakdown.laborCost.user, 0);
          const comparableItems = items.filter((i) => !i.isFreeRepair);
          const totalPartCostAverage = comparableItems.reduce((sum, i) => sum + i.breakdown.partCost.average, 0);
          const totalLaborCostAverage = comparableItems.reduce((sum, i) => sum + i.breakdown.laborCost.average, 0);

          // DB에 저장된 shop_type 우선 사용, 없으면 상호명으로 분류
          const dbShopType = dbResult.estimate?.shop_type;
          const estimateShopName = dbResult.estimate?.shop_name || savedShopName;
          if (dbShopType && ['bluehands', 'autoq', 'gongimnara', 'speedmate', 'other'].includes(dbShopType)) {
            setShopType(dbShopType as ShopType);
          } else if (estimateShopName) {
            setShopType(classifyShopType(estimateShopName));
          }

          setResult({
            estimateId: id,
            totalAmount: dbResult.result.total_amount,
            status: dbResult.result.status as VerificationResult['status'],
            items,
            confidence: dbResult.result.confidence || 0,
            shopType: (dbResult.estimate?.shop_type as ShopType) || classifyShopType(estimateShopName || ''),
            totalPartCost,
            totalLaborCost,
            totalPartCostAverage,
            totalLaborCostAverage,
          });

          const v = dbResult.estimate?.vehicle as (FullVehicleInfo & { fuel_type?: string }) | undefined;
          if (v) {
            setFullVehicleInfo({
              manufacturer: v.manufacturer ?? '',
              model: v.model ?? '',
              variant: v.variant,
              year: v.year ?? new Date().getFullYear(),
              mileage: v.mileage ?? 0,
              fuelType: v.fuel_type ?? v.fuelType ?? '',
            });
            setVehicleConditions({
              model: v.model,
              variant: v.variant,
              mileage: v.mileage,
            });
          } else {
            const savedVehicle = sessionStorage.getItem('selectedVehicle');
            if (savedVehicle) {
              try {
                const parsed = JSON.parse(savedVehicle);
                const fv: FullVehicleInfo = {
                  manufacturer: parsed.manufacturer ?? '',
                  model: parsed.model ?? '',
                  variant: parsed.variant,
                  year: parsed.year ?? new Date().getFullYear(),
                  mileage: parsed.mileage ?? 0,
                  fuelType: parsed.fuelType ?? parsed.fuel_type ?? '',
                };
                setFullVehicleInfo(fv);
                setVehicleConditions({ model: fv.model, variant: fv.variant, mileage: fv.mileage });
              } catch (e) {
                console.warn('차량 정보 파싱 실패:', e);
              }
            }
          }

          const itemsForEngine: EstimateItem[] = dbResult.items.map((item: any) => {
            const ei = item.estimateItem || item.estimate_items;
            return {
              id: item.estimate_item_id || ei?.id || '',
              name: ei?.name || '',
              partCost: ei?.part_cost ?? 0,
              laborCost: ei?.labor_cost ?? 0,
              totalCost: ei?.total_cost ?? 0,
              category: ei?.category || '기타',
              normalizedName: ei?.normalized_name ?? ei?.normalizedName,
            };
          });
          setEstimateItems(itemsForEngine);
        } else {
          setResult(mockVerificationResult);
          setVehicleConditions({
            model: mockVehicle.model,
            variant: mockVehicle.variant,
            mileage: mockVehicle.mileage,
          });
          setFullVehicleInfo({
            manufacturer: mockVehicle.manufacturer ?? '현대',
            model: mockVehicle.model ?? '',
            variant: mockVehicle.variant,
            year: mockVehicle.year ?? new Date().getFullYear(),
            mileage: mockVehicle.mileage ?? 0,
            fuelType: mockVehicle.fuelType ?? '가솔린',
          });
        }
      } else {
        setResult(mockVerificationResult);
        setVehicleConditions({
          model: mockVehicle.model,
          variant: mockVehicle.variant,
          mileage: mockVehicle.mileage,
        });
        setFullVehicleInfo({
          manufacturer: mockVehicle.manufacturer ?? '현대',
          model: mockVehicle.model ?? '',
          variant: mockVehicle.variant,
          year: mockVehicle.year ?? new Date().getFullYear(),
          mileage: mockVehicle.mileage ?? 0,
          fuelType: mockVehicle.fuelType ?? '가솔린',
        });
      }
      setIsLoading(false);
    };

    loadVerificationResult();
  }, []);

  const handleMileageConfirm = async (newMileage: number) => {
    if (!result || !fullVehicleInfo) return;
    setMileageModalOpen(false);

    const updatedVehicle: FullVehicleInfo = {
      ...fullVehicleInfo,
      mileage: newMileage,
    };
    setFullVehicleInfo(updatedVehicle);
    setVehicleConditions((prev) => ({ ...prev, mileage: newMileage }));

    if (estimateItems.length === 0) {
      toast.success('주행거리가 수정되었어요.');
      return;
    }

    setIsReVerifying(true);
    try {
      const engineResult = await VerificationEngine.verifyEstimate(
        estimateItems,
        result.totalAmount,
        {
          manufacturer: updatedVehicle.manufacturer,
          model: updatedVehicle.model,
          variant: updatedVehicle.variant,
          year: updatedVehicle.year,
          mileage: updatedVehicle.mileage,
        },
        shopType
      );

      const newItems: ItemVerification[] = engineResult.items.map((item) => ({
        itemId: item.itemId,
        status: item.status,
        userPrice: item.userPrice,
        averagePrice: item.averagePrice,
        priceRange: item.priceRange,
        sampleCount: item.sampleCount,
        breakdown: item.breakdown,
        costType: item.costType,
        guide: item.guide,
        isFreeRepair: item.isFreeRepair,
      }));

      setResult({
        estimateId: result.estimateId,
        totalAmount: result.totalAmount,
        status: engineResult.status,
        items: newItems,
        confidence: engineResult.confidence,
        shopType: engineResult.shopType,
        totalPartCost: engineResult.totalPartCost,
        totalLaborCost: engineResult.totalLaborCost,
        totalPartCostAverage: engineResult.totalPartCostAverage,
        totalLaborCostAverage: engineResult.totalLaborCostAverage,
      });
      toast.success('주행거리 반영해 검증 결과를 다시 산출했어요.');
    } catch (e) {
      console.error('Re-verify failed:', e);
      toast.error('검증을 다시 실행하는 중 오류가 발생했어요.');
    } finally {
      setIsReVerifying(false);
    }
  };

  // 필터링된 항목
  const filteredAndSortedItems = useMemo(() => {
    if (!result) return [];

    let items = [...result.items];

    // 필터 적용
    if (activeFilter === 'part') {
      items = items.filter((i) => i.costType === 'part');
    } else if (activeFilter === 'labor') {
      items = items.filter((i) => i.costType === 'labor');
    } else if (activeFilter === 'review_needed') {
      items = items.filter((i) => i.status === 'review_needed');
    }

    // 정렬: 확인필요 먼저
    items.sort((a, b) => {
      const order: Record<string, number> = { review_needed: 0, appropriate: 1 };
      return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    });

    return items;
  }, [result, activeFilter]);

  // 필터 카운트
  const filterCounts = useMemo(() => {
    if (!result) return { all: 0, part: 0, labor: 0, review_needed: 0 };
    return {
      all: result.items.length,
      part: result.items.filter((i) => i.costType === 'part').length,
      labor: result.items.filter((i) => i.costType === 'labor').length,
      review_needed: result.items.filter((i) => i.status === 'review_needed').length,
    };
  }, [result]);

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

  const comparableItems = result.items.filter((item) => !item.isFreeRepair);
  const itemCounts = {
    appropriate: comparableItems.filter((item) => item.status === 'appropriate').length,
    reviewNeeded: comparableItems.filter((item) => item.status === 'review_needed').length,
    freeRepairCount: result.items.filter((item) => item.isFreeRepair).length,
  };

  const currentMileage = fullVehicleInfo?.mileage ?? vehicleConditions?.mileage ?? 0;
  const mileageDisplay = `${currentMileage.toLocaleString('ko-KR')}km`;

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
          partPriceSource: item.breakdown.partCost.partPriceSource ?? null,
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

  // 필터 칩 정의
  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: filterCounts.all },
    { key: 'part', label: '부품', count: filterCounts.part },
    { key: 'labor', label: '공임', count: filterCounts.labor },
    { key: 'review_needed', label: '확인필요', count: filterCounts.review_needed },
  ];

  const vehicleLabel =
    fullVehicleInfo || vehicleConditions.model
      ? fullVehicleInfo
        ? `${fullVehicleInfo.manufacturer} ${fullVehicleInfo.model}${fullVehicleInfo.variant ? ` ${fullVehicleInfo.variant}` : ''}`
        : `${vehicleConditions.model}${vehicleConditions.variant ? ` ${vehicleConditions.variant}` : ''}`
      : null;

  return (
    <>
      <main className="min-h-screen bg-hyundai-gray-50 pb-32">
        <div className="bg-white">
          <Container>
            <div className="flex items-center pt-[env(safe-area-inset-top,0px)]">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-12 flex items-center text-hyundai-gray-700 active:opacity-70"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="px-1 pt-2 pb-4">
              <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                검증 결과
              </h1>
              {registrationNumber && (
                <p className="text-sm text-hyundai-gray-500 mt-1">
                  {formatRegistrationDisplay(registrationNumber)}
                </p>
              )}
            </div>

            {/* 차량·주행거리 한 줄 요약 */}
            {(vehicleLabel || fullVehicleInfo?.year || currentMileage > 0) && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-hyundai-gray-500 pb-4">
                {vehicleLabel && <span className="text-hyundai-gray-900 font-medium">{vehicleLabel}</span>}
                {fullVehicleInfo?.year && <span>{fullVehicleInfo.year}년형</span>}
                {currentMileage > 0 && (
                  <span>
                    {mileageDisplay}
                    <button
                      type="button"
                      onClick={() => setMileageModalOpen(true)}
                      className="ml-1.5 text-hyundai-primary font-medium active:opacity-80"
                    >
                      수정
                    </button>
                  </span>
                )}
              </div>
            )}
          </Container>
        </div>

        <Container>
          <div className="pt-5 space-y-5">
            <VerificationSummary
              totalAmount={result.totalAmount}
              itemCounts={itemCounts}
              vehicleConditions={vehicleConditions}
              shopType={result.shopType ?? shopType}
              costSummary={{
                totalPartCost: result.totalPartCost ?? 0,
                totalLaborCost: result.totalLaborCost ?? 0,
                totalPartCostAverage: result.totalPartCostAverage ?? 0,
                totalLaborCostAverage: result.totalLaborCostAverage ?? 0,
              }}
            />

            <div>
              <div className="flex items-center justify-between px-0 mb-2">
                <p className="text-xs text-hyundai-gray-500 font-medium">항목별 결과</p>
                <span className="text-[11px] text-hyundai-gray-400">{filteredAndSortedItems.length}건</span>
              </div>

              {/* 필터 칩 */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
                {filters.map((filter) =>
                  (filter.key === 'all' || filter.count > 0) ? (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                        activeFilter === filter.key
                          ? 'bg-hyundai-gray-900 text-white'
                          : 'bg-hyundai-gray-100 text-hyundai-gray-500 active:bg-hyundai-gray-200'
                      }`}
                    >
                      {filter.label} {filter.count}
                    </button>
                  ) : null
                )}
              </div>

              <Card variant="default" padding="none">
                {filteredAndSortedItems.length > 0 ? (
                  filteredAndSortedItems.map((item, index) => (
                    <React.Fragment key={item.itemId}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <EstimateCard
                        itemId={item.itemId}
                        itemName={itemNames[item.itemId] || '항목명'}
                        totalCost={item.userPrice}
                        status={item.status}
                        priceRange={item.priceRange}
                        userPrice={item.userPrice}
                        costType={item.costType}
                        guide={item.guide}
                        breakdown={item.breakdown}
                        isFreeRepair={item.isFreeRepair}
                      />
                    </React.Fragment>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-hyundai-gray-400">해당하는 항목이 없습니다.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Container>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="max-w-lg mx-auto px-4 py-3 flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-hyundai-gray-200 text-xs font-medium text-hyundai-gray-600 active:bg-hyundai-gray-50"
            >
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              공유
            </button>
            <button
              onClick={handleSave}
              disabled={!estimateId || isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-hyundai-gray-900 text-xs font-medium text-white active:bg-hyundai-gray-800 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {isAuthenticated ? '저장' : '로그인 후 저장'}
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <MileageEditModal
        isOpen={mileageModalOpen}
        onClose={() => setMileageModalOpen(false)}
        currentMileage={currentMileage}
        recentMileage={currentMileage > 0 ? currentMileage : undefined}
        onConfirm={handleMileageConfirm}
        isLoading={isReVerifying}
      />
    </>
  );
};

export default VerificationResultPage;
