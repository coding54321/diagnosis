/**
 * 목업 데이터
 * 프로토타입 개발을 위한 샘플 데이터
 */

import type { Estimate, EstimateItem, VerificationResult, ItemVerification } from '@/types';

// 샘플 차량 정보
export const mockVehicle = {
  id: 'vehicle-1',
  manufacturer: '현대',
  model: '투싼',
  variant: 'NX4',
  year: 2022,
  mileage: 45000,
  fuelType: '가솔린',
};

// 샘플 견적서
export const mockEstimate: Estimate = {
  id: 'estimate-1',
  vehicleId: 'vehicle-1',
  shopName: '블루핸즈 강남점',
  shopType: 'bluehands',
  items: [
    {
      id: 'item-1',
      name: '브레이크 패드 교체 (전륜)',
      partCost: 120000,
      laborCost: 40000,
      totalCost: 160000,
      category: '제동 계통',
    },
    {
      id: 'item-2',
      name: '브레이크 디스크 연마 (전륜)',
      partCost: 0,
      laborCost: 25000,
      totalCost: 25000,
      category: '제동 계통',
    },
  ],
  totalAmount: 203500, // 부가세 포함
  createdAt: new Date('2025-01-28'),
};

// 샘플 검증 결과
export const mockVerificationResult: VerificationResult = {
  estimateId: 'estimate-1',
  totalAmount: 203500,
  status: 'appropriate',
  shopType: 'bluehands',
  confidence: 85,
  totalPartCost: 120000,
  totalLaborCost: 65000,
  totalPartCostAverage: 115000,
  totalLaborCostAverage: 64000,
  items: [
    {
      itemId: 'item-1',
      status: 'appropriate',
      userPrice: 160000,
      averagePrice: 155000,
      priceRange: {
        min: 130000,
        max: 180000,
        median: 155000,
      },
      sampleCount: 50,
      costType: 'combined',
      breakdown: {
        partCost: {
          user: 120000,
          average: 115000,
          referencePrice: 115000,
        },
        laborCost: {
          user: 40000,
          average: 40000,
        },
      },
      guide: {
        partVerdict: 'at_reference',
        laborVerdict: 'at_expected',
        partMessage: '순정 부품 가격과 일치합니다.',
        laborMessage: '표준 작업시간 기준 적정 수준입니다.',
      },
    },
    {
      itemId: 'item-2',
      status: 'appropriate',
      userPrice: 25000,
      averagePrice: 24000,
      priceRange: {
        min: 20000,
        max: 30000,
        median: 24000,
      },
      sampleCount: 45,
      costType: 'labor',
      breakdown: {
        partCost: {
          user: 0,
          average: 0,
        },
        laborCost: {
          user: 25000,
          average: 24000,
        },
      },
      guide: {
        partVerdict: 'no_data',
        laborVerdict: 'at_expected',
        laborMessage: '표준 작업시간 기준 적정 수준입니다.',
      },
    },
  ],
};

// 최근 검증 내역
import type { VerificationHistory } from '@/types';

export const mockRecentHistory: VerificationHistory[] = [
  {
    id: 'history-1',
    estimateId: 'estimate-1',
    date: new Date('2025-01-28'),
    items: '브레이크 패드 교체 외 1건',
    totalAmount: 203500,
    status: 'appropriate',
    shopName: '블루핸즈 강남점',
  },
  {
    id: 'history-2',
    estimateId: 'estimate-2',
    date: new Date('2025-01-15'),
    items: '엔진오일 교환',
    totalAmount: 95000,
    status: 'appropriate',
    shopName: '블루핸즈 서초점',
  },
  {
    id: 'history-3',
    estimateId: 'estimate-3',
    date: new Date('2024-12-20'),
    items: '인젝터 클리닝 외 2건',
    totalAmount: 320000,
    status: 'review_needed',
    shopName: '오토큐 역삼점',
  },
];

// 비슷한차 정비결과 (항목 상세 바텀시트용)
export interface SimilarRepairCase {
  id: string;
  year: number;
  mileage: string;
  variant: string;
  totalCost: number;
  partCost: number;
  laborCost: number;
  shopType: string;
}

