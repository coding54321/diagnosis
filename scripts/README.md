# 스크립트

## 0. 전국자동차정비업체 표준데이터 적재

Supabase `national_repair_shops` 테이블에 전국 등록 정비업체를 넣어 두고, 정비소 검색/OCR 매칭에 사용합니다.

### 방법 A: JSON 파일로 적재 (권장)

공공데이터포털에서 **JSON**으로 다운로드한 파일을 그대로 적재합니다.

**필요**: `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**실행**:

```bash
npm run seed-shops
```

기본 경로: `public/전국자동차정비업체표준데이터.json`  
다른 경로를 쓰려면:

```bash
npx tsx scripts/seed-national-repair-shops-from-json.ts public/다운받은파일.json
```

- JSON 구조: `{ "records": [ { "자동차정비업체명", "소재지도로명주소", ... } ] }` 형태여야 합니다.
- 기존 테이블 데이터를 지운 뒤, 파일 전체를 배치로 삽입합니다.

### 방법 B: 공공 API로 동기화

**필요 환경변수**: `DATA_GO_KR_SERVICE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

```bash
npm run sync-shops
```

- 공공 API 페이지네이션 조회 후 기존 행 삭제 → 새 행 삽입.
- API가 JSON을 지원해야 하며, XML만 지원 시 스크립트 수정이 필요할 수 있음.

---

## 정비 항목 매핑용 스크립트

전국자동차검사정비사업조합 표현 → 블루핸즈 표준 정비표 매핑을 위한 데이터 준비 스크립트.

## 1. 전국조합 작업명 추출

```bash
python3 scripts/extract_national_association_terms.py
```

- **입력**: `public/전국자동차검사정비사업조합-표준정비시간 (1).xlsx` (모든 시트 A열)
- **출력**: `docs/national_association_work_terms.csv` (컬럼: `external_term`)

## 2. 블루핸즈 매핑 후보 제안

```bash
python3 scripts/suggest_bluehands_mapping.py
```

- **입력**:  
  - `docs/national_association_work_terms.csv`  
  - `public/bluehands_maintenance.csv`
- **출력**: `docs/national_association_mapping_suggestions.csv`  
  - 컬럼: `external_term`, `suggested_category`, `suggested_no`, `suggested_work_name`, `match_type`, `score`
- **제안 순서**: 규칙 → 정규화 포함 → 키워드 → 유사도

## 3. 이후 단계

1. `national_association_mapping_suggestions.csv`를 열어 **검수**: 잘못된 제안 수정, 빈 행은 수동 매핑 또는 미매핑 유지.
2. 확정된 행만 `maintenance_term_mapping` 테이블에 시드 (`external_term`, `standard_item_id`, `source='전국조합'`).
3. `standard_item_id`는 `maintenance_standard_items`에서 `(category, no)`로 조회해 얻기.

자세한 구상은 `docs/전국조합_블루핸즈_매핑_구상.md` 참고.
