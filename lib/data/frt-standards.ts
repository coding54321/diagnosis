/**
 * FRT (Flat Rate Time) 표준정비시간 조회
 * bluehands_maintenance.csv 데이터를 활용하여 차종별 표준 작업시간을 제공
 *
 * CSV 컬럼: 구분,NO,작업명,엑센트(RB),아반떼(AD),i30(PD),아이오닉HEV(AE),
 *           i40세단(VF),쏘나타(LF),그랜저(IG),G70(IK),G80(DH),EQ900(HI),
 *           코나(OS),투싼(TL),싼타페(DM),그랜드스타렉스(TQ),포터2
 */

export interface FrtEntry {
  category: string; // '기능정비' | '판금도장'
  no: number;
  workName: string; // 작업명
  standardHours: Record<string, number>; // 차종코드별 표준시간
}

/** CSV 차종 컬럼 → 차종 코드 매핑 */
const CSV_COLUMN_TO_CODE: Record<string, string> = {
  '엑센트(RB)': 'RB',
  '아반떼(AD)': 'AD',
  'i30(PD)': 'PD',
  '아이오닉HEV(AE)': 'AE',
  'i40세단(VF)': 'VF',
  '쏘나타(LF)': 'LF',
  '그랜저(IG)': 'IG',
  'G70(IK)': 'IK',
  'G80(DH)': 'DH',
  'EQ900(HI)': 'HI',
  '코나(OS)': 'OS',
  '투싼(TL)': 'TL',
  '싼타페(DM)': 'DM',
  '그랜드스타렉스(TQ)': 'TQ',
  '포터2': 'HR',
};

/** CSV에 없는 차종 → 유사 차종 코드로 매핑 (FRT 추정용) */
const FALLBACK_CODE_MAP: Record<string, string> = {
  // 현대 신차 → 유사 기존 차종
  CN7: 'AD', // 아반떼 CN7 → 아반떼 AD
  MD: 'AD', // 아반떼 MD → 아반떼 AD
  HC: 'RB', // 베르나 → 엑센트
  AX1: 'RB', // 캐스퍼 → 엑센트
  DN8: 'LF', // 쏘나타 DN8 → 쏘나타 LF
  YF: 'LF', // 쏘나타 YF → 쏘나타 LF
  GN7: 'IG', // 그랜저 GN7 → 그랜저 IG
  HG: 'IG', // 그랜저 HG → 그랜저 IG
  SX2: 'OS', // 코나 SX2 → 코나 OS
  QX: 'OS', // 베뉴 → 코나
  NX4: 'TL', // 투싼 NX4 → 투싼 TL
  MX5: 'DM', // 싼타페 MX5 → 싼타페 DM
  TM: 'DM', // 싼타페 TM → 싼타페 DM
  LX2: 'DM', // 팰리세이드 → 싼타페
  US4: 'TQ', // 스타리아 → 스타렉스
  NE: 'AE', // 아이오닉5 → 아이오닉 HEV
  CE: 'AE', // 아이오닉6 → 아이오닉 HEV
  // 기아 → 현대 동급
  JA: 'RB', // 모닝 → 엑센트
  TAM: 'RB', // 레이 → 엑센트
  BD: 'AD', // K3 → 아반떼
  DL3: 'LF', // K5 → 쏘나타
  JF: 'LF', // K5 JF → 쏘나타
  GL3: 'IG', // K8 → 그랜저
  RJ: 'HI', // K9 → EQ900
  CK: 'IK', // 스팅어 → G70
  DE: 'AE', // 니로 → 아이오닉
  SG2: 'AE', // 니로 EV → 아이오닉
  SP2: 'OS', // 셀토스 → 코나
  NQ5: 'TL', // 스포티지 → 투싼
  QL: 'TL', // 스포티지 QL → 투싼
  MQ4: 'DM', // 쏘렌토 → 싼타페
  UM: 'DM', // 쏘렌토 UM → 싼타페
  KA4: 'TQ', // 카니발 → 스타렉스
  YP: 'TQ', // 카니발 YP → 스타렉스
  HM: 'DM', // 모하비 → 싼타페
  PU: 'HR', // 봉고 → 포터
  CV: 'AE', // EV6 → 아이오닉
  MV: 'AE', // EV9 → 아이오닉
  // 제네시스 (이미 CSV에 있는 것 제외)
  RG3: 'DH', // G80 RG3 → G80 DH
  RS4: 'HI', // G90 RS4 → EQ900
  JK1: 'IK', // GV70 → G70
  JX1: 'DH', // GV80 → G80
  JW: 'IK', // GV60 → G70
};

