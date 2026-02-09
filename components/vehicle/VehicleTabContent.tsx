'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, ChevronRight, MapPin, Plus, ChevronDown, Car, Pencil, Loader2 } from 'lucide-react';
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
        <div className="bg-white pb-1">
          <Container>
            <div className="pt-6 pb-5 px-1">
              <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight">차량을 등록해주세요</h2>
              <p className="text-sm text-hyundai-gray-400 mt-1">차량번호·소유주로 검증 후 맞춤 가격을 확인해요</p>
            </div>
          </Container>
        </div>
        <Container>
          <div className="py-4">
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
    ? `${selectedVehicle.manufacturer} ${selectedVehicle.model}${selectedVehicle.variant ? ` ${selectedVehicle.variant}` : ''}(${selectedVehicle.year})`
    : '';

  return (
    <main className="min-h-[calc(100vh-52px)] bg-white">
      {/* 상단: 흰 배경 + 차량 선택 드롭다운 */}
      <div className="bg-white">
        <Container>
          <div className="pt-6 pb-4 px-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="vehicle-select" className="sr-only">
                  차량 선택
                </label>
                <div className="relative w-auto min-w-[120px] max-w-[60vw]">
                  <select
                    id="vehicle-select"
                    value={selectedVehicle?.id ?? ''}
                    onChange={handleVehicleChange}
                    className="w-full appearance-none rounded-lg bg-hyundai-gray-50/60 py-2 pl-3 pr-7 text-sm font-medium text-hyundai-gray-900 focus:outline-none cursor-pointer border border-hyundai-gray-100 hover:border-hyundai-gray-200 hover:bg-hyundai-gray-50 focus:border-hyundai-gray-300 transition-colors"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {vehicleOptionLabel(v)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-hyundai-gray-400 pointer-events-none" strokeWidth={2} />
                </div>
              </div>
              <Link
                href="/vehicle/edit"
                className="text-xs text-hyundai-gray-400 font-medium shrink-0 flex items-center gap-0.5 hover:text-hyundai-gray-600 transition-colors"
              >
                차량 추가
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* 선택한 차량 이미지 + 차종·주행거리 (흰 배경) */}
      {selectedVehicle && (
        <div className="bg-white pb-6">
          <Container>
            <div className="px-1 text-center">
              {/* 차량 이미지 플레이스홀더 */}
              <div className="rounded-2xl bg-gradient-to-b from-hyundai-gray-100 to-hyundai-gray-50 aspect-[16/10] max-h-44 flex items-center justify-center overflow-hidden mx-auto">
                <Car className="w-16 h-16 text-hyundai-gray-300" strokeWidth={1} />
              </div>
              {/* 차종 · 연식 */}
              <p className="text-lg font-bold text-hyundai-gray-900 mt-4">
                {modelLabel}
              </p>
              {/* 주행거리 (수정 가능) */}
              <div className="mt-2 flex items-center justify-center gap-2">
                {editingMileage ? (
                  <>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="주행거리"
                      value={mileageInput}
                      onChange={(e) => setMileageInput(e.target.value.replace(/\D/g, ''))}
                      className="w-28 text-base"
                    />
                    <span className="text-base text-hyundai-gray-500">km</span>
                    <button
                      type="button"
                      onClick={handleSaveMileage}
                      disabled={savingMileage}
                      className="text-sm font-medium text-hyundai-gray-900 underline disabled:opacity-50 flex items-center gap-1"
                    >
                      {savingMileage ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMileageInput(String(selectedVehicle.mileage || ''));
                        setEditingMileage(false);
                      }}
                      className="text-sm text-hyundai-gray-500"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-base text-hyundai-gray-700">
                      {(selectedVehicle.mileage ?? 0).toLocaleString('ko-KR')}km
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingMileage(true)}
                      className="p-1 rounded-lg text-hyundai-gray-400 hover:bg-hyundai-gray-100 hover:text-hyundai-gray-600 transition-colors"
                      aria-label="주행거리 수정"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* 정비이력 (회색 영역) */}
      <div className="bg-hyundai-gray-50 rounded-t-2xl pt-5 pb-8 min-h-[40vh]">
        <Container>
          <div className="px-1">
            <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-hyundai-gray-900">정비이력</h3>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSortBy('latest')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        sortBy === 'cost'
                          ? 'bg-hyundai-gray-900 text-white'
                          : 'bg-white text-hyundai-gray-500 border border-hyundai-gray-200 active:bg-hyundai-gray-50'
                      }`}
                    >
                      비용순
                    </button>
                  </>
                )}
                {history.length > 0 && (
                  <span className="text-xs text-hyundai-gray-500 ml-1">
                    {history.length}건 · 누적 {formatCompact(totalSpent)}
                  </span>
                )}
              </div>
            </div>

            {history.length === 0 ? (
              <div className="rounded-2xl bg-white px-5 py-10 text-center">
                <p className="text-sm text-hyundai-gray-500">이 차량의 정비 이력이 없어요</p>
                <p className="text-xs text-hyundai-gray-400 mt-1">견적서를 검증하면 이력이 쌓여요</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white overflow-hidden">
                {sortedHistory.map((item, index) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.Icon;
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <Link href={`/history/${item.id}`}>
                        <div className="px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs text-hyundai-gray-400">
                                  {formatHistoryDate(item.date)}
                                </span>
                                <Badge variant={config.variant} size="sm" className="flex items-center gap-0.5">
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className="text-sm font-medium text-hyundai-gray-900 flex-1 min-w-0 truncate">
                                  {item.items}
                                </p>
                                <p className="text-sm font-bold text-hyundai-gray-900 shrink-0">
                                  {formatPrice(item.totalAmount)}
                                </p>
                              </div>
                              {item.shopName && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                                  <span className="text-xs text-hyundai-gray-400 truncate">{item.shopName}</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0 ml-2" strokeWidth={1.5} />
                          </div>
                        </div>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </Container>
      </div>
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
