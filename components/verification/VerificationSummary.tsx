import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { ShopType } from '@/types';
import { getShopTypeLabel } from '@/lib/verification/shop-classifier';

export interface VehicleConditions {
  model?: string;       // 차종 (예: "투싼")
  variant?: string;     // 옵션/트림 (예: "NX4 가솔린")
  mileage?: number;     // 주행거리 (예: 45000)
}

export interface CostSummary {
  totalPartCost: number;
  totalLaborCost: number;
  totalPartCostAverage: number;
  totalLaborCostAverage: number;
}

export interface VerificationSummaryProps {
  totalAmount: number;
  itemCounts: {
    appropriate: number;
    reviewNeeded: number;
  };
  vehicleConditions?: VehicleConditions;
  shopType?: ShopType;
  costSummary?: CostSummary;
}

const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  totalAmount,
  itemCounts,
  vehicleConditions,
  shopType,
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
    conditions.push(`${vehicleConditions.mileage.toLocaleString('ko-KR')}km`);
  }

  return (
    <div className="bg-white rounded-2xl border border-hyundai-gray-100 px-5 py-5">
      {/* 검증 조건 · 정비소 */}
      {conditions.length > 0 && (
        <p className="text-xs text-hyundai-gray-500 mb-3">
          {conditions.map((cond, idx) => (
            <React.Fragment key={cond}>
              <span className="text-hyundai-gray-700 font-medium">{cond}</span>
              {idx < conditions.length - 1 && ', '}
            </React.Fragment>
          ))}
          {shopType && <span className="ml-1">· {getShopTypeLabel(shopType)}</span>}
        </p>
      )}

      {/* 총 금액 · 항목 수 */}
      <p className="text-2xl font-bold text-hyundai-gray-900 tracking-tight">
        {formatPrice(totalAmount)}
      </p>
      <p className="text-xs text-hyundai-gray-400 mt-0.5 mb-4">
        총 {totalItems}개 항목
      </p>

      {/* 적정 / 확인필요 */}
      <div className="flex gap-1.5">
        {itemCounts.appropriate > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-[11px] font-medium text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            적정 {itemCounts.appropriate}
          </span>
        )}
        {itemCounts.reviewNeeded > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-[11px] font-medium text-amber-600">
            <AlertCircle className="w-3 h-3" />
            확인필요 {itemCounts.reviewNeeded}
          </span>
        )}
      </div>
    </div>
  );
};

export default VerificationSummary;
