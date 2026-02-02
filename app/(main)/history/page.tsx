import React from 'react';
import { Header, Container } from '@/components/layout';
import UserMenu from '@/components/auth/UserMenu';
import RecentHistory from '@/components/verification/RecentHistory';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { mockRecentHistory } from '@/lib/mockData';
import type { VerificationHistory } from '@/types';

export default async function HistoryPage() {
  const user = await getCurrentUser();

  // 로그인한 사용자만 Supabase에서 조회 (비로그인 시 타인 데이터 노출 방지)
  const historyResult = user ? await fetchRecentHistory(100) : { success: false, data: null };

  const history: VerificationHistory[] = historyResult.success && historyResult.data
    ? historyResult.data.map((item) => ({
        id: item.id,
        estimateId: item.estimateId || '',
        date: item.date,
        items: item.items,
        totalAmount: item.totalAmount,
        status: item.status as VerificationHistory['status'],
        shopName: item.shopName,
      }))
    : mockRecentHistory;

  return (
    <>
      <Header title="검증 내역" rightAction={<UserMenu />} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-4">
            <div className="mb-4">
              <h2 className="text-h2 text-hyundai-gray-900 mb-2">
                전체 검증 내역
              </h2>
              <p className="text-body-2 text-hyundai-gray-600">
                지금까지 검증한 견적 내역을 확인할 수 있어요
              </p>
            </div>

            {!user && (
              <LoginPrompt message="로그인하시면 저장된 검증 내역을 확인할 수 있어요" />
            )}

            {history.length === 0 && user ? (
              <div className="text-center py-12">
                <p className="text-body-1 text-hyundai-gray-600 mb-2">
                  아직 검증한 내역이 없어요
                </p>
                <p className="text-body-2 text-hyundai-gray-500">
                  견적서를 검증해보세요
                </p>
              </div>
            ) : (
              <RecentHistory items={history} maxItems={100} />
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
