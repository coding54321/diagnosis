import { NextRequest, NextResponse } from 'next/server';

/**
 * 주소 → 위경도 (Nominatim, 1 req/sec 권장)
 * 좌표가 없는 정비소(CSV 등) 거리 계산용
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')?.trim();
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'kr'); // 한국 주소 우선

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'DiagnosisApp/1.0 (repair-shop-distance)',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 });
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No result' }, { status: 404 });
    }
    const first = data[0];
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json({ error: 'Invalid result' }, { status: 502 });
    }
    return NextResponse.json({ lat, lng: lon });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
