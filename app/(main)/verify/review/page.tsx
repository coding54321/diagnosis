'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, X } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, BottomSheet, Input } from '@/components/ui';
import { mockEstimate } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import { createEstimate, saveVehicle, uploadEstimateImageAction, createVerificationResult } from '@/lib/supabase/actions';
import { VerificationEngine } from '@/lib/verification/engine';
import type { EstimateItem } from '@/types';
import type { BluehandsShop } from '@/lib/data/bluehands-seoul';

type EditSheetMode = 'vehicle' | 'shop' | 'date' | 'vat' | 'item' | null;

const ReviewPage: React.FC = () => {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 추가 필드
  const [requestDate, setRequestDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [vatIncluded, setVatIncluded] = useState<boolean>(true);
  const [vatAmount, setVatAmount] = useState<number>(0);

  // 수정 바텀시트
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetMode, setEditSheetMode] = useState<EditSheetMode>(null);

  // 정비소
  const [shopName, setShopName] = useState(mockEstimate.shopName);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<BluehandsShop[]>([]);
  const [shopSearching, setShopSearching] = useState(false);

  // 정비 항목
  const [items, setItems] = useState<EstimateItem[]>(() => [...mockEstimate.items]);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: '', partCost: 0, laborCost: 0 });

  // 차량 정보
  const [estimateMileage, setEstimateMileage] = useState<number>(45000);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');

  useEffect(() => {
    const image = sessionStorage.getItem('capturedEstimateImage');
    if (image) setCapturedImage(image);
  }, []);

  // 정비소 검색
  const searchShops = useCallback(async (q: string) => {
    setShopSearching(true);
    try {
      const res = await fetch(`/api/shops?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setShopSearchResults(data.shops ?? []);
    } catch {
      setShopSearchResults([]);
    } finally {
      setShopSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!editSheetOpen || editSheetMode !== 'shop') return;
    const t = setTimeout(() => searchShops(shopSearchQuery), editSheetMode === 'shop' && !shopSearchQuery ? 0 : 300);
    return () => clearTimeout(t);
  }, [editSheetOpen, editSheetMode, shopSearchQuery, searchShops]);

  const totalAmount = items.reduce((sum, i) => sum + i.totalCost, 0);
  const estimate = { ...mockEstimate, shopName, items, totalAmount };

  const openSheet = (mode: EditSheetMode) => {
    setEditSheetMode(mode);
    setEditSheetOpen(true);
  };

  const closeSheet = () => {
    setEditSheetOpen(false);
    setEditSheetMode(null);
    setEditItemIndex(null);
    setShopSearchQuery('');
    setShopSearchResults([]);
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${y}.${m}.${d}`;
  };

  const handleVerify = async () => {
    setIsSubmitting(true);

    try {
      const vehicleResult = await saveVehicle({
        manufacturer: '현대',
        model: '투싼',
        variant: 'NX4',
        year: 2022,
        mileage: estimateMileage > 0 ? estimateMileage : 45000,
        fuelType: '가솔린',
      });

      if (!vehicleResult.success || !vehicleResult.data) {
        throw new Error(vehicleResult.error || '차량 정보 저장 실패');
      }

      const vehicleId = vehicleResult.data.id;

      const estimateResult = await createEstimate({
        vehicleId,
        shopName: estimate.shopName,
        totalAmount: estimate.totalAmount,
        items: estimate.items.map((item) => ({
          name: item.name,
          partCost: item.partCost,
          laborCost: item.laborCost,
          totalCost: item.totalCost,
          category: item.category,
        })),
      });

      if (!estimateResult.success || !estimateResult.data) {
        throw new Error(estimateResult.error || '견적서 저장 실패');
      }

      const savedEstimateId = estimateResult.data.estimateId;
      const savedItems = estimateResult.data.items;

      if (capturedImage) {
        try {
          const uploadResult = await uploadEstimateImageAction(capturedImage, savedEstimateId);
          if (!uploadResult.success) {
            console.warn('Image upload failed:', uploadResult.error);
          }
        } catch (error) {
          console.error('Image upload failed:', error);
        }
      }

      const vehicleInfo = {
        manufacturer: '현대',
        model: '투싼',
        year: 2022,
        mileage: estimateMileage > 0 ? estimateMileage : 45000,
      };

      const estimateItemsForVerification: EstimateItem[] = savedItems.map((item) => ({
        id: item.id,
        name: item.name,
        partCost: item.part_cost,
        laborCost: item.labor_cost,
        totalCost: item.total_cost,
        category: item.category || '',
      }));

      const verificationResult = await VerificationEngine.verifyEstimate(
        estimateItemsForVerification,
        estimate.totalAmount,
        vehicleInfo
      );

      const saveVerificationResult = await createVerificationResult({
        estimateId: savedEstimateId,
        totalAmount: estimate.totalAmount,
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        items: verificationResult.items.map((item, index) => ({
          estimateItemId: savedItems[index]?.id || '',
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

      if (!saveVerificationResult.success) {
        console.error('검증 결과 저장 실패:', saveVerificationResult.error);
      }

      sessionStorage.setItem('currentEstimateId', savedEstimateId);
      router.push('/verify/result');
    } catch (error) {
      console.error('Error in handleVerify:', error);
      alert('견적서 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header title="견적서 확인" showBackButton onBack={() => router.back()} />

      <main className="min-h-screen bg-hyundai-gray-50 pb-36">
        <Container>
          <div className="py-5 space-y-4">
            {/* 안내 문구 */}
            <div className="px-1">
              <h2 className="text-lg font-bold text-hyundai-gray-900 mb-1">
                인식된 내용을 확인해주세요
              </h2>
              <p className="text-sm text-hyundai-gray-400">
                잘못된 부분은 탭해서 수정할 수 있어요
              </p>
            </div>

            {/* 촬영 이미지 (축소 썸네일) */}
            {capturedImage && (
              <>
                <button
                  type="button"
                  onClick={() => setShowImage(!showImage)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl active:bg-hyundai-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-hyundai-gray-100 shrink-0">
                    <img src={capturedImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm text-hyundai-gray-700 flex-1 text-left">
                    촬영된 견적서
                  </span>
                  <span className="text-xs text-hyundai-gray-400">
                    {showImage ? '숨기기' : '보기'}
                  </span>
                </button>
                {showImage && (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={capturedImage} alt="촬영된 견적서" className="w-full h-auto bg-hyundai-gray-100" />
                    <button
                      onClick={() => setShowImage(false)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* 견적 정보 — 하나의 카드에 디바이더 패턴 */}
            <Card variant="default" padding="none">
              {/* 의뢰일자 */}
              <button
                type="button"
                onClick={() => openSheet('date')}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs text-hyundai-gray-400 mb-0.5">의뢰일자</p>
                  <p className="text-sm font-medium text-hyundai-gray-900">{formatDate(requestDate)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
              </button>

              <div className="mx-5 border-b border-hyundai-gray-100" />

              {/* 정비소 */}
              <button
                type="button"
                onClick={() => openSheet('shop')}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs text-hyundai-gray-400 mb-0.5">정비소</p>
                  <p className="text-sm font-medium text-hyundai-gray-900">{estimate.shopName}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
              </button>

              <div className="mx-5 border-b border-hyundai-gray-100" />

              {/* 차량 정보 */}
              <button
                type="button"
                onClick={() => openSheet('vehicle')}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs text-hyundai-gray-400 mb-0.5">차량</p>
                  <p className="text-sm font-medium text-hyundai-gray-900">
                    투싼 NX4 · {estimateMileage.toLocaleString()}km
                  </p>
                  {vehicleNumber && (
                    <p className="text-xs text-hyundai-gray-400 mt-0.5">{vehicleNumber}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
              </button>

              <div className="mx-5 border-b border-hyundai-gray-100" />

              {/* VAT */}
              <button
                type="button"
                onClick={() => openSheet('vat')}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs text-hyundai-gray-400 mb-0.5">부가세</p>
                  <p className="text-sm font-medium text-hyundai-gray-900">
                    {vatIncluded ? `포함 · ${formatPrice(vatAmount || Math.round(estimate.totalAmount / 11))}` : '미포함'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
              </button>
            </Card>

            {/* 정비 항목 */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-sm font-bold text-hyundai-gray-900">
                  정비 항목
                </h3>
                <span className="text-xs text-hyundai-gray-400">{items.length}건</span>
              </div>
              <Card variant="default" padding="none">
                {estimate.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                    <button
                      type="button"
                      onClick={() => {
                        setEditItemIndex(index);
                        setEditItemForm({
                          name: item.name,
                          partCost: item.partCost,
                          laborCost: item.laborCost,
                        });
                        openSheet('item');
                      }}
                      className="w-full px-5 py-4 active:bg-hyundai-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-hyundai-gray-900">
                          {item.name}
                        </p>
                        <p className="text-sm font-bold text-hyundai-gray-900 shrink-0 ml-3">
                          {formatPrice(item.totalCost)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-hyundai-gray-400">
                        <span>부품 {formatPrice(item.partCost)}</span>
                        <span className="text-hyundai-gray-200">|</span>
                        <span>공임 {formatPrice(item.laborCost)}</span>
                      </div>
                    </button>
                  </React.Fragment>
                ))}
              </Card>
            </div>
          </div>
        </Container>

        {/* 하단 고정 바 */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100">
          <div className="max-w-lg mx-auto px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-hyundai-gray-400">총 금액</span>
              <div className="text-right">
                <span className="text-xl font-bold text-hyundai-gray-900">
                  {formatPrice(estimate.totalAmount)}
                </span>
                <span className="text-xs text-hyundai-gray-400 ml-1">
                  {vatIncluded ? '(VAT 포함)' : '(VAT 미포함)'}
                </span>
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  저장 중...
                </>
              ) : (
                '검증하기'
              )}
            </button>
          </div>
        </div>
      </main>

      {/* 수정 바텀시트 */}
      <BottomSheet
        isOpen={editSheetOpen}
        onClose={closeSheet}
        title={
          editSheetMode === 'vehicle' ? '차량 정보'
            : editSheetMode === 'shop' ? '정비소 검색'
            : editSheetMode === 'date' ? '의뢰일자'
            : editSheetMode === 'vat' ? '부가세'
            : editSheetMode === 'item' ? '항목 수정'
            : undefined
        }
      >
        {editSheetMode === 'vehicle' && (
          <div className="space-y-4">
            <p className="text-xs text-hyundai-gray-400">
              이 견적서 기준으로 입력해 주세요
            </p>
            <Input
              type="number"
              label="주행거리 (km)"
              placeholder="예: 45000"
              value={estimateMileage > 0 ? String(estimateMileage) : ''}
              onChange={(e) => setEstimateMileage(Number(e.target.value) || 0)}
              fullWidth
            />
            <Input
              label="차량번호 (선택)"
              placeholder="예: 12가 3456"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.trim())}
              fullWidth
            />
            <button
              onClick={closeSheet}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}

        {editSheetMode === 'shop' && (
          <div className="space-y-3">
            <Input
              placeholder="업체명, 구·군, 주소로 검색"
              value={shopSearchQuery}
              onChange={(e) => setShopSearchQuery(e.target.value)}
              fullWidth
            />
            <div className="max-h-64 overflow-y-auto -mx-1">
              {shopSearching && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-hyundai-gray-300" strokeWidth={1.5} />
                </div>
              )}
              {!shopSearching && shopSearchQuery.trim() && shopSearchResults.length === 0 && (
                <p className="text-xs text-hyundai-gray-400 py-6 text-center">검색 결과가 없어요</p>
              )}
              {!shopSearching &&
                shopSearchResults.map((shop) => (
                  <button
                    key={`${shop.업체명}-${shop.주소}`}
                    type="button"
                    onClick={() => {
                      setShopName(shop.업체명);
                      closeSheet();
                    }}
                    className="w-full text-left px-3 py-3 rounded-xl active:bg-hyundai-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-hyundai-gray-900">{shop.업체명}</p>
                    <p className="text-xs text-hyundai-gray-400 mt-0.5">{shop.시군구} · {shop.주소}</p>
                  </button>
                ))}
            </div>
          </div>
        )}

        {editSheetMode === 'date' && (
          <div className="space-y-4">
            <Input
              type="date"
              label="의뢰일자"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              fullWidth
            />
            <button
              onClick={closeSheet}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}

        {editSheetMode === 'vat' && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={vatIncluded}
                onChange={(e) => setVatIncluded(e.target.checked)}
                className="w-5 h-5 rounded border-hyundai-gray-300 accent-hyundai-gray-900"
              />
              <span className="text-sm text-hyundai-gray-900">VAT 포함</span>
            </label>
            {vatIncluded && (
              <Input
                type="number"
                label="VAT 금액 (원)"
                placeholder={`자동: ${formatPrice(Math.round(estimate.totalAmount / 11))}`}
                value={vatAmount > 0 ? String(vatAmount) : ''}
                onChange={(e) => setVatAmount(Number(e.target.value) || 0)}
                fullWidth
              />
            )}
            <button
              onClick={() => {
                if (vatIncluded && vatAmount === 0) {
                  setVatAmount(Math.round(estimate.totalAmount / 11));
                }
                closeSheet();
              }}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}

        {editSheetMode === 'item' && editItemIndex !== null && (
          <div className="space-y-4">
            <Input
              label="항목명"
              placeholder="정비 항목명"
              value={editItemForm.name}
              onChange={(e) => setEditItemForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <Input
              type="number"
              label="부품비 (원)"
              placeholder="0"
              value={editItemForm.partCost > 0 ? String(editItemForm.partCost) : ''}
              onChange={(e) =>
                setEditItemForm((prev) => ({ ...prev, partCost: Number(e.target.value) || 0 }))
              }
              fullWidth
            />
            <Input
              type="number"
              label="공임비 (원)"
              placeholder="0"
              value={editItemForm.laborCost > 0 ? String(editItemForm.laborCost) : ''}
              onChange={(e) =>
                setEditItemForm((prev) => ({ ...prev, laborCost: Number(e.target.value) || 0 }))
              }
              fullWidth
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-hyundai-gray-400">소계</span>
              <span className="text-sm font-bold text-hyundai-gray-900">
                {formatPrice(editItemForm.partCost + editItemForm.laborCost)}
              </span>
            </div>
            <button
              onClick={() => {
                const item = items[editItemIndex];
                if (!item) return;
                const totalCost = editItemForm.partCost + editItemForm.laborCost;
                setItems((prev) =>
                  prev.map((it, i) =>
                    i === editItemIndex
                      ? {
                          ...it,
                          name: editItemForm.name || it.name,
                          partCost: editItemForm.partCost,
                          laborCost: editItemForm.laborCost,
                          totalCost,
                        }
                      : it
                  )
                );
                closeSheet();
              }}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
};

export default ReviewPage;
