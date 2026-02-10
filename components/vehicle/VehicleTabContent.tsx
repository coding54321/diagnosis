'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, ChevronRight, ChevronDown, Pencil, Loader2, Trash2 } from 'lucide-react';
import { Container } from '@/components/layout';
import { Input } from '@/components/ui';
import {
  updateVehicleMileageAction,
  fetchVehicleByRegistrationNumber,
  verifyVehicleOwnerAction,
  saveVehicle,
  deleteVehicleAction,
} from '@/lib/supabase/actions';
import { formatPrice } from '@/lib/utils';
import type { VerificationHistory } from '@/types';

type HistorySortBy = 'latest' | 'cost';
type RegStep = 'input' | 'checking' | 'owner' | 'confirmed';

type VehicleInfoFromLookup = {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
};

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

  // --- 기존 차량 관련 state ---
  const [mileageInput, setMileageInput] = useState(selectedVehicle ? String(selectedVehicle.mileage || '') : '');
  const [editingMileage, setEditingMileage] = useState(false);
  const [savingMileage, setSavingMileage] = useState(false);
  const [sortBy, setSortBy] = useState<HistorySortBy>('latest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 인라인 등록 폼 state ---
  const [regStep, setRegStep] = useState<RegStep>('input');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoFromLookup | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [nickname, setNickname] = useState('');
  const [regMileage, setRegMileage] = useState(0);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [ownerVerifying, setOwnerVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    setIsDeleting(true);
    try {
      const res = await deleteVehicleAction(selectedVehicle.id);
      if (res.success) {
        setShowDeleteConfirm(false);
        router.push('/vehicle');
        router.refresh();
      } else {
        alert(res.error ?? '삭제에 실패했어요.');
      }
    } finally {
      setIsDeleting(false);
    }
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

  // --- 인라인 등록 핸들러 ---
  const handleCheckVehicle = async () => {
    const num = vehicleNumber.replace(/\s|-/g, '').trim();
    if (!num) { setCheckError('차량번호를 입력해 주세요.'); return; }
    setCheckError(null);
    setRegStep('checking');
    try {
      const res = await fetchVehicleByRegistrationNumber(num);
      if (res.success && res.data) {
        setVehicleInfo(res.data);
        setRegMileage(res.data.mileage > 0 ? res.data.mileage : 0);
        setRegStep('owner');
      } else {
        setCheckError(res.error ?? '등록된 차량을 찾을 수 없어요. 차량번호를 다시 확인해 주세요.');
        setRegStep('input');
      }
    } catch {
      setCheckError('조회 중 오류가 발생했어요. 다시 시도해 주세요.');
      setRegStep('input');
    }
  };

  const handleConfirmOwner = async () => {
    if (!ownerName.trim()) { setCheckError('소유주 이름을 입력해 주세요.'); return; }
    setCheckError(null);
    setOwnerVerifying(true);
    try {
      const res = await verifyVehicleOwnerAction(
        vehicleNumber.replace(/\s|-/g, '').trim(),
        ownerName.trim()
      );
      if (res.success) {
        setRegStep('confirmed');
      } else {
        setCheckError(res.error ?? '소유주 정보가 일치하지 않아요.');
      }
    } finally {
      setOwnerVerifying(false);
    }
  };

  const handleRegSave = async () => {
    if (!vehicleInfo) return;
    const finalMileage = regMileage > 0 ? regMileage : vehicleInfo.mileage;
    if (finalMileage <= 0) { alert('주행거리를 입력해 주세요.'); return; }
    setIsSubmitting(true);
    try {
      const result = await saveVehicle(
        {
          manufacturer: vehicleInfo.manufacturer,
          model: vehicleInfo.model,
          variant: vehicleInfo.variant ?? undefined,
          year: vehicleInfo.year,
          mileage: finalMileage,
          fuelType: vehicleInfo.fuelType,
        },
        {
          registrationNumber: vehicleNumber.replace(/\s|-/g, '').trim() || undefined,
          nickname: nickname.trim() || undefined,
        }
      );
      if (result.success) {
        router.push('/vehicle');
        router.refresh();
      } else {
        alert(result.error || '저장에 실패했습니다.');
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vehicleOptionLabel = (v: VehicleRow) => {
    if (v.registration_number) return v.nickname ? `${v.registration_number} (${v.nickname})` : v.registration_number;
    return v.nickname || `${v.manufacturer} ${v.model}${v.variant ? ` ${v.variant}` : ''}`;
  };

  // ============================
  // 차량 미등록 → 인라인 등록 폼
  // ============================
  if (vehicles.length === 0) {
    return (
      <main className="min-h-[calc(100vh-52px)] bg-white">
        <Container>
          <div className="pt-8 pb-6 px-1">
            <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight">차량을 등록해주세요</h2>
            <p className="text-sm text-hyundai-gray-400 mt-1.5">차량번호와 소유주 확인으로 등록할 수 있어요</p>
          </div>

          <div className="px-1 space-y-4">
            {/* Step 1: 차량번호 입력 */}
            {regStep === 'input' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">차량등록번호(번호판)</span>
                  <Input
                    placeholder="예: 12가3456"
                    value={vehicleNumber}
                    onChange={(e) => { setVehicleNumber(e.target.value.trim()); setCheckError(null); }}
                    className="text-base"
                    fullWidth
                  />
                </label>
                {checkError && (
                  <p className="text-xs text-semantic-error-main flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {checkError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCheckVehicle}
                  disabled={!vehicleNumber.trim()}
                  className="w-full py-3.5 rounded-2xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                  차량 조회
                </button>
              </div>
            )}

            {/* Step 1.5: 조회 중 */}
            {regStep === 'checking' && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-hyundai-gray-300 mb-3" />
                <p className="text-sm text-hyundai-gray-400">차량 정보를 조회하고 있어요...</p>
              </div>
            )}

            {/* Step 2: 소유주 확인 */}
            {regStep === 'owner' && vehicleInfo && (
              <div className="space-y-4">
                <div className="p-4 bg-semantic-success-light rounded-2xl">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-semantic-success-main flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-hyundai-gray-900">
                        {vehicleInfo.manufacturer} {vehicleInfo.model}
                        {vehicleInfo.variant ? ` ${vehicleInfo.variant}` : ''}
                      </p>
                      <p className="text-xs text-hyundai-gray-500 mt-0.5">
                        {vehicleNumber} · {vehicleInfo.year}년식 · {vehicleInfo.fuelType}
                      </p>
                    </div>
                  </div>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">소유주 이름</span>
                  <Input
                    placeholder="차량등록증에 기재된 이름"
                    value={ownerName}
                    onChange={(e) => { setOwnerName(e.target.value); setCheckError(null); }}
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">차량등록증에 기재된 소유주명을 입력해 주세요</p>
                </label>
                {checkError && (
                  <p className="text-xs text-semantic-error-main flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {checkError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleConfirmOwner}
                  disabled={!ownerName.trim() || ownerVerifying}
                  className="w-full py-3.5 rounded-2xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {ownerVerifying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />확인 중...</>
                  ) : '소유주 확인'}
                </button>
              </div>
            )}

            {/* Step 3: 확정 — 주행거리·별칭 입력 + 저장 */}
            {regStep === 'confirmed' && vehicleInfo && (
              <div className="space-y-4">
                <div className="p-4 bg-semantic-success-light rounded-2xl">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-semantic-success-main flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-hyundai-gray-900">
                        {vehicleInfo.manufacturer} {vehicleInfo.model}
                        {vehicleInfo.variant ? ` ${vehicleInfo.variant}` : ''}
                      </p>
                      <p className="text-xs text-hyundai-gray-500 mt-0.5">
                        {vehicleNumber} · {vehicleInfo.year}년식 · {vehicleInfo.fuelType}
                      </p>
                      {ownerName && <p className="text-xs text-semantic-success-dark mt-1">소유주: {ownerName}</p>}
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">별칭 (선택)</span>
                  <Input
                    placeholder="예: 우리 엄마 차"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">목록에서 구분하기 쉬운 이름을 붙여보세요</p>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">주행거리 (km)</span>
                  <Input
                    type="number"
                    placeholder="예: 45000"
                    value={regMileage || ''}
                    onChange={(e) => setRegMileage(parseInt(e.target.value, 10) || 0)}
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">현재 주행거리를 입력해 주세요</p>
                </label>

                <button
                  type="button"
                  onClick={handleRegSave}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-hyundai-gray-900 text-white text-sm font-medium active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />저장 중...</>
                  ) : '차량 등록'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegStep('input');
                    setVehicleInfo(null);
                    setOwnerName('');
                    setCheckError(null);
                  }}
                  className="text-sm text-hyundai-gray-400 underline"
                >
                  다른 차량으로 변경
                </button>
              </div>
            )}
          </div>
        </Container>
      </main>
    );
  }

  // ============================
  // 차량 등록됨 — 기존 뷰
  // ============================
  const modelLabel = selectedVehicle
    ? `${selectedVehicle.manufacturer} ${selectedVehicle.model}${selectedVehicle.variant ? ` ${selectedVehicle.variant}` : ''}`
    : '';

  return (
    <>
      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full">
            <p className="text-base font-bold text-hyundai-gray-900 mb-2">차량을 삭제할까요?</p>
            <p className="text-sm text-hyundai-gray-500 mb-5">
              {modelLabel}의 정보가 삭제됩니다.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-hyundai-gray-200 text-sm font-medium text-hyundai-gray-700 active:bg-hyundai-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteVehicle}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-medium active:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-[calc(100vh-52px)] bg-white">
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
            <div className="rounded-2xl bg-hyundai-gray-50 mx-1">
              <div className="px-5 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-hyundai-gray-900">
                      {modelLabel}
                    </p>
                    <p className="text-xs text-hyundai-gray-400 mt-0.5">
                      {selectedVehicle.year}년식 · {selectedVehicle.fuel_type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1.5 rounded-lg text-hyundai-gray-300 active:bg-hyundai-gray-100 transition-colors"
                    aria-label="차량 삭제"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>

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
            </div>
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
                        : 'bg-white text-hyundai-gray-500 border border-hyundai-gray-200 active:bg-white'
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
                        : 'bg-white text-hyundai-gray-500 border border-hyundai-gray-200 active:bg-white'
                    }`}
                  >
                    비용순
                  </button>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="rounded-2xl bg-hyundai-gray-50 p-5">
                <p className="text-sm text-hyundai-gray-400 text-center">이 차량의 정비 이력이 없어요</p>
                <p className="text-xs text-hyundai-gray-300 mt-1 text-center">견적서를 검증하면 이력이 쌓여요</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-hyundai-gray-50 overflow-hidden">
                {sortedHistory.map((item, index) => {
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="mx-5 border-b border-hyundai-gray-100" />}
                      <Link href={`/history/${item.id}`}>
                        <div className="px-5 py-3.5 active:bg-hyundai-gray-100 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-hyundai-gray-400">
                              {formatHistoryDate(item.date)}
                            </span>
                            {item.shopName && (
                              <>
                                <span className="text-xs text-hyundai-gray-300">•</span>
                                <span className="text-xs text-hyundai-gray-400 truncate">
                                  {item.shopName}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-hyundai-gray-900 flex-1 min-w-0 truncate">
                              {item.items}
                            </p>
                            <p className="text-sm font-bold text-hyundai-gray-900 shrink-0">
                              {formatPrice(item.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
    </>
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
