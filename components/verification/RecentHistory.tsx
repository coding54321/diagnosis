'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, ChevronRight, Trash2 } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatShortDate, formatPrice } from '@/lib/utils';
import { deleteVerificationHistory } from '@/lib/supabase/actions';
import { toast } from 'sonner';
import type { VerificationHistory } from '@/types';

export interface RecentHistoryProps {
  items: VerificationHistory[];
  maxItems?: number;
}

// 2단계 상태: 적정 / 확인필요
const statusConfig = {
  appropriate: {
    label: '적정',
    variant: 'success' as const,
    Icon: CheckCircle2,
  },
  review_needed: {
    label: '확인필요',
    variant: 'warning' as const,
    Icon: AlertCircle,
  },
};

const RecentHistory: React.FC<RecentHistoryProps> = ({ items, maxItems = 3 }) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const displayItems = items.slice(0, maxItems);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('이 검증 내역을 삭제할까요?')) return;
    setDeletingId(id);
    try {
      const res = await deleteVerificationHistory(id);
      if (res.success) {
        toast.success('삭제했어요');
        router.refresh();
      } else {
        toast.error(res.error ?? '삭제에 실패했어요');
      }
    } finally {
      setDeletingId(null);
    }
  };

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
          <div
            key={item.id}
            className={`flex items-center gap-2 ${
              index < displayItems.length - 1 ? 'border-b border-hyundai-gray-100' : ''
            }`}
          >
            <Link href={`/history/${item.id}`} className="flex-1 min-w-0">
              <div className="px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
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
            <button
              type="button"
              onClick={(e) => handleDelete(e, item.id)}
              disabled={deletingId === item.id}
              className="p-3 text-hyundai-gray-400 hover:text-red-500 active:bg-hyundai-gray-50 transition-colors disabled:opacity-50 touch-target"
              aria-label="삭제"
            >
              <Trash2 className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </Card>
  );
};

export default RecentHistory;
