'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Loader2 } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Card, Input, Button } from '@/components/ui';
import { manufacturers, hyundaiModels, kiaModels } from '@/lib/mockData';
import { saveVehicle } from '@/lib/supabase/actions';
import type { Vehicle } from '@/types';

const FUEL_TYPES = ['가솔린', '디젤', 'LPG', '하이브리드', '전기', '수소'] as const;

export interface VehicleEditFormProps {
  /** 기존 차량 정보 (없으면 신규 등록) */
  initialVehicle: Vehicle | null;
  /** 페이지 제목 (수정 vs 등록) */
  title: string;
}

export default function VehicleEditForm({ initialVehicle, title }: VehicleEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <form onSubmit={handleSubmit} className="py-6 space-y-6">
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-hyundai-gray-600" />
                <h2 className="text-h4 text-hyundai-gray-900">차량 정보</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-body-2 text-hyundai-gray-700 mb-2 block font-medium">
                    제조사
                  </label>
                  <select
                    value={form.manufacturer}
                    onChange={(e) =>
                      setForm({ ...form, manufacturer: e.target.value, model: '' })
                    }
                    className="w-full px-4 py-3 border border-hyundai-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hyundai-blue-500 bg-white"
                    required
                  >
                    <option value="">선택하세요</option>
                    {manufacturers.map((mfg) => (
                      <option key={mfg} value={mfg}>
                        {mfg}
                      </option>
                    ))}
                  </select>
                </div>

                {form.manufacturer && (
                  <div>
                    <label className="text-body-2 text-hyundai-gray-700 mb-2 block font-medium">
                      차종
                    </label>
                    <select
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="w-full px-4 py-3 border border-hyundai-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hyundai-blue-500 bg-white"
                      required
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

                <Input
                  label="세부 모델 (선택)"
                  value={form.variant}
                  onChange={(e) => setForm({ ...form, variant: e.target.value })}
                  placeholder="예: NX4, 2.0 터보"
                  fullWidth
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="연식"
                    type="number"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    value={form.year || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        year: parseInt(e.target.value, 10) || new Date().getFullYear(),
                      })
                    }
                    fullWidth
                  />
                  <Input
                    label="주행거리 (km)"
                    type="number"
                    min={0}
                    value={form.mileage || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mileage: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    fullWidth
                  />
                </div>

                <div>
                  <label className="text-body-2 text-hyundai-gray-700 mb-2 block font-medium">
                    연료
                  </label>
                  <select
                    value={form.fuelType}
                    onChange={(e) =>
                      setForm({ ...form, fuelType: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-hyundai-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hyundai-blue-500 bg-white"
                  >
                    {FUEL_TYPES.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  저장 중...
                </>
              ) : initialVehicle ? (
                '수정 완료'
              ) : (
                '차량 등록'
              )}
            </Button>
          </form>
        </Container>
      </main>
    </>
  );
}
