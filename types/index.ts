/**
 * TypeScript 타입 정의
 */

// 정비소 유형 (DB shop_type과 동일: 블루핸즈, 오토큐, 공임나라, 스피드메이트, 기타)
export type ShopType = 'bluehands' | 'autoq' | 'gongimnara' | 'speedmate' | 'other';

// 비용 유형 (부품/공임/복합)
export type CostType = 'part' | 'labor' | 'combined';

// 부품 판정 상세 (WPC 기반)
export type PartVerdict = 'above_reference' | 'at_reference' | 'below_reference' | 'no_data';

// 공임 판정 상세 (FRT 기반)
export type LaborVerdict = 'above_expected' | 'at_expected' | 'below_expected' | 'no_data';

// 견적서 관련 타입
export interface EstimateItem {
  id: string;
  name: string; // 정비 항목명 (견적서 원문 - 사용자 표시용)
  normalizedName?: string; // 블루핸즈 표준 작업명 (가격 비교용)
  masterJobId?: string; // 정비항목 마스터 ID (예: BH_0057)
  partCost: number; // 부품비
  laborCost: number; // 공임비
  totalCost: number; // 총액
  category: string; // 카테고리 (엔진, 변속기, 제동 등)
}

export interface Estimate {
  id: string;
  vehicleId: string;
  shopName: string;
  shopType: ShopType; // 정비소 유형
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
  registration_number?: string | null; // 차량등록번호 (표시·구분용)
  nickname?: string | null; // 사용자 지정 별칭
}

// 검증 결과 관련 타입 (2단계: 적정 / 확인필요)
export type VerificationStatus = 'appropriate' | 'review_needed';

export interface PriceRange {
  min: number;
  max: number;
  median: number;
}

/** 부품 기준가 출처: wpc=WPC 순정가, market=시장/참고 평균 */
export type PartPriceSource = 'wpc' | 'market';

export interface CostBreakdown {
  partCost: {
    user: number;
    average: number;
    referencePrice?: number; // WPC 순정 기준가 (있는 경우)
    /** 블루핸즈/오토큐에서 WPC 매칭 시 'wpc' */
    partPriceSource?: PartPriceSource | null;
  };
  laborCost: {
    user: number;
    average: number;
    expectedLabor?: number; // FRT 기반 기대 공임 (있는 경우)
    frtHours?: number; // 표준정비시간 (시간)
  };
}

// 가이드 문구 정보
export interface VerificationGuide {
  partVerdict: PartVerdict;
  laborVerdict: LaborVerdict;
  partMessage?: string; // 부품 관련 가이드 문구
  laborMessage?: string; // 공임 관련 가이드 문구
  askMechanicTip?: string; // "정비사에게 이렇게 물어보세요" 문구
}

export interface ItemVerification {
  itemId: string;
  status: VerificationStatus;
  userPrice: number;
  averagePrice: number;
  priceRange: PriceRange;
  sampleCount: number; // 비교 표본 수
  breakdown: CostBreakdown;
  costType: CostType; // 부품/공임/복합
  guide?: VerificationGuide; // 가이드 정보
  /** 0원 무상수리 항목이면 true. 견적 비교 대상에서 제외 */
  isFreeRepair?: boolean;
}

export interface VerificationResult {
  estimateId: string;
  totalAmount: number;
  status: VerificationStatus;
  shopType: ShopType; // 정비소 유형
  items: ItemVerification[];
  confidence: number; // 데이터 신뢰도 (0-100)
  // 총액 부품/공임 분리 요약
  totalPartCost: number;
  totalLaborCost: number;
  totalPartCostAverage: number;
  totalLaborCostAverage: number;
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
  /** 해당 검증이 어떤 차량에 대한 것인지 (예: "현대 쏘나타 NX4") */
  vehicleLabel?: string;
}
