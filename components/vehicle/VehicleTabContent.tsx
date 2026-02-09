'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, ChevronRight, MapPin, Plus, ChevronDown, Pencil, Loader2 } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card, Badge, Input } from '@/components/ui';
import { updateVehicleMileageAction } from '@/lib/supabase/actions';
import { formatPrice } from '@/lib/utils';
import type { VerificationHistory } from '@/types';

type HistorySortBy = 'latest' | 'cost';

export type VehicleRow = {
  id: string;
  manufacturer: string;
  model: string;
  variant?: string | null;
  year: number;
  mileage: number;
  fuel_type: string;
  registration_number?: string | null;
  nickname?: string | null;
};

const statusConfig = {
  appropriate: {
    label: '적정',
    variant: 'success' as const,
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '확인필요',
    variant: 'warning' as const,
    Icon: AlertCircle,
  },
};

export function VehicleTabContent({
  vehicles,
  selectedVehicle,
  history,
}: {
  vehicles: VehicleRow[];
  selectedVehicle: VehicleRow | null;
  history: VerificationHistory[];
}) {
  const router = useRouter();
  const [mileageInput, setMileageInput] = useState(selectedVehicle ? String(selectedVehicle.mileage || '') : '');
  const [editingMileage, setEditingMileage] = useState(false);
  const [savingMileage, setSavingMileage] = useState(false);
  const [sortBy, setSortBy] = useState<HistorySortBy>('latest');

  useEffect(() => {
    setMileageInput(selectedVehicle ? String(selectedVehicle.mileage || '') : '');
    setEditingMileage(false);
  }, [selectedVehicle?.id, selectedVehicle?.mileage]);

  const sortedHistory = useMemo(() => {
    const list = [...history];
    if (sortBy === 'latest') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      list.sort((a, b) => b.totalAmount - a.totalAmount);
    }
    return list;
  }, [history, sortBy]);

  const totalSpent = history.reduce((sum, h) => sum + h.totalAmount, 0);

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) router.push(`/vehicle?vehicleId=${id}`);
  };

  const handleSaveMileage = async () => {
    if (!selectedVehicle) return;
    const value = parseInt(mileageInput.replace(/\D/g, ''), 10);
    if (Number.isNaN(value) || value < 0) {
      alert('올바른 주행거리를 입력해 주세요.');
      return;
    }
    setSavingMileage(true);
    try {
      const res = await updateVehicleMileageAction(selectedVehicle.id, value);
      if (res.success) {
        setEditingMileage(false);
        router.refresh();
      } else {
        alert(res.error ?? '주행거리 저장에 실패했어요.');
      }
    } finally {
      setSavingMileage(false);
    }
  };

  // 선택한 차량 표시 라벨 (드롭다운 옵션용)
  const vehicleOptionLabel = (v: VehicleRow) => {
    if (v.registration_number) return v.nickname ? `${v.registration_number} (${v.nickname})` : v.registration_number;
    return v.nickname || `${v.manufacturer} ${v.model}${v.variant ? ` ${v.variant}` : ''}`;
  };

  if (vehicles.length === 0) {
    return (
      <main className="min-h-[calc(100vh-52px)] bg-hyundai-gray-50">
        <Container>
          <div className="pt-8 pb-6 px-1">
            <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight">차량을 등록해주세요</h2>
            <p className="text-sm text-hyundai-gray-400 mt-1.5">차량번호·소유주로 검증 후 맞춤 가격을 확인해요</p>
          </div>
          <div className="px-1">
            <Link href="/vehicle/edit">
              <Card variant="default" padding="none">
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-hyundai-gray-100 flex items-center justify-center mb-4">
                    <Plus className="w-6 h-6 text-hyundai-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-hyundai-gray-900">차량 추가하기</p>
                  <p className="text-xs text-hyundai-gray-400 mt-0.5">차량번호·소유주 검증 후 등록해요</p>
                </div>
              </Card>
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  const modelLabel = selectedVehicle
    ? `${selectedVehicle.manufacturer} ${selectedVehicle.model}${selectedVehicle.variant ? ` ${selectedVehicle.variant}` : ''}`
    : '';

  return (
    <main className="min-h-[calc(100vh-52px)] bg-hyundai-gray-50">
      <Container>
        <div className="pb-8">
          {/* 상단: 차량 선택 드롭다운 */}
          <div className="pt-6 pb-4 px-1">
            <div className="flex items-center justify-between gap-3">
              <div className="relative w-auto min-w-[120px] max-w-[60vw]">
                <label htmlFor="vehicle-select" className="sr-only">차량 선택</label>
                <select
                  id="vehicle-select"
                  value={selectedVehicle?.id ?? ''}
                  onChange={handleVehicleChange}
                  className="w-full appearance-none rounded-lg bg-white py-2 pl-3 pr-7 text-sm font-medium text-hyundai-gray-900 focus:outline-none cursor-pointer border border-hyundai-gray-200 transition-colors"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {vehicleOptionLabel(v)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-hyundai-gray-400 pointer-events-none" strokeWidth={2} />
              </div>
              <Link
                href="/vehicle/edit"
                className="text-xs text-hyundai-gray-400 font-medium shrink-0 flex items-center gap-0.5"
              >
                차량 추가
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 차량 정보 카드 */}
          {selectedVehicle && (
            <Card variant="default" padding="none">
              <div className="px-5 py-5">
                <p className="text-lg font-bold text-hyundai-gray-900">
                  {modelLabel}
                </p>
                <p className="text-xs text-hyundai-gray-400 mt-0.5">
                  {selectedVehicle.year}년식 · {selectedVehicle.fuel_type}
                </p>

                {/* 주행거리 */}
                <div className="mt-3 flex items-center gap-2">
                  {editingMileage ? (
                    <>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="주행거리"
                        value={mileageInput}
                        onChange={(e) => setMileageInput(e.target.value.replace(/\D/g, ''))}
                        className="w-28 text-sm"
                      />
                      <span className="text-sm text-hyundai-gray-500">km</span>
                      <button
                        type="button"
                        onClick={handleSaveMileage}
                        disabled={savingMileage}
                        className="text-xs font-medium text-hyundai-gray-900 underline disabled:opacity-50 flex items-center gap-1"
                      >
                        {savingMileage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '저장'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMileageInput(String(selectedVehicle.mileage || ''));
                          setEditingMileage(false);
                        }}
                        className="text-xs text-hyundai-gray-400"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-hyundai-gray-600">
                        {(selectedVehicle.mileage ?? 0).toLocaleString('ko-KR')}km
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingMileage(true)}
                        className="p-1 rounded-md text-hyundai-gray-400 active:bg-hyundai-gray-100 transition-colors"
                        aria-label="주행거리 수정"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 정비이력 */}
          <div className="mt-6">
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-hyundai-gray-900">정비이력</h3>
                {history.length > 0 && (
                  <span className="text-xs text-hyundai-gray-400">
                    {history.length}건 · 누적 {formatCompact(totalSpent)}
                  </span>
                )}
              </div>
              {history.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSortBy('latest')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      sortBy === 'latest'
                        ? 'bg-hyundai-gray-900 text-white'
                        : 'bg-white text-hyundai-gray-500 border border-hyundai-gray-200 active:bg-hyundai-gray-50'
                    }`}
                  >
                    최신순
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('cost')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      sortBy === 'cost'
                        ? 'bg-hyundai-gray-900 text-white'
                        : 'bg-white text-hyundai-gray-500 border border-hyundai-gray-200 active:bg-hyundai-gray-50'
                    }`}
                  >
                    비용순
                  </button>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <Card variant="default" padding="md">
                <p className="text-sm text-hyundai-gray-400 text-center">이 차량의 정비 이력이 없어요</p>
                <p className="text-xs text-hyundai-gray-300 mt-1 text-center">견적서를 검증하면 이력이 쌓여요</p>
              </Card>
            ) : (
              <Card variant="default" padding="none">
                {sortedHistory.map((item, index) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.Icon;
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <Link href={`/history/${item.id}`}>
                        <div className="px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-hyundai-gray-400">
                              {formatHistoryDate(item.date)}
                            </span>
                            <Badge variant={config.variant} size="sm" className="flex items-center gap-0.5">
                              <StatusIcon className="w-2.5 h-2.5" />
                              {config.label}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-hyundai-gray-900 flex-1 min-w-0 truncate">
                              {item.items}
                            </p>
                            <p className="text-sm font-bold text-hyundai-gray-900 shrink-0">
                              {formatPrice(item.totalAmount)}
                            </p>
                          </div>
                          {item.shopName && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                              <span className="text-xs text-hyundai-gray-400 truncate">{item.shopName}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </Card>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}

function formatCompact(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    return `${man}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
