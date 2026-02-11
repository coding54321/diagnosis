/**
 * bluehands_jobs_normalized_v4.csv → maintenance_job_master INSERT SQL 생성
 * 실행: npx tsx scripts/generate-maintenance-job-master-sql.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CSV_PATH = path.join(process.cwd(), 'public', 'bluehands_jobs_normalized_v4.csv');

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || (c === '\r' && !inQuotes)) {
      result.push(current.trim());
      current = '';
    } else if (c !== '\r') {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

function main() {
  const text = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = text.split('\n').filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);
  if (header[0] !== 'job_id') {
    throw new Error('Expected header job_id,...');
  }

  const rows: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 11) continue;
    const [
      job_id,
      job_name_raw,
      job_name_norm,
      system_type,
      area,
      component_group,
      position_side,
      axle_or_row,
      quantity_type,
      work_type,
      labor_category,
    ] = cols;
    rows.push(
      `('${escapeSql(job_id)}', '${escapeSql(job_name_raw)}', '${escapeSql(job_name_norm)}', '${escapeSql(system_type)}', '${escapeSql(area)}', '${escapeSql(component_group)}', '${escapeSql(position_side)}', '${escapeSql(axle_or_row)}', '${escapeSql(quantity_type)}', '${escapeSql(work_type)}', '${escapeSql(labor_category)}')`
    );
  }

  const sql = `INSERT INTO public.maintenance_job_master (job_id, job_name_raw, job_name_norm, system_type, area, component_group, position_side, axle_or_row, quantity_type, work_type, labor_category)\nVALUES\n${rows.join(',\n')};`;
  console.log(sql);
}

main();
