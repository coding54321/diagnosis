'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import type { PriceRange } from '@/types';

export interface PriceChartProps {
  userPrice: number;
  priceRange: PriceRange;
  sampleCount: number;
  className?: string;
}

const PriceChart: React.FC<PriceChartProps> = ({
  userPrice,
  priceRange,
  sampleCount,
  className,
}) => {
  const { min, max, median } = priceRange;
  const range = max - min;
  const userPosition = range > 0 ? Math.max(0, Math.min(100, ((userPrice - min) / range) * 100)) : 50;
  const medianPosition = range > 0 ? ((median - min) / range) * 100 : 50;

  return (
    <Card variant="default" padding="none" className={className}>
      <div className="px-5 py-4">
        <div className="mb-4">
          <p className="text-sm font-medium text-hyundai-gray-900">가격 분포</p>
        </div>

        {/* 분포 바 */}
        <div className="relative">
          {/* 바 본체 */}
          <div className="relative h-2 bg-hyundai-gray-100 rounded-full">
            {/* 평균 구간 표시 */}
            <div
              className="absolute inset-y-0 bg-hyundai-gray-200 rounded-full"
              style={{
                left: `${Math.max(0, medianPosition - 15)}%`,
                width: '30%',
              }}
            />
            {/* 중앙값 마커 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-hyundai-gray-400 rounded-full"
              style={{ left: `${medianPosition}%` }}
            />
            {/* 사용자 위치 마커 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-hyundai-gray-900 border-2 border-white shadow-sm"
              style={{ left: `${userPosition}%`, marginLeft: '-6px' }}
            />
          </div>

          {/* 범위 라벨 */}
          <div className="flex justify-between mt-2 text-[10px] text-hyundai-gray-300">
            <span>{formatPrice(min)}</span>
            <span>{formatPrice(max)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PriceChart;
