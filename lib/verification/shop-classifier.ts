/**
 * 정비소 유형 자동 분류
 * 상호명 기반으로 정비소 유형을 판별
 */

import type { ShopType } from '@/types';

/** 블루핸즈 (현대 공식 서비스) 키워드 */
const BLUEHANDS_KEYWORDS = [
  '블루핸즈',
  'bluehands',
  'blue hands',
  '현대자동차서비스',
  '현대서비스센터',
  '현대자동차정비',
  '현대오토에버',
];

/** 오토큐 (기아 공식 서비스) 키워드 */
const AUTOQ_KEYWORDS = [
  '오토큐',
  'autoq',
  'auto q',
  '기아자동차서비스',
  '기아서비스센터',
  '기아자동차정비',
];

/** 공임나라 키워드 */
const GONGIMNARA_KEYWORDS = [
  '공임나라',
  '공임 나라',
];

/** 스피드메이트 키워드 */
const SPEEDMATE_KEYWORDS = [
  '스피드메이트',
  'speedmate',
  'speed mate',
];

/**
 * 상호명에서 정비소 유형을 자동 분류 (DB shop_type과 동일: bluehands, autoq, gongimnara, speedmate, other)
 */
export function classifyShopType(shopName: string): ShopType {
  if (!shopName) return 'other';

  const normalized = shopName
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();

  // 블루핸즈 체크
  for (const keyword of BLUEHANDS_KEYWORDS) {
    if (normalized.includes(keyword.replace(/\s+/g, ''))) {
      return 'bluehands';
    }
  }

  // 오토큐 체크
  for (const keyword of AUTOQ_KEYWORDS) {
    if (normalized.includes(keyword.replace(/\s+/g, ''))) {
      return 'autoq';
    }
  }

  // 공임나라 체크
  for (const keyword of GONGIMNARA_KEYWORDS) {
    if (normalized.includes(keyword.replace(/\s+/g, ''))) {
      return 'gongimnara';
    }
  }

  // 스피드메이트 체크
  for (const keyword of SPEEDMATE_KEYWORDS) {
    if (normalized.includes(keyword.replace(/\s+/g, ''))) {
      return 'speedmate';
    }
  }

  // 추가: 현대/기아 딜러 패턴 (예: "○○현대자동차서비스", "석촌현대자동차서비스")
  if (/현대자동차/.test(shopName) || /hyundai/i.test(shopName)) {
    return 'bluehands';
  }
  if (/기아자동차/.test(shopName) || /kia/i.test(shopName)) {
    return 'autoq';
  }

  return 'other';
}

/**
 * 정비소 유형 한글 라벨
 */
export function getShopTypeLabel(shopType: ShopType): string {
  const labels: Record<ShopType, string> = {
    bluehands: '블루핸즈 (현대 공식)',
    autoq: '오토큐 (기아 공식)',
    gongimnara: '공임나라',
    speedmate: '스피드메이트',
    other: '기타',
  };
  return labels[shopType];
}

/**
 * 공식 정비소 여부 (WPC 1:1 매칭 가능)
 */
export function isOfficialShop(shopType: ShopType): boolean {
  return shopType === 'bluehands' || shopType === 'autoq';
}
