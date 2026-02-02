'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Car, Building2, Wrench, Image as ImageIcon, Loader2, Calendar, Receipt } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Button, BottomSheet, Input } from '@/components/ui';
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
  const [showImage, setShowImage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 추가 필드 (점검/정비 의뢰일자, VAT)
  const [requestDate, setRequestDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [vatIncluded, setVatIncluded] = useState<boolean>(true);
  const [vatAmount, setVatAmount] = useState<number>(0);

  // 수정 바텀시트
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetMode, setEditSheetMode] = useState<EditSheetMode>(null);

  // 정비소 (편집 가능, bluehands_seoul 기반 검색)
  const [shopName, setShopName] = useState(mockEstimate.shopName);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<BluehandsShop[]>([]);
  const [shopSearching, setShopSearching] = useState(false);

  // 정비 항목 (편집 가능)
  const [items, setItems] = useState<EstimateItem[]>(() => [...mockEstimate.items]);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: '', partCost: 0, laborCost: 0 });

  // sessionStorage에서 촬영된 이미지 가져오기
  useEffect(() => {
    const image = sessionStorage.getItem('capturedEstimateImage');
    if (image) {
      setCapturedImage(image);
    }
  }, []);

  // 정비소 검색 (bluehands_seoul.csv 기반)
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

  // 정비소 검색: 시트가 'shop' 모드로 열리거나 검색어가 바뀔 때
  useEffect(() => {
    if (!editSheetOpen || editSheetMode !== 'shop') return;
    const t = setTimeout(() => searchShops(shopSearchQuery), editSheetMode === 'shop' && !shopSearchQuery ? 0 : 300);
    return () => clearTimeout(t);
  }, [editSheetOpen, editSheetMode, shopSearchQuery, searchShops]);

  // 목업 데이터 사용 (실제로는 OCR 결과), 항목/총액은 편집 반영
  const totalAmount = items.reduce((sum, i) => sum + i.totalCost, 0);
  const estimate = { ...mockEstimate, shopName, items, totalAmount };

  const handleVerify = async () => {
    setIsSubmitting(true);

    try {
      // 차량 정보 저장/업데이트 (목업 데이터 기준)
      const vehicleResult = await saveVehicle({
        manufacturer: '현대',
        model: '투싼',
        variant: 'NX4',
        year: 2022,
        mileage: 45000,
        fuelType: '가솔린',
      });

      if (!vehicleResult.success || !vehicleResult.data) {
        throw new Error(vehicleResult.error || '차량 정보 저장 실패');
      }

      const vehicleId = vehicleResult.data.id;

      // 견적서 저장 (이미지는 나중에 업로드)
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

      // 이미지 업로드 (있는 경우)
      if (capturedImage) {
        try {
          const uploadResult = await uploadEstimateImageAction(capturedImage, savedEstimateId);
          if (!uploadResult.success) {
            console.warn('Image upload failed:', uploadResult.error);
            // 이미지 업로드 실패해도 계속 진행
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          // 이미지 업로드 실패해도 계속 진행
        }
      }

      // 검증 엔진 실행
      const vehicleInfo = {
        manufacturer: '현대', // TODO: 실제 차량 정보 사용
        model: '투싼',
        year: 2022,
        mileage: 45000,
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

      // 검증 결과 저장
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
        // 검증 결과 저장 실패해도 계속 진행
      }

      // 견적서 ID를 sessionStorage에 저장
      sessionStorage.setItem('currentEstimateId', savedEstimateId);

      // 검증 결과 페이지로 이동
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
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6 text-hyundai-gray-600" />
                <h2 className="text-h2 text-hyundai-gray-900">
                  인식된 내용을 확인해주세요
                </h2>
              </div>
              <p className="text-body-2 text-hyundai-gray-600">
                잘못된 부분은 탭해서 수정할 수 있어요
              </p>
            </div>

            {/* 촬영된 이미지 표시 */}
            {capturedImage && (
              <Card variant="default" padding="md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-hyundai-gray-600" />
                    <p className="text-body-1 text-hyundai-gray-900 font-medium">
                      촬영된 견적서
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImage(!showImage)}
                  >
                    {showImage ? '숨기기' : '보기'}
                  </Button>
                </div>
                {showImage && (
                  <div className="rounded-lg overflow-hidden border border-hyundai-gray-200">
                    <img
                      src={capturedImage}
                      alt="촬영된 견적서"
                      className="w-full h-auto object-contain bg-hyundai-gray-50"
                    />
                  </div>
                )}
              </Card>
            )}

            {/* 점검/정비 의뢰일자 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-hyundai-gray-600" />
                  </div>
                  <div>
                    <p className="text-caption text-hyundai-gray-600 mb-1">점검/정비 의뢰일자</p>
                    <p className="text-body-1 text-hyundai-gray-900">{requestDate}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setEditSheetMode('date'); setEditSheetOpen(true); }}>
                  수정
                </Button>
              </div>
            </Card>

            {/* 정비소 정보 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-hyundai-gray-600" />
                  </div>
                  <div>
                    <p className="text-caption text-hyundai-gray-600 mb-1">정비소 정보</p>
                    <p className="text-body-1 text-hyundai-gray-900">{estimate.shopName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setEditSheetMode('shop'); setEditSheetOpen(true); }}>
                  수정
                </Button>
              </div>
            </Card>

            {/* 차량 정보 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                    <Car className="w-5 h-5 text-hyundai-gray-600" />
                  </div>
                  <div>
                    <p className="text-caption text-hyundai-gray-600 mb-1">차량 정보</p>
                    <p className="text-body-1 text-hyundai-gray-900">
                      투싼 NX4 · 2022년식 · 45,000km
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setEditSheetMode('vehicle'); setEditSheetOpen(true); }}>
                  수정
                </Button>
              </div>
            </Card>

            {/* VAT 금액 여부 및 금액 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-hyundai-gray-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-hyundai-gray-600" />
                  </div>
                  <div>
                    <p className="text-caption text-hyundai-gray-600 mb-1">VAT 금액 여부 및 금액</p>
                    <p className="text-body-1 text-hyundai-gray-900">
                      {vatIncluded ? `VAT 포함 · ${formatPrice(vatAmount || Math.round(estimate.totalAmount / 11))}` : 'VAT 미포함'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setEditSheetMode('vat'); setEditSheetOpen(true); }}>
                  수정
                </Button>
              </div>
            </Card>

            {/* 정비 항목 */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-hyundai-gray-600" />
                <p className="text-caption text-hyundai-gray-600">정비 항목</p>
              </div>
              <div className="space-y-3">
                {estimate.items.map((item, index) => (
                  <Card key={item.id} variant="outlined" padding="md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-caption text-hyundai-gray-500">
                            {index + 1}.
                          </span>
                          <h4 className="text-body-1 text-hyundai-gray-900 font-medium">
                            {item.name}
                          </h4>
                        </div>
                        <div className="text-body-2 text-hyundai-gray-600 space-y-1">
                          <p>부품비: {formatPrice(item.partCost)}</p>
                          <p>공임비: {formatPrice(item.laborCost)}</p>
                          <p className="font-medium text-hyundai-gray-900">
                            소계: {formatPrice(item.totalCost)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditItemIndex(index);
                          setEditItemForm({
                            name: item.name,
                            partCost: item.partCost,
                            laborCost: item.laborCost,
                          });
                          setEditSheetMode('item');
                          setEditSheetOpen(true);
                        }}
                      >
                        수정
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* 총 금액 */}
            <Card variant="highlighted" padding="md">
              <div className="text-center">
                <p className="text-caption text-hyundai-gray-600 mb-1">총 금액</p>
                <p className="text-h2 text-hyundai-blue-600 font-bold">
                  {formatPrice(estimate.totalAmount)}
                </p>
                <p className="text-caption text-hyundai-gray-500 mt-1">
                  {vatIncluded ? '(부가세 포함)' : '(부가세 미포함)'}
                </p>
              </div>
            </Card>

            {/* 수정 바텀시트 */}
            <BottomSheet
              isOpen={editSheetOpen}
              onClose={() => {
                setEditSheetOpen(false);
                setEditSheetMode(null);
                setEditItemIndex(null);
                setShopSearchQuery('');
                setShopSearchResults([]);
              }}
              title={
                editSheetMode === 'vehicle'
                  ? '차량 정보'
                  : editSheetMode === 'shop'
                    ? '정비소 검색'
                    : editSheetMode === 'date'
                      ? '점검/정비 의뢰일자'
                      : editSheetMode === 'vat'
                        ? 'VAT 금액'
                        : editSheetMode === 'item'
                          ? '정비 항목 수정'
                          : undefined
              }
            >
              {editSheetMode === 'vehicle' && (
                <div className="py-4">
                  <p className="text-body-2 text-hyundai-gray-600 mb-4">
                    차량 정보는 [내 차 관리]에서 수정할 수 있어요.
                  </p>
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => router.push('/vehicle')}
                  >
                    내 차 관리로 이동
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    className="mt-2"
                    onClick={() => { setEditSheetOpen(false); setEditSheetMode(null); }}
                  >
                    닫기
                  </Button>
                </div>
              )}

              {editSheetMode === 'shop' && (
                <div className="space-y-4 py-2">
                  <Input
                    placeholder="업체명, 구·군, 주소로 검색 (서울 블루핸즈)"
                    value={shopSearchQuery}
                    onChange={(e) => setShopSearchQuery(e.target.value)}
                    fullWidth
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {shopSearching && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-hyundai-blue-500" />
                      </div>
                    )}
                    {!shopSearching && shopSearchQuery.trim() && shopSearchResults.length === 0 && (
                      <p className="text-caption text-hyundai-gray-500 py-4 text-center">검색 결과가 없어요</p>
                    )}
                    {!shopSearching &&
                      shopSearchResults.map((shop) => (
                        <button
                          key={`${shop.업체명}-${shop.주소}`}
                          type="button"
                          onClick={() => {
                            setShopName(shop.업체명);
                            setEditSheetOpen(false);
                            setEditSheetMode(null);
                            setShopSearchQuery('');
                            setShopSearchResults([]);
                          }}
                          className="w-full text-left p-3 rounded-lg border border-hyundai-gray-200 hover:bg-hyundai-gray-50"
                        >
                          <p className="text-body-1 text-hyundai-gray-900 font-medium">{shop.업체명}</p>
                          <p className="text-caption text-hyundai-gray-500 mt-0.5">{shop.시군구} · {shop.주소}</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {editSheetMode === 'date' && (
                <div className="py-4 space-y-4">
                  <Input
                    type="date"
                    label="의뢰일자"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setEditSheetOpen(false);
                      setEditSheetMode(null);
                    }}
                  >
                    완료
                  </Button>
                </div>
              )}

              {editSheetMode === 'vat' && (
                <div className="py-4 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatIncluded}
                      onChange={(e) => setVatIncluded(e.target.checked)}
                      className="w-5 h-5 rounded border-hyundai-gray-300"
                    />
                    <span className="text-body-1 text-hyundai-gray-900">VAT 포함</span>
                  </label>
                  {vatIncluded && (
                    <Input
                      type="number"
                      label="VAT 금액 (원, 선택)"
                      placeholder={`자동: ${formatPrice(Math.round(estimate.totalAmount / 11))}`}
                      value={vatAmount > 0 ? String(vatAmount) : ''}
                      onChange={(e) => setVatAmount(Number(e.target.value) || 0)}
                      fullWidth
                    />
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      if (vatIncluded && vatAmount === 0) {
                        setVatAmount(Math.round(estimate.totalAmount / 11));
                      }
                      setEditSheetOpen(false);
                      setEditSheetMode(null);
                    }}
                  >
                    완료
                  </Button>
                </div>
              )}

              {editSheetMode === 'item' && editItemIndex !== null && (
                <div className="py-4 space-y-4">
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
                  <p className="text-caption text-hyundai-gray-500">
                    소계: {formatPrice(editItemForm.partCost + editItemForm.laborCost)}
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
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
                      setEditSheetOpen(false);
                      setEditSheetMode(null);
                      setEditItemIndex(null);
                    }}
                  >
                    완료
                  </Button>
                </div>
              )}
            </BottomSheet>

            {/* 검증하기 버튼 */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleVerify}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  저장 중...
                </>
              ) : (
                '검증하기'
              )}
            </Button>
          </div>
        </Container>
      </main>
    </>
  );
};

export default ReviewPage;
