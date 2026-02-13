'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Share2, ArrowLeft } from 'lucide-react';
import EstimateCard from '@/components/verification/EstimateCard';
import { mockVerificationResult, mockVehicle } from '@/lib/mockData';
import { fetchVerificationResult, getCurrentUserDisplayName, saveVerificationToMyCar } from '@/lib/supabase/actions';
import { classifyShopType } from '@/lib/verification/shop-classifier';
import { parseFrtCsv } from '@/lib/data/frt-standards';
import { copyLink, formatVerificationResultForShare, shareNative } from '@/lib/share';
import { toast } from 'sonner';
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
  const [shopType, setShopType] = useState<ShopType>('other');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [ownerDisplayName, setOwnerDisplayName] = useState<string | null>(null);
  /** 정비소 위치 기반 시/도 (공통 비교 조건 표시용) */
  const [shopRegionSido, setShopRegionSido] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 소유주 표시명 (검증 결과 문구용)
  useEffect(() => {
    getCurrentUserDisplayName().then((res) => {
      if (res.success && res.name) setOwnerDisplayName(res.name);
    });
  }, []);

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
        setShopRegionSido(null);

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

          const regionSido = (dbResult.estimate as { shop_region_sido?: string } | undefined)?.shop_region_sido;
          if (regionSido) setShopRegionSido(regionSido);

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
              masterJobId: ei?.master_job_id ?? ei?.masterJobId,
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
    } catch (err) {
      console.error('Share failed:', err);
      toast.error('공유 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!estimateId || !result) return;
    const info = fullVehicleInfo;
    if (!info) {
      toast.error('차량 정보가 없어 저장할 수 없어요.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await saveVerificationToMyCar(estimateId, {
        manufacturer: info.manufacturer,
        model: info.model,
        variant: info.variant,
        year: info.year,
        mileage: info.mileage,
        fuelType: info.fuelType,
        registrationNumber: registrationNumber || undefined,
      });
      if (res.success && res.vehicleId) {
        toast.success('내 차에 저장했어요.');
        router.push(`/vehicle?vehicleId=${res.vehicleId}`);
      } else {
        toast.error(res.error ?? '저장에 실패했어요.');
      }
    } catch {
      toast.error('저장 중 오류가 발생했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 검증 결과는 review 단계에서 이미 저장됨 (자동 저장)

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
      <main className="min-h-screen bg-hyundai-gray-50 flex flex-col">
        {/* 상단: 흰색 배경, 뒤로가기 + 제목·설명 + 차량 요약 */}
        <div className="bg-white shrink-0">
          <div className="px-5 pt-[env(safe-area-inset-top,0px)]">
            <div className="flex items-center justify-between min-h-[48px]">
              <button
                type="button"
                onClick={() => router.back()}
                className="min-h-[44px] min-w-[44px] -ml-4 flex items-center justify-center text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="min-h-[44px] min-w-[44px] -mr-4 flex items-center justify-center text-hyundai-gray-700 active:opacity-70 rounded-lg touch-manipulation"
                aria-label="공유하기"
              >
                <Share2 className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="pt-2 pb-4">
              <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                검증 결과
              </h1>
              <p className="text-sm text-hyundai-gray-400 mt-3">
                {ownerDisplayName ? `${ownerDisplayName}님의 차량과 유사한 조건의 실제 정비이력으로 검증했어요!` : '내 차량과 유사한 조건의 실제 정비이력으로 검증했어요!'}
              </p>
            </div>
          </div>

          <div className="px-5 pb-5">

          {/* 차량 정보·공통 비교 조건: 요약 카드 (차량, 연식, 주행거리, 정비지역) */}
          {(vehicleLabel || (fullVehicleInfo?.year != null && fullVehicleInfo.year > 0) || currentMileage > 0 || shopRegionSido) && (
            <div className="p-4 bg-hyundai-gray-50 rounded-2xl">
              {vehicleLabel && (
                <div className={`flex items-center justify-between text-sm ${(fullVehicleInfo?.year != null && fullVehicleInfo.year > 0) || currentMileage > 0 || shopRegionSido ? 'mb-2' : ''}`}>
                  <span className="text-hyundai-gray-500">차량</span>
                  <span className="font-medium text-hyundai-gray-900">{vehicleLabel}</span>
                </div>
              )}
              {fullVehicleInfo?.year != null && fullVehicleInfo.year > 0 && (
                <div className={`flex items-center justify-between text-sm ${currentMileage > 0 || shopRegionSido ? 'mb-2' : ''}`}>
                  <span className="text-hyundai-gray-500">연식</span>
                  <span className="font-medium text-hyundai-gray-900">{fullVehicleInfo.year}년형</span>
                </div>
              )}
              {currentMileage > 0 && (
                <div className={`flex items-center justify-between text-sm ${shopRegionSido ? 'mb-2' : ''}`}>
                  <span className="text-hyundai-gray-500">주행거리</span>
                  <span className="font-medium text-hyundai-gray-900">{mileageDisplay}</span>
                </div>
              )}
              {shopRegionSido && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-hyundai-gray-500">정비지역</span>
                  <span className="font-medium text-hyundai-gray-900">{shopRegionSido}</span>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* 항목별 결과 — 토스 스타일. flex-1로 남는 영역까지 흰 배경 채워서 회색 노출 방지 */}
        <div className="flex-1 min-h-0 bg-white pt-1 pb-36">
          <div className="px-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-hyundai-primary font-medium tabular-nums">{filterCounts.all}건</span>
            </div>
            <h2 className="text-[18px] font-bold text-hyundai-gray-900 leading-tight mb-4">
              항목별 결과
            </h2>
            {filteredAndSortedItems.length > 0 && (
              <p className="text-xs text-hyundai-gray-400 mb-4">항목을 눌러 자세히 볼 수 있어요</p>
            )}

            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide overscroll-x-contain">
              {filters.map((filter) =>
                (filter.key === 'all' || filter.count > 0) ? (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`shrink-0 min-h-[36px] px-3.5 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                      activeFilter === filter.key
                        ? 'bg-hyundai-gray-900 text-white'
                        : 'bg-hyundai-gray-100 text-hyundai-gray-600 active:bg-hyundai-gray-200'
                    }`}
                  >
                    {filter.label} {filter.count}
                  </button>
                ) : null
              )}
            </div>
          </div>

          {/* 리스트: 카드 없이 구분선·여백만 (토스 리스트 스타일) */}
          <div className="px-5">
            {filteredAndSortedItems.length > 0 ? (
              <div>
                {filteredAndSortedItems.map((item, index) => (
                  <React.Fragment key={item.itemId}>
                    {index > 0 && <div className="border-b border-hyundai-gray-100" />}
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
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-hyundai-gray-500">해당하는 항목이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100">
          <div className="max-w-lg mx-auto px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-4 rounded-2xl bg-hyundai-gray-900 text-white text-base font-semibold active:bg-hyundai-gray-800 disabled:opacity-60 transition-colors touch-manipulation flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
              ) : (
                '저장'
              )}
            </button>
            <button
              type="button"
              className="flex-1 py-4 rounded-2xl bg-hyundai-gray-100 text-hyundai-gray-900 text-base font-semibold active:bg-hyundai-gray-200 transition-colors touch-manipulation"
            >
              다른 정비소 추천받기
            </button>
          </div>
        </div>
      </main>

    </>
  );
};

export default VerificationResultPage;
