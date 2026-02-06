import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface VehicleConditions {
  model?: string;       // 차종 (예: "투싼")
  variant?: string;     // 옵션/트림 (예: "NX4 가솔린")
  mileage?: number;     // 주행거리 (예: 45000)
}

export interface VerificationSummaryProps {
  totalAmount: number;
  itemCounts: {
    appropriate: number;
    reviewNeeded: number;
  };
  vehicleConditions?: VehicleConditions;
}

const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  totalAmount,
  itemCounts,
  vehicleConditions,
}) => {
  const totalItems = itemCounts.appropriate + itemCounts.reviewNeeded;

  // 검증 조건 목록 생성
  const conditions: string[] = [];
  if (vehicleConditions?.model) {
    conditions.push(vehicleConditions.model);
  }
  if (vehicleConditions?.variant) {
    conditions.push(vehicleConditions.variant);
  }
  if (vehicleConditions?.mileage) {
    const mileageText = vehicleConditions.mileage >= 10000
      ? `${(vehicleConditions.mileage / 10000).toFixed(1)}만km`
      : `${vehicleConditions.mileage.toLocaleString()}km`;
    conditions.push(mileageText);
  }

  return (
    <div className="text-center">
      {/* 검증 조건 문구 */}
      {conditions.length > 0 && (
        <p className="text-sm text-hyundai-gray-500 mb-5 leading-relaxed">
          {conditions.map((cond, idx) => (
            <React.Fragment key={cond}>
              <span className="text-hyundai-gray-900 font-medium underline underline-offset-2 decoration-hyundai-gray-300">
                {cond}
              </span>
              {idx < conditions.length - 1 && ', '}
            </React.Fragment>
          ))}
          {' '}조건의 실제 견적 데이터로 검증했어요.
        </p>
      )}

      {/* 총 금액 */}
      <p className="text-3xl font-bold text-hyundai-gray-900 tracking-tight">
        {formatPrice(totalAmount)}
      </p>
      <p className="text-xs text-hyundai-gray-400 mt-1 mb-5">
        총 {totalItems}개 항목
      </p>

      {/* 항목 카운트 바 (2단계: 적정/확인필요) */}
      <div className="flex gap-1.5 justify-center">
        {itemCounts.appropriate > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-[11px] font-medium text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            적정 {itemCounts.appropriate}
          </span>
        )}
        {itemCounts.reviewNeeded > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[11px] font-medium text-amber-500">
            <AlertCircle className="w-3 h-3" />
            확인필요 {itemCounts.reviewNeeded}
          </span>
        )}
      </div>
    </div>
  );
};

export default VerificationSummary;
