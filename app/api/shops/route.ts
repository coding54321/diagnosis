import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { parseBluehandsSeoulCSV, searchShops } from '@/lib/data/bluehands-seoul';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'bluehands_seoul.csv');
    const csvText = await readFile(csvPath, 'utf-8');
    const shops = parseBluehandsSeoulCSV(csvText);

    const q = request.nextUrl.searchParams.get('q') ?? '';
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
