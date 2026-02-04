#!/usr/bin/env python3
"""
전국조합 작업명 → 블루핸즈 표준 항목 매핑 후보 제안.
규칙 → 정규화 포함 → 키워드 점수 → 유사도 순으로 후보 1개 제안. 검수용 CSV 출력.

사용: python scripts/suggest_bluehands_mapping.py
입력: docs/national_association_work_terms.csv, public/bluehands_maintenance.csv
출력: docs/national_association_mapping_suggestions.csv
"""

import csv
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TERMS_CSV = ROOT / "docs" / "national_association_work_terms.csv"
BLUEHANDS_CSV = ROOT / "public" / "bluehands_maintenance.csv"
OUT_CSV = ROOT / "docs" / "national_association_mapping_suggestions.csv"

# 전국조합 표현 → 블루핸즈 작업명 (1차 규칙). 검수 시 확장.
RULE_MAP = {
    "후드 록크": "후드 래취 어셈블리",
    "후드 케이블": "후드 래취 어셈블리",
    "라디에이터그릴": "라디에이터 그릴 어셈블리",
    "라디에이터 그릴": "라디에이터 그릴 어셈블리",
    "백도어": "테일게이트 판넬 어셈블리",
    "프론트 범퍼": "프론트 범퍼 오버홀",
    "후드": "후드 판넬 어셈블리",
    "헤드램프(좌측)": "헤드 램프 어셈블리(LH)",
    "헤드램프(우측)": "헤드 램프 어셈블리(RH)",
    "포그램프(좌측)": "프론트포그램프어셈블리 (LH)",
    "포그램프(우측)": "프론트포그램프어셈블리 (RH)",
    "헤드램프 가니쉬(일체형)": "헤드 램프 어셈블리 (양쪽)",
    "리어 범퍼": "리어 범퍼 어셈블리(오버홀)",
    "엔진오일": "엔진오일/필터/에어크리너",
    "엔진 오일": "엔진오일/필터/에어크리너",
    "엔진 오일/휠터": "엔진 오일/휠터",
}


def load_bluehands(path):
    """(category, no, work_name) 리스트."""
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        r = csv.reader(f)
        next(r)  # header
        for row in r:
            if len(row) >= 3:
                rows.append((row[0].strip(), int(row[1]) if row[1].isdigit() else 0, row[2].strip()))
    return rows


def load_external_terms(path):
    """external_term 리스트."""
    terms = []
    with open(path, "r", encoding="utf-8") as f:
        r = csv.DictReader(f)
        for row in r:
            t = row.get("external_term", "").strip()
            if t:
                terms.append(t)
    return terms


def normalize(s):
    """공백·괄호 정규화 (비교용)."""
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\([^)]*\)", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def tokenize(s):
    """공백, 괄호, 슬래시 기준 토큰 (2글자 이상)."""
    s = re.sub(r"[()/]", " ", s)
    return [w for w in re.split(r"\s+", s) if len(w) >= 2]


def keyword_score(term_tokens, work_tokens):
    """겹치는 토큰 비율 (0~1)."""
    if not term_tokens:
        return 0.0
    inter = set(term_tokens) & set(work_tokens)
    return len(inter) / len(term_tokens)


def similarity(a, b):
    """SequenceMatcher 비율 (0~1)."""
    return SequenceMatcher(None, a, b).ratio()


def find_by_work_name(bluehands_list, work_name):
    """work_name과 완전 일치하는 (category, no, work_name) 반환."""
    for c, n, w in bluehands_list:
        if w == work_name:
            return (c, n, w)
    return None


def suggest_one(external_term, bluehands_list, rule_map):
    """한 전국조합 표현에 대해 (category, no, work_name, match_type, score) 후보 1개."""
    # 1) 규칙
    if external_term in rule_map:
        w = rule_map[external_term]
        hit = find_by_work_name(bluehands_list, w)
        if hit:
            return (*hit, "rule", 1.0)

    norm_term = normalize(external_term)
    term_tokens = tokenize(external_term)

    best = None
    best_score = 0.0
    best_type = ""

    for category, no, work_name in bluehands_list:
        norm_work = normalize(work_name)
        work_tokens = tokenize(work_name)

        # 2) 정규화 후 포함
        if norm_term in norm_work or norm_work in norm_term:
            s = 0.9 if norm_term == norm_work else 0.75
            if s > best_score:
                best = (category, no, work_name)
                best_score = s
                best_type = "contains"

        # 3) 키워드
        kw = keyword_score(term_tokens, work_tokens)
        if kw >= 0.5 and kw > best_score:
            best = (category, no, work_name)
            best_score = kw
            best_type = "keyword"

        # 4) 유사도
        sim = similarity(norm_term, norm_work)
        if sim >= 0.5 and sim > best_score:
            best = (category, no, work_name)
            best_score = sim
            best_type = "similarity"

    if best:
        return (*best, best_type, round(best_score, 3))
    return (None, None, "", "none", 0.0)


def main():
    if not TERMS_CSV.exists():
        print("먼저 extract_national_association_terms.py 를 실행하세요.", file=sys.stderr)
        sys.exit(1)
    if not BLUEHANDS_CSV.exists():
        print(f"블루핸즈 CSV 없음: {BLUEHANDS_CSV}", file=sys.stderr)
        sys.exit(1)

    bluehands_list = load_bluehands(BLUEHANDS_CSV)
    terms = load_external_terms(TERMS_CSV)

    rows = []
    for t in terms:
        cat, no, work_name, match_type, score = suggest_one(t, bluehands_list, RULE_MAP)
        rows.append({
            "external_term": t,
            "suggested_category": cat or "",
            "suggested_no": no if no is not None else "",
            "suggested_work_name": work_name,
            "match_type": match_type,
            "score": score,
        })

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["external_term", "suggested_category", "suggested_no", "suggested_work_name", "match_type", "score"],
        )
        w.writeheader()
        w.writerows(rows)

    matched = sum(1 for r in rows if r["match_type"] != "none")
    print(f"전국조합 항목 수: {len(terms)}")
    print(f"후보 제안된 항목 수: {matched}")
    print(f"저장: {OUT_CSV}")
    print("검수 후 suggested_* 컬럼을 확정하고 maintenance_term_mapping 에 시드하세요.")


if __name__ == "__main__":
    main()
