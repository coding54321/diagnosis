/**
 * WPC (Warranty Parts Catalog) 부품 기준가 참조 데이터
 * 현대모비스 순정 부품 권장 소비자가격 기준
 *
 * NOTE: 실제 운영 시에는 WPC API 또는 DB 테이블로 대체
 * 현재는 더미 데이터로 주요 정비 항목의 순정 부품가를 제공
 */

export interface WpcReferencePart {
  partName: string; // 정규화된 부품명
  partNumber?: string; // 모비스 부품번호 (참고용)
  referencePrice: number; // 순정 권장 소비자가 (원)
  category: string; // 카테고리
  keywords: string[]; // OCR 매칭용 키워드
}

export interface VehicleModelInfo {
  manufacturer: '현대' | '기아' | '제네시스';
  model: string; // 모델명
  code: string; // 차량 코드 (예: TL, LF)
  aliases: string[]; // 대체 이름 (OCR 매칭용)
}

// ─── 현대/기아/제네시스 전차종 목록 ───

export const VEHICLE_MODELS: VehicleModelInfo[] = [
  // 현대
  { manufacturer: '현대', model: '캐스퍼', code: 'AX1', aliases: ['캐스퍼', 'CASPER'] },
  { manufacturer: '현대', model: '엑센트', code: 'RB', aliases: ['엑센트', '액센트', 'ACCENT'] },
  { manufacturer: '현대', model: '베르나', code: 'HC', aliases: ['베르나', 'VERNA'] },
  { manufacturer: '현대', model: '아반떼', code: 'CN7', aliases: ['아반떼', 'AVANTE', '아반테'] },
  { manufacturer: '현대', model: '아반떼 AD', code: 'AD', aliases: ['아반떼AD', 'AVANTE AD'] },
  { manufacturer: '현대', model: '아반떼 MD', code: 'MD', aliases: ['아반떼MD', 'AVANTE MD'] },
  { manufacturer: '현대', model: 'i30', code: 'PD', aliases: ['i30', '아이서티'] },
  { manufacturer: '현대', model: '아이오닉 HEV', code: 'AE', aliases: ['아이오닉', 'IONIQ', '아이오닉HEV'] },
  { manufacturer: '현대', model: '아이오닉5', code: 'NE', aliases: ['아이오닉5', 'IONIQ5'] },
  { manufacturer: '현대', model: '아이오닉6', code: 'CE', aliases: ['아이오닉6', 'IONIQ6'] },
  { manufacturer: '현대', model: 'i40', code: 'VF', aliases: ['i40', '아이포티'] },
  { manufacturer: '현대', model: '쏘나타 DN8', code: 'DN8', aliases: ['쏘나타', 'SONATA', '쏘나타DN8'] },
  { manufacturer: '현대', model: '쏘나타 LF', code: 'LF', aliases: ['쏘나타LF', 'SONATA LF'] },
  { manufacturer: '현대', model: '쏘나타 YF', code: 'YF', aliases: ['쏘나타YF', 'SONATA YF'] },
  { manufacturer: '현대', model: '그랜저 GN7', code: 'GN7', aliases: ['그랜저', 'GRANDEUR', '그랜져'] },
  { manufacturer: '현대', model: '그랜저 IG', code: 'IG', aliases: ['그랜저IG', 'GRANDEUR IG'] },
  { manufacturer: '현대', model: '그랜저 HG', code: 'HG', aliases: ['그랜저HG', 'GRANDEUR HG'] },
  { manufacturer: '현대', model: '코나', code: 'SX2', aliases: ['코나', 'KONA'] },
  { manufacturer: '현대', model: '코나 OS', code: 'OS', aliases: ['코나OS', 'KONA OS'] },
  { manufacturer: '현대', model: '베뉴', code: 'QX', aliases: ['베뉴', 'VENUE'] },
  { manufacturer: '현대', model: '투싼 NX4', code: 'NX4', aliases: ['투싼', 'TUCSON', '투싼NX4', '투산'] },
  { manufacturer: '현대', model: '투싼 TL', code: 'TL', aliases: ['투싼TL', 'TUCSON TL'] },
  { manufacturer: '현대', model: '싼타페 MX5', code: 'MX5', aliases: ['싼타페', 'SANTAFE', '산타페'] },
  { manufacturer: '현대', model: '싼타페 TM', code: 'TM', aliases: ['싼타페TM', 'SANTAFE TM'] },
  { manufacturer: '현대', model: '싼타페 DM', code: 'DM', aliases: ['싼타페DM', 'SANTAFE DM'] },
  { manufacturer: '현대', model: '팰리세이드', code: 'LX2', aliases: ['팰리세이드', 'PALISADE', '펠리세이드'] },
  { manufacturer: '현대', model: '스타리아', code: 'US4', aliases: ['스타리아', 'STARIA'] },
  { manufacturer: '현대', model: '그랜드 스타렉스', code: 'TQ', aliases: ['스타렉스', 'STAREX', '그랜드스타렉스'] },
  { manufacturer: '현대', model: '포터2', code: 'HR', aliases: ['포터', 'PORTER', '포터2'] },
  // 기아
  { manufacturer: '기아', model: '모닝', code: 'JA', aliases: ['모닝', 'MORNING', '올뉴모닝'] },
  { manufacturer: '기아', model: '레이', code: 'TAM', aliases: ['레이', 'RAY'] },
  { manufacturer: '기아', model: 'K3', code: 'BD', aliases: ['K3', '케이쓰리', '포르테'] },
  { manufacturer: '기아', model: 'K5 DL3', code: 'DL3', aliases: ['K5', '케이파이브'] },
  { manufacturer: '기아', model: 'K5 JF', code: 'JF', aliases: ['K5 JF', '옵티마'] },
  { manufacturer: '기아', model: 'K8', code: 'GL3', aliases: ['K8', '케이에이트'] },
  { manufacturer: '기아', model: 'K9', code: 'RJ', aliases: ['K9', '케이나인', 'K900'] },
  { manufacturer: '기아', model: '스팅어', code: 'CK', aliases: ['스팅어', 'STINGER'] },
  { manufacturer: '기아', model: '니로 HEV', code: 'DE', aliases: ['니로', 'NIRO'] },
  { manufacturer: '기아', model: '니로 EV', code: 'SG2', aliases: ['니로EV', 'NIRO EV'] },
  { manufacturer: '기아', model: 'EV6', code: 'CV', aliases: ['EV6', '이브이식스'] },
  { manufacturer: '기아', model: 'EV9', code: 'MV', aliases: ['EV9', '이브이나인'] },
  { manufacturer: '기아', model: '셀토스', code: 'SP2', aliases: ['셀토스', 'SELTOS'] },
  { manufacturer: '기아', model: '스포티지 NQ5', code: 'NQ5', aliases: ['스포티지', 'SPORTAGE'] },
  { manufacturer: '기아', model: '스포티지 QL', code: 'QL', aliases: ['스포티지QL', 'SPORTAGE QL'] },
  { manufacturer: '기아', model: '쏘렌토 MQ4', code: 'MQ4', aliases: ['쏘렌토', 'SORENTO'] },
  { manufacturer: '기아', model: '쏘렌토 UM', code: 'UM', aliases: ['쏘렌토UM', 'SORENTO UM'] },
  { manufacturer: '기아', model: '카니발 KA4', code: 'KA4', aliases: ['카니발', 'CARNIVAL'] },
  { manufacturer: '기아', model: '카니발 YP', code: 'YP', aliases: ['카니발YP', 'CARNIVAL YP'] },
  { manufacturer: '기아', model: '모하비', code: 'HM', aliases: ['모하비', 'MOHAVE'] },
  { manufacturer: '기아', model: '봉고3', code: 'PU', aliases: ['봉고', 'BONGO', '봉고3'] },
  // 제네시스
  { manufacturer: '제네시스', model: 'G70', code: 'IK', aliases: ['G70', '지세븐티'] },
  { manufacturer: '제네시스', model: 'G80', code: 'RG3', aliases: ['G80', '지에이티'] },
  { manufacturer: '제네시스', model: 'G80 DH', code: 'DH', aliases: ['G80 DH', 'EQ900 DH'] },
  { manufacturer: '제네시스', model: 'G90', code: 'RS4', aliases: ['G90', '지나인티'] },
  { manufacturer: '제네시스', model: 'G90 HI', code: 'HI', aliases: ['EQ900', 'G90 HI'] },
  { manufacturer: '제네시스', model: 'GV70', code: 'JK1', aliases: ['GV70', '지브이세븐티'] },
  { manufacturer: '제네시스', model: 'GV80', code: 'JX1', aliases: ['GV80', '지브이에이티'] },
  { manufacturer: '제네시스', model: 'GV60', code: 'JW', aliases: ['GV60', '지브이식스티'] },
];

