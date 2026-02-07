/**
 * 검증 엔진
 * 견적 항목의 적정성을 판단하는 로직
 *
 * 검증 전략:
 * 1. 부품비: WPC 순정 기준가 대비 비교 (정비소 유형별 판정 기준 다름)
 * 2. 공임비: FRT(표준정비시간) 기반 기대 공임 산출 후 비교
 * 3. 가이드: 정비소유형 × 판정결과 매트릭스에서 맞춤 문구 생성
 */

import type {
  EstimateItem,
  ShopType,
  CostType,
  PartVerdict,
  LaborVerdict,
  VerificationGuide,
  CostBreakdown,
  PriceRange,
} from '@/types';
import { lookupWpcPrice, findVehicleCode } from '@/lib/data/wpc-reference-parts';
import { lookupFrt } from '@/lib/data/frt-standards';
import { generateGuide } from './guide-messages';
import { isOfficialShop } from './shop-classifier';

// 2단계 검증 상태: 적정 / 확인필요
export type VerificationStatus = 'appropriate' | 'review_needed';

export interface VerificationResult {
  status: VerificationStatus;
  userPrice: number;
  averagePrice: number;
  priceRange: PriceRange;
  sampleCount: number;
  confidence: number;
  breakdown: CostBreakdown;
  costType: CostType;
  guide?: VerificationGuide;
  /** 0원 무상수리 항목: 견적 비교 대상 아님 */
  isFreeRepair?: boolean;
}

/** 공임 산출용 기본 시간당 요율 (정비소 유형 미분류 시 기본값) */
const DEFAULT_HOURLY_RATE = 80000; // 원/시간

/**
 * 비용 유형 판별
 */
function determineCostType(item: EstimateItem): CostType {
  if (item.partCost > 0 && item.laborCost === 0) return 'part';
  if (item.partCost === 0 && item.laborCost > 0) return 'labor';
  return 'combined';
}

/**
 * 부품비 판정
 */
function verifyPartCost(
  userPartCost: number,
  referencePrice: number | null,
  shopType: ShopType
): { verdict: PartVerdict; diffPercent: number } {
  if (!referencePrice || referencePrice <= 0 || userPartCost <= 0) {
    return { verdict: 'no_data', diffPercent: 0 };
  }

  const diff = userPartCost - referencePrice;
  const diffPercent = Math.round((diff / referencePrice) * 100);

  // 블루핸즈/오토큐: ±10% 이내 적정
  // 일반/공임나라: ±15% 이내 적정 (유통비 감안)
  const threshold = isOfficialShop(shopType) ? 10 : 15;

  if (diffPercent > threshold) {
    return { verdict: 'above_reference', diffPercent };
  }
  if (diffPercent < -threshold) {
    return { verdict: 'below_reference', diffPercent };
  }
  return { verdict: 'at_reference', diffPercent };
}

/**
 * 공임비 판정
 */
function verifyLaborCost(
  userLaborCost: number,
  frtHours: number | null
): { verdict: LaborVerdict; diffPercent: number; expectedLabor: number; frtHours: number | null } {
  if (!frtHours || frtHours <= 0 || userLaborCost <= 0) {
    return { verdict: 'no_data', diffPercent: 0, expectedLabor: 0, frtHours: null };
  }

  const expectedLabor = Math.round(frtHours * DEFAULT_HOURLY_RATE);
  const diff = userLaborCost - expectedLabor;
  const diffPercent = Math.round((diff / expectedLabor) * 100);

  // ±15% 이내 적정
  if (diffPercent > 15) {
    return { verdict: 'above_expected', diffPercent, expectedLabor, frtHours };
  }
  if (diffPercent < -15) {
    return { verdict: 'below_expected', diffPercent, expectedLabor, frtHours };
  }
  return { verdict: 'at_expected', diffPercent, expectedLabor, frtHours };
}

/**
 * 검증 엔진 클래스
 */
