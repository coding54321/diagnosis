import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { parseBluehandsSeoulCSV, searchShops } from '@/lib/data/bluehands-seoul';
import { searchNationalRepairShops, searchNationalRepairShopsByAddress } from '@/lib/data/national-repair-shops';
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

/**
 * 정비소명에서 핵심 키워드 추출 (OCR 오타 대응)
 * "화북절 기아오토류" → ["화북", "기아", "오토"]
 */
function extractNameKeywords(name: string): string[] {
  return name
    .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .flatMap((t) => {
      const keywords = [t.slice(0, 2)];
      if (t.length >= 3) keywords.push(t.slice(0, 3));
      return keywords;
    });
}

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get('q') ?? '';
    const addressRaw = request.nextUrl.searchParams.get('address') ?? '';
    const q = raw.trim().replace(/\s+/g, ' ');
    const address = addressRaw.trim();

    // 1. 주소가 있으면 주소로 먼저 검색
    if (address) {
      const byAddress = await searchNationalRepairShopsByAddress(address, 30);
      if (byAddress.length > 0) {
        // 정비소명 키워드가 있으면, 주소 검색 결과 중 정비소명과 매칭되는 것 우선
        if (q) {
          const nameKeywords = extractNameKeywords(q);
          const reranked = byAddress
            .map((shop) => {
              const shopNameLower = shop.업체명.toLowerCase();
              let nameMatchCount = 0;
              for (const kw of nameKeywords) {
                if (shopNameLower.includes(kw.toLowerCase())) {
                  nameMatchCount++;
                }
              }
              // 주소 점수 + 정비소명 매칭 보너스
              const combinedScore = shop.score + (nameMatchCount > 0 ? 0.3 * (nameMatchCount / nameKeywords.length) : 0);
              return { ...shop, score: combinedScore, nameMatchCount };
            })
            .sort((a, b) => b.score - a.score);

          // 정비소명 매칭이 있는 결과가 있으면 그것을 우선
          const withNameMatch = reranked.filter((s) => s.nameMatchCount > 0);
          if (withNameMatch.length > 0) {
            return NextResponse.json({
              shops: withNameMatch.slice(0, 10).map(toBluehandsShape),
              matchedBy: 'address+name',
            });
          }
        }

        return NextResponse.json({
          shops: byAddress.slice(0, 10).map(toBluehandsShape),
          matchedBy: 'address',
        });
      }
    }

    // 2. 정비소명으로 검색
    let national = await searchNationalRepairShops(q, 50);
    if (national.length === 0 && q.includes(' ')) {
      const firstWord = q.split(/\s+/)[0];
      if (firstWord) national = await searchNationalRepairShops(firstWord, 50);
    }
    if (national.length > 0) {
      return NextResponse.json({
        shops: national.map(toBluehandsShape),
        matchedBy: 'name',
      });
    }

    // 3. 블루핸즈 서울 CSV 폴백
    const csvPath = path.join(process.cwd(), 'public', 'bluehands_seoul.csv');
    const csvText = await readFile(csvPath, 'utf-8');
    const shops = parseBluehandsSeoulCSV(csvText);
    const filtered = searchShops(shops, q);
    const limited = filtered.slice(0, 50);
    return NextResponse.json({ shops: limited, matchedBy: 'csv' });
  } catch (error) {
    console.error('Shops API error:', error);
    return NextResponse.json(
      { error: '정비소 목록을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}
