/**
 * 전국자동차정비업체 표준데이터 (Supabase national_repair_shops) 검색
 * UI 호환: BluehandsShop 형태(업체명, 시군구, 주소)로 반환
 * Fuse.js를 활용한 fuzzy search 적용
 */

import { createClient } from '@supabase/supabase-js';
import Fuse, { IFuseOptions } from 'fuse.js';
import type { Database } from '@/types/supabase';

export type NationalRepairShopDisplay = {
  업체명: string;
  시군구: string;
  주소: string;
  구분: string;
  광역시도: string;
  전화번호: string;
  유형별_블루핸즈: string;
};

/** DB에서 select하는 필드 타입 */
type DBSelectRow = {
  id: string;
  inspofc_nm: string | null;
  inspofc_type: string | null;
  rdnmadr: string | null;
  lnmadr: string | null;
  phone_number: string | null;
};

/** 주소 문자열에서 시군구 추정 (예: "서울특별시 강남구 ..." → "강남구") */
function inferSigungu(addr: string | null): string {
  if (!addr || !addr.trim()) return '';
  const parts = addr.trim().split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (/구$|시$|군$/.test(p)) return p;
    if (i > 0 && /특별시|광역시|도$/.test(parts[i - 1])) return p;
  }
  return parts.slice(0, 2).join(' ') || '';
}

/** DB 행 → UI 호환 객체 */
function toDisplay(row: DBSelectRow): NationalRepairShopDisplay {
  const addr = row.rdnmadr || row.lnmadr || '';
  return {
    업체명: row.inspofc_nm || '',
    시군구: inferSigungu(addr),
    주소: addr,
    구분: row.inspofc_type || '',
    광역시도: '',
    전화번호: row.phone_number || '',
    유형별_블루핸즈: '',
  };
}

/** Fuse.js 검색 옵션 */
const fuseOptions: IFuseOptions<NationalRepairShopDisplay> = {
  keys: [
    { name: '업체명', weight: 0.7 },
    { name: '주소', weight: 0.2 },
    { name: '시군구', weight: 0.1 },
  ],
  threshold: 0.6, // 0 = 완전 일치, 1 = 모두 매칭 (0.6 = OCR 오인식 허용)
  distance: 200, // 매칭 위치 허용 거리 (늘림)
  includeScore: true,
  ignoreLocation: true, // 위치 무관하게 매칭
  useExtendedSearch: true, // 확장 검색 (정확 매칭 등)
  minMatchCharLength: 2,
  findAllMatches: true,
};

/**
 * 검색어 전처리: 토큰 분리 및 정규화
 * "블루핸즈 강남점" → ["블루핸즈", "강남점"]
 */
function preprocessQuery(q: string): string[] {
  return q
    .trim()
    .replace(/[^\w\uAC00-\uD7A3\s]/g, ' ') // 특수문자 제거
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * DB 검색용 짧은 토큰 생성 (OCR 오타 대응)
 * "화북절 기아오토류" → ["화북", "기아", "오토"]
 * 각 토큰의 앞 2-3글자만 추출하여 ILIKE 매칭 확률 높임
 */
function generateShortTokens(q: string): string[] {
  const tokens = preprocessQuery(q);
  const shortTokens: Set<string> = new Set();

  for (const token of tokens) {
    // 2글자, 3글자 prefix 추출
    if (token.length >= 2) {
      shortTokens.add(token.slice(0, 2));
    }
    if (token.length >= 3) {
      shortTokens.add(token.slice(0, 3));
    }
    // 긴 토큰은 중간 부분도 추출 (예: "기아오토류" → "오토")
    if (token.length >= 5) {
      shortTokens.add(token.slice(2, 4));
      shortTokens.add(token.slice(2, 5));
    }
  }

  return Array.from(shortTokens).filter((t) => t.length >= 2);
}

/**
 * 전국 표준데이터에서 검색 (Fuse.js fuzzy search)
 * 1. DB에서 ILIKE로 후보군 조회 (넓은 범위)
 * 2. Fuse.js로 정밀 유사도 정렬
 * @param q 검색어 (빈 문자열이면 최대 limit건 반환)
 */
export async function searchNationalRepairShops(
  q: string,
  limit = 50
): Promise<NationalRepairShopWithScore[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient<Database>(url, key);
  const term = q.trim();
  const tokens = preprocessQuery(term);

  // 검색어가 없으면 기본 목록 반환
  if (!term) {
    const { data } = await supabase
      .from('national_repair_shops')
      .select('id, inspofc_nm, inspofc_type, rdnmadr, lnmadr, phone_number')
      .limit(limit)
      .order('inspofc_nm', { ascending: true });

    return (data || []).map((row) => ({ ...toDisplay(row), score: 0 }));
  }

  // 1단계: DB에서 넓은 범위로 후보군 조회
  // 짧은 토큰으로 검색하여 OCR 오타에도 대응
  const fetchLimit = Math.min(500, limit * 10); // 충분한 후보군 확보
  const shortTokens = generateShortTokens(term);

  // OR 조건 구성: 짧은 토큰들로 넓게 검색
  const patterns: string[] = [];

  // 짧은 토큰 패턴 (2-3글자로 넓게 검색)
  for (const token of shortTokens) {
    patterns.push(`inspofc_nm.ilike.%${token}%`);
  }

  // 원본 토큰도 추가 (정확한 매칭 가능성)
  for (const token of tokens) {
    if (token.length >= 2) {
      patterns.push(`inspofc_nm.ilike.%${token}%`);
    }
  }

  // 패턴이 없으면 전체 검색어로
  if (patterns.length === 0) {
    patterns.push(`inspofc_nm.ilike.%${term}%`);
  }

  const dbQuery = supabase
    .from('national_repair_shops')
    .select('id, inspofc_nm, inspofc_type, rdnmadr, lnmadr, phone_number')
    .or(patterns.join(','))
    .limit(fetchLimit);

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[national-repair-shops] search error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    // 결과가 없으면 첫 번째 짧은 토큰으로 재시도
    const fallbackToken = shortTokens[0] || (tokens[0]?.slice(0, 2));
    if (fallbackToken && fallbackToken.length >= 2) {
      const { data: retryData } = await supabase
        .from('national_repair_shops')
        .select('id, inspofc_nm, inspofc_type, rdnmadr, lnmadr, phone_number')
        .ilike('inspofc_nm', `%${fallbackToken}%`)
        .limit(fetchLimit);

      if (retryData && retryData.length > 0) {
        const list = retryData.map(toDisplay);
        return fuzzySort(list, term, limit);
      }
    }
    return [];
  }

  // 2단계: Fuse.js로 정밀 유사도 정렬
  const list = data.map(toDisplay);
  return fuzzySort(list, term, limit);
}

