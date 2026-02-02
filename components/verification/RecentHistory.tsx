import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatShortDate, formatPrice } from '@/lib/utils';
import type { VerificationHistory } from '@/types';

export interface RecentHistoryProps {
  items: VerificationHistory[];
  maxItems?: number;
}

const statusConfig = {
  appropriate: {
    label: '적정',
    variant: 'success' as const,
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '확인 필요',
    variant: 'warning' as const,
    Icon: AlertCircle,
  },
  recheck_recommended: {
    label: '재검토 권장',
    variant: 'error' as const,
    Icon: XCircle,
  },
};

const RecentHistory: React.FC<RecentHistoryProps> = ({ items, maxItems = 3 }) => {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-hyundai-gray-400">
          아직 검증 내역이 없습니다
        </p>
      </div>
    );
  }

  return (
    <Card variant="default" padding="none">
      {displayItems.map((item, index) => {
        const config = statusConfig[item.status];
        const Icon = config.Icon;

        return (
          <Link key={item.id} href={`/history/${item.id}`}>
            <div className={`px-5 py-4 active:bg-hyundai-gray-50 transition-colors ${
              index < displayItems.length - 1 ? 'border-b border-hyundai-gray-100' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-hyundai-gray-400">
                      {formatShortDate(item.date)}
                    </span>
                    <Badge variant={config.variant} size="sm" className="flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-hyundai-gray-900 font-medium mb-0.5">
                    {item.items}
                  </p>
                  <p className="text-xs text-hyundai-gray-500">
                    {formatPrice(item.totalAmount)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-hyundai-gray-300 shrink-0" />
              </div>
            </div>
          </Link>
        );
      })}
    </Card>
  );
};

export default RecentHistory;
