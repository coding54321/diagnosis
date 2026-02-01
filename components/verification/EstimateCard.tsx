import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
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
    variant: 'success' as const,
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '평균보다 높음',
    variant: 'warning' as const,
    Icon: AlertCircle,
  },
  recheck_recommended: {
    label: '재검토 권장',
    variant: 'error' as const,
    Icon: XCircle,
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
  const StatusIcon = config.Icon;
  const { min, max, median } = priceRange;
  const range = max - min;
  const userPosition = Math.max(0, Math.min(100, ((userPrice - min) / range) * 100));
  const medianPosition = ((median - min) / range) * 100;

  return (
    <Link href={`/verify/result/${itemId}`}>
      <Card variant="default" padding="md" className="hover:shadow-lg transition-shadow">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-body-1 text-hyundai-gray-900 font-medium mb-2">
                {itemName}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-h4 text-hyundai-gray-900">
                  {formatPrice(totalCost)}
                </span>
                <Badge variant={config.variant} size="sm" className="flex items-center gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* 간단한 가격 분포 바 */}
          <div className="relative h-2 bg-hyundai-gray-100 rounded-full overflow-hidden">
            {/* 분포 영역 */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-hyundai-gray-200 via-hyundai-gray-300 to-hyundai-gray-200"
              style={{
                left: `${Math.max(0, medianPosition - 15)}%`,
                width: '30%',
              }}
            />
            
            {/* 사용자 견적 위치 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-hyundai-gray-900"
              style={{ left: `${userPosition}%` }}
            />
          </div>

          <div className="flex justify-between text-caption text-hyundai-gray-500">
            <span>{formatPrice(min)}</span>
            <span>{formatPrice(median)}</span>
            <span>{formatPrice(max)}</span>
          </div>

          <div className="pt-2 border-t border-hyundai-gray-100">
            <div className="flex items-center justify-between text-body-2">
              <span className="text-hyundai-gray-600">상세 보기</span>
              <ChevronRight className="w-4 h-4 text-hyundai-gray-400" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default EstimateCard;