/** 항목 ID별 비슷한차 정비결과 목업 */
export const mockSimilarRepairCases: Record<string, SimilarRepairCase[]> = {
  'item-1': [
    { id: 'sr-1', year: 2022, mileage: '3만km', variant: '1.6 터보 프리미엄', totalCost: 145000, partCost: 108000, laborCost: 37000, shopType: '블루핸즈' },
    { id: 'sr-2', year: 2021, mileage: '4만km', variant: '1.6 터보 모던', totalCost: 158000, partCost: 118000, laborCost: 40000, shopType: '블루핸즈' },
    { id: 'sr-3', year: 2023, mileage: '2만km', variant: '1.6 터보 프리미엄', totalCost: 140000, partCost: 105000, laborCost: 35000, shopType: '오토큐' },
    { id: 'sr-4', year: 2022, mileage: '5만km', variant: '2.0 프리미엄', totalCost: 170000, partCost: 125000, laborCost: 45000, shopType: '블루핸즈' },
    { id: 'sr-5', year: 2021, mileage: '6만km', variant: '1.6 터보 모던', totalCost: 162000, partCost: 120000, laborCost: 42000, shopType: '공임나라' },
    { id: 'sr-6', year: 2023, mileage: '1만km', variant: '1.6 터보 인스퍼레이션', totalCost: 138000, partCost: 103000, laborCost: 35000, shopType: '블루핸즈' },
    { id: 'sr-7', year: 2022, mileage: '4만km', variant: '2.0 모던', totalCost: 155000, partCost: 115000, laborCost: 40000, shopType: '오토큐' },
    { id: 'sr-8', year: 2021, mileage: '7만km', variant: '1.6 터보 프리미엄', totalCost: 175000, partCost: 128000, laborCost: 47000, shopType: '블루핸즈' },
  ],
  'item-2': [
    { id: 'sr-9', year: 2022, mileage: '3만km', variant: '1.6 터보 프리미엄', totalCost: 22000, partCost: 0, laborCost: 22000, shopType: '블루핸즈' },
    { id: 'sr-10', year: 2021, mileage: '5만km', variant: '1.6 터보 모던', totalCost: 25000, partCost: 0, laborCost: 25000, shopType: '블루핸즈' },
    { id: 'sr-11', year: 2023, mileage: '2만km', variant: '2.0 프리미엄', totalCost: 20000, partCost: 0, laborCost: 20000, shopType: '오토큐' },
    { id: 'sr-12', year: 2022, mileage: '4만km', variant: '1.6 터보 모던', totalCost: 28000, partCost: 0, laborCost: 28000, shopType: '공임나라' },
    { id: 'sr-13', year: 2021, mileage: '6만km', variant: '1.6 터보 프리미엄', totalCost: 26000, partCost: 0, laborCost: 26000, shopType: '블루핸즈' },
  ],
};

/** itemId에 맞는 비슷한차 정비결과를 반환 (없으면 기본 데이터) */
export function getSimilarRepairCases(itemId: string): SimilarRepairCase[] {
  if (mockSimilarRepairCases[itemId]) {
    return mockSimilarRepairCases[itemId];
  }
  // 기본 폴백 데이터
  return [
    { id: 'sr-f1', year: 2022, mileage: '3만km', variant: '1.6 터보 프리미엄', totalCost: 120000, partCost: 85000, laborCost: 35000, shopType: '블루핸즈' },
    { id: 'sr-f2', year: 2021, mileage: '5만km', variant: '1.6 터보 모던', totalCost: 135000, partCost: 95000, laborCost: 40000, shopType: '블루핸즈' },
    { id: 'sr-f3', year: 2023, mileage: '2만km', variant: '2.0 프리미엄', totalCost: 115000, partCost: 80000, laborCost: 35000, shopType: '오토큐' },
    { id: 'sr-f4', year: 2022, mileage: '4만km', variant: '1.6 터보 모던', totalCost: 140000, partCost: 98000, laborCost: 42000, shopType: '공임나라' },
    { id: 'sr-f5', year: 2021, mileage: '6만km', variant: '2.0 모던', totalCost: 128000, partCost: 90000, laborCost: 38000, shopType: '블루핸즈' },
    { id: 'sr-f6', year: 2023, mileage: '1만km', variant: '1.6 터보 인스퍼레이션', totalCost: 110000, partCost: 78000, laborCost: 32000, shopType: '블루핸즈' },
  ];
}

// 정비 항목 카테고리
export const maintenanceCategories = [
  '엔진 계통',
  '변속기 계통',
  '구동/조향 계통',
  '제동 계통',
  '전기/전장 계통',
  '외장/차체',
  '정기 점검/소모품',
] as const;

// 인기 정비 항목 (자동완성용)
export const popularItems = [
  '브레이크 패드 교체 (전륜)',
  '브레이크 패드 교체 (후륜)',
  '브레이크 디스크 교체',
  '브레이크 디스크 연마',
  '엔진오일 교환',
  '에어컨 필터 교체',
  '연료 필터 교체',
  '배터리 교체',
  '타이어 교체',
  '인젝터 클리닝',
  '냉각수 교환',
  '변속기 오일 교환',
] as const;

// 제조사 목록
export const manufacturers = ['현대', '기아', '제네시스', '쉐보레', '르노삼성'] as const;

// 현대 차종 목록 (샘플)
export const hyundaiModels = [
  '투싼',
  '싼타페',
  '팰리세이드',
  '코나',
  '아이오닉',
  '넥소',
  '캐스퍼',
  '아반떼',
  '소나타',
  '그랜저',
] as const;

// 기아 차종 목록 (샘플)
export const kiaModels = [
  '스포티지',
  '쏘렌토',
  '모하비',
  '니로',
  'EV6',
  '레이',
  'K3',
  'K5',
  'K7',
  'K9',
] as const;
