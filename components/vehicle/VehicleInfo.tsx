import React from 'react';
import Link from 'next/link';
import { Car, Wrench, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import type { Vehicle } from '@/types';

export interface NextMaintenance {
  name: string;
  remainingKm: number;
}

export interface VehicleInfoProps {
  vehicle: Vehicle;
  nextMaintenance?: NextMaintenance;
}

const VehicleInfo: React.FC<VehicleInfoProps> = ({ vehicle, nextMaintenance }) => {
  return (
    <Link href="/vehicle">
      <Card variant="default" padding="md" className="active:opacity-90">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-hyundai-gray-500 mb-1">내 차</p>
            <p className="text-lg font-semibold text-hyundai-gray-900">
              {vehicle.manufacturer} {vehicle.model}
              {vehicle.variant && ` ${vehicle.variant}`}
            </p>
            <p className="text-body-2 text-hyundai-gray-600 mt-0.5">
              {vehicle.year}년식 · {vehicle.mileage.toLocaleString('ko-KR')}km
            </p>
          </div>
          <div className="w-12 h-12 shrink-0 rounded-full bg-hyundai-gray-100 flex items-center justify-center ml-4">
            <Car className="w-6 h-6 text-hyundai-gray-500" strokeWidth={1.5} />
          </div>
        </div>
        {nextMaintenance && (
          <div className="mt-3 pt-3 border-t border-hyundai-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-hyundai-gray-700" strokeWidth={1.5} />
              <span className="text-body-2 text-hyundai-gray-700">
                다음 예상: <span className="font-medium text-hyundai-gray-900">{nextMaintenance.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-caption text-hyundai-gray-500 font-medium">
                약 {nextMaintenance.remainingKm.toLocaleString('ko-KR')}km 후
              </span>
              <ChevronRight className="w-4 h-4 text-hyundai-gray-400" />
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
};

export default VehicleInfo;
