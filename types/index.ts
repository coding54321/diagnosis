/**
 * TypeScript 타입 정의
 */

// 견적서 관련 타입
export interface EstimateItem {
  id: string;
  name: string; // 정비 항목명 (견적서 원문 - 사용자 표시용)
  normalizedName?: string; // 블루핸즈 표준 작업명 (가격 비교용)
  partCost: number; // 부품비
  laborCost: number; // 공임비
  totalCost: number; // 총액
  category: string; // 카테고리 (엔진, 변속기, 제동 등)
}

export interface Estimate {
  id: string;
  vehicleId: string;
  shopName: string;
  items: EstimateItem[];
  totalAmount: number; // 총 견적 금액 (부가세 포함)
  createdAt: Date;
}

// 차량 관련 타입
export interface Vehicle {
  id: string;
  manufacturer: string; // 제조사
  model: string; // 차종
  variant?: string; // 세부 모델 (예: NX4)
  year: number; // 연식
  mileage: number; // 주행거리
  fuelType: string; // 연료 타입
}

// 검증 결과 관련 타입
export type VerificationStatus = 'appropriate' | 'review_needed' | 'recheck_recommended';

export interface PriceRange {
  min: number;
  max: number;
  median: number;
}

export interface CostBreakdown {
  partCost: {
    user: number;
    average: number;
  };
  laborCost: {
    user: number;
    average: number;
  };
}

export interface ItemVerification {
  itemId: string;
  status: VerificationStatus;
  userPrice: number;
  averagePrice: number;
  priceRange: PriceRange;
  sampleCount: number; // 비교 표본 수
  breakdown: CostBreakdown;
}

export interface VerificationResult {
  estimateId: string;
  totalAmount: number;
  status: VerificationStatus;
  items: ItemVerification[];
  confidence: number; // 데이터 신뢰도 (0-100)
}

// 검증 내역
export interface VerificationHistory {
  id: string;
  estimateId: string;
  date: Date;
  items: string; // 항목 요약 (예: "브레이크 패드 교체 외 1건")
  totalAmount: number;
  status: VerificationStatus;
  shopName?: string; // 정비소 이름
}
