import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { VerificationStatus } from '@/types';

export interface EstimateCardProps {
  itemId: string;
  itemName: string;
  totalCost: number;
  status: VerificationStatus;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  userPrice: number;
}

const statusConfig = {
  appropriate: {
    label: '적정',
    Icon: CheckCircle2,
    dotColor: 'bg-green-500',
    textColor: 'text-green-600',
  },
  review_needed: {
    label: '확인 필요',
    Icon: AlertCircle,
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-500',
  },
  recheck_recommended: {
    label: '재검토',
    Icon: XCircle,
    dotColor: 'bg-red-500',
    textColor: 'text-red-500',
  },
};

const EstimateCard: React.FC<EstimateCardProps> = ({
  itemId,
  itemName,
  totalCost,
  status,
  priceRange,
  userPrice,
}) => {
  const config = statusConfig[status];
  const { min, max, median } = priceRange;
  const range = max - min;
  const userPosition = range > 0 ? Math.max(0, Math.min(100, ((userPrice - min) / range) * 100)) : 50;
  const medianPosition = range > 0 ? ((median - min) / range) * 100 : 50;

  // 평균 대비 차이 퍼센트
  const diffPercent = median > 0 ? Math.round(((userPrice - median) / median) * 100) : 0;

  return (
    <Link href={`/verify/result/${itemId}`}>
      <div className="px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
        {/* 항목명 + 상태 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} />
            <p className="text-sm font-medium text-hyundai-gray-900 truncate">
              {itemName}
            </p>
          </div>
          <span className={`text-[11px] font-medium ${config.textColor} shrink-0 ml-2`}>
            {config.label}
          </span>
        </div>

        {/* 금액 + 차이 */}
        <div className="flex items-baseline justify-between mb-3 pl-3.5">
          <p className="text-sm font-bold text-hyundai-gray-900">
            {formatPrice(totalCost)}
          </p>
          {diffPercent !== 0 && (
            <span className={`text-xs ${diffPercent > 0 ? 'text-red-400' : 'text-green-500'}`}>
              평균 대비 {diffPercent > 0 ? '+' : ''}{diffPercent}%
            </span>
          )}
        </div>

        {/* 가격 분포 바 */}
        <div className="pl-3.5">
          <div className="relative h-1.5 bg-hyundai-gray-100 rounded-full">
            {/* 평균 구간 */}
            <div
              className="absolute inset-y-0 bg-hyundai-gray-200 rounded-full"
              style={{
                left: `${Math.max(0, medianPosition - 12)}%`,
                width: '24%',
              }}
            />
            {/* 사용자 위치 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-hyundai-gray-900 border-2 border-white shadow-sm"
              style={{ left: `${userPosition}%`, marginLeft: '-5px' }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-hyundai-gray-300">
            <span>{formatPrice(min)}</span>
            <span>{formatPrice(max)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EstimateCard;
