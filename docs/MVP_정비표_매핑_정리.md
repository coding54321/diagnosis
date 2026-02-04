# MVP: 정비표 표준 및 유저 입력 매핑 정리

MVP 수준에서 정리한 범위만 요약한다.

---

## 1. 기준 데이터

- **통합 기준**: 블루핸즈 표준정비표 (`bluehands_maintenance.csv`)
- **DB**: `maintenance_standard_items` — 구분·NO·작업명만 저장 (차종별 시간 제외)
- **용도**: 유저 견적 항목을 “블루핸즈 표준 항목”으로 정규화할 때의 마스터

---

## 2. 사설/전국조합 표현 매핑 (MVP)

- **전국조합**: xlsx에서 고유 작업명 추출 → 블루핸즈 후보 제안 스크립트 → 검수용 CSV 생성까지 구현
- **스크립트**
  - `scripts/extract_national_association_terms.py` — 전국조합 작업명 추출
  - `scripts/suggest_bluehands_mapping.py` — 블루핸즈 매핑 후보 제안
- **산출물**
  - `docs/national_association_work_terms.csv` — 전국조합 고유 표현 목록
  - `docs/national_association_mapping_suggestions.csv` — 제안 결과 (검수 후 DB 시드용)
- **MVP 이후**: 검수 완료분만 `maintenance_term_mapping` 테이블 생성·시드, 유저 입력 정규화 시 이 테이블 조회

---

## 3. 문서·참고

| 문서 | 내용 |
|------|------|
| `docs/정비표_표준_분석_및_제언.md` | 기획 기준, 블루핸즈/전국조합 비교, DB 설계, 사설 정규화 방법 |
| `docs/전국조합_블루핸즈_매핑_구상.md` | 전국조합 → 블루핸즈 매핑 프로세스, 용어 예시, 구현 순서 |
| `scripts/README.md` | 추출·제안 스크립트 사용법 |

---

## 4. MVP 범위 요약

- 블루핸즈 표를 DB 마스터로 반영 ✅  
- 전국조합 표현 추출 + 블루핸즈 매핑 후보 제안(검수용 CSV) ✅  
- 매핑 테이블(`maintenance_term_mapping`) 생성·시드 및 런타임 매칭 로직 → MVP 이후 단계로 보류

이 정도로 MVP 수준 정리는 완료.
