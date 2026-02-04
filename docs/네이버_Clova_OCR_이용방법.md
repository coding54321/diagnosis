# 네이버 Clova OCR 이용 방법

Upstage OCR 대신 **네이버 클라우드 CLOVA OCR**을 사용할 때 필요한 설정과 API 사용법 정리.

---

## 1. 사전 준비 (네이버 클라우드 플랫폼)

### 1.1 콘솔 접속
- [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com) 로그인
- **AI·Application Service** → **CLOVA OCR** 메뉴 이동

### 1.2 CLOVA OCR 도메인 생성
1. **Application** 또는 **OCR** 메뉴에서 **도메인 생성** 선택
2. 사용할 **도메인 이름** 입력 (예: `diagnosis-ocr`)
3. **General OCR** 사용 시: 일반 텍스트·표 추출용 도메인 선택  
   (견적서처럼 자유 형식 문서는 **General OCR**이 적합)
4. 생성 완료 후 **Invoke URL**과 **Client Secret** 확인

### 1.3 Invoke URL / Client Secret 확인
- **Invoke URL**: API 호출 시 사용하는 엔드포인트 (예: `https://xxxxx.apigw.ntruss.com/custom/v1/xxxx/general`)
- **Client Secret**: 요청 헤더 `X-OCR-SECRET`에 넣을 비밀 키
- 이 두 값을 `.env`에 설정해야 함 (아래 2절 참고)

---

## 2. 환경 변수 설정

프로젝트 루트 `.env` 또는 `.env.local`에 다음을 추가:

```env
# Clova OCR (네이버 클라우드)
CLOVA_OCR_INVOKE_URL=https://xxxxx.apigw.ntruss.com/custom/v1/xxxx/general
CLOVA_OCR_SECRET=your-client-secret-here
```

- `CLOVA_OCR_INVOKE_URL`: 콘솔에서 복사한 **Invoke URL** (General OCR이면 경로 끝이 `/general`)
- `CLOVA_OCR_SECRET`: 콘솔에서 복사한 **Client Secret**

---

## 3. API 호출 방식 요약

### 3.1 요청

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | Invoke URL (위 환경 변수) |
| **Headers** | `Content-Type: application/json`<br>`X-OCR-SECRET: {Client Secret}` |
| **Body** | JSON (이미지 base64 또는 URL) |

### 3.2 요청 Body 예시 (Base64 이미지)

```json
{
  "version": "V2",
  "requestId": "uuid-문자열",
  "timestamp": 1234567890,
  "lang": "ko",
  "images": [
    {
      "format": "jpg",
      "name": "estimate",
      "data": "base64로 인코딩된 이미지 문자열"
    }
  ]
}
```

- **version**: `V1` 또는 `V2` (V2 권장)
- **requestId**: 호출당 고유 UUID
- **timestamp**: 밀리초 단위 타임스탬프
- **lang**: `ko` (한국어)
- **images[].format**: `jpg`, `jpeg`, `png`, `pdf`, `tif`, `tiff` 등
- **images[].name**: 이미지 식별용 이름
- **images[].data**: Base64 인코딩된 이미지 (Data URL이면 `data:image/...;base64,` 접두어 제거 후 전달)

### 3.3 이미지 제한
- **크기**: 50MB 이하
- **형식**: jpg, png, pdf, tiff
- **해상도**: A4 기준 150dpi 이상 권장

---

## 4. 응답 구조 (General OCR)

응답은 JSON이며, 이미지별로 인식 결과가 들어 있습니다.

- **images[].inferResult**: `"SUCCESS"` 등 상태
- **images[].fields[]**: 인식된 영역 배열
  - **inferText**: 해당 영역에서 추출된 텍스트
  - **boundingPoly** 등 좌표 정보

**전체 텍스트**를 쓰려면 `images[0].fields`를 순회하면서 `inferText`를 이어 붙이면 됩니다. (줄바꿈은 필드 순서 또는 boundingPoly로 판단 가능)

---

## 5. 에러 코드 참고

| HTTP | 코드 | 의미 |
|------|------|------|
| 400 | 0001 | URL/요청 형식 오류 |
| 401 | 0002 | Secret Key 검증 실패 (X-OCR-SECRET 확인) |
| 400 | 0011 | 요청 바디 값 오류 |
| 500 | 0501 | OCR 서비스 내부 오류 |

---

## 6. 프로젝트 연동 상태

이미 아래처럼 연동되어 있습니다.

- **`lib/clova/document-ocr.ts`**  
  Clova General OCR 호출 및 응답에서 텍스트 추출. Upstage와 동일한 반환 타입(`{ success, text }` / `{ success: false, error }`) 사용.
- **`lib/openai/vision.ts`**  
  `analyzeEstimateImage` 호출 시 OCR 우선순위:
  1. **Clova OCR** — `CLOVA_OCR_SECRET`과 `CLOVA_OCR_INVOKE_URL`이 있으면 먼저 시도
  2. **Upstage OCR** — `UPSTAGE_API_KEY`가 있으면 시도
  3. **OpenAI Vision** — 위 두 개가 없거나 실패 시 이미지 직접 전송

`.env`에 Clova 값만 넣으면 Clova가 우선 사용되고, 실패 시 Upstage → Vision 순으로 폴백됩니다.

---

## 7. 참고 링크

- [CLOVA OCR 개요 (네이버 클라우드)](https://api-fin.ncloud-docs.com/docs/ai-application-service-ocr)
- [General OCR API 가이드](https://guide-fin.ncloud-docs.com/docs/clovaocr-general)
- [CLOVA OCR 사용 준비 (도메인/키 등)](https://guide-fin.ncloud-docs.com/docs/clovaocr-spec)
