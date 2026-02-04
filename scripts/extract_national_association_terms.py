#!/usr/bin/env python3
"""
전국자동차검사정비사업조합 xlsx에서 고유 작업명(정비항목) 추출.
A열 = 작업명, 1행 = 헤더. 시트별로 A열 값을 모아 중복 제거 후 CSV로 출력.

사용: python scripts/extract_national_association_terms.py
입력: public/전국자동차검사정비사업조합-표준정비시간 (1).xlsx
출력: docs/national_association_work_terms.csv (external_term 한 컬럼)
"""

import csv
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
XLSX_PATH = Path(__file__).resolve().parent.parent / "public" / "전국자동차검사정비사업조합-표준정비시간 (1).xlsx"
OUT_CSV_PATH = Path(__file__).resolve().parent.parent / "docs" / "national_association_work_terms.csv"


def get_shared_strings(zip_file):
    with zip_file.open("xl/sharedStrings.xml") as f:
        root = ET.parse(f).getroot()
    out = []
    for si in root.findall(".//main:si", NS):
        texts = []
        for t in si.iter():
            if t.text:
                texts.append(t.text)
        out.append("".join(texts).strip())
    return out


def get_column_a_work_names_from_sheet(zip_file, sheet_path, shared_strings):
    """시트 XML에서 A열(첫 번째 셀) 값만 추출. 1행 제외."""
    with zip_file.open(sheet_path) as f:
        root = ET.parse(f).getroot()
    names = []
    for row in root.findall(".//main:row", NS):
        cells = row.findall("main:c", NS)
        if not cells:
            continue
        first = cells[0]
        r = first.get("r", "")
        if not r.startswith("A"):
            continue
        t = first.get("t")
        v_el = first.find("main:v", NS)
        if v_el is None or v_el.text is None:
            continue
        val = v_el.text.strip()
        if t == "s" and val.isdigit():
            idx = int(val)
            if 0 <= idx < len(shared_strings):
                name = shared_strings[idx].strip()
                if name and name not in ("작업명", "코드", "작업구분"):
                    names.append(name)
    return names


def main():
    if not XLSX_PATH.exists():
        print(f"파일 없음: {XLSX_PATH}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(XLSX_PATH, "r") as z:
        shared_strings = get_shared_strings(z)
        all_names = set()
        # 시트 목록: xlsx에서는 sheet1.xml, sheet2.xml, ...
        for i in range(1, 20):
            sheet_path = f"xl/worksheets/sheet{i}.xml"
            try:
                z.getinfo(sheet_path)
            except KeyError:
                break
            names = get_column_a_work_names_from_sheet(z, sheet_path, shared_strings)
            all_names.update(names)

    sorted_names = sorted(all_names)
    OUT_CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV_PATH, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["external_term"])
        for n in sorted_names:
            w.writerow([n])

    print(f"고유 작업명 수: {len(sorted_names)}")
    print(f"저장: {OUT_CSV_PATH}")


if __name__ == "__main__":
    main()
