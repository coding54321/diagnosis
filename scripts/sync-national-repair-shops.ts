/**
 * 전국자동차정비업체 표준데이터 공공 API → Supabase 동기화
 * .env.local 에 DATA_GO_KR_SERVICE_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요
 * 실행: npx tsx scripts/sync-national-repair-shops.ts
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

// .env.local 우선 로드
config({ path: path.resolve(process.cwd(), '.env.local') });

const API_BASE =
  'http://api.data.go.kr/openapi/tn_pubr_public_auto_maintenance_company_api';
const ROWS_PER_PAGE = 1000;

type ApiItem = {
  inspofcNm?: string;
  inspofcType?: string;
  rdnmadr?: string;
  lnmadr?: string;
  latitude?: string;
  longitude?: string;
  phoneNumber?: string;
  bsnSttus?: string;
  referenceDate?: string;
  instt_code?: string;
  insttCode?: string;
  [key: string]: unknown;
};

function parseRefDate(v: string | undefined): string | null {
  if (!v || typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  // YYYYMMDD or YYYY-MM-DD
  if (trimmed.length >= 8) {
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(4, 6) || trimmed.slice(5, 7);
    const d = trimmed.slice(6, 8) || trimmed.slice(8, 10);
    if (y && m && d) return `${y}-${m}-${d}`;
  }
  return null;
}

async function fetchPage(
  serviceKey: string,
  pageNo: number,
  debug = false
): Promise<{ items: ApiItem[]; totalCount: number }> {
  const params = new URLSearchParams({
    serviceKey,
    pageNo: String(pageNo),
    numOfRows: String(ROWS_PER_PAGE),
    type: 'json',
  });
  const url = `${API_BASE}?${params.toString()}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    if (debug || text.trimStart().startsWith('<')) {
      console.error('API 응답(일부):', text.slice(0, 400));
    }
    throw new Error(
      'API가 JSON이 아닌 형식(XML 등)을 반환했습니다. type=json 미지원 시 스크립트에 XML 파싱이 필요합니다.'
    );
  }
  const response = data && typeof data === 'object' && 'response' in data ? (data as { response?: { header?: { resultCode?: string; resultMsg?: string }; body?: unknown } }).response : undefined;
  const header = response?.header;
  const body = response?.body as { items?: { item?: ApiItem | ApiItem[] }; totalCount?: number } | undefined;

  if (header && header.resultCode !== '00' && header.resultCode !== undefined) {
    console.error(`[API 에러] resultCode=${header.resultCode}, resultMsg=${header.resultMsg}`);
  }
  if (debug || !body?.items) {
    const sample = JSON.stringify(data).slice(0, 600);
    console.error('응답 구조 참고:', sample);
  }

  const totalCount = Number(body?.totalCount) || 0;
  let items: ApiItem[] = [];
  const raw = body?.items?.item;
  if (raw != null) {
    items = Array.isArray(raw) ? raw : [raw];
  }
  return { items, totalCount };
}

function toRow(item: ApiItem) {
  return {
    inspofc_nm: item.inspofcNm?.trim() || null,
    inspofc_type: item.inspofcType?.trim() || null,
    rdnmadr: item.rdnmadr?.trim() || null,
    lnmadr: item.lnmadr?.trim() || null,
    latitude: item.latitude ? Number(item.latitude) : null,
    longitude: item.longitude ? Number(item.longitude) : null,
    phone_number: item.phoneNumber?.trim() || null,
    bsn_sttus: item.bsnSttus?.trim() || null,
    reference_date: parseRefDate(item.referenceDate),
    instt_code: item.instt_code?.trim() || item.insttCode?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error('DATA_GO_KR_SERVICE_KEY가 .env.local에 없습니다.');
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 .env.local에 필요합니다.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let totalFetched = 0;
  let pageNo = 1;
  const allRows: ReturnType<typeof toRow>[] = [];

  console.log('공공 API 페이지 조회 중...');
  while (true) {
    const isFirstPage = pageNo === 1;
    const { items, totalCount } = await fetchPage(serviceKey, pageNo, isFirstPage);
    if (items.length === 0) {
      if (isFirstPage) {
        console.error('첫 페이지에서 데이터가 없습니다. 위 [API 에러] 또는 [응답 구조 참고] 로그를 확인하세요.');
      }
      break;
    }
    for (const item of items) {
      allRows.push(toRow(item));
    }
    totalFetched += items.length;
    console.log(`  페이지 ${pageNo}: ${items.length}건 (누적 ${totalFetched} / ${totalCount || '?'})`);
    if (totalCount > 0 && totalFetched >= totalCount) break;
    if (items.length < ROWS_PER_PAGE) break;
    pageNo += 1;
    await new Promise((r) => setTimeout(r, 300));
  }

  if (allRows.length === 0) {
    console.error('가져온 데이터가 없습니다.');
    console.error('확인할 것: 1) 공공데이터포털에서 "일반인증키(Encoding)" 사용 2) 해당 API에서 JSON 지원 시 type=json, 미지원 시 XML 파싱 필요');
    process.exit(1);
  }

  console.log(`Supabase national_repair_shops 갱신: 기존 삭제 후 ${allRows.length}건 삭입...`);
  const { error: delErr } = await supabase.from('national_repair_shops').delete().gte('created_at', '1970-01-01');
  if (delErr) {
    console.error('기존 데이터 삭제 실패:', delErr);
    process.exit(1);
  }

  const BATCH = 500;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const chunk = allRows.slice(i, i + BATCH);
    const { error } = await supabase.from('national_repair_shops').insert(chunk);
    if (error) {
      console.error(`삽입 실패 (${i}~${i + chunk.length}):`, error);
      process.exit(1);
    }
    console.log(`  삽입 ${i + 1} ~ ${i + chunk.length}`);
  }
  console.log('동기화 완료.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
