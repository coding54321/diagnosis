'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, X, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card, BottomSheet, Input } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { createEstimate, saveVehicle, uploadEstimateImageAction, createVerificationResult, fetchVehicleByRegistrationNumber, fetchVehicle } from '@/lib/supabase/actions';
import { VerificationEngine } from '@/lib/verification/engine';
import type { EstimateItem } from '@/types';
import type { OCRResult } from '@/lib/openai/vision';

/** 차량번호 조회로 채워지는 차량 정보 (주행거리 포함) */
type VehicleInfoFromLookup = {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
};
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

  // 정비소 (전국 표준데이터 검색)
  const [shopName, setShopName] = useState('');
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<BluehandsShop[]>([]);
  const [shopSearching, setShopSearching] = useState(false);
  const [shopLookupLoading, setShopLookupLoading] = useState(false);

  // 정비 항목
  const [items, setItems] = useState<EstimateItem[]>([]);

  // OCR에서 추출한 차량 정보
  const [ocrVehicleModel, setOcrVehicleModel] = useState<string | null>(null);
  const [ocrMileage, setOcrMileage] = useState<number | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState({ name: '', partCost: 0, laborCost: 0 });

  // 차량 정보 (차량번호 조회로 채워짐)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoFromLookup | null>(null);
  const [estimateMileage, setEstimateMileage] = useState<number>(0);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // 저장된 내 차 정보
  const [savedVehicle, setSavedVehicle] = useState<VehicleInfoFromLookup | null>(null);
  const [savedVehicleDismissed, setSavedVehicleDismissed] = useState(false);

  useEffect(() => {
    const image = sessionStorage.getItem('capturedEstimateImage');
    const ocrResultJson = sessionStorage.getItem('ocrResult');

    if (image) setCapturedImage(image);

    // OCR 결과가 있으면 초기 상태 설정
    if (ocrResultJson) {
      try {
        const ocrResult: OCRResult = JSON.parse(ocrResultJson);

        if (ocrResult.success && ocrResult.data) {
          // 정비소명: DB에서 가장 유사한 결과만 사용, 없으면 빈 칸 (OCR 원본값 사용 안 함)
          if (ocrResult.data.shopName) {
            const ocrShopName = ocrResult.data.shopName.trim();
            setShopLookupLoading(true);
            fetch(`/api/shops?q=${encodeURIComponent(ocrShopName)}`)
              .then((res) => res.json())
              .then((data: { shops?: (BluehandsShop & { score?: number })[] }) => {
                if (data.shops && data.shops.length >= 1) {
                  // 검색 결과가 있으면 가장 유사한 첫 번째 결과를 무조건 사용
                  setShopName(data.shops[0].업체명);
                }
                // 검색 결과가 없으면 빈 칸 유지 (사용자가 직접 검색)
              })
              .catch(() => {})
              .finally(() => setShopLookupLoading(false));
          }

          // 의뢰일자
          if (ocrResult.data.date) {
            setRequestDate(ocrResult.data.date);
          }

          // 정비 항목
          if (ocrResult.data.items && ocrResult.data.items.length > 0) {
            setItems(
              ocrResult.data.items.map((item, index) => ({
                id: `ocr-item-${index}`,
                name: item.name,
                normalizedName: item.normalizedName,
                partCost: item.partCost || 0,
                laborCost: item.laborCost || 0,
                totalCost: item.totalCost || (item.partCost || 0) + (item.laborCost || 0),
                category: item.category || '',
              }))
            );
          }

          // 차량번호
          if (ocrResult.data.registrationNumber) {
            setVehicleNumber(ocrResult.data.registrationNumber);
          }

          // OCR에서 추출한 차종
          if (ocrResult.data.vehicleModel) {
            setOcrVehicleModel(ocrResult.data.vehicleModel);
          }

          // OCR에서 추출한 주행거리
          if (ocrResult.data.mileage) {
            setOcrMileage(ocrResult.data.mileage);
            setEstimateMileage(ocrResult.data.mileage);
          }

          // VAT 정보
          if (ocrResult.data.vatIncluded !== undefined) {
            setVatIncluded(ocrResult.data.vatIncluded);
          }
          if (ocrResult.data.vatAmount) {
            setVatAmount(ocrResult.data.vatAmount);
          }

          // 부분 인식 안내 (토스트 또는 배지로 표시 가능)
          if (ocrResult.status === 'PARTIAL') {
            console.log('일부 항목만 인식되었습니다. 확인 후 수정해주세요.');
          }

          // OCR에서 차량번호가 있으면 자동으로 차량 정보 조회
          if (ocrResult.data.registrationNumber) {
            const num = ocrResult.data.registrationNumber.replace(/\s|-/g, '').trim();
            fetchVehicleByRegistrationNumber(num).then((res) => {
              if (res.success && res.data) {
                setVehicleInfo(res.data);
                // OCR 주행거리가 있으면 우선 사용, 없으면 조회된 주행거리 사용
                if (ocrResult.data?.mileage) {
                  setEstimateMileage(ocrResult.data.mileage);
                } else if (res.data.mileage > 0) {
                  setEstimateMileage(res.data.mileage);
                }
                setSavedVehicleDismissed(true); // 저장된 차량 선택 UI 숨기기
              }
            }).catch(() => {
              // 조회 실패 시 무시 (사용자가 직접 입력 가능)
            });
          }
        }
      } catch (error) {
        console.error('OCR 결과 파싱 오류:', error);
      }
    }

    // 저장된 차량 정보 불러오기
    const loadSavedVehicle = async () => {
      try {
        const res = await fetchVehicle();
        if (res.success && res.data) {
          setSavedVehicle({
            manufacturer: res.data.manufacturer,
            model: res.data.model,
            variant: res.data.variant || null,
            year: res.data.year,
            mileage: res.data.mileage,
            fuelType: res.data.fuel_type,
          });
        }
      } catch {
        // 무시
      }
    };
    loadSavedVehicle();
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

  // 총 금액 = 항목 합계 (견적서 화면에서는 항목 금액이 보통 부가세 포함이므로 이 합계가 VAT 포함 총액)
  const totalAmount = items.reduce((sum, i) => sum + i.totalCost, 0);
  // VAT 포함일 때 부가세 = 총액/11 (부가세 포함가 기준: 공급가액×1.1=포함가 → 부가세=포함가/11)
  const computedVatAmount = vatIncluded ? Math.round(totalAmount / 11) : 0;
  const estimate = { shopName, items, totalAmount };

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

  /** 차량번호로 차량 정보 불러오기 (카드·시트 공통) */
  const handleFetchVehicleByNumber = async (numberToUse?: string) => {
    const num = (numberToUse ?? vehicleNumber).replace(/\s|-/g, '').trim();
    if (!num) {
      alert('차량번호를 입력해 주세요.');
      return;
    }
    setVehicleLoading(true);
    try {
      const res = await fetchVehicleByRegistrationNumber(num);
      if (res.success && res.data) {
        setVehicleInfo(res.data);
        setEstimateMileage(res.data.mileage > 0 ? res.data.mileage : 0);
        setVehicleNumber(num); // 표시용 통일 (예: 12가3456)
      } else {
        alert(res.error ?? '등록된 차량이 없어요. 아래에서 제조사·차종 등을 직접 입력해 주세요.');
      }
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!vehicleInfo) {
      alert('차량 정보를 입력해 주세요. 차량번호를 입력하고 [차량 정보 불러오기]를 눌러 주세요.');
      return;
    }
    const mileage = estimateMileage > 0 ? estimateMileage : vehicleInfo.mileage;
    if (mileage <= 0) {
      alert('주행거리를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const vehicleResult = await saveVehicle({
        manufacturer: vehicleInfo.manufacturer,
        model: vehicleInfo.model,
        variant: vehicleInfo.variant ?? undefined,
        year: vehicleInfo.year,
        mileage,
        fuelType: vehicleInfo.fuelType,
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

      const vehicleInfoForVerification = {
        manufacturer: vehicleInfo.manufacturer,
        model: vehicleInfo.model,
        year: vehicleInfo.year,
        mileage,
      };

      const estimateItemsForVerification: EstimateItem[] = savedItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        normalizedName: estimate.items[index]?.normalizedName,
        partCost: item.part_cost,
        laborCost: item.labor_cost,
        totalCost: item.total_cost,
        category: item.category || '',
      }));

      const verificationResult = await VerificationEngine.verifyEstimate(
        estimateItemsForVerification,
        estimate.totalAmount,
        vehicleInfoForVerification
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
      <main className="min-h-screen bg-white pb-36">
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
              견적서 확인
            </h1>
            <p className="text-sm text-hyundai-gray-400 mt-1.5">
              인식된 내용을 확인하세요. 정비소는 전국 등록 업체에서 검색해 선택할 수 있어요.
            </p>
          </div>

          <div className="space-y-4">

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

              {/* 정비소 (전국 등록 정비업체 검색) */}
              <button
                type="button"
                onClick={() => openSheet('shop')}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
              >
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs text-hyundai-gray-400 mb-0.5">정비소</p>
                  {shopLookupLoading ? (
                    <p className="text-sm text-hyundai-gray-500 flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.5} />
                      전국 등록 업체에서 확인 중...
                    </p>
                  ) : estimate.shopName ? (
                    <p className="text-sm font-medium text-hyundai-gray-900 truncate">{estimate.shopName}</p>
                  ) : (
                    <p className="text-sm text-hyundai-gray-400">검색해서 선택</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0 ml-2" strokeWidth={1.5} />
              </button>

              <div className="mx-5 border-b border-hyundai-gray-100" />

              {/* 차량 정보: 저장된 차량 사용 or 차량번호 입력 */}
              <div className="px-5 py-4">
                <p className="text-xs text-hyundai-gray-400 mb-2">차량</p>

                {/* 저장된 내 차 정보가 있고, 아직 차량 정보를 설정하지 않았을 때 */}
                {savedVehicle && !vehicleInfo && !savedVehicleDismissed && (
                  <div className="mb-3 p-3 bg-hyundai-gray-50 rounded-xl">
                    <p className="text-xs text-hyundai-gray-500 mb-2">저장된 내 차 정보가 있어요</p>
                    <p className="text-sm font-medium text-hyundai-gray-900 mb-2.5">
                      {savedVehicle.manufacturer} {savedVehicle.model}
                      {savedVehicle.variant ? ` ${savedVehicle.variant}` : ''} · {savedVehicle.year}년식 · {savedVehicle.fuelType}
                      {savedVehicle.mileage > 0 ? ` · ${savedVehicle.mileage.toLocaleString()}km` : ''}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVehicleInfo(savedVehicle);
                          setEstimateMileage(savedVehicle.mileage);
                          setSavedVehicleDismissed(true);
                        }}
                        className="flex-1 py-2 rounded-lg bg-hyundai-gray-900 text-white text-xs font-medium active:bg-hyundai-gray-800 transition-colors"
                      >
                        이 차량으로 검증
                      </button>
                      <button
                        type="button"
                        onClick={() => setSavedVehicleDismissed(true)}
                        className="py-2 px-3 rounded-lg bg-white text-hyundai-gray-500 text-xs font-medium active:bg-hyundai-gray-100 transition-colors border border-hyundai-gray-200"
                      >
                        다른 차량
                      </button>
                    </div>
                  </div>
                )}

                {/* OCR에서 추출한 차량 정보 표시 (차량 조회 전) */}
                {!vehicleInfo && (ocrVehicleModel || ocrMileage || vehicleNumber) && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 mb-1.5">📋 견적서에서 인식된 정보</p>
                    <div className="space-y-1 text-sm text-hyundai-gray-700">
                      {vehicleNumber && <p>차량번호: <span className="font-medium">{vehicleNumber}</span></p>}
                      {ocrVehicleModel && <p>차종: <span className="font-medium">{ocrVehicleModel}</span></p>}
                      {ocrMileage && <p>주행거리: <span className="font-medium">{ocrMileage.toLocaleString()}km</span></p>}
                    </div>
                    {vehicleLoading && (
                      <p className="text-xs text-blue-500 mt-2">차량 정보 조회 중...</p>
                    )}
                  </div>
                )}

                {/* 차량번호 입력 (저장된 차량 미사용 시) */}
                {(savedVehicleDismissed || !savedVehicle || vehicleInfo) && !vehicleInfo && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="예: 12가3456"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value.trim())}
                          className="text-sm"
                          fullWidth
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFetchVehicleByNumber()}
                        disabled={vehicleLoading || !vehicleNumber.trim()}
                        className="shrink-0 py-2 px-3 rounded-lg bg-hyundai-gray-100 text-hyundai-gray-800 text-xs font-medium active:bg-hyundai-gray-200 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {vehicleLoading ? '조회 중...' : '차량 정보 불러오기'}
                      </button>
                    </div>
                    <p className="text-xs text-hyundai-gray-400">
                      차량번호를 입력한 뒤 버튼을 누르면 제조사·차종 등이 자동으로 채워져요.
                    </p>
                  </>
                )}

                {/* 조회된 차량 정보 표시 */}
                {vehicleInfo && (
                  <>
                    <button
                      type="button"
                      onClick={() => openSheet('vehicle')}
                      className="w-full text-left -mx-1 px-1 py-1 rounded-lg active:bg-hyundai-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-hyundai-gray-900">
                        {vehicleInfo.manufacturer} {vehicleInfo.model}
                        {vehicleInfo.variant ? ` ${vehicleInfo.variant}` : ''} · {vehicleInfo.year}년식 · {vehicleInfo.fuelType}
                        {estimateMileage > 0 ? ` · ${estimateMileage.toLocaleString()}km` : ''}
                      </p>
                      <p className="text-xs text-hyundai-gray-400 mt-0.5">탭하여 수정</p>
                    </button>
                    {estimateMileage <= 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">주행거리를 입력해 주세요.</p>
                    )}
                  </>
                )}
              </div>

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
                    {vatIncluded ? `포함 · ${formatPrice(computedVatAmount)}` : '미포함'}
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
              차량등록번호(번호판)를 입력한 뒤 불러오기를 누르면 제조사·차종 등이 자동으로 채워져요.
            </p>
            <Input
              label="차량번호"
              placeholder="예: 12가3456"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.trim())}
              fullWidth
            />
            <button
              type="button"
              onClick={() => handleFetchVehicleByNumber(vehicleNumber)}
              disabled={vehicleLoading || !vehicleNumber.trim()}
              className="w-full py-2.5 rounded-xl bg-hyundai-gray-100 text-hyundai-gray-800 text-sm font-medium active:bg-hyundai-gray-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {vehicleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  조회 중...
                </>
              ) : (
                '차량 정보 불러오기'
              )}
            </button>
            <Input
              type="number"
              label="주행거리 (km)"
              placeholder="예: 45000"
              value={estimateMileage > 0 ? String(estimateMileage) : ''}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setEstimateMileage(v);
                if (vehicleInfo) setVehicleInfo((prev) => (prev ? { ...prev, mileage: v } : null));
              }}
              fullWidth
            />
            <button
              type="button"
              onClick={closeSheet}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>
          </div>
        )}

        {editSheetMode === 'shop' && (
          <div className="space-y-3">
            <p className="text-xs text-hyundai-gray-500">
              전국 등록 정비업체에서 검색해요. 업체명·주소로 찾을 수 있어요.
            </p>
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
                shopSearchResults.map((shop, idx) => (
                  <button
                    key={`${shop.업체명}-${shop.주소}-${idx}`}
                    type="button"
                    onClick={() => {
                      setShopName(shop.업체명);
                      closeSheet();
                    }}
                    className="w-full text-left px-3 py-3 rounded-xl active:bg-hyundai-gray-50 transition-colors border-b border-hyundai-gray-50 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-hyundai-gray-900">{shop.업체명}</p>
                    <p className="text-xs text-hyundai-gray-400 mt-0.5">
                      {[shop.시군구, shop.주소].filter(Boolean).join(' · ')}
                    </p>
                    {shop.전화번호 && (
                      <p className="text-xs text-hyundai-gray-500 mt-0.5">{shop.전화번호}</p>
                    )}
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
                placeholder={`자동: ${formatPrice(computedVatAmount)}`}
                value={vatAmount > 0 ? String(vatAmount) : ''}
                onChange={(e) => setVatAmount(Number(e.target.value) || 0)}
                fullWidth
              />
            )}
            <button
              onClick={() => {
                if (vatIncluded && vatAmount === 0) {
                  setVatAmount(computedVatAmount);
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
