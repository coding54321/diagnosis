/**
 * 검증 엔진
 * 견적 항목의 적정성을 판단하는 로직
 */

import type { EstimateItem } from '@/types';

export type VerificationStatus = 'appropriate' | 'review_needed' | 'recheck_recommended';

export interface VerificationResult {
  status: VerificationStatus;
  userPrice: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  sampleCount: number;
  confidence: number;
  breakdown: {
    partCost: {
      user: number;
      average: number;
    };
    laborCost: {
      user: number;
      average: number;
    };
  };
}

/**
 * 검증 엔진 클래스
 * TODO: 실제 데이터베이스에서 유사 사례를 조회하여 통계 계산
 */
export class VerificationEngine {
  /**
   * 견적 항목 검증
   * 현재는 목업 데이터 기반으로 검증
   * TODO: 데이터베이스에서 유사 차량/항목의 가격 데이터를 조회하여 통계 계산
   */
  static async verifyItem(
    item: EstimateItem,
    vehicleInfo: {
      manufacturer: string;
      model: string;
      year: number;
      mileage: number;
    }
  ): Promise<VerificationResult> {
    // TODO: 실제 데이터베이스 쿼리로 대체
    // 현재는 목업 데이터 기반 검증
    const mockData = this.getMockVerificationData(item.name);

    return {
      status: mockData.status,
      userPrice: item.totalCost,
      averagePrice: mockData.averagePrice,
      priceRange: mockData.priceRange,
      sampleCount: mockData.sampleCount,
      confidence: mockData.confidence,
      breakdown: {
        partCost: {
          user: item.partCost,
          average: mockData.breakdown.partCost.average,
        },
        laborCost: {
          user: item.laborCost,
          average: mockData.breakdown.laborCost.average,
        },
      },
    };
  }

  /**
   * 전체 견적서 검증
   */
  static async verifyEstimate(
    items: EstimateItem[],
    totalAmount: number,
    vehicleInfo: {
      manufacturer: string;
      model: string;
      year: number;
      mileage: number;
    }
  ): Promise<{
    status: VerificationStatus;
    confidence: number;
    items: Array<VerificationResult & { itemId: string }>;
  }> {
    const itemResults = await Promise.all(
      items.map(async (item) => ({
        itemId: item.id,
        ...(await this.verifyItem(item, vehicleInfo)),
      }))
    );

    // 전체 상태 결정 (가장 심각한 상태를 선택)
    let overallStatus: VerificationStatus = 'appropriate';
    let hasReviewNeeded = false;
    let hasRecheckRecommended = false;

    itemResults.forEach((result) => {
      if (result.status === 'recheck_recommended') {
        hasRecheckRecommended = true;
      } else if (result.status === 'review_needed') {
        hasReviewNeeded = true;
      }
    });

    if (hasRecheckRecommended) {
      overallStatus = 'recheck_recommended';
    } else if (hasReviewNeeded) {
      overallStatus = 'review_needed';
    }

    // 전체 신뢰도 계산 (항목별 신뢰도의 평균)
    const avgConfidence =
      itemResults.reduce((sum, r) => sum + r.confidence, 0) / itemResults.length;

    return {
      status: overallStatus,
      confidence: Math.round(avgConfidence),
      items: itemResults,
    };
  }

  /**
   * 목업 검증 데이터 (임시)
   * TODO: 실제 데이터베이스 쿼리로 대체
   */
  private static getMockVerificationData(itemName: string): {
    status: VerificationStatus;
    averagePrice: number;
    priceRange: { min: number; max: number; median: number };
    sampleCount: number;
    confidence: number;
    breakdown: {
      partCost: { average: number };
      laborCost: { average: number };
    };
  } {
    // 항목명에 따른 목업 데이터
    const mockDataMap: Record<string, any> = {
      '브레이크 패드 교체 (전륜)': {
        status: 'appropriate' as VerificationStatus,
        averagePrice: 155000,
        priceRange: { min: 130000, max: 180000, median: 155000 },
        sampleCount: 50,
        confidence: 85,
        breakdown: {
          partCost: { average: 115000 },
          laborCost: { average: 40000 },
        },
      },
      '브레이크 디스크 연마 (전륜)': {
        status: 'appropriate' as VerificationStatus,
        averagePrice: 24000,
        priceRange: { min: 20000, max: 30000, median: 24000 },
        sampleCount: 45,
        confidence: 80,
        breakdown: {
          partCost: { average: 0 },
          laborCost: { average: 24000 },
        },
      },
      '엔진오일 교환': {
        status: 'appropriate' as VerificationStatus,
        averagePrice: 95000,
        priceRange: { min: 80000, max: 120000, median: 95000 },
        sampleCount: 100,
        confidence: 90,
        breakdown: {
          partCost: { average: 55000 },
          laborCost: { average: 40000 },
        },
      },
      '인젝터 클리닝': {
        status: 'review_needed' as VerificationStatus,
        averagePrice: 150000,
        priceRange: { min: 120000, max: 180000, median: 150000 },
        sampleCount: 30,
        confidence: 75,
        breakdown: {
          partCost: { average: 0 },
          laborCost: { average: 150000 },
        },
      },
    };

    // 기본값 (매칭되는 항목이 없는 경우)
    return (
      mockDataMap[itemName] || {
        status: 'appropriate' as VerificationStatus,
        averagePrice: 100000,
        priceRange: { min: 80000, max: 120000, median: 100000 },
        sampleCount: 20,
        confidence: 70,
        breakdown: {
          partCost: { average: 60000 },
          laborCost: { average: 40000 },
        },
      }
    );
  }

  /**
   * 가격 비교를 통한 상태 결정
   */
  static determineStatus(
    userPrice: number,
    averagePrice: number,
    priceRange: { min: number; max: number; median: number }
  ): VerificationStatus {
    const deviation = (userPrice - averagePrice) / averagePrice;

    // 평균 대비 30% 이상 높으면 재검토 권장
    if (deviation > 0.3) {
      return 'recheck_recommended';
    }

    // 평균 대비 15% 이상 높으면 확인 필요
    if (deviation > 0.15) {
      return 'review_needed';
    }

    // 범위를 벗어나면 확인 필요
    if (userPrice > priceRange.max || userPrice < priceRange.min) {
      return 'review_needed';
    }

    return 'appropriate';
  }
}
