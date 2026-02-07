import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { VerificationStatus, CostType, VerificationGuide } from '@/types';

/** 기준 대비 ±이 범위 내면 "적정" 표시 */
const THRESHOLD_PERCENT = 15;

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

// 2단계 상태: 적정 / 확인필요
const statusConfig = {
  appropriate: {
    label: '적정',
    Icon: CheckCircle2,
    dotColor: 'bg-green-500',
    textColor: 'text-green-600',
  },
  review_needed: {
    label: '확인필요',
    Icon: AlertCircle,
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-500',
  },
};

// 비용 유형 태그
const costTypeConfig: Record<CostType, { label: string; bgColor: string; textColor: string }> = {
  part: { label: '부품', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  labor: { label: '공임', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  combined: { label: '부품+공임', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
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
  const costTag = costType ? costTypeConfig[costType] : null;
  const { min, max, median } = priceRange;
  const range = max - min;
  const userPosition = range > 0 ? Math.max(0, Math.min(100, ((userPrice - min) / range) * 100)) : 50;
  const medianPosition = range > 0 ? ((median - min) / range) * 100 : 50;

  const diffPercent = median > 0 ? Math.round(((userPrice - median) / median) * 100) : 0;

  const guideMessage = guide?.partMessage && guide.partVerdict !== 'no_data' && guide.partVerdict !== 'at_reference'
    ? guide.partMessage
    : guide?.laborMessage && guide.laborVerdict !== 'no_data' && guide.laborVerdict !== 'at_expected'
      ? guide.laborMessage
      : null;

  const showBreakdown = breakdown && !isFreeRepair;
  const partUser = breakdown?.partCost.user ?? 0;
  const partAvg = breakdown?.partCost.average ?? 0;
  const laborUser = breakdown?.laborCost.user ?? 0;
  const laborAvg = breakdown?.laborCost.average ?? 0;
  const partDiff = partAvg > 0 ? Math.round(((partUser - partAvg) / partAvg) * 100) : null;
  const laborDiff = laborAvg > 0 ? Math.round(((laborUser - laborAvg) / laborAvg) * 100) : null;

  const partRefLabel = breakdown?.partCost.partPriceSource === 'wpc' ? 'WPC 순정가' : null;
  const partLabel = partDiff !== null && Math.abs(partDiff) <= THRESHOLD_PERCENT ? '적정' : partDiff !== null ? `기준 대비 ${partDiff > 0 ? '+' : ''}${partDiff}%` : null;
  const laborLabel = laborDiff !== null && Math.abs(laborDiff) <= THRESHOLD_PERCENT ? '적정' : laborDiff !== null ? `기준 대비 ${laborDiff > 0 ? '+' : ''}${laborDiff}%` : null;

  return (
    <Link href={`/verify/result/${itemId}`}>
      <div className="px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} />
            {costTag && (
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${costTag.bgColor} ${costTag.textColor}`}>
                {costTag.label}
              </span>
            )}
            <p className="text-sm font-medium text-hyundai-gray-900 truncate">
              {itemName}
            </p>
          </div>
          <span className={`text-[11px] font-medium ${config.textColor} shrink-0 ml-2`}>
            {config.label}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-1.5 pl-3.5">
          <p className="text-sm font-bold text-hyundai-gray-900">
            {formatPrice(totalCost)}
          </p>
          {!isFreeRepair && diffPercent !== 0 && (
            <span className={`text-xs ${diffPercent > 0 ? 'text-red-400' : 'text-green-500'}`}>
              평균 대비 {diffPercent > 0 ? '+' : ''}{diffPercent}%
            </span>
          )}
        </div>

        {showBreakdown && (partUser > 0 || laborUser > 0) && (
          <div className="pl-3.5 mb-3 space-y-0.5">
            {partUser > 0 && (
              <p className="text-[11px] text-hyundai-gray-500">
                부품 {formatPrice(partUser)}
                {partRefLabel && partAvg > 0 && (
                  <span className="text-hyundai-gray-400"> · {partRefLabel} {formatPrice(partAvg)}</span>
                )}
                {partLabel && <span className="text-hyundai-gray-400"> · {partLabel}</span>}
              </p>
            )}
            {laborUser > 0 && (
              <p className="text-[11px] text-hyundai-gray-500">
                공임 {formatPrice(laborUser)}
                {laborLabel && <span className="text-hyundai-gray-400"> · {laborLabel}</span>}
              </p>
            )}
          </div>
        )}

        {isFreeRepair && (
          <p className="pl-3.5 mb-3 text-[11px] text-hyundai-gray-400">무상수리</p>
        )}

        {!isFreeRepair && (
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
        )}

        {/* 가이드 문구 (확인필요 상태일 때만 표시) */}
        {status === 'review_needed' && guideMessage && (
          <div className="mt-3 ml-3.5 px-3 py-2.5 bg-amber-50 rounded-lg">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              {guideMessage}
            </p>
            {guide?.askMechanicTip && (
              <div className="mt-2 flex items-start gap-1.5">
                <MessageCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600 leading-relaxed italic">
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
