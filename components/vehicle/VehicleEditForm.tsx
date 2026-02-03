'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Check } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Input, BottomSheet } from '@/components/ui';
import { manufacturers, hyundaiModels, kiaModels } from '@/lib/mockData';
import { saveVehicle, fetchVehicleByRegistrationNumber } from '@/lib/supabase/actions';
import type { Vehicle } from '@/types';

const FUEL_TYPES = ['가솔린', '디젤', 'LPG', '하이브리드', '전기', '수소'] as const;

export interface VehicleEditFormProps {
  initialVehicle: Vehicle | null;
  title: string;
}

type SheetMode = 'manufacturer' | 'model' | 'fuelType' | null;

export default function VehicleEditForm({ initialVehicle, title }: VehicleEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  const [form, setForm] = useState({
    manufacturer: '',
    model: '',
    variant: '',
    year: new Date().getFullYear(),
    mileage: 0,
    fuelType: '가솔린',
  });

  useEffect(() => {
    if (initialVehicle) {
      setForm({
        manufacturer: initialVehicle.manufacturer,
        model: initialVehicle.model,
        variant: initialVehicle.variant || '',
        year: initialVehicle.year,
        mileage: initialVehicle.mileage,
        fuelType: initialVehicle.fuelType || '가솔린',
      });
    }
  }, [initialVehicle]);

  const availableModels =
    form.manufacturer === '현대'
      ? hyundaiModels
      : form.manufacturer === '기아'
        ? kiaModels
        : [];

  const openSheet = (mode: SheetMode) => {
    setSheetMode(mode);
    setSheetOpen(true);
  };
  const closeSheet = () => {
    setSheetOpen(false);
    setSheetMode(null);
  };

  const handleLookupByNumber = async () => {
    const num = lookupNumber.replace(/\s|-/g, '').trim();
    if (!num) {
      setLookupMessage({ type: 'error', text: '차량번호를 입력해 주세요.' });
      return;
    }
    setLookupMessage(null);
    setLookupLoading(true);
    try {
      const res = await fetchVehicleByRegistrationNumber(num);
      if (res.success && res.data) {
        setForm({
          manufacturer: res.data.manufacturer,
          model: res.data.model,
          variant: res.data.variant ?? '',
          year: res.data.year,
          mileage: res.data.mileage,
          fuelType: res.data.fuelType,
        });
        setLookupMessage({ type: 'success', text: '차량 정보를 불러왔어요. 주행거리만 확인해 주세요.' });
      } else {
        setLookupMessage({ type: 'error', text: res.error ?? '등록된 차량이 없어요. 아래에서 직접 입력해 주세요.' });
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.manufacturer || !form.model) {
      alert('제조사와 차종을 선택해주세요.');
      return;
    }
    if (form.mileage < 0) {
      alert('주행거리를 올바르게 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveVehicle({
        manufacturer: form.manufacturer,
        model: form.model,
        variant: form.variant || undefined,
        year: form.year,
        mileage: form.mileage,
        fuelType: form.fuelType,
      });

      if (result.success) {
        router.push('/vehicle');
        router.refresh();
      } else {
        alert(result.error || '저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header title={title} showBackButton onBack={() => router.back()} />

      <main className="min-h-screen bg-hyundai-gray-50 pb-32">
        <Container>
          <div className="py-5 space-y-4">

            {/* 안내 */}
            <div className="px-1">
              <h2 className="text-lg font-bold text-hyundai-gray-900 mb-1">
                {initialVehicle ? '차량 정보를 수정해주세요' : '차량 정보를 등록해주세요'}
              </h2>
              <p className="text-sm text-hyundai-gray-400">
                차량번호로 불러오거나 직접 입력할 수 있어요
              </p>
            </div>

            {/* 차량번호로 불러오기 */}
            <Card variant="default" padding="none">
              <div className="px-5 py-4">
                <p className="text-xs text-hyundai-gray-400 mb-3">
                  차량등록번호(번호판)를 입력하면 제조사·차종 등이 자동으로 채워져요.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="예: 12가3456"
                      value={lookupNumber}
                      onChange={(e) => {
                        setLookupNumber(e.target.value.trim());
                        setLookupMessage(null);
                      }}
                      className="text-sm"
                      fullWidth
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupByNumber}
                    disabled={lookupLoading || !lookupNumber.trim()}
                    className="shrink-0 py-2 px-3 rounded-lg bg-hyundai-gray-100 text-hyundai-gray-800 text-xs font-medium active:bg-hyundai-gray-200 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                    ) : null}
                    {lookupLoading ? '조회 중...' : '불러오기'}
                  </button>
                </div>
                {lookupMessage && (
                  <p className={`text-xs mt-2 ${lookupMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {lookupMessage.text}
                  </p>
                )}
              </div>
            </Card>

            {/* 차량 정보 — row + divider 패턴 */}
            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">차량 정보</p>
              <Card variant="default" padding="none">
                {/* 제조사 */}
                <button
                  type="button"
                  onClick={() => openSheet('manufacturer')}
                  className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs text-hyundai-gray-400 mb-0.5">제조사</p>
                    <p className="text-sm font-medium text-hyundai-gray-900">
                      {form.manufacturer || '선택하세요'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
                </button>

                <div className="mx-5 border-b border-hyundai-gray-100" />

                {/* 차종 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!form.manufacturer) {
                      alert('제조사를 먼저 선택해주세요.');
                      return;
                    }
                    openSheet('model');
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs text-hyundai-gray-400 mb-0.5">차종</p>
                    <p className="text-sm font-medium text-hyundai-gray-900">
                      {form.model || '선택하세요'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
                </button>

                <div className="mx-5 border-b border-hyundai-gray-100" />

                {/* 세부 모델 */}
                <div className="px-5 py-4">
                  <p className="text-xs text-hyundai-gray-400 mb-1.5">세부 모델 (선택)</p>
                  <Input
                    placeholder="예: NX4, 2.0 터보"
                    value={form.variant}
                    onChange={(e) => setForm({ ...form, variant: e.target.value })}
                    className="text-sm"
                    fullWidth
                  />
                </div>

                <div className="mx-5 border-b border-hyundai-gray-100" />

                {/* 연식 · 주행거리 */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-hyundai-gray-400 mb-1.5">연식</p>
                      <Input
                        type="number"
                        placeholder={`${new Date().getFullYear()}`}
                        value={form.year || ''}
                        onChange={(e) =>
                          setForm({ ...form, year: parseInt(e.target.value, 10) || new Date().getFullYear() })
                        }
                        className="text-sm"
                        fullWidth
                      />
                    </div>
                    <div>
                      <p className="text-xs text-hyundai-gray-400 mb-1.5">주행거리 (km)</p>
                      <Input
                        type="number"
                        placeholder="예: 45000"
                        value={form.mileage || ''}
                        onChange={(e) =>
                          setForm({ ...form, mileage: parseInt(e.target.value, 10) || 0 })
                        }
                        className="text-sm"
                        fullWidth
                      />
                    </div>
                  </div>
                </div>

                <div className="mx-5 border-b border-hyundai-gray-100" />

                {/* 연료 */}
                <button
                  type="button"
                  onClick={() => openSheet('fuelType')}
                  className="w-full flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs text-hyundai-gray-400 mb-0.5">연료</p>
                    <p className="text-sm font-medium text-hyundai-gray-900">{form.fuelType}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
                </button>
              </Card>
            </div>

          </div>
        </Container>

        {/* 하단 고정 바 */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-hyundai-gray-100">
          <div className="max-w-lg mx-auto px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  저장 중...
                </>
              ) : initialVehicle ? (
                '수정 완료'
              ) : (
                '차량 등록'
              )}
            </button>
          </div>
        </div>
      </main>

      {/* 선택 바텀시트 */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        title={
          sheetMode === 'manufacturer' ? '제조사'
            : sheetMode === 'model' ? '차종'
            : sheetMode === 'fuelType' ? '연료'
            : undefined
        }
      >
        {sheetMode === 'manufacturer' && (
          <div className="max-h-72 overflow-y-auto -mx-1">
            {manufacturers.map((mfg) => (
              <button
                key={mfg}
                type="button"
                onClick={() => {
                  setForm({ ...form, manufacturer: mfg, model: '' });
                  closeSheet();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:bg-hyundai-gray-50 transition-colors"
              >
                <span className="text-sm text-hyundai-gray-900">{mfg}</span>
                {form.manufacturer === mfg && (
                  <Check className="w-4 h-4 text-hyundai-gray-900" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        )}

        {sheetMode === 'model' && (
          <div className="max-h-72 overflow-y-auto -mx-1">
            {availableModels.length === 0 ? (
              <p className="text-xs text-hyundai-gray-400 py-6 text-center">제조사를 먼저 선택해주세요</p>
            ) : (
              availableModels.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, model });
                    closeSheet();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:bg-hyundai-gray-50 transition-colors"
                >
                  <span className="text-sm text-hyundai-gray-900">{model}</span>
                  {form.model === model && (
                    <Check className="w-4 h-4 text-hyundai-gray-900" strokeWidth={2} />
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {sheetMode === 'fuelType' && (
          <div className="max-h-72 overflow-y-auto -mx-1">
            {FUEL_TYPES.map((fuel) => (
              <button
                key={fuel}
                type="button"
                onClick={() => {
                  setForm({ ...form, fuelType: fuel });
                  closeSheet();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:bg-hyundai-gray-50 transition-colors"
              >
                <span className="text-sm text-hyundai-gray-900">{fuel}</span>
                {form.fuelType === fuel && (
                  <Check className="w-4 h-4 text-hyundai-gray-900" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
