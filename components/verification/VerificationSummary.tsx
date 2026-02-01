import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, FileText } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
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
    color: 'text-semantic-success-main',
    bgColor: 'bg-semantic-success-light',
    message: '비슷한 차량의 정비 비용과 비교했을 때 합리적인 금액이에요.',
  },
  review_needed: {
    label: '확인이 필요한 항목이 있어요',
    Icon: AlertCircle,
    color: 'text-semantic-warning-main',
    bgColor: 'bg-semantic-warning-light',
    message: '일부 항목이 평균보다 높은 편이에요. 아래 내용을 확인해보세요.',
  },
  recheck_recommended: {
    label: '재검토를 권장해요',
    Icon: XCircle,
    color: 'text-semantic-error-main',
    bgColor: 'bg-semantic-error-light',
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

  return (
    <Card variant="highlighted" padding="lg" className="text-center">
      <div className="space-y-4">
        <div className="flex justify-center mb-2">
          <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-8 h-8 ${config.color}`} />
          </div>
        </div>
        
        <div>
          <p className="text-h1 text-hyundai-gray-900 mb-2">
            {formatPrice(totalAmount)}
          </p>
          <div className="w-24 h-0.5 bg-hyundai-gray-300 mx-auto rounded-full mb-4" />
          <p className={`text-h3 font-semibold ${config.color} mb-2`}>
            {config.label}
          </p>
          <p className="text-body-2 text-hyundai-gray-600">
            {config.message}
          </p>
        </div>

        <div className="pt-4 border-t border-hyundai-gray-200">
          <div className="flex items-center justify-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-hyundai-gray-500" />
            <p className="text-body-2 text-hyundai-gray-700">
              전체 {Object.values(itemCounts).reduce((a, b) => a + b, 0)}개 항목
            </p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {itemCounts.appropriate > 0 && (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                적정 {itemCounts.appropriate}개
              </Badge>
            )}
            {itemCounts.reviewNeeded > 0 && (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                확인 필요 {itemCounts.reviewNeeded}개
              </Badge>
            )}
            {itemCounts.recheckRecommended > 0 && (
              <Badge variant="error" size="sm" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                재검토 권장 {itemCounts.recheckRecommended}개
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VerificationSummary;