export class VerificationEngine {
  /**
   * 견적 항목 검증
   */
  static async verifyItem(
    item: EstimateItem,
    vehicleInfo: {
      manufacturer: string;
      model: string;
      variant?: string;
      year: number;
      mileage: number;
    },
    shopType: ShopType = 'other'
  ): Promise<VerificationResult> {
    // 0원 = 무상수리: 견적 비교 대상 아님
    const isFreeRepair = item.totalCost === 0;
    if (isFreeRepair) {
      return {
        status: 'appropriate',
        userPrice: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0, median: 0 },
        sampleCount: 0,
        confidence: 0,
        breakdown: {
          partCost: { user: 0, average: 0 },
          laborCost: { user: 0, average: 0 },
        },
        costType: 'combined',
        guide: {
          partVerdict: 'no_data',
          laborVerdict: 'no_data',
          partMessage: '무상수리 항목으로 견적 비교 대상이 아닙니다.',
        },
        isFreeRepair: true,
      };
    }

    const lookupName = item.normalizedName?.trim() || item.name;
    const costType = determineCostType(item);

    // 차종 코드 조회
    const vehicleCode = findVehicleCode(
      vehicleInfo.manufacturer,
      vehicleInfo.model,
      vehicleInfo.variant
    );

    // ── 부품비 검증 (WPC) ──
    let referencePrice: number | null = null;
    let partResult = { verdict: 'no_data' as PartVerdict, diffPercent: 0 };

    if (vehicleCode && item.partCost > 0) {
      const wpcPart = lookupWpcPrice(lookupName, vehicleCode);
      if (wpcPart) {
        referencePrice = wpcPart.referencePrice;
        partResult = verifyPartCost(item.partCost, referencePrice, shopType);
      }
    }

    // ── 공임비 검증 (FRT) ──
    let laborResult = { verdict: 'no_data' as LaborVerdict, diffPercent: 0, expectedLabor: 0, frtHours: null as number | null };

    if (vehicleCode && item.laborCost > 0) {
      const frtHours = lookupFrt(lookupName, vehicleCode);
      laborResult = verifyLaborCost(item.laborCost, frtHours);
    }

    // ── 종합 상태 결정 ──
    let status: VerificationStatus = 'appropriate';

    if (costType === 'part') {
      // 부품 전용: 부품 판정만
      if (partResult.verdict === 'above_reference') status = 'review_needed';
    } else if (costType === 'labor') {
      // 공임 전용: 공임 판정만
      if (laborResult.verdict === 'above_expected') status = 'review_needed';
    } else {
      // 복합: 둘 중 하나라도 주의면 확인필요
      if (partResult.verdict === 'above_reference' || laborResult.verdict === 'above_expected') {
        status = 'review_needed';
      }
    }

    // ── 가격 범위 산출 ──
    // WPC/FRT 기반으로 합리적인 범위 생성
    const avgPrice = this.calculateAveragePrice(item, referencePrice, laborResult.expectedLabor);
    const priceRange = this.calculatePriceRange(avgPrice, item.totalCost);

    // ── 가이드 문구 생성 ──
    const guide = generateGuide(
      shopType,
      partResult.verdict,
      laborResult.verdict,
      item.name,
      partResult.diffPercent,
      laborResult.diffPercent,
      laborResult.frtHours ?? undefined
    );

    // ── 신뢰도 산출 ──
    const confidence = this.calculateConfidence(
      referencePrice !== null,
      laborResult.frtHours !== null,
      vehicleCode !== null
    );