// ─── 차급별 부품 가격 계수 ───
// 소형=1.0, 준중형=1.1, 중형=1.25, 대형/고급=1.5, SUV소형=1.1, SUV중형=1.3, SUV대형=1.5, 상용=1.2, 제네시스=1.8

type VehicleClass = 'compact' | 'mid_compact' | 'mid' | 'full' | 'suv_compact' | 'suv_mid' | 'suv_full' | 'commercial' | 'genesis' | 'ev';

const VEHICLE_CLASS_MAP: Record<string, VehicleClass> = {
  // 현대 소형
  AX1: 'compact', RB: 'compact', HC: 'compact',
  // 현대 준중형
  CN7: 'mid_compact', AD: 'mid_compact', MD: 'mid_compact', PD: 'mid_compact', AE: 'mid_compact',
  // 현대 중형
  VF: 'mid', DN8: 'mid', LF: 'mid', YF: 'mid',
  // 현대 대형
  GN7: 'full', IG: 'full', HG: 'full',
  // 현대 SUV 소형
  SX2: 'suv_compact', OS: 'suv_compact', QX: 'suv_compact',
  // 현대 SUV 중형
  NX4: 'suv_mid', TL: 'suv_mid',
  // 현대 SUV 대형
  MX5: 'suv_full', TM: 'suv_full', DM: 'suv_full', LX2: 'suv_full',
  // 현대 상용/밴
  US4: 'commercial', TQ: 'commercial', HR: 'commercial',
  // 현대 EV
  NE: 'ev', CE: 'ev',
  // 기아 소형
  JA: 'compact', TAM: 'compact',
  // 기아 준중형
  BD: 'mid_compact', DE: 'mid_compact',
  // 기아 중형
  DL3: 'mid', JF: 'mid', CK: 'mid',
  // 기아 대형
  GL3: 'full', RJ: 'full',
  // 기아 SUV 소형
  SP2: 'suv_compact', SG2: 'suv_compact',
  // 기아 SUV 중형
  NQ5: 'suv_mid', QL: 'suv_mid',
  // 기아 SUV 대형
  MQ4: 'suv_full', UM: 'suv_full', KA4: 'suv_full', YP: 'suv_full', HM: 'suv_full',
  // 기아 상용
  PU: 'commercial',
  // 기아 EV
  CV: 'ev', MV: 'ev',
  // 제네시스
  IK: 'genesis', RG3: 'genesis', DH: 'genesis', RS4: 'genesis', HI: 'genesis',
  JK1: 'genesis', JX1: 'genesis', JW: 'genesis',
};

