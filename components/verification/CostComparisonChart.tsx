'use client';

import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

export interface CostComparisonChartProps {
  partUser: number;
  partAvg: number;
  laborUser: number;
  laborAvg: number;
  partRefLabel?: string;
  className?: string;
}

function getCostStatus(user: number, avg: number): 'appropriate' | 'review_needed' {
  if (avg === 0) return 'appropriate';
  return user > avg * 1.1 ? 'review_needed' : 'appropriate';
}

const statusStyle = {
  appropriate: {
    label: '적정',
    color: 'text-green-600',
    bg: 'bg-green-50',
    barColor: 'bg-green-400',
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '확인필요',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    barColor: 'bg-amber-400',
    Icon: AlertCircle,
  },
};

function CostRow({
  label,
  userAmount,
  avgAmount,
  avgLabel,
  status,
}: {
  label: string;
  userAmount: number;
  avgAmount: number;
  avgLabel: string;
  status: 'appropriate' | 'review_needed';
}) {
  const maxVal = Math.max(userAmount, avgAmount);
  const userPct = maxVal > 0 ? (userAmount / maxVal) * 100 : 0;
  const avgPct = maxVal > 0 ? (avgAmount / maxVal) * 100 : 0;
  const diffPercent = avgAmount > 0 ? Math.round(((userAmount - avgAmount) / avgAmount) * 100) : 0;
  const config = statusStyle[status];
  const StatusIcon = config.Icon;

  return (
    <div>
      {/* 헤더: 라벨 + 상태 뱃지 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-hyundai-gray-900">{label}</span>
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}>
          <StatusIcon className={`w-3 h-3 ${config.color}`} strokeWidth={1.5} />
          <span className={`text-[11px] font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* 내 견적 바 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-hyundai-gray-400 w-12 shrink-0">내 견적</span>
          <div className="flex-1 h-2 bg-hyundai-gray-50 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.barColor} rounded-full`}
              style={{ width: `${Math.max(userPct, 3)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-hyundai-gray-900 w-[76px] text-right shrink-0">
            {formatPrice(userAmount)}
          </span>
        </div>

        {/* 평균 바 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-hyundai-gray-400 w-12 shrink-0">{avgLabel}</span>
          <div className="flex-1 h-2 bg-hyundai-gray-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-hyundai-gray-200 rounded-full"
              style={{ width: `${Math.max(avgPct, 3)}%` }}
            />
          </div>
          <span className="text-[11px] text-hyundai-gray-400 w-[76px] text-right shrink-0">
            {formatPrice(avgAmount)}
          </span>
        </div>
      </div>

      {/* 차이 퍼센트 */}
      {diffPercent !== 0 && (
        <div className="flex justify-end mt-1.5">
          <span
            className={`text-[11px] font-medium ${
              diffPercent > 0 ? 'text-red-400' : 'text-green-500'
            }`}
          >
            평균 대비 {diffPercent > 0 ? '+' : ''}{diffPercent}%
          </span>
        </div>
      )}
    </div>
  );
}

const CostComparisonChart: React.FC<CostComparisonChartProps> = ({
  partUser,
  partAvg,
  laborUser,
  laborAvg,
  partRefLabel = '평균',
  className,
}) => {
  const showPart = partUser > 0 || partAvg > 0;
  const showLabor = laborUser > 0 || laborAvg > 0;
  const partStatus = getCostStatus(partUser, partAvg);
  const laborStatus = getCostStatus(laborUser, laborAvg);

  return (
    <Card variant="default" padding="none" className={className}>
      {showPart && (
        <div className="px-5 py-4">
          <CostRow
            label="부품비"
            userAmount={partUser}
            avgAmount={partAvg}
            avgLabel={partRefLabel}
            status={partStatus}
          />
        </div>
      )}

      {showPart && showLabor && (
        <div className="mx-5 border-b border-hyundai-gray-100" />
      )}

      {showLabor && (
        <div className="px-5 py-4">
          <CostRow
            label="공임비"
            userAmount={laborUser}
            avgAmount={laborAvg}
            avgLabel="평균"
            status={laborStatus}
          />
        </div>
      )}
    </Card>
  );
};

export { getCostStatus };
export default CostComparisonChart;
