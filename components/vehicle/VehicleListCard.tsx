'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui';
import { deleteVehicleAction } from '@/lib/supabase/actions';
import type { Vehicle } from '@/types';

function toVehicle(v: { id: string; manufacturer: string; model: string; variant?: string | null; year: number; mileage: number; fuel_type: string; registration_number?: string | null; nickname?: string | null }): Vehicle {
  return {
    id: v.id,
    manufacturer: v.manufacturer,
    model: v.model,
    variant: v.variant ?? undefined,
    year: v.year,
    mileage: v.mileage,
    fuelType: v.fuel_type,
    registration_number: v.registration_number ?? undefined,
    nickname: v.nickname ?? undefined,
  };
}

export function VehicleListCard({
  vehicleRow,
}: {
  vehicleRow: Parameters<typeof toVehicle>[0];
}) {
  const router = useRouter();
  const vehicle = toVehicle(vehicleRow);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('이 차량을 목록에서 삭제할까요? (검증 이력은 유지됩니다)')) return;
    setIsDeleting(true);
    try {
      const res = await deleteVehicleAction(vehicle.id);
      if (res.success) router.refresh();
      else alert(res.error ?? '삭제에 실패했어요.');
    } finally {
      setIsDeleting(false);
    }
  };

  const label = vehicle.nickname || `${vehicle.manufacturer} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''}`;
  const sub = vehicle.nickname
    ? `${vehicle.manufacturer} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ''} · ${vehicle.year}년식`
    : `${vehicle.year}년식 · ${vehicle.mileage.toLocaleString('ko-KR')}km · ${vehicle.fuelType}`;

  return (
    <Card variant="default" padding="none">
      <Link href={`/vehicle/edit?id=${vehicle.id}`} className="block">
        <div className="flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-hyundai-gray-900 truncate">{label}</p>
            <p className="text-xs text-hyundai-gray-400 mt-0.5">{sub}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-lg text-hyundai-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              aria-label="차량 삭제"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
          </div>
        </div>
      </Link>
    </Card>
  );
}
