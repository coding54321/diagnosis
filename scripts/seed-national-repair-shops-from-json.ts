/**
 * 전국자동차정비업체 표준데이터 JSON 파일 → Supabase national_repair_shops 적재
 * 파일: public/전국자동차정비업체표준데이터.json (공공데이터포털에서 JSON 다운로드)
 * 실행: npm run seed-shops 또는 npx tsx scripts/seed-national-repair-shops-from-json.ts [경로]
 */

import 'dotenv/config';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

config({ path: path.resolve(process.cwd(), '.env.local') });

type JsonRecord = {
  자동차정비업체명?: string;
  자동차정비업체종류?: string;
  소재지도로명주소?: string;
  소재지지번주소?: string;
  위도?: string;
  경도?: string;
  영업상태?: string;
  전화번호?: string;
  데이터기준일자?: string;
  제공기관코드?: string;
  [key: string]: unknown;
};

function parseRefDate(v: string | undefined): string | null {
  if (!v || typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  if (trimmed.length >= 10) {
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  if (trimmed.length >= 8 && /^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  return null;
}

function toRow(record: JsonRecord) {
  return {
    inspofc_nm: record.자동차정비업체명?.trim() || null,
    inspofc_type: record.자동차정비업체종류?.trim() || null,
    rdnmadr: record.소재지도로명주소?.trim() || null,
    lnmadr: record.소재지지번주소?.trim() || null,
    latitude: record.위도 ? Number(record.위도) : null,
    longitude: record.경도 ? Number(record.경도) : null,
    phone_number: record.전화번호?.trim() || null,
    bsn_sttus: record.영업상태?.trim() || null,
    reference_date: parseRefDate(record.데이터기준일자),
    instt_code: record.제공기관코드?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  const jsonPath =
    process.argv[2] ||
    path.join(process.cwd(), 'public', '전국자동차정비업체표준데이터.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('파일이 없습니다:', jsonPath);
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 .env.local에 필요합니다.');
    process.exit(1);
  }

  console.log('JSON 파일 읽는 중...', jsonPath);
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw) as { records?: JsonRecord[] };
  const records = data?.records ?? [];
  if (records.length === 0) {
    console.error('records가 비어 있거나 구조가 다릅니다.');
    process.exit(1);
  }

  const allRows = records.map(toRow);
  console.log(`총 ${allRows.length}건 매핑 완료. Supabase 갱신 중...`);

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  const { error: delErr } = await supabase
    .from('national_repair_shops')
    .delete()
    .gte('created_at', '1970-01-01');
  if (delErr) {
    console.error('기존 데이터 삭제 실패:', delErr);
    process.exit(1);
  }

  const BATCH = 500;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const chunk = allRows.slice(i, i + BATCH);
    const { error } = await supabase.from('national_repair_shops').insert(chunk);
    if (error) {
      console.error(`삽입 실패 (${i + 1}~${i + chunk.length}):`, error);
      process.exit(1);
    }
    console.log(`  삽입 ${i + 1} ~ ${i + chunk.length}`);
  }
  console.log('적재 완료.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