let frtData: FrtEntry[] | null = null;

/**
 * CSV 파싱 후 FRT 데이터 캐싱
 */
export function parseFrtCsv(csvText: string): FrtEntry[] {
  if (frtData) return frtData;

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const vehicleColumns = headers.slice(3); // 차종 컬럼들

  const entries: FrtEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 3) continue;

    const category = cols[0].trim();
    const no = parseInt(cols[1], 10);
    const workName = cols[2].trim();

    if (!workName || isNaN(no)) continue;

    const standardHours: Record<string, number> = {};
    for (let j = 0; j < vehicleColumns.length; j++) {
      const colName = vehicleColumns[j].trim();
      const code = CSV_COLUMN_TO_CODE[colName];
      if (!code) continue;

      const value = cols[j + 3]?.trim();
      if (value && value !== '-' && value !== '') {
        const hours = parseFloat(value);
        if (!isNaN(hours)) {
          standardHours[code] = hours;
        }
      }
    }

    entries.push({ category, no, workName, standardHours });
  }

  frtData = entries;
  return entries;
}

/**
 * FRT 데이터 직접 설정 (테스트/초기화용)
 */
export function setFrtData(data: FrtEntry[]): void {
  frtData = data;
}

/**
 * 작업명과 차종 코드로 표준정비시간(시간) 조회
 *
 * @returns 표준정비시간 (시간) 또는 null (데이터 없음)
 */
export function lookupFrt(
  workName: string,
  vehicleCode: string
): number | null {
  if (!frtData || frtData.length === 0) return null;

  // 실제 코드 또는 폴백 코드
  const effectiveCode = FALLBACK_CODE_MAP[vehicleCode] || vehicleCode;

  const normalizedWork = workName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()]/g, '')
    .replace(/어셈블리/g, '')
    .replace(/교체/g, '')
    .replace(/교환/g, '');

  // 1. 정확한 이름 매칭
  for (const entry of frtData) {
    const normalizedEntry = entry.workName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()]/g, '')
      .replace(/어셈블리/g, '')
      .replace(/교체/g, '')
      .replace(/교환/g, '');

    if (
      normalizedWork === normalizedEntry ||
      normalizedWork.includes(normalizedEntry) ||
      normalizedEntry.includes(normalizedWork)
    ) {
      const hours = entry.standardHours[effectiveCode];
      if (hours !== undefined) return hours;

      // 해당 차종 데이터 없으면 전체 평균
      const allHours = Object.values(entry.standardHours);
      if (allHours.length > 0) {
        return Math.round((allHours.reduce((a, b) => a + b, 0) / allHours.length) * 10) / 10;
      }
    }
  }

  // 2. 부분 키워드 매칭
  const keywords = normalizedWork.split(/[\/\-]/).filter((k) => k.length > 1);
  if (keywords.length === 0) return null;

  for (const entry of frtData) {
    const normalizedEntry = entry.workName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()]/g, '');

    const matchCount = keywords.filter(
      (k) => normalizedEntry.includes(k)
    ).length;

    if (matchCount >= Math.ceil(keywords.length * 0.5)) {
      const hours = entry.standardHours[effectiveCode];
      if (hours !== undefined) return hours;

      const allHours = Object.values(entry.standardHours);
      if (allHours.length > 0) {
        return Math.round((allHours.reduce((a, b) => a + b, 0) / allHours.length) * 10) / 10;
      }
    }
  }

  return null;
}

/**
 * FRT 데이터가 로드되었는지 확인
 */
export function isFrtDataLoaded(): boolean {
  return frtData !== null && frtData.length > 0;
}
