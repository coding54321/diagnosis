'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Plus, X } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, BottomSheet, Input } from '@/components/ui';
import { manufacturers, hyundaiModels, kiaModels, popularItems } from '@/lib/mockData';
import { createEstimate, saveVehicle } from '@/lib/supabase/actions';
import { formatPrice } from '@/lib/utils';
import type { EstimateItem } from '@/types';

const ManualInputPage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vehicleInfo, setVehicleInfo] = useState({
    manufacturer: '',
    model: '',
    variant: '',
    year: new Date().getFullYear(),
    mileage: 0,
    fuelType: '가솔린',
  });

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

  const openSheet = (mode: SheetMode) => {
    setSheetMode(mode);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetMode(null);
    setEditItemIndex(null);
  };

  const availableModels =
    vehicleInfo.manufacturer === '현대'
      ? hyundaiModels
      : vehicleInfo.manufacturer === '기아'
      ? kiaModels
      : [];

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

    if (!vehicleInfo.manufacturer || !vehicleInfo.model) {
      alert('차량 정보를 입력해주세요');
      return;
    }

    setIsSubmitting(true);

    try {
      const vehicleResult = await saveVehicle({
        manufacturer: vehicleInfo.manufacturer,
        model: vehicleInfo.model,
        variant: vehicleInfo.variant || undefined,
        year: vehicleInfo.year,
        mileage: vehicleInfo.mileage,
        fuelType: vehicleInfo.fuelType || '가솔린',
      });

      if (!vehicleResult.success || !vehicleResult.data) {
        throw new Error(vehicleResult.error || '차량 정보 저장 실패');
      }

      const vehicleId = vehicleResult.data.id;

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

  const vehicleSummary =
    vehicleInfo.manufacturer && vehicleInfo.model
      ? `${vehicleInfo.manufacturer} ${vehicleInfo.model}${vehicleInfo.variant ? ` ${vehicleInfo.variant}` : ''} · ${vehicleInfo.year}년식${vehicleInfo.mileage > 0 ? ` · ${vehicleInfo.mileage.toLocaleString()}km` : ''}`
      : '차량을 선택해주세요';

  return (
    <>
      <Header title="직접 입력" showBackButton onBack={() => router.back()} />

      <main className="min-h-screen bg-hyundai-gray-50 pb-36">
        <Container>
          <div className="py-5 space-y-4">
            {/* 안내 문구 */}
            <div className="px-1">
              <h2 className="text-lg font-bold text-hyundai-gray-900 mb-1">
                견적 내용을 입력해주세요
              </h2>
              <p className="text-sm text-hyundai-gray-400">
                차량 정보와 정비 항목을 직접 입력할 수 있어요
              </p>
            </div>

            {/* 차량 정보 */}
            <Card variant="default" padding="none">
              <button
                type="button"
                onClick={() => openSheet('vehicle')}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs text-hyundai-gray-400 mb-0.5">차량 정보</p>
                  <p className={`text-sm font-medium ${vehicleInfo.manufacturer ? 'text-hyundai-gray-900' : 'text-hyundai-gray-400'}`}>
                    {vehicleSummary}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
              </button>
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

        {/* 하단 고정 바 */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100">
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
          sheetMode === 'vehicle' ? '차량 정보'
            : sheetMode === 'addItem' ? '항목 추가'
            : sheetMode === 'editItem' ? '항목 수정'
            : undefined
        }
      >
        {sheetMode === 'vehicle' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-hyundai-gray-400 mb-1.5 block">제조사</label>
              <select
                value={vehicleInfo.manufacturer}
                onChange={(e) =>
                  setVehicleInfo({ ...vehicleInfo, manufacturer: e.target.value, model: '' })
                }
                className="w-full px-4 py-3 border border-hyundai-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hyundai-gray-900 bg-white"
              >
                <option value="">선택하세요</option>
                {manufacturers.map((mfg) => (
                  <option key={mfg} value={mfg}>
                    {mfg}
                  </option>
                ))}
              </select>
            </div>

            {vehicleInfo.manufacturer && (
              <div>
                <label className="text-xs text-hyundai-gray-400 mb-1.5 block">차종</label>
                <select
                  value={vehicleInfo.model}
                  onChange={(e) =>
                    setVehicleInfo({ ...vehicleInfo, model: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-hyundai-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-hyundai-gray-900 bg-white"
                >
                  <option value="">선택하세요</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="연식"
                type="number"
                value={vehicleInfo.year}
                onChange={(e) =>
                  setVehicleInfo({
                    ...vehicleInfo,
                    year: parseInt(e.target.value) || new Date().getFullYear(),
                  })
                }
                fullWidth
              />
              <Input
                label="주행거리 (km)"
                type="number"
                value={vehicleInfo.mileage || ''}
                onChange={(e) =>
                  setVehicleInfo({
                    ...vehicleInfo,
                    mileage: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
            </div>

            <button
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
