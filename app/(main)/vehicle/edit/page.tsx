import React from 'react';
import { redirect } from 'next/navigation';
import { fetchVehicle } from '@/lib/supabase/actions';
import { getCurrentUser } from '@/lib/supabase/auth-server';
import VehicleEditForm from '@/components/vehicle/VehicleEditForm';
import type { Vehicle } from '@/types';

/**
 * 차량 정보 수정/등록 페이지
 * 로그인한 사용자만 접근 가능
 */
export default async function VehicleEditPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/vehicle');
  }

  const vehicleResult = await fetchVehicle();
  const vehicleData = vehicleResult.success && vehicleResult.data ? vehicleResult.data : null;

  const vehicle: Vehicle | null = vehicleData
    ? {
        id: vehicleData.id,
        manufacturer: vehicleData.manufacturer,
        model: vehicleData.model,
        variant: vehicleData.variant || undefined,
        year: vehicleData.year,
        mileage: vehicleData.mileage,
        fuelType: vehicleData.fuel_type,
      }
    : null;

  const title = vehicle ? '차량 정보 수정' : '차량 등록';

  return <VehicleEditForm initialVehicle={vehicle} title={title} />;
}