    return {
      status,
      userPrice: item.totalCost,
      averagePrice: avgPrice,
      priceRange,
      sampleCount: referencePrice ? 50 : 20, // WPC 데이터 있으면 높은 표본
      confidence,
      breakdown: {
        partCost: {
          user: item.partCost,
          average: referencePrice ?? item.partCost,
          referencePrice: referencePrice ?? undefined,
          partPriceSource:
            referencePrice != null && isOfficialShop(shopType) ? 'wpc' : undefined,
        },
        laborCost: {
          user: item.laborCost,
          average: laborResult.expectedLabor || item.laborCost,
          expectedLabor: laborResult.expectedLabor || undefined,
          frtHours: laborResult.frtHours ?? undefined,
        },
      },
      costType,
      guide,
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
      variant?: string;
      year: number;
      mileage: number;
    },
    shopType: ShopType = 'other'
  ): Promise<{
    status: VerificationStatus;
    confidence: number;
    shopType: ShopType;
    items: Array<VerificationResult & { itemId: string }>;
    totalPartCost: number;
    totalLaborCost: number;
    totalPartCostAverage: number;
    totalLaborCostAverage: number;
  }> {
    const itemResults = await Promise.all(
      items.map(async (item) => ({
        itemId: item.id,
        ...(await this.verifyItem(item, vehicleInfo, shopType)),
      }))
    );

    // 비교 대상: 비용이 0원이 아닌 항목만 (무상수리 제외)
    const comparableResults = itemResults.filter((r) => !r.isFreeRepair);
    const comparableCount = comparableResults.length;

    // 전체 상태 결정: 무상수리 제외한 유료 항목만 반영
    let overallStatus: VerificationStatus = 'appropriate';
    comparableResults.forEach((result) => {
      if (result.status === 'review_needed') {
        overallStatus = 'review_needed';
      }
    });

    // 전체 신뢰도: 비교 대상 항목만 평균
    const avgConfidence =
      comparableCount > 0
        ? comparableResults.reduce((sum, r) => sum + r.confidence, 0) / comparableCount
        : 0;

    // 총 부품비/공임비 집계 (전체 견적 금액은 그대로)
    const totalPartCost = items.reduce((sum, i) => sum + i.partCost, 0);
    const totalLaborCost = items.reduce((sum, i) => sum + i.laborCost, 0);
    // 참고 평균은 유료 항목만 합산 (무상수리 제외하여 견적 비교)
    const totalPartCostAverage = comparableResults.reduce(
      (sum, r) => sum + r.breakdown.partCost.average, 0
    );
    const totalLaborCostAverage = comparableResults.reduce(
      (sum, r) => sum + r.breakdown.laborCost.average, 0
    );

    return {
      status: overallStatus,
      confidence: Math.round(avgConfidence),
      shopType,
      items: itemResults,
      totalPartCost,
      totalLaborCost,
      totalPartCostAverage,
      totalLaborCostAverage,
    };
  }

  /**
   * 평균 가격 산출
   */
  private static calculateAveragePrice(
    item: EstimateItem,
    referencePrice: number | null,
    expectedLabor: number
  ): number {
    const partAvg = referencePrice ?? item.partCost;
    const laborAvg = expectedLabor > 0 ? expectedLabor : item.laborCost;
    return partAvg + laborAvg;
  }

  /**
   * 가격 범위 산출
   */
  private static calculatePriceRange(averagePrice: number, userPrice: number): PriceRange {
    const spread = averagePrice * 0.25; // ±25% 범위
    return {
      min: Math.max(0, Math.round(averagePrice - spread)),
      max: Math.round(averagePrice + spread),
      median: averagePrice,
    };
  }

  /**
   * 신뢰도 산출
   */
  private static calculateConfidence(
    hasWpcData: boolean,
    hasFrtData: boolean,
    hasVehicleCode: boolean
  ): number {
    let confidence = 50; // 기본

    if (hasVehicleCode) confidence += 15;
    if (hasWpcData) confidence += 20;
    if (hasFrtData) confidence += 15;

    return Math.min(100, confidence);
  }

  /**
   * 가격 비교를 통한 상태 결정 (하위 호환)
   */
  static determineStatus(
    userPrice: number,
    averagePrice: number,
    priceRange: { min: number; max: number; median: number }
  ): VerificationStatus {
    const deviation = (userPrice - averagePrice) / averagePrice;

    if (deviation > 0.15) {
      return 'review_needed';
    }

    if (userPrice > priceRange.max) {
      return 'review_needed';
    }

    return 'appropriate';
  }
}
