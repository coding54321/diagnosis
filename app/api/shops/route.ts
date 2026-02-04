import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { parseBluehandsSeoulCSV, searchShops } from '@/lib/data/bluehands-seoul';
import { searchNationalRepairShops } from '@/lib/data/national-repair-shops';
import type { BluehandsShop } from '@/lib/data/bluehands-seoul';

export const dynamic = 'force-dynamic';

/** 전국 표준데이터 검색 결과를 BluehandsShop 호환 형태로 반환 (score 포함) */
function toBluehandsShape(
  row: { 업체명: string; 시군구: string; 주소: string; 구분: string; 광역시도: string; 전화번호: string; 유형별_블루핸즈: string; score?: number }
): BluehandsShop & { score?: number } {
  return {
    업체명: row.업체명,
    구분: row.구분,
    광역시도: row.광역시도,
    시군구: row.시군구,
    주소: row.주소,
    전화번호: row.전화번호,
    유형별_블루핸즈: row.유형별_블루핸즈,
    score: row.score,
  };
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('q') ?? '';
    const q = raw.trim().replace(/\s+/g, ' ');

    let national = await searchNationalRepairShops(q, 50);
    if (national.length === 0 && q.includes(' ')) {
      const firstWord = q.split(/\s+/)[0];
      if (firstWord) national = await searchNationalRepairShops(firstWord, 50);
    }
    if (national.length > 0) {
      return NextResponse.json({
        shops: national.map(toBluehandsShape),
      });
    }

    const csvPath = path.join(process.cwd(), 'public', 'bluehands_seoul.csv');
    const csvText = await readFile(csvPath, 'utf-8');
    const shops = parseBluehandsSeoulCSV(csvText);
    const filtered = searchShops(shops, q);
    const limited = filtered.slice(0, 50);
    return NextResponse.json({ shops: limited });
  } catch (error) {
    console.error('Shops API error:', error);
    return NextResponse.json(
      { error: '정비소 목록을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}
