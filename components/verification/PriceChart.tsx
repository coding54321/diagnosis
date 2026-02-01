'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
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
  const userPosition = ((userPrice - min) / range) * 100;
  const medianPosition = ((median - min) / range) * 100;

  // 범위를 0-100으로 정규화
  const normalizedMin = 0;
  const normalizedMax = 100;
  const normalizedMedian = medianPosition;
  const normalizedUser = userPosition;

  return (
    <Card variant="default" padding="md" className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-hyundai-gray-600" />
            <h4 className="text-h4 text-hyundai-gray-900">가격 분포</h4>
          </div>
          <span className="text-caption text-hyundai-gray-500">
            유사 사례 {sampleCount}건
          </span>
        </div>

        {/* 차트 영역 */}
        <div className="relative h-16 bg-hyundai-gray-100 rounded-lg overflow-hidden">
          {/* 분포 영역 (시각화) */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-8 bg-gradient-to-r from-hyundai-blue-200 via-hyundai-blue-400 to-hyundai-blue-200 rounded opacity-60" />
          </div>

          {/* 중앙값 표시 */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-hyundai-gray-600"
            style={{ left: `${normalizedMedian}%` }}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-caption text-hyundai-gray-600 whitespace-nowrap">
              평균
            </div>
          </div>

          {/* 사용자 견적 표시 */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-hyundai-blue-600"
            style={{ left: `${Math.max(0, Math.min(100, normalizedUser))}%` }}
          >
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-caption font-medium text-hyundai-blue-600 whitespace-nowrap">
              내 견적
            </div>
          </div>
        </div>

        {/* 가격 범위 표시 */}
        <div className="flex justify-between text-caption text-hyundai-gray-600">
          <span>{formatPrice(min)}</span>
          <span className="font-medium">{formatPrice(median)}</span>
          <span>{formatPrice(max)}</span>
        </div>

        {/* 사용자 견적 정보 */}
        <div className="pt-2 border-t border-hyundai-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-body-2 text-hyundai-gray-700">내 견적</span>
            <span className="text-body-1 font-semibold text-hyundai-gray-900">
              {formatPrice(userPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-body-2 text-hyundai-gray-700">평균 대비</span>
            <span
              className={`text-body-1 font-medium ${
                userPrice > median
                  ? 'text-semantic-warning-main'
                  : userPrice < median
                  ? 'text-semantic-success-main'
                  : 'text-hyundai-gray-700'
              }`}
            >
              {userPrice > median ? '+' : ''}
              {Math.round(((userPrice - median) / median) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PriceChart;
