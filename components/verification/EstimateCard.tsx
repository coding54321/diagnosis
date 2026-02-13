import React from 'react';
import Link from 'next/link';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { VerificationStatus, CostType, VerificationGuide } from '@/types';

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
  costType?: CostType;
  guide?: VerificationGuide;
  /** 부품/공임 분해 (0원이 아닌 것만 라인 표시). partPriceSource 'wpc'면 WPC 순정가 기준 표시 */
  breakdown?: {
    partCost: { user: number; average: number; partPriceSource?: 'wpc' | 'market' | null };
    laborCost: { user: number; average: number };
  };
  isFreeRepair?: boolean;
}

// 2단계 상태: 적정 / 확인필요 (이미지 스타일: 점 색상 + 라벨)
const statusConfig = {
  appropriate: {
    label: '적정',
    dotColor: 'bg-green-500',
    textColor: 'text-green-600',
  },
  review_needed: {
    label: '확인필요',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-500',
  },
};

// 비용 유형 라벨 (항목 제목에 "부품 냉각수" 형태로 사용)
const costTypeLabel: Record<CostType, string> = {
  part: '부품',
  labor: '공임',
  combined: '부품+공임',
};

const EstimateCard: React.FC<EstimateCardProps> = ({
  itemId,
  itemName,
  totalCost,
  status,
  priceRange,
  userPrice,
  costType,
  guide,
  breakdown,
  isFreeRepair,
}) => {
  const config = statusConfig[status];
  const costLabel = costType ? costTypeLabel[costType] : '부품';
  const categoryAndName = `${costLabel} ${itemName}`;
  const { min, max, median } = priceRange;
  const range = max - min;
  const userPosition = range > 0 ? Math.max(0, Math.min(100, ((userPrice - min) / range) * 100)) : 50;
  const medianPosition = range > 0 ? ((median - min) / range) * 100 : 50;

  const guideMessage = guide?.partMessage && guide.partVerdict !== 'no_data' && guide.partVerdict !== 'at_reference'
    ? guide.partMessage
    : guide?.laborMessage && guide.laborVerdict !== 'no_data' && guide.laborVerdict !== 'at_expected'
      ? guide.laborMessage
      : null;

  return (
    <Link href={`/verify/result/${itemId}`} className="block min-h-[44px] active:bg-hyundai-gray-50 transition-colors">
      <div className="px-5 py-4">
        {/* 1행: 적정도 여부(좌측 상단) · chevron(우측 상단) */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.dotColor} shrink-0`} />
            <span className={`text-sm font-medium ${config.textColor}`}>
              {config.label}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-hyundai-gray-300 shrink-0" />
        </div>

        {/* 2행: 부품명/정비항목명 */}
        <p className="text-[15px] font-bold text-hyundai-gray-900 truncate mb-1">
          {categoryAndName}
        </p>

        {/* 3행: 내 가격 */}
        <div className="mb-3">
          {isFreeRepair ? (
            <p className="text-sm text-hyundai-gray-400">무상수리</p>
          ) : (
            <p className="text-base font-bold text-hyundai-gray-900 tabular-nums">
              {formatPrice(totalCost)}
            </p>
          )}
        </div>

        {/* 4행: 가격비교 차트 */}
        {!isFreeRepair && (
          <div className="relative">
            <div className="relative h-2 bg-hyundai-gray-100 rounded-full">
              <div
                className="absolute inset-y-0 bg-hyundai-gray-200 rounded-full"
                style={{
                  left: `${Math.max(0, medianPosition - 15)}%`,
                  width: '30%',
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-hyundai-gray-400 rounded-full"
                style={{ left: `${medianPosition}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-hyundai-gray-900 border-2 border-white shadow-sm z-10"
                style={{ left: `${userPosition}%`, marginLeft: '-6px' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-hyundai-gray-300 tabular-nums">
              <span>{formatPrice(min)}</span>
              <span>{formatPrice(max)}</span>
            </div>
          </div>
        )}

        {/* 가이드 문구 (확인필요 상태일 때만) */}
        {status === 'review_needed' && guideMessage && (
          <div className="mt-3 px-3 py-2.5 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700 leading-snug">
              {guideMessage}
            </p>
            {guide?.askMechanicTip && (
              <div className="mt-2 flex items-start gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 leading-snug italic">
                  {guide.askMechanicTip}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default EstimateCard;
