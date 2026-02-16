'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, ChevronRight, ChevronDown, Pencil, Loader2, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui';
import VehicleAddSheet from './VehicleAddSheet';
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
  const [showAddSheet, setShowAddSheet] = useState(false);

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

  useEffect(() => {
    if (vehicles.length === 0) {
      // 마지막 차량 삭제 후에도 이전 등록 단계(state)가 남지 않도록 초기화
      setRegStep('input');
      setVehicleNumber('');
      setVehicleInfo(null);
      setOwnerName('');
      setNickname('');
      setRegMileage(0);
      setCheckError(null);
      setOwnerVerifying(false);
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  }, [vehicles.length]);

  const sortedHistory = useMemo(() => {
    const list = [...history];
    if (sortBy === 'latest') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      list.sort((a, b) => b.totalAmount - a.totalAmount);
    }
    return list;
  }, [history, sortBy]);

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
    if (v.registration_number) return v.nickname ? `${v.nickname} (${v.registration_number})` : v.registration_number;
    return v.nickname || `${v.manufacturer} ${v.model}${v.variant ? ` ${v.variant}` : ''}`;
  };

  // ============================
  // 차량 미등록 → 인라인 등록 폼 (토스 스타일)
  // ============================
  if (vehicles.length === 0) {
    return (
      <main className="flex-1 min-h-screen bg-white">
        <div className="max-w-lg mx-auto w-full px-5 pt-7 pb-10">
          <div className="mb-4">
            <p className="text-xs font-semibold text-hyundai-gray-400">마이페이지</p>
            <h2 className="mt-2 text-[24px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
              내 차 등록하기
            </h2>
            <p className="text-sm text-hyundai-gray-500 mt-1.5">
              번호 조회와 소유주 확인 후 등록할 수 있어요.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1: 차량번호 입력 */}
            {regStep === 'input' && (
              <div className="rounded-2xl bg-white border border-hyundai-gray-100 p-4 space-y-3.5">
                <label className="block">
                  <span className="text-sm font-semibold text-hyundai-gray-800 mb-2 block">차량번호(번호판)</span>
                  <Input
                    placeholder="예: 12가3456"
                    value={vehicleNumber}
                    onChange={(e) => { setVehicleNumber(e.target.value.trim()); setCheckError(null); }}
                    className="text-base h-12 rounded-xl"
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
                  className="w-full h-12 rounded-xl bg-hyundai-gray-900 text-white text-sm font-semibold active:bg-hyundai-gray-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                  차량 조회
                </button>
              </div>
            )}

            {/* Step 1.5: 조회 중 */}
            {regStep === 'checking' && (
              <div className="rounded-2xl bg-white border border-hyundai-gray-100 p-8 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-hyundai-gray-300 mb-3" />
                <p className="text-sm text-hyundai-gray-500">차량 정보를 조회하고 있어요...</p>
              </div>
            )}

            {/* Step 2: 소유주 확인 */}
            {regStep === 'owner' && vehicleInfo && (
              <div className="rounded-2xl bg-white border border-hyundai-gray-100 p-4 space-y-4">
                <div className="p-4 bg-hyundai-gray-50 rounded-xl">
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
                  <span className="text-sm font-semibold text-hyundai-gray-800 mb-2 block">소유주 이름</span>
                  <Input
                    placeholder="차량등록증에 기재된 이름"
                    value={ownerName}
                    onChange={(e) => { setOwnerName(e.target.value); setCheckError(null); }}
                    className="text-base h-12 rounded-xl"
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
                  className="w-full h-12 rounded-xl bg-hyundai-gray-900 text-white text-sm font-semibold active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {ownerVerifying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />확인 중...</>
                  ) : '소유주 확인'}
                </button>
              </div>
            )}

            {/* Step 3: 확정 — 주행거리·별칭 입력 + 저장 */}
            {regStep === 'confirmed' && vehicleInfo && (
              <div className="rounded-2xl bg-white border border-hyundai-gray-100 p-4 space-y-4">
                <div className="p-4 bg-hyundai-gray-50 rounded-xl">
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
                  <span className="text-sm font-semibold text-hyundai-gray-800 mb-2 block">별칭 (선택)</span>
                  <Input
                    placeholder="예: 우리 엄마 차"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="text-base h-12 rounded-xl"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">목록에서 구분하기 쉬운 이름을 붙여보세요</p>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-hyundai-gray-800 mb-2 block">주행거리 (km)</span>
                  <Input
                    type="number"
                    placeholder="예: 45000"
                    value={regMileage || ''}
                    onChange={(e) => setRegMileage(parseInt(e.target.value, 10) || 0)}
                    className="text-base h-12 rounded-xl"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">현재 주행거리를 입력해 주세요</p>
                </label>

                <button
                  type="button"
                  onClick={handleRegSave}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-hyundai-gray-900 text-white text-sm font-semibold active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
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
        </div>
      </main>
    );
  }

  // ============================
  // 차량 등록됨 — 토스 스타일 뷰
  // ============================
  const modelLabel = selectedVehicle
    ? `${selectedVehicle.manufacturer} ${selectedVehicle.model}${selectedVehicle.variant ? ` ${selectedVehicle.variant}` : ''}`
    : '';
  const deleteModalLabel = selectedVehicle
    ? selectedVehicle.registration_number
      ? (selectedVehicle.nickname
        ? `${selectedVehicle.nickname} (${selectedVehicle.registration_number})`
        : selectedVehicle.registration_number)
      : modelLabel
    : '';

  return (
    <>
      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full">
            <p className="text-base font-bold text-hyundai-gray-900 mb-2">차량을 삭제할까요?</p>
            <p className="text-sm text-hyundai-gray-500 mb-5">
              {deleteModalLabel}의 정보와 해당 차량의 견적 검증 기록이 함께 삭제됩니다.
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

      <main className="flex-1 min-h-screen bg-hyundai-gray-50 flex flex-col">
        <div className="flex-1 min-h-0 bg-white max-w-lg mx-auto w-full">
          <div className="px-5 pt-6 pb-5 animate-fade-in-up">
            <p className="text-xs font-semibold text-hyundai-gray-400 mb-4">마이페이지</p>
            {/* 상단: 차량 선택 + 차량 추가 */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative min-w-0 flex-1 max-w-[70%]">
                <label htmlFor="vehicle-select" className="sr-only">차량 선택</label>
                <select
                  id="vehicle-select"
                  value={selectedVehicle?.id ?? ''}
                  onChange={handleVehicleChange}
                  className="w-full appearance-none rounded-xl bg-hyundai-gray-50 py-3 pl-4 pr-9 text-[15px] font-bold text-hyundai-gray-900 focus:outline-none cursor-pointer border-0 transition-colors"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {vehicleOptionLabel(v)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-hyundai-gray-400 pointer-events-none" strokeWidth={2} />
              </div>
              <button
                type="button"
                onClick={() => setShowAddSheet(true)}
                className="shrink-0 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-hyundai-gray-700 bg-hyundai-gray-100 active:bg-hyundai-gray-200 transition-colors touch-manipulation flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                차량 추가
              </button>
            </div>

            {/* 차량 프로필 카드 */}
            {selectedVehicle && (
              <div className="rounded-2xl overflow-hidden">
                {/* 상단: 다크 영역 — 차명 + 정보 칩 */}
                <div className="bg-hyundai-blue-500 px-5 pt-5 pb-4">
                  <p className="text-lg font-bold text-white leading-tight">
                    {modelLabel}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className="text-xs text-white bg-white/10 px-2.5 py-1 rounded-full">
                      {selectedVehicle.year}년식
                    </span>
                    <span className="text-xs text-white bg-white/10 px-2.5 py-1 rounded-full">
                      {selectedVehicle.fuel_type}
                    </span>
                  </div>
                </div>
                {/* 하단: 라이트 영역 — 주행거리 + 삭제 */}
                <div className="bg-hyundai-gray-50 px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                      {editingMileage ? (
                        <>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="주행거리"
                            value={mileageInput}
                            onChange={(e) => setMileageInput(e.target.value.replace(/\D/g, ''))}
                            className="w-24 text-sm h-9 rounded-lg"
                          />
                          <span className="text-sm text-hyundai-gray-500">km</span>
                          <button
                            type="button"
                            onClick={handleSaveMileage}
                            disabled={savingMileage}
                            className="text-sm font-semibold text-hyundai-primary disabled:opacity-50 flex items-center gap-1"
                          >
                            {savingMileage ? <Loader2 className="w-4 h-4 animate-spin" /> : '저장'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMileageInput(String(selectedVehicle.mileage || ''));
                              setEditingMileage(false);
                            }}
                            className="text-sm text-hyundai-gray-400"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-hyundai-gray-600 tabular-nums">
                            {(selectedVehicle.mileage ?? 0).toLocaleString('ko-KR')}km
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingMileage(true)}
                            className="p-2 -m-2 rounded-lg text-hyundai-gray-400 active:bg-hyundai-gray-100 transition-colors touch-manipulation"
                            aria-label="주행거리 수정"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 rounded-lg text-hyundai-gray-400 active:bg-hyundai-gray-200 transition-colors touch-manipulation shrink-0"
                      aria-label="차량 삭제"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 검증이력 */}
          <div className="px-5 pt-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-hyundai-gray-900 leading-tight">검증이력</h3>
              {history.length > 0 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSortBy('latest')}
                    className={`shrink-0 min-h-[32px] px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
                      sortBy === 'latest'
                        ? 'bg-hyundai-blue-500 text-white'
                        : 'bg-hyundai-gray-100 text-hyundai-gray-500 active:bg-hyundai-gray-200'
                    }`}
                  >
                    최신순
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('cost')}
                    className={`shrink-0 min-h-[32px] px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
                      sortBy === 'cost'
                        ? 'bg-hyundai-blue-500 text-white'
                        : 'bg-hyundai-gray-100 text-hyundai-gray-500 active:bg-hyundai-gray-200'
                    }`}
                  >
                    비용순
                  </button>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-hyundai-gray-50">
                <p className="text-sm font-medium text-hyundai-gray-500">이 차량의 검증 이력이 없어요</p>
                <p className="text-xs text-hyundai-gray-400 mt-1">견적서를 검증하면 이력이 쌓여요</p>
                <Link
                  href="/verify/camera"
                  className="mt-5 inline-flex items-center justify-center gap-1 px-5 py-2.5 rounded-full bg-hyundai-blue-500 text-white text-sm font-medium active:bg-hyundai-blue-600 transition-colors"
                >
                  검증하러 가기
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHistory.map((item) => (
                  <Link key={item.id} href={`/history/${item.id}`} className="block">
                    <div className="rounded-2xl bg-hyundai-gray-50 p-4 active:bg-hyundai-gray-100 transition-colors">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-hyundai-gray-400">
                            {formatHistoryDate(item.date)}
                          </span>
                          {item.shopName && (
                            <>
                              <span className="text-hyundai-gray-200">·</span>
                              <span className="text-xs text-hyundai-gray-400 truncate">
                                {item.shopName}
                              </span>
                            </>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[15px] font-bold text-hyundai-gray-900 flex-1 min-w-0 truncate">
                          {item.items}
                        </p>
                        <p className="text-base font-bold text-hyundai-gray-900 shrink-0 tabular-nums">
                          {formatPrice(item.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <VehicleAddSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} />
    </>
  );
}

function formatHistoryDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
