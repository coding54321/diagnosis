'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Share2, Trash2 } from 'lucide-react';
import { deleteVerificationHistory, fetchVerificationResult } from '@/lib/supabase/actions';
import { toast } from 'sonner';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';
import EstimateCard from '@/components/verification/EstimateCard';
import { formatDate, formatPrice } from '@/lib/utils';
import { copyLink, formatVerificationResultForShare, shareNative } from '@/lib/share';
import type { VerificationHistory, VerificationResult, ItemVerification, CostType } from '@/types';

interface HistoryDetailContentProps {
  history: VerificationHistory;
}

type FilterType = 'all' | 'part' | 'labor' | 'review_needed';

export default function HistoryDetailContent({ history }: HistoryDetailContentProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [displayShopName, setDisplayShopName] = useState(history.shopName || '');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [displayVehicleLabel, setDisplayVehicleLabel] = useState(history.vehicleLabel || '');

  useEffect(() => {
    const load = async () => {
      if (!history.estimateId) {
        setIsLoading(false);
        return;
      }

      // sessionStorage에 estimateId 설정 (항목 상세 페이지 이동 시 필요)
      sessionStorage.setItem('currentEstimateId', history.estimateId);

      const verificationResult = await fetchVerificationResult(history.estimateId);
      if (verificationResult.success && verificationResult.data) {
        const dbResult = verificationResult.data;
        const nameMap: Record<string, string> = {};
        const items: ItemVerification[] = dbResult.items.map((item: any) => {
          const id = item.estimate_item_id || item.estimateItem?.id || '';
          const name = item.estimateItem?.name || item.estimate_items?.name || '';
          if (id && name) nameMap[id] = name;

          const partUser = item.part_cost_user ?? 0;
          const laborUser = item.labor_cost_user ?? 0;
          const userPrice = item.user_price ?? 0;
          let costType: CostType = 'combined';
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

        const estimateShopName = dbResult.estimate?.shop_name || history.shopName || '';
        setDisplayShopName(estimateShopName);
        const estimateVehicle = dbResult.estimate?.vehicle;
        if (estimateVehicle?.registration_number) {
          setRegistrationNumber(estimateVehicle.registration_number);
        }
        const vehicleLabel = [estimateVehicle?.manufacturer, estimateVehicle?.model, estimateVehicle?.variant]
          .filter(Boolean)
          .join(' ');
        if (vehicleLabel) {
          setDisplayVehicleLabel(vehicleLabel);
        }

        const rawShopType = dbResult.estimate?.shop_type;
        const normalizedShopType =
          rawShopType === 'bluehands' ||
          rawShopType === 'autoq' ||
          rawShopType === 'gongimnara' ||
          rawShopType === 'speedmate' ||
          rawShopType === 'other'
            ? rawShopType
            : 'other';

        setResult({
          estimateId: history.estimateId,
          totalAmount: dbResult.result.total_amount,
          status: dbResult.result.status as VerificationResult['status'],
          items,
          confidence: dbResult.result.confidence || 0,
          shopType: normalizedShopType,
          totalPartCost,
          totalLaborCost,
          totalPartCostAverage,
          totalLaborCostAverage,
        });
      }
      setIsLoading(false);
    };
    load();
  }, [history.estimateId, history.shopName]);

  // 필터링된 항목
  const filteredAndSortedItems = useMemo(() => {
    if (!result) return [];
    let items = [...result.items];
    if (activeFilter === 'part') items = items.filter((i) => i.costType === 'part');
    else if (activeFilter === 'labor') items = items.filter((i) => i.costType === 'labor');
    else if (activeFilter === 'review_needed') items = items.filter((i) => i.status === 'review_needed');
    items.sort((a, b) => {
      const order: Record<string, number> = { review_needed: 0, appropriate: 1 };
      return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    });
    return items;
  }, [result, activeFilter]);

  const filterCounts = useMemo(() => {
    if (!result) return { all: 0, part: 0, labor: 0, review_needed: 0 };
    return {
      all: result.items.length,
      part: result.items.filter((i) => i.costType === 'part').length,
      labor: result.items.filter((i) => i.costType === 'labor').length,
      review_needed: result.items.filter((i) => i.status === 'review_needed').length,
    };
  }, [result]);

  const itemCounts = useMemo(() => {
    if (!result) return { appropriate: 0, reviewNeeded: 0, freeRepairCount: 0 };
    const comparable = result.items.filter((i) => !i.isFreeRepair);
    return {
      appropriate: comparable.filter((i) => i.status === 'appropriate').length,
      reviewNeeded: comparable.filter((i) => i.status === 'review_needed').length,
      freeRepairCount: result.items.filter((i) => i.isFreeRepair).length,
    };
  }, [result]);

  const handleDelete = async () => {
    if (!confirm('이 검증 내역을 삭제할까요? 삭제 후에는 복구할 수 없어요.')) return;
    setIsDeleting(true);
    try {
      const res = await deleteVerificationHistory(history.id);
      if (res.success) {
        toast.success('삭제했어요');
        router.push('/vehicle');
        router.refresh();
      } else {
        toast.error(res.error ?? '삭제에 실패했어요');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = formatVerificationResultForShare(
        result?.totalAmount ?? history.totalAmount,
        result?.status ?? history.status,
        itemCounts
      );
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

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: filterCounts.all },
    { key: 'part', label: '부품', count: filterCounts.part },
    { key: 'labor', label: '공임', count: filterCounts.labor },
    { key: 'review_needed', label: '확인필요', count: filterCounts.review_needed },
  ];

  const totalItems = result ? result.items.length : itemCounts.appropriate + itemCounts.reviewNeeded;
  const totalAmount = result?.totalAmount ?? history.totalAmount;

  if (isLoading) {
    return (
      <main className="flex-1 bg-white">
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

  return (
    <>
      <main className="flex-1 bg-hyundai-gray-50 pb-32">
        {/* 헤더 영역 — 흰 배경 */}
        <div className="bg-white">
          <Container>
            <div className="flex items-center justify-between pt-[env(safe-area-inset-top,0px)]">
              <button
                type="button"
                onClick={() => router.back()}
                className="h-12 flex items-center text-hyundai-gray-700 active:opacity-70"
                aria-label="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-base leading-none text-hyundai-gray-600 active:bg-hyundai-gray-100"
                aria-label="공유하기"
              >
                <Share2 className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="px-1 pt-2 pb-4">
              <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                검증 내역
              </h1>
              <div className="mt-3 rounded-xl border border-hyundai-gray-100 bg-hyundai-gray-50 px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-hyundai-gray-400 shrink-0 pt-0.5">일시/정비소</span>
                  <p className="text-sm text-hyundai-gray-700 text-right">
                    {formatDate(history.date)}
                    {displayShopName && <span className="ml-1.5">· {displayShopName}</span>}
                  </p>
                </div>
                {(registrationNumber || displayVehicleLabel) && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-medium text-hyundai-gray-400 shrink-0 pt-0.5">차량</span>
                    <p className="text-sm text-hyundai-gray-700 text-right">
                      {registrationNumber && <span className="font-medium text-hyundai-gray-800">{registrationNumber}</span>}
                      {registrationNumber && displayVehicleLabel && <span className="mx-1.5 text-hyundai-gray-300">·</span>}
                      {displayVehicleLabel && <span>{displayVehicleLabel}</span>}
                    </p>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-hyundai-gray-400 shrink-0 pt-0.5">요약</span>
                  <p className="text-sm text-hyundai-gray-800 text-right">
                    <span>총 {totalItems}개 항목</span>
                    <span className="mx-1.5 text-hyundai-gray-300">·</span>
                    <span className="font-semibold text-hyundai-gray-900">{formatPrice(totalAmount)}</span>
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </div>

        <Container>
          <div className="pt-5 space-y-5">
            {/* 항목별 결과 */}
            {result && result.items.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-0 mb-2">
                  <p className="text-xs text-hyundai-gray-500 font-medium">항목별 결과</p>
                  <span className="text-[11px] text-hyundai-gray-400">{filteredAndSortedItems.length}건</span>
                </div>

                {/* 필터 칩 */}
                <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
                  {filters.map((filter) =>
                    filter.key === 'all' || filter.count > 0 ? (
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
            )}

            {/* 데이터 없을 때 안내 */}
            {!result && (
              <Card variant="default" padding="none">
                <div className="py-8 text-center">
                  <p className="text-sm text-hyundai-gray-400">상세 검증 데이터를 불러올 수 없습니다.</p>
                </div>
              </Card>
            )}
          </div>
        </Container>

        {/* 하단 고정 바 — 공유 + 삭제 */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="max-w-lg mx-auto px-4 py-3 flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-hyundai-gray-200 text-xs font-medium text-hyundai-gray-600 active:bg-hyundai-gray-50"
            >
              <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              공유
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-hyundai-gray-200 text-xs font-medium text-red-500 active:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
