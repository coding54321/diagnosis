import React from 'react';
import { fetchVehicleById } from '@/lib/supabase/actions';
import VehicleEditForm from '@/components/vehicle/VehicleEditForm';
import type { Vehicle } from '@/types';

type Props = { searchParams: Promise<{ id?: string }> };

/**
 * 차량 정보 수정/등록 페이지
 * searchParams.id 있으면 수정 모드, 없으면 신규 등록
 * 차량번호·소유주 검증 후 등록/수정
 */
export default async function VehicleEditPage({ searchParams }: Props) {
  const { id } = await searchParams;
  const vehicleResult = id ? await fetchVehicleById(id) : { success: true, data: null };
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
        registration_number: vehicleData.registration_number ?? undefined,
        nickname: vehicleData.nickname ?? undefined,
      }
    : null;

  const title = vehicle ? '차량 정보 수정' : '차량 등록';

  return (
    <VehicleEditForm
      initialVehicle={vehicle}
      vehicleId={vehicle?.id}
      title={title}
    />
  );
}