const CLASS_MULTIPLIER: Record<VehicleClass, number> = {
  compact: 1.0,
  mid_compact: 1.1,
  mid: 1.25,
  full: 1.5,
  suv_compact: 1.1,
  suv_mid: 1.3,
  suv_full: 1.5,
  commercial: 1.2,
  genesis: 1.8,
  ev: 1.6,
};

// ─── 기본 부품 가격 (소형차 기준 순정가) ───

interface BasePartDef {
  partName: string;
  basePrice: number; // 소형차 기준 순정가
  category: string;
  keywords: string[];
}

const BASE_PARTS: BasePartDef[] = [
  // 제동 계통
  { partName: '전륜 브레이크 패드', basePrice: 35000, category: '제동', keywords: ['전패드', '프런트패드', '프론트패드', '앞패드', '브레이크패드전'] },
  { partName: '후륜 브레이크 패드', basePrice: 30000, category: '제동', keywords: ['후패드', '리어패드', '뒷패드', '브레이크패드후'] },
  { partName: '전륜 브레이크 디스크', basePrice: 55000, category: '제동', keywords: ['전디스크', '프런트디스크', '프론트디스크', '앞디스크'] },
  { partName: '후륜 브레이크 디스크', basePrice: 45000, category: '제동', keywords: ['후디스크', '리어디스크', '뒷디스크'] },
  { partName: '브레이크 오일', basePrice: 12000, category: '제동', keywords: ['브레이크오일', '브레이크액', '제동액'] },
  { partName: '브레이크 패드 어셈블리 (양쪽)', basePrice: 60000, category: '제동', keywords: ['패드어셈블리', '브레이크패드양쪽'] },
  { partName: '브레이크 캘리퍼', basePrice: 120000, category: '제동', keywords: ['캘리퍼', '칼리퍼', '브레이크캘리퍼'] },
  // 엔진 계통
  { partName: '엔진오일 (합성유 5W-30)', basePrice: 45000, category: '엔진', keywords: ['엔진오일', '엔진 오일', '합성유'] },
  { partName: '엔진오일 (합성유 0W-20)', basePrice: 50000, category: '엔진', keywords: ['엔진오일0W', '0W20', '0W-20'] },
  { partName: '엔진오일 필터', basePrice: 7000, category: '엔진', keywords: ['오일필터', '오일 필터', '엔진오일필터'] },
  { partName: '에어클리너 필터', basePrice: 15000, category: '엔진', keywords: ['에어클리너', '에어필터', '공기필터', '에어 클리너'] },
  { partName: '에어컨 필터', basePrice: 18000, category: '엔진', keywords: ['에어컨필터', '캐빈필터', '히터필터'] },
  { partName: '연료 필터', basePrice: 25000, category: '엔진', keywords: ['연료필터', '퓨얼필터', '유류필터'] },
  { partName: '점화 플러그 (1개)', basePrice: 8000, category: '엔진', keywords: ['점화플러그', '스파크플러그', '플러그'] },
  { partName: '점화 코일 (1개)', basePrice: 35000, category: '엔진', keywords: ['점화코일', '이그니션코일'] },
  { partName: '타이밍 벨트', basePrice: 40000, category: '엔진', keywords: ['타이밍벨트', '타이밍 벨트'] },
  { partName: '타이밍 체인', basePrice: 80000, category: '엔진', keywords: ['타이밍체인', '타이밍 체인'] },
  { partName: '구동 벨트 (V벨트/리브벨트)', basePrice: 20000, category: '엔진', keywords: ['구동벨트', 'V벨트', '리브벨트', '팬벨트'] },
  { partName: '인젝터 (1개)', basePrice: 80000, category: '엔진', keywords: ['인젝터', '연료분사장치'] },
  { partName: '스로틀바디', basePrice: 150000, category: '엔진', keywords: ['스로틀바디', '스로틀 바디'] },
  // 냉각 계통
  { partName: '부동액 (냉각수)', basePrice: 15000, category: '냉각', keywords: ['부동액', '냉각수', '쿨란트'] },
  { partName: '워터펌프 어셈블리', basePrice: 85000, category: '냉각', keywords: ['워터펌프', '워타펌프', '물펌프'] },
  { partName: '라디에이터 어셈블리', basePrice: 150000, category: '냉각', keywords: ['라디에이터', '라지에이터'] },
  { partName: '라디에이터 상부호스', basePrice: 20000, category: '냉각', keywords: ['라디에이터상부호스', '상부호스'] },
  { partName: '라디에이터 하부호스', basePrice: 22000, category: '냉각', keywords: ['라디에이터하부호스', '하부호스'] },
  { partName: '서모스탯', basePrice: 25000, category: '냉각', keywords: ['서모스탯', '서모스타트', '수온조절기'] },
  // 변속기 계통
  { partName: 'ATF (자동변속기오일)', basePrice: 35000, category: '변속기', keywords: ['ATF', '미션오일', '변속기오일', '자동변속기오일'] },
  { partName: 'MTF (수동변속기오일)', basePrice: 25000, category: '변속기', keywords: ['MTF', '수동변속기오일', '기어오일'] },
  { partName: '클러치 디스크', basePrice: 80000, category: '변속기', keywords: ['클러치디스크', '클러치 디스크'] },
  { partName: '클러치 커버', basePrice: 60000, category: '변속기', keywords: ['클러치커버', '클러치 커버', '압력판'] },
  // 전기 계통
  { partName: '배터리 (60Ah)', basePrice: 100000, category: '전기', keywords: ['배터리', '밧데리', '축전지'] },
  { partName: '배터리 (80Ah)', basePrice: 140000, category: '전기', keywords: ['배터리80', '대형배터리'] },
  { partName: '헤드램프 전구 (1개)', basePrice: 8000, category: '전기', keywords: ['헤드램프전구', '전조등전구', '전구'] },
  { partName: 'LED 헤드램프 어셈블리', basePrice: 250000, category: '전기', keywords: ['LED헤드램프', 'LED 헤드램프'] },
  { partName: '와이퍼 블레이드 (1개)', basePrice: 12000, category: '전기', keywords: ['와이퍼', '와이퍼블레이드'] },
  { partName: '퓨즈', basePrice: 1000, category: '전기', keywords: ['퓨즈', '휴즈'] },
  { partName: '얼터네이터 (발전기)', basePrice: 250000, category: '전기', keywords: ['얼터네이터', '발전기', '제너레이터'] },
  { partName: '스타터모터', basePrice: 200000, category: '전기', keywords: ['스타터모터', '시동모터', '스타트모터'] },
  // 조향 / 현가 계통
  { partName: '파워스티어링 오일', basePrice: 15000, category: '조향', keywords: ['파워스티어링오일', 'PSF', '파스오일'] },
  { partName: '타이로드 엔드 (1개)', basePrice: 30000, category: '조향', keywords: ['타이로드', '타이로드엔드'] },
  { partName: '로어암 (1개)', basePrice: 80000, category: '현가', keywords: ['로어암', '로워암', '하부암'] },
  { partName: '쇽업소버 (1개)', basePrice: 70000, category: '현가', keywords: ['쇽업소버', '쇼바', '쇽업쇼바', '충격흡수기'] },
  { partName: '코일 스프링 (1개)', basePrice: 50000, category: '현가', keywords: ['코일스프링', '스프링'] },
  { partName: '스태빌라이저 링크 (1개)', basePrice: 20000, category: '현가', keywords: ['스태빌라이저링크', '스테빌링크'] },
  // 배기 계통
  { partName: '촉매 변환기', basePrice: 350000, category: '배기', keywords: ['촉매', '삼원촉매', '촉매변환기', '캐탈라이저'] },
  { partName: '리어 머플러 어셈블리', basePrice: 120000, category: '배기', keywords: ['머플러', '소음기', '리어머플러'] },
  { partName: '산소센서 (1개)', basePrice: 60000, category: '배기', keywords: ['산소센서', 'O2센서'] },
  // 기타 소모품
  { partName: '미션 마운트', basePrice: 40000, category: '기타', keywords: ['미션마운트', '변속기마운트'] },
  { partName: '엔진 마운트', basePrice: 50000, category: '기타', keywords: ['엔진마운트', '엔진 마운트'] },
];

