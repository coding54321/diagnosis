'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface MileageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMileage: number;
  recentMileage?: number | null;
  onConfirm: (newMileage: number) => void;
  isLoading?: boolean;
}

/** 주행거리 수정 모달 (헤이딜러 스타일 참고) */
const MileageEditModal: React.FC<MileageEditModalProps> = ({
  isOpen,
  onClose,
  currentMileage,
  recentMileage,
  onConfirm,
  isLoading = false,
}) => {
  const [value, setValue] = useState(String(currentMileage > 0 ? currentMileage : ''));

  useEffect(() => {
    if (isOpen) {
      setValue(currentMileage > 0 ? String(currentMileage) : '');
    }
  }, [isOpen, currentMileage]);

  const num = value.replace(/,/g, '');
  const mileageNum = num === '' ? 0 : parseInt(num, 10);
  const isValid = mileageNum > 0 && mileageNum <= 9999999;
  const displayShort = mileageNum >= 10000
    ? `${(mileageNum / 10000).toFixed(1)}만 km`
    : mileageNum > 0
      ? `${mileageNum.toLocaleString()} km`
      : '';

  const handleSubmit = () => {
    if (!isValid) return;
    onConfirm(mileageNum);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 pt-6 pb-5">
          <h2 className="text-lg font-bold text-hyundai-gray-900">주행거리</h2>
          {recentMileage != null && recentMileage > 0 && (
            <p className="text-sm text-hyundai-gray-500 mt-1">
              최근 기록 : {recentMileage.toLocaleString()}km
            </p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={value}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                setValue(v === '' ? '' : parseInt(v, 10).toLocaleString());
              }}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl border text-base font-medium',
                'border-hyundai-gray-200 focus:border-hyundai-primary focus:ring-2 focus:ring-hyundai-primary/20 outline-none'
              )}
            />
            <span className="text-sm font-medium text-hyundai-gray-500 shrink-0">km</span>
          </div>
          {displayShort && (
            <p className="text-sm text-hyundai-primary font-medium mt-2">{displayShort}</p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-hyundai-primary active:bg-hyundai-gray-50 rounded-xl"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-hyundai-gray-900 rounded-xl active:bg-hyundai-gray-800 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? '적용 중...' : '수정하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MileageEditModal;
