/**
 * 블루핸즈 서울 정비소 데이터 (bluehands_seoul.csv 기반)
 * API에서 CSV 파일을 읽어 파싱할 때 사용
 */

export interface BluehandsShop {
  업체명: string;
  구분: string;
  광역시도: string;
  시군구: string;
  주소: string;
  전화번호: string;
  유형별_블루핸즈: string;
}

/** CSV 한 줄 파싱 (따옴표 안 쉼표 처리) */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseBluehandsSeoulCSV(csvText: string): BluehandsShop[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]);
  const rows: BluehandsShop[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((h, j) => {
      const key = h.replace(/\s/g, '_');
      row[key] = values[j] ?? '';
    });
    rows.push(row as unknown as BluehandsShop);
  }

  return rows;
}

export function searchShops(shops: BluehandsShop[], query: string): BluehandsShop[] {
  if (!query.trim()) return shops;
  const q = query.trim().toLowerCase();
  return shops.filter(
    (s) =>
      s.업체명?.toLowerCase().includes(q) ||
      s.시군구?.toLowerCase().includes(q) ||
      s.주소?.toLowerCase().includes(q) ||
      s.구분?.toLowerCase().includes(q)
  );
}
