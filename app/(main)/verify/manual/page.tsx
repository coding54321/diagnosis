'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Wrench, X, Plus, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Input, Button } from '@/components/ui';
import { manufacturers, hyundaiModels, kiaModels, popularItems } from '@/lib/mockData';
import { createEstimate, saveVehicle } from '@/lib/supabase/actions';
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

  const [showItemForm, setShowItemForm] = useState(false);

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
    setShowItemForm(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
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
      // 차량 정보 저장/업데이트
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

      // 견적서 저장
      const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
      const vatAmount = Math.floor(totalAmount * 0.1);
      const finalAmount = totalAmount + vatAmount;

      const estimateResult = await createEstimate({
        vehicleId,
        shopName: '직접 입력', // TODO: 정비소 이름 입력 필드 추가
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

      // 견적서 ID를 sessionStorage에 저장하여 검증 결과 페이지에서 사용
      sessionStorage.setItem('currentEstimateId', estimateResult.data.estimateId);

      // 검증 결과 페이지로 이동 (임시로 목업 데이터 사용)
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

  const availableModels =
    vehicleInfo.manufacturer === '현대'
      ? hyundaiModels
      : vehicleInfo.manufacturer === '기아'
      ? kiaModels
      : [];

  return (
    <>
      <Header title="직접 입력" showBackButton onBack={() => router.back()} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-6">
            {/* 차량 정보 */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">차량 정보</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-body-2 text-hyundai-gray-700 mb-2 block font-medium">
                    제조사
                  </label>
                  <select
                    value={vehicleInfo.manufacturer}
                    onChange={(e) =>
                      setVehicleInfo({ ...vehicleInfo, manufacturer: e.target.value, model: '' })
                    }
                    className="w-full px-4 py-3 border border-hyundai-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hyundai-blue-500"
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
                    <label className="text-body-2 text-hyundai-gray-700 mb-2 block font-medium">
                      차종
                    </label>
                    <select
                      value={vehicleInfo.model}
                      onChange={(e) =>
                        setVehicleInfo({ ...vehicleInfo, model: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-hyundai-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hyundai-blue-500"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                  </div>
                  <div>
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
                </div>
              </div>
            </Card>

            {/* 정비 항목 */}
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-hyundai-gray-600" />
                  <h3 className="text-h4 text-hyundai-gray-900">정비 항목</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowItemForm(!showItemForm)}
                  className="flex items-center gap-1"
                >
                  {showItemForm ? (
                    <>
                      <X className="w-4 h-4" />
                      취소
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      항목 추가
                    </>
                  )}
                </Button>
              </div>

              {showItemForm && (
                <Card variant="highlighted" padding="md" className="mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-body-2 text-hyundai-gray-700 mb-2 block font-medium">
                        정비 항목명
                      </label>
                      <input
                        type="text"
                        list="popular-items"
                        value={currentItem.name}
                        onChange={(e) =>
                          setCurrentItem({ ...currentItem, name: e.target.value })
                        }
                        placeholder="예: 브레이크 패드 교체 (전륜)"
                        className="w-full px-4 py-3 border border-hyundai-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hyundai-blue-500"
                      />
                      <datalist id="popular-items">
                        {popularItems.map((item) => (
                          <option key={item} value={item} />
                        ))}
                      </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
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
                      </div>
                      <div>
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
                    </div>

                    <Button variant="primary" fullWidth onClick={handleAddItem}>
                      추가하기
                    </Button>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {items.map((item, index) => (
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
                          <p>부품비: {item.partCost.toLocaleString('ko-KR')}원</p>
                          <p>공임비: {item.laborCost.toLocaleString('ko-KR')}원</p>
                          <p className="font-medium text-hyundai-gray-900">
                            소계: {item.totalCost.toLocaleString('ko-KR')}원
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-semantic-error-main p-2 hover:bg-semantic-error-light rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </Card>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-body-2 text-hyundai-gray-500">
                      정비 항목을 추가해주세요
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* 총 금액 */}
            {items.length > 0 && (
              <Card variant="highlighted" padding="md">
                <div className="space-y-2">
                  <div className="flex justify-between text-body-1">
                    <span className="text-hyundai-gray-700">부품비 + 공임비</span>
                    <span className="font-medium">{totalAmount.toLocaleString('ko-KR')}원</span>
                  </div>
                  <div className="flex justify-between text-body-1">
                    <span className="text-hyundai-gray-700">부가세 (10%)</span>
                    <span className="font-medium">{vatAmount.toLocaleString('ko-KR')}원</span>
                  </div>
                  <div className="border-t border-hyundai-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-h3">
                      <span className="text-hyundai-gray-900">총 금액</span>
                      <span className="font-bold text-hyundai-blue-600">
                        {finalAmount.toLocaleString('ko-KR')}원
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 검증하기 버튼 */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmit}
              disabled={items.length === 0 || isSubmitting}
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

export default ManualInputPage;
