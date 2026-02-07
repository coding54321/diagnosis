/**
 * bluehands_seoul.csv 파싱 → 업체명, 주소, 전화번호 추출
 * 실행: npx tsx scripts/parse-bluehands-seoul.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = path.join(process.cwd(), 'public', 'bluehands_seoul.csv');

interface BluehandsEntry {
  name: string;
  address: string;
  phone: string;
  /** 전화번호만 숫자 (매칭용) */
  phoneDigits: string;
}

const TYPE_LINES = new Set(['전문블루핸즈', '종합블루핸즈', '하이테크센터']);
const ADDRESS_PREFIX = '서울특별시';
const PHONE_REGEX = /(\d{2,3})-?(\d{3,4})-?(\d{4})/;

function parse(): BluehandsEntry[] {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split(/\r?\n/);
  const result: BluehandsEntry[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith(ADDRESS_PREFIX)) {
      i++;
      continue;
    }

    const tabIdx = line.indexOf('\t');
    const address = (tabIdx >= 0 ? line.slice(0, tabIdx) : line).trim();
    const rest = tabIdx >= 0 ? line.slice(tabIdx + 1) : '';
    const phoneMatch = rest.match(PHONE_REGEX) || lines[i + 1]?.match(PHONE_REGEX);
    const phone = phoneMatch ? phoneMatch[0] : '';
    const phoneDigits = phone.replace(/\D/g, '');

    let name = '';
    let j = i - 1;
    while (j >= 0 && lines[j].trim() === '') j--;
    const nameLineIdx = j;
    while (j >= 0) {
      const t = lines[j].trim();
      if (t === '' || t === '업체명	주소	전화번호	유형별 블루핸즈	정비예약') break;
      if (!TYPE_LINES.has(t) && !t.startsWith('예약하기') && !/^전기차|^수소|^전동차|^차체|^중형|^대형|^상용/.test(t)) {
        name = t;
        break;
      }
      j--;
    }
    if (!name && nameLineIdx >= 0) name = lines[nameLineIdx].trim();

    result.push({ name, address, phone, phoneDigits });
    i++;
  }

  return result;
}

const entries = parse();
console.log(JSON.stringify(entries, null, 0));
if (process.argv.includes('--count')) {
  process.stderr.write(`Parsed ${entries.length} entries\n`);
}
