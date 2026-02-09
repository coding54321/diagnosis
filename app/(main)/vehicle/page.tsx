import React from 'react';
import { redirect } from 'next/navigation';
import { VehicleTabContent } from '@/components/vehicle/VehicleTabContent';
import { fetchVehicles, fetchRecentHistoryByVehicleId } from '@/lib/supabase/actions';
import type { VerificationHistory } from '@/types';

type Props = { searchParams: Promise<{ vehicleId?: string }> };

export default async function VehiclePage({ searchParams }: Props) {
  const { vehicleId: queryVehicleId } = await searchParams;
  const vehiclesResult = await fetchVehicles();
  const vehicles = vehiclesResult.success && vehiclesResult.data ? vehiclesResult.data : [];

  if (vehicles.length === 0) {
    return (
      <VehicleTabContent
        vehicles={[]}
        selectedVehicle={null}
        history={[]}
      />
    );
  }

  const validId = queryVehicleId && vehicles.some((v) => v.id === queryVehicleId);
  const selectedVehicleId = validId ? queryVehicleId! : vehicles[0].id;
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0];

  if (!validId && queryVehicleId) {
    redirect(`/vehicle?vehicleId=${selectedVehicleId}`);
  }

  const historyResult = await fetchRecentHistoryByVehicleId(selectedVehicleId, 100);
  const history: VerificationHistory[] =
    historyResult.success && historyResult.data
      ? historyResult.data.map((item) => ({
          id: item.id,
          estimateId: item.estimateId || '',
          date: item.date,
          items: item.items,
          totalAmount: item.totalAmount,
          status: item.status as VerificationHistory['status'],
          shopName: item.shopName,
        }))
      : [];

  return (
    <VehicleTabContent
      vehicles={vehicles}
      selectedVehicle={selectedVehicle}
      history={history}
    />
  );
}
