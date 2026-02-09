# OpenAI API 사용 방식 종합 정리

현재 서비스에서 **OpenAI API**가 **어디에서**, **어떤 방식으로**, **어떤 프롬프트**로 사용되는지 정리한 문서입니다.

---

## 1. 사용 위치 요약

| 구분 | 파일 | 함수/역할 |
|------|------|-----------|
| **구현** | `lib/openai/vision.ts` | OpenAI 클라이언트 초기화, 텍스트 분석, 이미지 분석 |
| **호출** | `app/(main)/verify/review/page.tsx` | 견적서 이미지 촬영 후 리뷰 페이지 마운트 시 `analyzeEstimateImage(image)` 호출 |

- **진입 흐름**: 사용자가 카메라/앨범에서 견적서 이미지 선택 → `sessionStorage`에 이미지 + `pendingOcr` 저장 → `/verify/review` 이동 → review 페이지 `useEffect`에서 `analyzeEstimateImage(image)` 호출 (서버 액션).
- **직접 입력**으로 들어온 경우에는 이미지가 없으므로 OpenAI 호출 없음.

---

## 2. OpenAI 사용 방식 (2가지 경로)

### 2.1 이미지 분석 진입: `analyzeEstimateImage(imageUrl)`

**함수**: `lib/openai/vision.ts` → `analyzeEstimateImage(imageUrl: string)`

**흐름**:

1. **1단계: Upstage OCR (선택)**  
   - `process.env.UPSTAGE_API_KEY`가 있으면 **Upstage Document OCR**로 이미지에서 텍스트 추출 시도.
   - 성공하고 텍스트가 비어 있지 않으면 → **2-A**로 이동 (OpenAI **텍스트** 분석).
   - 실패하거나 빈 텍스트면 → **2-B**로 폴백 (OpenAI **Vision** 분석).

2. **2-A: OpenAI 텍스트 분석 (Chat Completions)**  
   - Upstage에서 추출한 텍스트를 `analyzeEstimateFromText(ocrText)`에 넘김.  
   - **모델**: `gpt-4o`  
   - **역할**: “견적서 OCR 텍스트 → 구조화된 JSON” 변환.  
   - 프롬프트는 아래 **3.1** 참고.

3. **2-B: OpenAI Vision (폴백)**  
   - Upstage가 없거나 실패 시, **이미지 자체**를 OpenAI에 전송.  
   - **모델**: `gpt-4o`  
   - **역할**: “견적서 이미지 → 구조화된 JSON” (OCR + 구조화 한 번에).  
   - 프롬프트는 아래 **3.2** 참고.

정리하면:

- **OpenAI가 쓰이는 경우**  
  - (A) **텍스트 입력**: Upstage OCR 텍스트 → `analyzeEstimateFromText()` → `gpt-4o` Chat (텍스트만).  
  - (B) **이미지 입력**: 이미지 URL/base64 → `gpt-4o` Chat with `image_url` (Vision).

---

## 3. 프롬프트 상세

### 3.1 텍스트 분석용 (Upstage OCR 결과 → JSON 구조화)

- **상수명**: `ESTIMATE_TEXT_SYSTEM_PROMPT` (`lib/openai/vision.ts`)
- **역할**: “한국 자동차 정비 견적서 OCR 텍스트”에서 정비소명, 날짜, 차량정보, 항목 배열 등을 **JSON**으로 추출.
- **호출**: `analyzeEstimateFromText(ocrText)` → `openai.chat.completions.create`의 `system` 메시지.

**시스템 프롬프트 요지**:

- 당신은 **한국 자동차 정비 견적서 텍스트를 분석하는 전문가**.
- **입력**: 견적서/명세서에서 추출한 OCR 텍스트.
- **추출할 정보**:
  - `shopName`, `shopAddress`, `date` (YYYY-MM-DD), `registrationNumber`, `vehicleModel`, `mileage`
  - `items`: 배열 — 각 항목에 `name`(견적서 원문 그대로), `normalizedName`(블루핸즈 표준 작업명), `partCost`, `laborCost`, `totalCost`, `category`
  - `totalAmount`, `vatIncluded`, `vatAmount`
- **중요**: `name`은 원문 그대로, `normalizedName`은 블루핸즈/현대·기아 정비표 표준 작업명으로 매핑.
- **응답 형식**: JSON 객체 (예시 포함).

**유저 메시지**:

- `"아래 견적서 텍스트를 분석해 JSON으로 추출해주세요. 각 정비 항목에는 name(견적서 원문 그대로)과 normalizedName(블루핸즈 표준 작업명)을 모두 포함해주세요."`  
- 그 다음 `---` 구분 후 실제 OCR 텍스트 (최대 12,000자 슬라이스).

**API 옵션**:

- `model: 'gpt-4o'`
- `response_format: { type: 'json_object' }`
- `max_tokens: 4000`

---

### 3.2 이미지 분석용 (Vision 폴백 — 이미지 → JSON)

- **위치**: `analyzeEstimateImage()` 내부의 `openai.chat.completions.create` 호출에서 **system** 메시지.
- **역할**: “견적서/정비명세서 **이미지**”를 보고 동일한 구조의 JSON 추출 + 견적서 여부/품질 판정.

