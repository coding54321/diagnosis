/**
 * 검증 가이드 문구 생성
 * 정비소 유형 × 부품/공임 판정 결과에 따른 맞춤 가이드 문구
 */

import type { ShopType, PartVerdict, LaborVerdict, VerificationGuide } from '@/types';
import { isOfficialShop } from './shop-classifier';

/**
 * 부품비 가이드 문구 생성
 */
function getPartMessage(shopType: ShopType, verdict: PartVerdict, diffPercent?: number): string | undefined {
  if (verdict === 'no_data') {
    return '해당 부품의 순정 기준가 데이터가 없어 비교가 어렵습니다.';
  }

  const official = isOfficialShop(shopType);
  const pct = diffPercent ? `약 ${Math.abs(diffPercent)}%` : '';

  if (official) {
    // 블루핸즈 / 오토큐: WPC 순정가가 공개되어 있어 부품이 거의 확정적 → 정확 비용 표시 + 과다 시 가이드
    switch (verdict) {
      case 'above_reference':
        return '이 부품이 사용되었을 가능성이 높습니다. 가격이 다르다면 정비사님께 부품번호 확인을 요청해보세요.';
      case 'at_reference':
        return '순정 부품 가격과 일치합니다.';
      case 'below_reference':
        return '순정 부품 권장가보다 저렴합니다. 할인이 적용되었을 수 있습니다.';
    }
  } else if (shopType === 'gongimnara') {
    switch (verdict) {
      case 'above_reference':
        return `순정 부품 권장가보다 ${pct} 높게 책정되었습니다. 공임나라는 부품을 별도 공급받는 경우가 있어 유통비가 포함되었을 수 있습니다.`;
      case 'at_reference':
        return '순정 부품 수준으로 적정하게 책정되었습니다.';
      case 'below_reference':
        return '순정 대비 저렴한 애프터마켓 부품이 사용되었을 가능성이 있습니다. 부품 제조사를 확인해보세요.';
    }
  } else {
    // 일반 정비소
    switch (verdict) {
      case 'above_reference':
        return `순정 부품 권장 소비자가보다 ${pct} 높게 책정되었습니다. 정비소의 자체 마진이나 유통비가 포함되었는지 확인이 필요합니다.`;
      case 'at_reference':
        return '순정 부품 가격 수준으로 투명하게 책정되었습니다.';
      case 'below_reference':
        return '순정 대비 저렴한 애프터마켓 부품(상신, 홍성 등) 또는 재생 부품이 사용되었을 가능성이 높습니다. 부품 제조사를 확인해보세요.';
    }
  }
}

/**
 * 공임비 가이드 문구 생성
 */
function getLaborMessage(verdict: LaborVerdict, frtHours?: number, diffPercent?: number): string | undefined {
  if (verdict === 'no_data') {
    return '해당 작업의 표준정비시간 데이터가 없어 공임 비교가 어렵습니다.';
  }

  const pct = diffPercent ? `약 ${Math.abs(diffPercent)}%` : '';
  const frtText = frtHours ? ` (표준 ${frtHours}시간)` : '';

  switch (verdict) {
    case 'above_expected':
      return `표준 작업시간 기준${frtText} 대비 ${pct} 높게 책정되었습니다. 추가 작업(고착, 분해 등)이 있었는지 확인해보세요.`;
    case 'at_expected':
      return `표준 작업시간 기준${frtText} 적정 수준입니다.`;
    case 'below_expected':
      return `표준 작업시간 기준${frtText} 대비 저렴하게 책정되었습니다.`;
  }
}

/**
 * "정비사에게 이렇게 물어보세요" 팁 생성
 */
function getAskMechanicTip(
  shopType: ShopType,
  partVerdict: PartVerdict,
  laborVerdict: LaborVerdict,
  itemName: string
): string | undefined {
  // 부품이 싼데 공임이 비싼 경우 (조합) — 먼저 검사
  if (partVerdict === 'below_reference' && laborVerdict === 'above_expected') {
    return '"부품은 순정 대비 저렴한데 공임이 조금 높은 것 같습니다. 어떤 부품을 사용하셨는지, 작업에 추가 공정이 있었는지 확인할 수 있을까요?"';
  }

  // 부품이 비싼 경우
  if (partVerdict === 'above_reference') {
    if (isOfficialShop(shopType)) {
      return `"${itemName}에 적용된 부품번호가 무엇인지, 정비 명세서에 기재해 주실 수 있을까요?"`;
    }
    return `"순정 부품 권장가보다 조금 높게 책정된 것 같은데, 혹시 다른 프리미엄 부품을 사용하신 건가요?"`;
  }

  // 공임이 비싼 경우
  if (laborVerdict === 'above_expected') {
    return `"${itemName} 작업 시 추가로 분해하거나 어려운 부분이 있었나요? 작업 내용을 좀 더 자세히 알 수 있을까요?"`;
  }

  return undefined;
}

/**
 * 종합 가이드 정보 생성
 */
export function generateGuide(
  shopType: ShopType,
  partVerdict: PartVerdict,
  laborVerdict: LaborVerdict,
  itemName: string,
  partDiffPercent?: number,
  laborDiffPercent?: number,
  frtHours?: number
): VerificationGuide {
  return {
    partVerdict,
    laborVerdict,
    partMessage: getPartMessage(shopType, partVerdict, partDiffPercent),
    laborMessage: getLaborMessage(laborVerdict, frtHours, laborDiffPercent),
    askMechanicTip: getAskMechanicTip(shopType, partVerdict, laborVerdict, itemName),
  };
}
