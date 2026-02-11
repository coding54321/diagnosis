'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, AlertCircle, X } from 'lucide-react';
import { Input } from '@/components/ui';
import {
  saveVehicle,
  fetchVehicleByRegistrationNumber,
  verifyVehicleOwnerAction,
} from '@/lib/supabase/actions';

type RegStep = 'input' | 'checking' | 'owner' | 'confirmed';

type VehicleInfoFromLookup = {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
};

interface VehicleAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleAddSheet({ isOpen, onClose }: VehicleAddSheetProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // 등록 폼 state
  const [regStep, setRegStep] = useState<RegStep>('input');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoFromLookup | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [nickname, setNickname] = useState('');
  const [mileage, setMileage] = useState(0);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [ownerVerifying, setOwnerVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setRegStep('input');
    setVehicleNumber('');
    setVehicleInfo(null);
    setOwnerName('');
    setNickname('');
    setMileage(0);
    setCheckError(null);
    setOwnerVerifying(false);
    setIsSubmitting(false);
  }, []);

  // 열기/닫기 애니메이션
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetForm]);

  const handleClose = () => {
    if (isSubmitting || ownerVerifying) return;
    onClose();
  };

  const handleCheckVehicle = async () => {
    const num = vehicleNumber.replace(/\s|-/g, '').trim();
    if (!num) { setCheckError('차량번호를 입력해 주세요.'); return; }
    setCheckError(null);
    setRegStep('checking');
    try {
      const res = await fetchVehicleByRegistrationNumber(num);
      if (res.success && res.data) {
        setVehicleInfo(res.data);
        setMileage(res.data.mileage > 0 ? res.data.mileage : 0);
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

  const handleSave = async () => {
    if (!vehicleInfo) return;
    const finalMileage = mileage > 0 ? mileage : vehicleInfo.mileage;
    if (finalMileage <= 0) { setCheckError('주행거리를 입력해 주세요.'); return; }
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
        onClose();
        router.refresh();
      } else {
        setCheckError(result.error || '저장에 실패했어요.');
      }
    } catch {
      setCheckError('저장 중 오류가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* 백드롭 */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 시트 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out ${
          animating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* 핸들 + 닫기 */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="w-8" />
          <div className="w-10 h-1 rounded-full bg-hyundai-gray-200" />
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-hyundai-gray-400 active:bg-hyundai-gray-100"
            aria-label="닫기"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* 헤더 */}
        <div className="px-6 pt-2 pb-4">
          <h2 className="text-xl font-bold text-hyundai-gray-900">차량 등록</h2>
          <p className="text-sm text-hyundai-gray-400 mt-1">
            차량번호와 소유주 확인으로 등록할 수 있어요
          </p>
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(85dvh - 140px)' }}>
          <div className="space-y-4">
            {/* Step 1: 차량번호 입력 */}
            {regStep === 'input' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">
                    차량번호(번호판)
                  </span>
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

            {/* Step 3: 확정 — 별칭·주행거리 + 저장 */}
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
                    value={mileage || ''}
                    onChange={(e) => setMileage(parseInt(e.target.value, 10) || 0)}
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">현재 주행거리를 입력해 주세요</p>
                </label>

                {checkError && (
                  <p className="text-xs text-semantic-error-main flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {checkError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSave}
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
                  className="w-full text-sm text-hyundai-gray-400 underline"
                >
                  다른 차량으로 변경
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
