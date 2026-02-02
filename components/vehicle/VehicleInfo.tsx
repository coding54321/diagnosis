import React from 'react';
import Link from 'next/link';
import { Wrench, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import type { Vehicle } from '@/types';

export interface NextMaintenance {
  name: string;
  remainingKm: number;
}

export interface VehicleInfoProps {
  vehicle: Vehicle;
  nextMaintenance?: NextMaintenance;
  totalVerifications?: number;
}

const VehicleInfo: React.FC<VehicleInfoProps> = ({ vehicle, nextMaintenance, totalVerifications }) => {
  return (
    <Link href="/vehicle">
      <Card variant="default" padding="none">
        {/* 차량 정보 row */}
        <div className="flex items-center justify-between px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-hyundai-gray-400 mb-0.5">내 차</p>
            <p className="text-sm font-medium text-hyundai-gray-900">
              {vehicle.manufacturer} {vehicle.model}
              {vehicle.variant && ` ${vehicle.variant}`}
            </p>
            <p className="text-xs text-hyundai-gray-400 mt-0.5">
              {vehicle.year}년식 · {vehicle.mileage.toLocaleString('ko-KR')}km
              {totalVerifications != null && totalVerifications > 0 && ` · 검증 ${totalVerifications}회`}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0 ml-3" strokeWidth={1.5} />
        </div>

        {/* 다음 예상 정비 row */}
        {nextMaintenance && (
          <>
            <div className="mx-5 border-b border-hyundai-gray-100" />
            <div className="flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-3.5 h-3.5 text-hyundai-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-hyundai-gray-600">
                  다음 예상: <span className="font-medium text-hyundai-gray-900">{nextMaintenance.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-hyundai-gray-400">
                  약 {nextMaintenance.remainingKm.toLocaleString('ko-KR')}km 후
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-hyundai-gray-300" strokeWidth={1.5} />
              </div>
            </div>
          </>
        )}
      </Card>
    </Link>
  );
};

export default VehicleInfo;