**시스템 프롬프트 요지**:

- 당신은 **한국 자동차 정비 문서를 분석하는 OCR 전문가**.
- **문서 유형 (isEstimate: true 조건)**:
  - 자동차점검·정비명세서, 견적서, 정비명세서
  - 정비 항목과 금액이 포함된 자동차 관련 문서
  - 블루핸즈, 오토큐, 공임나라 등 정비소 문서
- **추출할 정보**: 3.1과 동일 (shopName, shopAddress, date, registrationNumber, vehicleModel, mileage, items, totalAmount, vatAmount 등).
- **items**: `name`(견적서/이미지에 보인 그대로), `normalizedName`(블루핸즈 표준 작업명), partCost, laborCost, totalCost, category.
- **카테고리**: 제동/냉각/전기/엔진/변속기/기타 (예시 키워드 명시).
- **중요**:
  - name은 견적서/이미지에 보인 항목명 그대로.
  - normalizedName은 블루핸즈/현대·기아 표준 정비표 작업명으로 매핑.
  - 문서 양식 다양 가능, 이미지 숫자 정확히 읽기.
  - 부품비/공임비 분리 시 각각 추출, 합계만 있으면 totalCost에 넣고 partCost=0, laborCost=0.
- **JSON 응답 형식**: 3.1과 유사 + `quality: { imageQuality, textRecognitionRate }`, `warnings` 등.

**유저 메시지** (멀티모달):

- **type: 'text'**:  
  `"이 자동차 정비 견적서/명세서 이미지를 분석해주세요. 이미지에서 다음 정보를 추출해주세요: 정비소명, 정비소 주소(도로명 또는 지번), 날짜, 차량번호, 차종, 주행거리, 각 정비 항목의 이름·부품비·공임비, 총 금액과 부가세. 문서 양식에 관계없이 이미지에 보이는 내용을 정확히 읽어주세요. JSON 형식으로만 응답해주세요."`
- **type: 'image_url'**:  
  - `url`: 전달받은 이미지 (base64 또는 URL)
  - `detail: 'high'` (고해상도 분석)

**API 옵션**:

- `model: 'gpt-4o'`
- `response_format: { type: 'json_object' }`
- `max_tokens: 4000`

---

## 4. 응답 처리 및 에러/상태

### 4.1 공통 반환 타입: `OCRResult`

- `success: boolean`
- `data?`: shopName, shopAddress, date, registrationNumber, vehicleModel, mileage, items, totalAmount, vatIncluded, vatAmount
- `confidence?`, `status?`, `warnings?`, `error?`

### 4.2 Vision 응답에서의 서버 측 검증 (vision.ts)

- **견적서 아님**: `!parsed.isEstimate && !hasValidItems` → `success: false`, `status: 'NOT_ESTIMATE'`, 에러 메시지.
- **신뢰도 낮음**: `(parsed.confidence || 0) < 0.3 && !hasValidItems` → `success: false`, “인식 신뢰도가 낮습니다…”.
- **이미지 품질 낮음**: `parsed.quality?.imageQuality < 0.5` → `success: false`, `status: 'POOR_QUALITY'`, “이미지 품질이 낮아 인식이 어려울 수 있습니다.”.
- **부분 인식**: 필수 필드 누락 시 `status: 'PARTIAL'`, 모두 있으면 `'COMPLETE'`.

### 4.3 review 페이지에서의 사용

- `analyzeEstimateImage(image)` 결과가 `success: false`이면:
  - `status === 'NOT_ESTIMATE'` → “견적서가 아닌 것으로 보입니다…”
  - `status === 'POOR_QUALITY'` → “이미지 품질이 낮아 인식이 어려울 수 있습니다.”
  - 그 외 → “이미지 분석 중 오류가 발생했습니다.”
- `success: true`이면 `applyOcrResultToState(ocrResult)`로 상태 반영 후 Step 2로 이동.

---

## 5. 환경 변수

- **OpenAI**: `process.env.OPENAI_API_KEY`  
  - 없으면 `analyzeEstimateImage` / `analyzeEstimateFromText` 모두 즉시 `success: false` + “OpenAI API 키가 설정되지 않았습니다.” 반환.
- **Upstage (선택)**: `process.env.UPSTAGE_API_KEY`  
  - 있으면 이미지 분석 시 먼저 Upstage OCR 시도, 없으면 바로 OpenAI Vision 사용.

---

## 6. 한 줄 요약

- **위치**: `lib/openai/vision.ts` (구현), `app/(main)/verify/review/page.tsx` (호출).
- **방식**: 견적서 **이미지** → (가능하면 Upstage OCR →) **텍스트** 또는 **이미지**를 OpenAI **gpt-4o** Chat/Vision으로 보내 **구조화 JSON** 추출.
- **프롬프트**: (1) 텍스트용: “한국 견적서 OCR 텍스트 → JSON (원문 name + 블루핸즈 normalizedName)”. (2) 이미지용: 동일 구조 + “이미지에서 정확히 읽어 JSON으로만 응답” + `image_url` with `detail: 'high'`.
