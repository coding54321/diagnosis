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
  confidence: 85, // 표본 수 기반 신뢰도
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
      breakdown: {
        partCost: {
          user: 120000,
          average: 115000,
        },
        laborCost: {
          user: 40000,
          average: 40000,
        },
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
