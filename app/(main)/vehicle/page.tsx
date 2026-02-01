import React from 'react';
import Link from 'next/link';
import { BarChart3, Calendar, Clock } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import UserMenu from '@/components/auth/UserMenu';
import { Card, Button } from '@/components/ui';
import VehicleInfo from '@/components/vehicle/VehicleInfo';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { fetchVehicle, fetchRecentHistory } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import { mockVehicle, mockRecentHistory } from '@/lib/mockData';
import { formatPrice } from '@/lib/utils';
import type { Vehicle, VerificationHistory } from '@/types';

export default async function VehiclePage() {
  const user = await getCurrentUser();

  // 로그인한 사용자만 Supabase에서 조회 (비로그인 시 타인 데이터 노출 방지)
  const vehicleResult = user ? await fetchVehicle() : { success: false, data: null };
  const historyResult = user ? await fetchRecentHistory(100) : { success: false, data: null };

  const vehicle: Vehicle = vehicleResult.success && vehicleResult.data
    ? {
        id: vehicleResult.data.id,
        manufacturer: vehicleResult.data.manufacturer,
        model: vehicleResult.data.model,
        variant: vehicleResult.data.variant || undefined,
        year: vehicleResult.data.year,
        mileage: vehicleResult.data.mileage,
        fuelType: vehicleResult.data.fuel_type,
      }
    : mockVehicle;

  const history: VerificationHistory[] = historyResult.success && historyResult.data
    ? historyResult.data.map((item) => ({
        id: item.id,
        estimateId: item.estimateId || '',
        date: item.date,
        items: item.items,
        totalAmount: item.totalAmount,
        status: item.status as VerificationHistory['status'],
      }))
    : mockRecentHistory;

  // 통계 계산
  const totalSpent = history.reduce((sum, h) => sum + h.totalAmount, 0);
  const maintenanceCount = history.length;
  const averageSpent = maintenanceCount > 0 ? Math.floor(totalSpent / maintenanceCount) : 0;

  return (
    <>
      <Header title="내 차 관리" rightAction={<UserMenu />} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-6">
            {!user && (
              <LoginPrompt message="로그인하시면 차량 정보와 정비 통계를 저장하고 관리할 수 있어요" />
            )}

            {/* 차량 정보 */}
            <VehicleInfo vehicle={vehicle} />

            {/* 정비 통계 */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">정비 통계</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-body-1 text-hyundai-gray-700">총 정비 횟수</span>
                  <span className="text-h3 text-hyundai-gray-900 font-bold">
                    {maintenanceCount}회
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-1 text-hyundai-gray-700">누적 정비 비용</span>
                  <span className="text-h3 text-hyundai-blue-600 font-bold">
                    {formatPrice(totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body-1 text-hyundai-gray-700">평균 정비 비용</span>
                  <span className="text-body-1 text-hyundai-gray-900 font-semibold">
                    {formatPrice(averageSpent)}
                  </span>
                </div>
              </div>
            </Card>

            {/* 정비 이력 타임라인 */}
            <Card variant="default" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">정비 이력</h3>
              </div>
              <div className="space-y-4">
                {history.map((historyItem, index) => (
                  <div key={historyItem.id} className="relative">
                    {index < history.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-hyundai-gray-200" />
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hyundai-blue-500 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-white" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-body-1 font-medium text-hyundai-gray-900">
                            {historyItem.items}
                          </span>
                          <span className="text-body-2 text-hyundai-gray-600">
                            {new Date(historyItem.date).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-body-2 text-hyundai-gray-600">
                          {formatPrice(historyItem.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 다음 예상 정비 */}
            <Card variant="highlighted" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-hyundai-gray-600" />
                <h3 className="text-h4 text-hyundai-gray-900">다음 예상 정비</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-body-1 font-medium text-hyundai-gray-900">
                      엔진오일 교환
                    </p>
                    <p className="text-body-2 text-hyundai-gray-600">
                      약 5,000km 후 또는 6개월 후
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    상세보기
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-body-1 font-medium text-hyundai-gray-900">
                      에어컨 필터 교체
                    </p>
                    <p className="text-body-2 text-hyundai-gray-600">
                      약 10,000km 후 또는 1년 후
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    상세보기
                  </Button>
                </div>
              </div>
            </Card>

            {/* 차량 정보 수정 (로그인 사용자만) */}
            {user && (
              <Link href="/vehicle/edit" className="block">
                <Button variant="outline" size="lg" fullWidth>
                  {vehicleResult.success && vehicleResult.data ? '차량 정보 수정' : '차량 등록'}
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