// ─── 차종별 WPC 가격 생성 ───

/**
 * 특정 차종 코드에 대한 WPC 부품 목록 조회
 */
export function getWpcPartsForVehicle(vehicleCode: string): WpcReferencePart[] {
  const vehicleClass = VEHICLE_CLASS_MAP[vehicleCode] || 'mid_compact';
  const multiplier = CLASS_MULTIPLIER[vehicleClass];

  return BASE_PARTS.map((base) => ({
    partName: base.partName,
    referencePrice: Math.round((base.basePrice * multiplier) / 100) * 100, // 100원 단위 반올림
    category: base.category,
    keywords: base.keywords,
  }));
}

/**
 * 차종 코드를 찾기 위한 차량 정보 매칭
 */
export function findVehicleCode(
  manufacturer: string,
  model: string,
  variant?: string
): string | null {
  const searchStr = `${manufacturer} ${model} ${variant || ''}`.toLowerCase().replace(/\s+/g, '');

  for (const v of VEHICLE_MODELS) {
    // 정확한 코드 매칭
    if (variant && v.code.toLowerCase() === variant.toLowerCase()) {
      return v.code;
    }

    // 별칭 매칭
    for (const alias of v.aliases) {
      if (searchStr.includes(alias.toLowerCase().replace(/\s+/g, ''))) {
        return v.code;
      }
    }

    // 모델명 매칭
    if (searchStr.includes(v.model.toLowerCase().replace(/\s+/g, ''))) {
      return v.code;
    }
  }

  return null;
}

/**
 * 항목명으로 WPC 기준가 조회
 * @returns 매칭된 부품의 기준가 또는 null
 */
export function lookupWpcPrice(
  itemName: string,
  vehicleCode: string
): WpcReferencePart | null {
  const parts = getWpcPartsForVehicle(vehicleCode);
  const normalizedItem = itemName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '');

  // 1. 정확한 이름 매칭
  for (const part of parts) {
    const normalizedPart = part.partName.toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '');
    if (normalizedItem.includes(normalizedPart) || normalizedPart.includes(normalizedItem)) {
      return part;
    }
  }

  // 2. 키워드 매칭
  for (const part of parts) {
    for (const keyword of part.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '');
      if (normalizedItem.includes(normalizedKeyword)) {
        return part;
      }
    }
  }

  return null;
}

/**
 * 차종별 전체 WPC 가격표 조회 (디버깅/관리용)
 */
export function getFullWpcPriceTable(): Map<string, WpcReferencePart[]> {
  const table = new Map<string, WpcReferencePart[]>();
  for (const vehicle of VEHICLE_MODELS) {
    table.set(`${vehicle.manufacturer} ${vehicle.model} (${vehicle.code})`, getWpcPartsForVehicle(vehicle.code));
  }
  return table;
}
