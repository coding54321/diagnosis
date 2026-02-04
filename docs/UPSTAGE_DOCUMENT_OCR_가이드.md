# Upstage Document OCR API 사용 가이드

OpenAI Vision 대신(또는 병행) **Upstage Document OCR** 로 견적서 이미지에서 텍스트를 추출한 뒤, 그 텍스트를 OpenAI에 넘겨 블루핸즈 정규화·범주에 맞게 구조화하는 흐름 정리.

---

## 1. Upstage Document OCR API

- **엔드포인트**: `POST https://api.upstage.ai/v1/document-digitization`
- **역할**: 이미지/문서 파일을 보내면 **추출된 텍스트**를 JSON으로 반환 (OCR).
- **인증**: `Authorization: Bearer {UPSTAGE_API_KEY}`

---

## 2. API 키 발급

1. [Upstage Console](https://console.upstage.ai) 접속 후 로그인.
2. [API Keys](https://console.upstage.ai/api-keys) 메뉴에서 **Create API Key**.
3. 발급된 키를 복사해 **서버 환경 변수**에만 넣어 사용 (클라이언트 노출 금지).

```env
# .env.local (Next.js)
UPSTAGE_API_KEY=your_upstage_api_key_here
```

---

## 3. API 호출 방법 (Document OCR)

### 3.1 엔드포인트·인증

- **URL**: `POST https://api.upstage.ai/v1/document-digitization`
- **헤더**: `Authorization: Bearer {UPSTAGE_API_KEY}`

### 3.2 요청 Body (multipart/form-data)

| 필드 | 필수 | 설명 |
|------|------|------|
| `model` | O | `"ocr"` (최신 OCR 모델 alias) |
| `document` | O | OCR 처리할 파일 (이미지/PDF 등) |
| `schema` | X | 응답 형식. `"clova"` \| `"google"` (Upstage 제공 형식) |

### 3.3 cURL 예시

```bash
curl -X POST "https://api.upstage.ai/v1/document-digitization" \
  -H "Authorization: Bearer $UPSTAGE_API_KEY" \
  -F "model=ocr" \
  -F "document=@/path/to/estimate_image.jpg"
```

### 3.4 응답 (200 성공 시)

- **`text`**: 전체 추출 텍스트 (문자열). 이 값을 OpenAI 등 LLM에 넘기면 됨.
- **`pages`**: 페이지별 배열. 각 항목에 `text`, `words`(바운딩 박스 등) 포함.
- **`confidence`**: 인식 신뢰도 (0~1).
- **`metadata`**, **`numBilledPages`** 등 부가 정보.

```json
{
  "apiVersion": "1.1",
  "confidence": 0.99,
  "text": "Print the words \nhello, world",
  "pages": [
    {
      "id": 0,
      "text": "Print the words \nhello, world",
      "words": [ { "text": "Print", ... }, ... ]
    }
  ],
  "numBilledPages": 1
}
```

---

## 4. Next.js에서 사용하는 흐름

### 4.1 전체 흐름 (Upstage OCR → OpenAI 구조화)

1. **클라이언트**: 견적서 이미지 촬영/업로드 → Base64 또는 FormData로 서버에 전달.
2. **서버**:
   - **Upstage Document OCR** (`POST /v1/document-digitization`) 호출 → 응답 **`text`** 수신.
   - 그 **`text`** 를 **OpenAI Chat Completions**에 넣어, “아래 견적서 텍스트를 분석해 JSON(shopName, items, totalAmount, 블루핸즈 범주 등)으로 추출해라” 식으로 한 번 더 호출.
3. **화면**: OpenAI가 반환한 구조화 JSON을 그대로 사용해 사용자에게 표시 (기존 `OCRResult` 형식 유지).

→ Upstage는 **텍스트 추출(OCR)** 만 담당하고, **의도에 맞는 구조화·블루핸즈 정규화**는 OpenAI 프롬프트로 처리하는 구성이 맞음.

### 4.2 구현 위치

- **`lib/upstage/document-ocr.ts`**: `parseDocumentWithUpstage(imageInput)` — Upstage OCR 호출 후 `{ success, text, confidence }` 반환.
- **`lib/openai/vision.ts`** (또는 별도 함수): Upstage에서 받은 `text`를 OpenAI에 넘겨 기존과 동일한 `OCRResult` 형태로 파싱.

### 4.3 기존 `analyzeEstimateImage`와 연동

- **Upstage 사용 시**: 이미지 → `parseDocumentWithUpstage(imageBase64)` → `text` → OpenAI “텍스트만” 입력으로 견적서 JSON 추출 → `OCRResult` 반환.
- **OpenAI Vision만 사용 시**: 기존처럼 이미지 URL을 그대로 Vision API에 넘겨 처리.

---

## 5. 체크리스트

| 항목 | 내용 |
|------|------|
| API 키 | `.env.local`에 `UPSTAGE_API_KEY` 설정 |
| 엔드포인트 | `POST https://api.upstage.ai/v1/document-digitization` |
| 요청 | multipart/form-data: `model=ocr`, `document=파일` |
| 응답 | `response.text` 사용 (전체 OCR 텍스트) |
| 후처리 | OCR `text` → OpenAI로 견적서 JSON(블루핸즈 정규화) 생성 → 사용자 표시 |

---

## 6. 참고

- Upstage Console: Document digitization → **Document OCR** 문서.
- [Upstage API Keys](https://console.upstage.ai/api-keys)
