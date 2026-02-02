import React from 'react';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { VerificationStatus } from '@/types';

export interface VerificationSummaryProps {
  totalAmount: number;
  status: VerificationStatus;
  itemCounts: {
    appropriate: number;
    reviewNeeded: number;
    recheckRecommended: number;
  };
}

const statusConfig = {
  appropriate: {
    label: '적정 범위입니다',
    Icon: CheckCircle2,
    color: 'text-green-600',
    message: '비슷한 차량의 정비 비용과 비교했을 때 합리적인 금액이에요.',
  },
  review_needed: {
    label: '확인이 필요해요',
    Icon: AlertCircle,
    color: 'text-amber-500',
    message: '일부 항목이 평균보다 높은 편이에요. 아래 내용을 확인해보세요.',
  },
  recheck_recommended: {
    label: '재검토를 권장해요',
    Icon: XCircle,
    color: 'text-red-500',
    message: '일부 항목이 평균보다 현저히 높아요. 정비사와 상담을 권장합니다.',
  },
};

const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  totalAmount,
  status,
  itemCounts,
}) => {
  const config = statusConfig[status];
  const StatusIcon = config.Icon;
  const totalItems = Object.values(itemCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="text-center">
      {/* 상태 아이콘 + 메시지 */}
      <StatusIcon className={`w-10 h-10 ${config.color} mx-auto mb-3`} strokeWidth={1.5} />
      <p className={`text-lg font-bold ${config.color} mb-1`}>
        {config.label}
      </p>
      <p className="text-xs text-hyundai-gray-400 mb-5 max-w-[260px] mx-auto leading-relaxed">
        {config.message}
      </p>

      {/* 총 금액 */}
      <p className="text-3xl font-bold text-hyundai-gray-900 tracking-tight">
        {formatPrice(totalAmount)}
      </p>
      <p className="text-xs text-hyundai-gray-400 mt-1 mb-5">
        총 {totalItems}개 항목
      </p>

      {/* 항목 카운트 바 */}
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
            확인 {itemCounts.reviewNeeded}
          </span>
        )}
        {itemCounts.recheckRecommended > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-[11px] font-medium text-red-500">
            <XCircle className="w-3 h-3" />
            재검토 {itemCounts.recheckRecommended}
          </span>
        )}
      </div>
    </div>
  );
};

export default VerificationSummary;
