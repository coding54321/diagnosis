import React from 'react';
import { notFound } from 'next/navigation';
import { fetchHistoryById } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import HistoryDetailContent from '@/components/history/HistoryDetailContent';
import type { VerificationHistory } from '@/types';

interface HistoryDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 검증 내역 상세 - 로그인한 소유자만 조회 가능, 그 외 404
 */
export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user?.id) {
    notFound();
  }

  const result = await fetchHistoryById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const history: VerificationHistory = {
    id: result.data.id,
    estimateId: result.data.estimateId ?? '',
    date: result.data.date,
    items: result.data.items,
    totalAmount: result.data.totalAmount,
    status: result.data.status as VerificationHistory['status'],
    shopName: result.data.shopName,
    vehicleLabel: result.data.vehicleLabel,
  };

  return <HistoryDetailContent history={history} />;
}
