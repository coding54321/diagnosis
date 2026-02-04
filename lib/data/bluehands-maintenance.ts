/**
 * 블루핸즈 표준 작업 목록 데이터
 * 기준 데이터: Supabase public.maintenance_standard_items (bluehands_maintenance.csv 마이그레이션)
 * CSV 파싱(parseBluehandsMaintenanceCSV)은 시드/오프라인용 또는 DB 조회 전 목록 구성용
 */

export interface BluehandsMaintenanceItem {
  category: '기능정비' | '판금도장';
  no: number;
  name: string;
  // 차종별 표준 작업 시간은 필요시 추가
}

/**
 * CSV 데이터를 파싱하여 작업 목록으로 변환
 */
export function parseBluehandsMaintenanceCSV(csvText: string): BluehandsMaintenanceItem[] {
  const lines = csvText.trim().split('\n');
  const items: BluehandsMaintenanceItem[] = [];

  // 헤더 제외하고 파싱
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    
    if (parts.length < 3) continue;

    const category = parts[0] as '기능정비' | '판금도장';
    const no = parseInt(parts[1], 10);
    const name = parts[2]?.trim();

    if (category && !isNaN(no) && name) {
      items.push({ category, no, name });
    }
  }

  return items;
}

/**
 * 작업명에서 키워드를 추출하여 검색 가능한 형태로 변환
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')
    .replace(/lh|rh/gi, '')
    .replace(/양쪽/gi, '')
    .replace(/어셈블리/gi, '')
    .replace(/교체/gi, '')
    .replace(/수리/gi, '')
    .replace(/도장/gi, '')
    .replace(/판금/gi, '');
}

/**
 * OCR로 추출한 항목명을 블루핸즈 표준 작업명과 매칭
 * @param ocrItemName OCR로 추출한 항목명
 * @param maintenanceItems 블루핸즈 표준 작업 목록
 * @returns 매칭된 작업 정보 또는 null
 */
export function matchToBluehandsMaintenance(
  ocrItemName: string,
  maintenanceItems: BluehandsMaintenanceItem[]
): BluehandsMaintenanceItem | null {
  const normalizedOcr = normalizeItemName(ocrItemName);
  
  // 정확한 매칭 시도
  for (const item of maintenanceItems) {
    const normalizedItem = normalizeItemName(item.name);
    if (normalizedOcr === normalizedItem || normalizedOcr.includes(normalizedItem) || normalizedItem.includes(normalizedOcr)) {
      return item;
    }
  }

  // 부분 매칭 시도 (키워드 기반)
  const ocrKeywords = normalizedOcr.split(/[\/\-\s]/).filter(k => k.length > 2);
  
  for (const item of maintenanceItems) {
    const normalizedItem = normalizeItemName(item.name);
    const itemKeywords = normalizedItem.split(/[\/\-\s]/).filter(k => k.length > 2);
    
    // 키워드가 50% 이상 일치하면 매칭
    const matchedKeywords = ocrKeywords.filter(k => itemKeywords.some(ik => ik.includes(k) || k.includes(ik)));
    if (matchedKeywords.length >= Math.ceil(ocrKeywords.length * 0.5)) {
      return item;
    }
  }

  return null;
}

/**
 * 블루핸즈 카테고리를 우리 앱 카테고리로 매핑
 */
export function mapBluehandsCategoryToAppCategory(
  bluehandsCategory: '기능정비' | '판금도장',
  itemName: string
): string {
  // 판금도장은 항상 "기타"로 분류
  if (bluehandsCategory === '판금도장') {
    return '기타';
  }

  // 기능정비는 작업명에서 세부 카테고리 추론
  const name = itemName.toLowerCase();
  
  if (name.includes('엔진') || name.includes('오일') || name.includes('필터') || name.includes('에어클리너') || name.includes('스파크')) {
    return '엔진';
  }
  if (name.includes('브레이크') || name.includes('제동') || name.includes('패드') || name.includes('디스크')) {
    return '제동';
  }
  if (name.includes('변속기') || name.includes('미션') || name.includes('클러치') || name.includes('트랜스')) {
    return '변속기';
  }
  if (name.includes('배터리') || name.includes('전기') || name.includes('라이트') || name.includes('전구') || name.includes('램프')) {
    return '전기';
  }
  if (name.includes('냉각') || name.includes('라디에이터') || name.includes('워터펌프') || name.includes('부동액')) {
    return '냉각';
  }
  if (name.includes('배기') || name.includes('머플러') || name.includes('촉매')) {
    return '배기';
  }
  
  return '기타';
}
