'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import { Input } from '@/components/ui';
import {
  saveVehicle,
  fetchVehicleByRegistrationNumber,
  verifyVehicleOwnerAction,
} from '@/lib/supabase/actions';
import type { Vehicle } from '@/types';

type VehicleStep = 'input' | 'checking' | 'owner' | 'confirmed';

/** 차량번호 조회로 채워지는 차량 정보 */
type VehicleInfoFromLookup = {
  manufacturer: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
};

export interface VehicleEditFormProps {
  initialVehicle: Vehicle | null;
  vehicleId?: string;
  title: string;
}

export default function VehicleEditForm({ initialVehicle, vehicleId, title }: VehicleEditFormProps) {
  const router = useRouter();
  const [vehicleStep, setVehicleStep] = useState<VehicleStep>('input');
  const [vehicleNumber, setVehicleNumber] = useState(initialVehicle?.registration_number ?? '');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfoFromLookup | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [nickname, setNickname] = useState(initialVehicle?.nickname ?? '');
  const [mileage, setMileage] = useState(initialVehicle?.mileage ?? 0);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [ownerVerifying, setOwnerVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckVehicle = async () => {
    const num = vehicleNumber.replace(/\s|-/g, '').trim();
    if (!num) {
      setCheckError('차량번호를 입력해 주세요.');
      return;
    }
    setCheckError(null);
    setVehicleStep('checking');
    try {
      const res = await fetchVehicleByRegistrationNumber(num);
      if (res.success && res.data) {
        setVehicleInfo(res.data);
        const nextMileage = res.data.mileage > 0 ? res.data.mileage : (initialVehicle?.mileage ?? 0);
        setMileage(nextMileage);
        setVehicleStep('owner');
      } else {
        setCheckError(res.error ?? '등록된 차량을 찾을 수 없어요. 차량번호를 다시 확인해 주세요.');
        setVehicleStep('input');
      }
    } catch {
      setCheckError('조회 중 오류가 발생했어요. 다시 시도해 주세요.');
      setVehicleStep('input');
    }
  };

  const handleConfirmOwner = async () => {
    if (!ownerName.trim()) {
      setCheckError('소유주 이름을 입력해 주세요.');
      return;
    }
    setCheckError(null);
    setOwnerVerifying(true);
    try {
      const res = await verifyVehicleOwnerAction(
        vehicleNumber.replace(/\s|-/g, '').trim(),
        ownerName.trim()
      );
      if (res.success) {
        setVehicleStep('confirmed');
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
    if (finalMileage <= 0) {
      alert('주행거리를 입력해 주세요.');
      return;
    }

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
          ...(vehicleId && { vehicleId }),
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
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToInput = () => {
    setVehicleStep('input');
    setVehicleInfo(null);
    setOwnerName('');
    setCheckError(null);
  };

  return (
    <>
      <Header title={title} showBackButton onBack={() => router.back()} className="border-b-0" />

      <main className="min-h-screen bg-hyundai-gray-50 pb-40">
        <Container>
          <div className="px-1 pt-8 pb-6">
            <h1 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight">
              {initialVehicle ? '차량 정보를 수정해주세요' : '차량을 등록해주세요'}
            </h1>
            <p className="text-sm text-hyundai-gray-400 mt-1.5">
              차량번호와 소유주 확인으로만 등록·수정할 수 있어요
            </p>
          </div>

          <div className="px-1 space-y-4">
            {/* Step 1: 차량번호 입력 */}
            {vehicleStep === 'input' && (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">
                    차량등록번호(번호판)
                  </span>
                  <Input
                    placeholder="예: 12가3456"
                    value={vehicleNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value.trim());
                      setCheckError(null);
                    }}
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
            {vehicleStep === 'checking' && (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-hyundai-gray-300 mb-3" />
                <p className="text-sm text-hyundai-gray-400">차량 정보를 조회하고 있어요...</p>
              </div>
            )}

            {/* Step 2: 소유주 확인 */}
            {vehicleStep === 'owner' && vehicleInfo && (
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
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">
                    소유주 이름
                  </span>
                  <Input
                    placeholder="차량등록증에 기재된 이름"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      setCheckError(null);
                    }}
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">
                    차량등록증에 기재된 소유주명을 입력해 주세요
                  </p>
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
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                      확인 중...
                    </>
                  ) : (
                    '소유주 확인'
                  )}
                </button>
              </div>
            )}

            {/* Step 3: 확정 — 주행거리 입력 + 저장 */}
            {vehicleStep === 'confirmed' && vehicleInfo && (
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
                      {ownerName && (
                        <p className="text-xs text-semantic-success-dark mt-1">소유주: {ownerName}</p>
                      )}
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">
                    별칭 (선택)
                  </span>
                  <Input
                    placeholder="예: 우리 엄마 차"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">
                    목록에서 구분하기 쉬운 이름을 붙여보세요
                  </p>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-hyundai-gray-700 mb-2 block">
                    주행거리 (km)
                  </span>
                  <Input
                    type="number"
                    placeholder="예: 45000"
                    value={mileage || ''}
                    onChange={(e) =>
                      setMileage(parseInt(e.target.value, 10) || 0)
                    }
                    className="text-base"
                    fullWidth
                  />
                  <p className="text-xs text-hyundai-gray-400 mt-1.5">
                    현재 주행거리를 입력해 주세요
                  </p>
                </label>

                <button
                  type="button"
                  onClick={resetToInput}
                  className="text-sm text-hyundai-gray-400 underline"
                >
                  다른 차량으로 변경
                </button>
              </div>
            )}
          </div>
        </Container>

        {/* 하단 저장 버튼 — 하단 네비(56px) 위에 배치 */}
        <div
          className="fixed left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-hyundai-gray-100 px-5 py-4"
          style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={vehicleStep !== 'confirmed' || isSubmitting}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl bg-hyundai-gray-900 text-white text-base font-semibold active:bg-hyundai-gray-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
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
      </main>
    </>
  );
}