/** 유사도 점수가 포함된 검색 결과 */
export type NationalRepairShopWithScore = NationalRepairShopDisplay & {
  /** 유사도 점수 (0~1, 1이 완전 일치) */
  score: number;
};

/**
 * 모든 토큰이 업체명에 포함되어 있는지 확인
 * "화북 기아" → 업체명에 "화북"과 "기아" 둘 다 포함되어야 true
 */
function matchesAllTokens(shopName: string, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return true;

  const nameLower = shopName.toLowerCase();

  for (const token of queryTokens) {
    const tokenLower = token.toLowerCase();
    // 토큰 전체 또는 앞 2글자가 포함되어야 함
    if (!nameLower.includes(tokenLower) && !nameLower.includes(tokenLower.slice(0, 2))) {
      return false;
    }
  }
  return true;
}

/**
 * 단순화된 fuzzy 정렬
 * 1. 모든 토큰이 포함된 결과만 필터링
 * 2. Fuse.js 점수로 정렬
 */
function fuzzySort(
  list: NationalRepairShopDisplay[],
  query: string,
  limit: number
): NationalRepairShopWithScore[] {
  if (list.length === 0) return [];

  const queryTokens = preprocessQuery(query);

  // 1단계: 모든 토큰이 포함된 결과만 필터링
  const filtered = list.filter((shop) => matchesAllTokens(shop.업체명, queryTokens));

  if (filtered.length === 0) {
    // 모든 토큰 매칭 실패 시 빈 배열 반환
    return [];
  }

  // 2단계: Fuse.js로 유사도 정렬
  const fuse = new Fuse(filtered, fuseOptions);
  const results = fuse.search(query);

  if (results.length > 0) {
    return results.slice(0, limit).map((r) => ({
      ...r.item,
      score: r.score !== undefined ? 1 - r.score : 0.5,
    }));
  }

  // Fuse.js 매칭 실패 시 필터링된 결과 그대로 반환
  return filtered.slice(0, limit).map((shop) => ({ ...shop, score: 0.5 }));
}

/**
 * 주소 기반 정비소 검색
 * 주소는 정비소명보다 OCR 오류가 적고 매칭이 정확함
 * @param address OCR에서 추출한 정비소 주소
 * @param limit 최대 결과 수
 */
export async function searchNationalRepairShopsByAddress(
  address: string,
  limit = 10
): Promise<NationalRepairShopWithScore[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient<Database>(url, key);
  const term = address.trim();

  if (!term) return [];

  // 주소에서 핵심 키워드 추출 (시/군/구 + 동/읍/면/리 + 번지/도로명)
  const addressTokens = term
    .replace(/[^가-힣0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (addressTokens.length === 0) return [];

  // 주소 토큰으로 DB 검색 (도로명주소 또는 지번주소)
  const patterns: string[] = [];
  for (const token of addressTokens.slice(0, 5)) {
    patterns.push(`rdnmadr.ilike.%${token}%`);
    patterns.push(`lnmadr.ilike.%${token}%`);
  }

  const { data, error } = await supabase
    .from('national_repair_shops')
    .select('id, inspofc_nm, inspofc_type, rdnmadr, lnmadr, phone_number')
    .or(patterns.join(','))
    .limit(100);

  if (error || !data || data.length === 0) {
    return [];
  }

  // 주소 유사도로 정렬 (더 많은 토큰이 매칭될수록 높은 점수)
  const scored = data.map((row) => {
    const shopAddr = (row.rdnmadr || row.lnmadr || '').toLowerCase();
    let matchCount = 0;
    for (const token of addressTokens) {
      if (shopAddr.includes(token.toLowerCase())) {
        matchCount++;
      }
    }
    const score = addressTokens.length > 0 ? matchCount / addressTokens.length : 0;
    return { ...toDisplay(row), score };
  });

  // 점수 내림차순 정렬 후 상위 결과만 반환
  return scored
    .filter((shop) => shop.score > 0.3) // 최소 30% 이상 매칭
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
