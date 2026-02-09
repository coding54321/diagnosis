'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card, BottomSheet, Input } from '@/components/ui';
import { popularItems } from '@/lib/mockData';
import { createEstimate, saveVehicle, fetchVehicleByRegistrationNumber, fetchVehicles } from '@/lib/supabase/actions';
import { formatPrice } from '@/lib/utils';
import type { EstimateItem } from '@/types';

/** 차량번호 조회로 채워지는 차량 정보 */
type VehicleInfoFromLookup = {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
};

const ManualInputPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 차량 정보 (차량번호 조회로 채워짐)
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoFromLookup | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [estimateMileage, setEstimateMileage] = useState(0);

  // 저장된 내 차 목록 (다차량)
  const [savedVehicles, setSavedVehicles] = useState<Array<{ id: string; manufacturer: string; model: string; variant: string | null; year: number; mileage: number; fuel_type: string }>>([]);
  const [savedVehicleDismissed, setSavedVehicleDismissed] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [items, setItems] = useState<EstimateItem[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<EstimateItem>>({
    name: '',
    partCost: 0,
    laborCost: 0,
    category: '',
  });

  // 바텀시트 상태
  type SheetMode = 'vehicle' | 'addItem' | 'editItem' | null;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadSavedVehicles = async () => {
      try {
        const res = await fetchVehicles();
        if (res.success && res.data && res.data.length > 0) {
          setSavedVehicles(res.data);
        }
      } catch {
        // 무시
      }
    };
    loadSavedVehicles();
  }, []);

  const openSheet = (mode: SheetMode) => {
    setSheetMode(mode);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetMode(null);
    setEditItemIndex(null);
  };

  /** 차량번호로 차량 정보 불러오기 */
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
        setVehicleNumber(num);
      } else {
        alert(res.error ?? '등록된 차량이 없어요. 차량번호를 다시 확인해 주세요.');
      }
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!currentItem.name || !currentItem.partCost || !currentItem.laborCost) {
      alert('모든 항목을 입력해주세요');
      return;
    }

    const newItem: EstimateItem = {
      id: `item-${Date.now()}`,
      name: currentItem.name || '',
      partCost: currentItem.partCost || 0,
      laborCost: currentItem.laborCost || 0,
      totalCost: (currentItem.partCost || 0) + (currentItem.laborCost || 0),
      category: currentItem.category || '기타',
    };

    setItems([...items, newItem]);
    setCurrentItem({ name: '', partCost: 0, laborCost: 0, category: '' });
    closeSheet();
  };

  const handleEditItem = () => {
    if (editItemIndex === null) return;
    const totalCost = (currentItem.partCost || 0) + (currentItem.laborCost || 0);
    setItems((prev) =>
      prev.map((it, i) =>
        i === editItemIndex
          ? {
              ...it,
              name: currentItem.name || it.name,
              partCost: currentItem.partCost || 0,
              laborCost: currentItem.laborCost || 0,
              totalCost,
            }
          : it
      )
    );
    closeSheet();
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    closeSheet();
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert('최소 1개 이상의 정비 항목을 추가해주세요');
      return;
    }

    if (!vehicleInfo) {
      alert('차량 정보를 입력해주세요. 차량번호를 입력하고 조회해 주세요.');
      return;
    }

    const mileage = estimateMileage > 0 ? estimateMileage : vehicleInfo.mileage;
    if (mileage <= 0) {
      alert('주행거리를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      let vehicleId: string;
      if (selectedVehicleId) {
        vehicleId = selectedVehicleId;
      } else {
        const vehicleResult = await saveVehicle(
          {
            manufacturer: vehicleInfo.manufacturer,
            model: vehicleInfo.model,
            variant: vehicleInfo.variant ?? undefined,
            year: vehicleInfo.year,
            mileage,
            fuelType: vehicleInfo.fuelType,
          },
          {
            registrationNumber: vehicleNumber.replace(/\s|-/g, '').trim() || undefined,
          }
        );
        if (!vehicleResult.success || !vehicleResult.data) {
          throw new Error(vehicleResult.error || '차량 정보 저장 실패');
        }
        vehicleId = vehicleResult.data.id;
      }

      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
      const vatAmount = Math.floor(totalAmount * 0.1);
      const finalAmount = totalAmount + vatAmount;

      const estimateResult = await createEstimate({
        vehicleId,
        shopName: '직접 입력',
        totalAmount: finalAmount,
        items: items.map((item) => ({
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

      sessionStorage.setItem('currentEstimateId', estimateResult.data.estimateId);
      router.push('/verify/result');
    } catch (error) {
      console.error('Error submitting estimate:', error);
      alert('견적서 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
  const vatAmount = Math.floor(totalAmount * 0.1);
  const finalAmount = totalAmount + vatAmount;

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
              직접 입력
            </h1>
            <p className="text-sm text-hyundai-gray-400 mt-1.5">
              차량 정보와 정비 항목을 직접 입력할 수 있어요
            </p>
          </div>

          <div className="space-y-4">
            {/* 차량 정보 */}
            <Card variant="default" padding="none">
              <div className="px-5 py-4">
                <p className="text-xs text-hyundai-gray-400 mb-2">차량</p>

                {/* 저장된 내 차 목록 */}
                {savedVehicles.length > 0 && !vehicleInfo && !savedVehicleDismissed && (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs text-hyundai-gray-500 mb-2">저장된 내 차량이 있어요</p>
                    {savedVehicles.length === 1 ? (
                      <div className="p-3 bg-hyundai-gray-50 rounded-xl">
                        <p className="text-sm font-medium text-hyundai-gray-900 mb-2.5">
                          {savedVehicles[0].manufacturer} {savedVehicles[0].model}
                          {savedVehicles[0].variant ? ` ${savedVehicles[0].variant}` : ''} · {savedVehicles[0].year}년식 · {savedVehicles[0].fuel_type}
                          {savedVehicles[0].mileage > 0 ? ` · ${savedVehicles[0].mileage.toLocaleString()}km` : ''}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const v = savedVehicles[0];
                              setVehicleInfo({
                                manufacturer: v.manufacturer,
                                model: v.model,
                                variant: v.variant,
                                year: v.year,
                                mileage: v.mileage,
                                fuelType: v.fuel_type,
                              });
                              setEstimateMileage(v.mileage);
                              setSelectedVehicleId(v.id);
                              setSavedVehicleDismissed(true);
                            }}
                            className="flex-1 py-2 rounded-lg bg-hyundai-gray-900 text-white text-xs font-medium active:bg-hyundai-gray-800 transition-colors"
                          >
                            이 차량으로 검증
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSavedVehicleDismissed(true);
                              setSelectedVehicleId(null);
                            }}
                            className="py-2 px-3 rounded-lg bg-white text-hyundai-gray-500 text-xs font-medium active:bg-hyundai-gray-100 transition-colors border border-hyundai-gray-200"
                          >
                            다른 차량
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {savedVehicles.map((v) => (
                          <div key={v.id} className="p-3 bg-hyundai-gray-50 rounded-xl">
                            <p className="text-sm font-medium text-hyundai-gray-900 mb-2">
                              {v.manufacturer} {v.model}
                              {v.variant ? ` ${v.variant}` : ''} · {v.year}년식
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setVehicleInfo({
                                  manufacturer: v.manufacturer,
                                  model: v.model,
                                  variant: v.variant,
                                  year: v.year,
                                  mileage: v.mileage,
                                  fuelType: v.fuel_type,
                                });
                                setEstimateMileage(v.mileage);
                                setSelectedVehicleId(v.id);
                                setSavedVehicleDismissed(true);
                              }}
                              className="w-full py-2 rounded-lg bg-hyundai-gray-900 text-white text-xs font-medium active:bg-hyundai-gray-800 transition-colors"
                            >
                              이 차량으로 검증
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setSavedVehicleDismissed(true);
                            setSelectedVehicleId(null);
                          }}
                          className="w-full py-2 rounded-lg border border-hyundai-gray-200 text-hyundai-gray-600 text-xs font-medium active:bg-hyundai-gray-50"
                        >
                          다른 차량으로 입력
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* 차량번호 입력 */}
                {(savedVehicleDismissed || savedVehicles.length === 0 || vehicleInfo) && !vehicleInfo && (
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
                      차량번호를 입력하면 제조사·차종 등이 자동으로 채워져요
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
            </Card>

            {/* 정비 항목 */}
            <div>
              <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-sm font-bold text-hyundai-gray-900">정비 항목</h3>
                <span className="text-xs text-hyundai-gray-400">{items.length}건</span>
              </div>

              <Card variant="default" padding="none">
                {items.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-hyundai-gray-400">
                      아래 버튼을 눌러 항목을 추가해주세요
                    </p>
                  </div>
                ) : (
                  items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <button
                        type="button"
                        onClick={() => {
                          setEditItemIndex(index);
                          setCurrentItem({
                            name: item.name,
                            partCost: item.partCost,
                            laborCost: item.laborCost,
                            category: item.category,
                          });
                          openSheet('editItem');
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
                  ))
                )}

                {/* 항목 추가 버튼 — 카드 내부 */}
                {items.length > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentItem({ name: '', partCost: 0, laborCost: 0, category: '' });
                    openSheet('addItem');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-5 py-3.5 text-sm text-hyundai-gray-400 active:bg-hyundai-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  항목 추가
                </button>
              </Card>
            </div>
          </div>
        </Container>

        {/* 하단 고정 바 — PWA safe area */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="max-w-lg mx-auto px-5 py-4">
            {items.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-hyundai-gray-400">부품비 + 공임비</span>
                  <span className="text-xs text-hyundai-gray-600">{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-hyundai-gray-400">부가세 (10%)</span>
                  <span className="text-xs text-hyundai-gray-600">{formatPrice(vatAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-hyundai-gray-100">
                  <span className="text-sm text-hyundai-gray-400">총 금액</span>
                  <span className="text-xl font-bold text-hyundai-gray-900">
                    {formatPrice(finalAmount)}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={items.length === 0 || isSubmitting}
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

      {/* 바텀시트 */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        title={
          sheetMode === 'vehicle' ? '차량 정보 수정'
            : sheetMode === 'addItem' ? '항목 추가'
            : sheetMode === 'editItem' ? '항목 수정'
            : undefined
        }
      >
        {sheetMode === 'vehicle' && (
          <div className="space-y-4">
            <p className="text-xs text-hyundai-gray-400">
              차량번호를 입력하면 제조사·차종 등이 자동으로 채워져요
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

        {sheetMode === 'addItem' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-hyundai-gray-400 mb-1.5 block">정비 항목명</label>
              <input
                type="text"
                list="popular-items"
                value={currentItem.name}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, name: e.target.value })
                }
                placeholder="예: 브레이크 패드 교체 (전륜)"
                className="w-full px-4 py-3 border border-hyundai-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hyundai-gray-900"
              />
              <datalist id="popular-items">
                {popularItems.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="부품비 (원)"
                type="number"
                value={currentItem.partCost || ''}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    partCost: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
              <Input
                label="공임비 (원)"
                type="number"
                value={currentItem.laborCost || ''}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    laborCost: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
            </div>

            {(currentItem.partCost || 0) + (currentItem.laborCost || 0) > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-hyundai-gray-400">소계</span>
                <span className="text-sm font-bold text-hyundai-gray-900">
                  {formatPrice((currentItem.partCost || 0) + (currentItem.laborCost || 0))}
                </span>
              </div>
            )}

            <button
              onClick={handleAddItem}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              추가하기
            </button>
          </div>
        )}

        {sheetMode === 'editItem' && editItemIndex !== null && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-hyundai-gray-400 mb-1.5 block">정비 항목명</label>
              <input
                type="text"
                list="popular-items-edit"
                value={currentItem.name}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, name: e.target.value })
                }
                placeholder="정비 항목명"
                className="w-full px-4 py-3 border border-hyundai-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hyundai-gray-900"
              />
              <datalist id="popular-items-edit">
                {popularItems.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="부품비 (원)"
                type="number"
                value={currentItem.partCost || ''}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    partCost: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
              <Input
                label="공임비 (원)"
                type="number"
                value={currentItem.laborCost || ''}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    laborCost: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-hyundai-gray-400">소계</span>
              <span className="text-sm font-bold text-hyundai-gray-900">
                {formatPrice((currentItem.partCost || 0) + (currentItem.laborCost || 0))}
              </span>
            </div>

            <button
              onClick={handleEditItem}
              className="w-full py-3 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors"
            >
              완료
            </button>

            <button
              onClick={() => {
                const item = items[editItemIndex];
                if (item) handleRemoveItem(item.id);
              }}
              className="w-full py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-red-500 active:bg-red-50 transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
};

export default ManualInputPage;
