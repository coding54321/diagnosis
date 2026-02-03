# OpenAI Vision API 연동 설계

견적서 이미지를 OpenAI Vision API로 OCR 처리하고, 결과를 DB에 저장한 뒤 UI에 표시하고 검증에 활용하는 전체 프로세스를 정리한 문서입니다.

---

## 1. 전체 플로우 개요

```
[견적서 촬영/앨범 선택]
         │
         ▼
[이미지 업로드 (Supabase Storage)]
         │
         ▼
[OpenAI Vision API 호출]
         │
         ├─→ [OCR 결과 파싱]
         │        │
         │        ▼
         │   [에러 케이스 검증]
         │        │
         │        ├─→ [견적서 아님] → 사용자 안내 + 직접 입력 유도
         │        ├─→ [품질 문제] → 재촬영 권장 + 선택적 진행
         │        ├─→ [부분 인식] → 인식된 부분만 표시 + 수동 입력 유도
         │        └─→ [정상 인식] → Review 화면으로 진행
         │
         ▼
[OCR 결과 DB 저장 (임시)]
         │
         ▼
[Review 화면 진입]
         │
         ├─→ [OCR 결과 표시]
         │        │
         │        ▼
         │   [사용자 수정/보완]
         │        │
         │        ▼
         │   [검증하기 클릭]
         │        │
         │        ▼
         │   [최종 데이터 DB 저장]
         │        │
         │        ▼
         │   [검증 엔진 실행]
         │        │
         │        ▼
         │   [검증 결과 화면]
```

---

## 2. DB 스키마 확장 (OCR 결과 저장)

### 2.1 `estimates` 테이블에 추가할 필드 (선택)

현재 스키마:
- `id`, `user_id`, `vehicle_id`, `shop_name`, `total_amount`, `image_url`, `created_at`, `updated_at`

**추가 고려 사항:**
- `ocr_result_json`: OCR 원본 JSON (디버깅/재분석용)
- `ocr_confidence`: 전체 OCR 신뢰도 (0~1)
- `ocr_status`: OCR 상태 (`pending`, `completed`, `failed`, `manual_input`)
- `ocr_completed_at`: OCR 완료 시각

**마이그레이션 예시:**
```sql
ALTER TABLE estimates
ADD COLUMN ocr_result_json JSONB,
ADD COLUMN ocr_confidence DECIMAL(3,2),
ADD COLUMN ocr_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN ocr_completed_at TIMESTAMPTZ;
```

**또는 별도 테이블로 분리 (권장):**
```sql
CREATE TABLE estimate_ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE,
  ocr_result_json JSONB NOT NULL,
  confidence DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 `estimate_items` 테이블에 추가할 필드 (선택)

현재 스키마:
- `id`, `estimate_id`, `name`, `part_cost`, `labor_cost`, `total_cost`, `category`, `display_order`, `created_at`

**추가 고려 사항:**
- `ocr_confidence`: 항목별 OCR 신뢰도 (0~1)
- `is_ocr_detected`: OCR로 인식된 항목인지 여부 (사용자가 추가한 항목과 구분)

**마이그레이션 예시:**
```sql
ALTER TABLE estimate_items
ADD COLUMN ocr_confidence DECIMAL(3,2),
ADD COLUMN is_ocr_detected BOOLEAN DEFAULT FALSE;
```

---

## 3. OpenAI Vision API 호출 구조

### 3.1 Server Action: `analyzeEstimateImage`

**위치:** `lib/openai/vision.ts` (새 파일)

```typescript
'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OCRResult {
  success: boolean;
  data?: {
    shopName?: string;
    date?: string;
    registrationNumber?: string; // 차량번호
    items: Array<{
      name: string;
      partCost?: number;
      laborCost?: number;
      totalCost?: number;
      category?: string;
    }>;
    totalAmount?: number;
    vatIncluded?: boolean;
    vatAmount?: number;
  };
  confidence?: number;
  status?: 'NOT_ESTIMATE' | 'POOR_QUALITY' | 'PARTIAL' | 'COMPLETE';
  warnings?: string[];
  error?: string;
}

/**
 * OpenAI Vision API로 견적서 이미지 분석
 * @param imageUrl Supabase Storage URL 또는 base64 이미지
 */
export async function analyzeEstimateImage(
  imageUrl: string
): Promise<OCRResult> {
  try {
    // 이미지 URL이 base64인지 확인
    const imageContent = imageUrl.startsWith('data:')
      ? imageUrl
      : imageUrl; // Supabase URL인 경우 그대로 사용

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 또는 'gpt-4o-mini' (비용 절감)
      messages: [
        {
          role: 'system',
          content: `당신은 한국의 자동차 정비소 견적서를 분석하는 전문가입니다.
다음 JSON 형식으로 응답해주세요:
{
  "isEstimate": boolean,  // 견적서인지 여부
  "confidence": number,   // 전체 신뢰도 (0~1)
  "shopName": string,     // 정비소명
  "date": string,         // 의뢰일자 (YYYY-MM-DD)
  "registrationNumber": string,  // 차량번호 (있는 경우)
  "items": [
    {
      "name": string,     // 정비 항목명
      "partCost": number, // 부품비 (없으면 null)
      "laborCost": number,// 공임비 (없으면 null)
      "totalCost": number,// 소계
      "category": string  // 카테고리 (엔진, 변속기, 제동 등)
    }
  ],
  "totalAmount": number,  // 총 금액
  "vatIncluded": boolean, // 부가세 포함 여부
  "vatAmount": number,   // 부가세 금액
  "quality": {
    "imageQuality": number,      // 이미지 품질 (0~1)
    "textRecognitionRate": number // 텍스트 인식률 (0~1)
  },
  "warnings": string[]    // 경고 메시지
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '이 이미지에서 견적서 정보를 추출해주세요. JSON 형식으로만 응답해주세요.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageContent,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: 'OpenAI API 응답이 비어있습니다.',
      };
    }

    const parsed = JSON.parse(content);

    // 에러 케이스 검증
    if (!parsed.isEstimate || parsed.confidence < 0.3) {
      return {
        success: false,
        status: 'NOT_ESTIMATE',
        confidence: parsed.confidence || 0,
        warnings: parsed.warnings || [],
        error: '견적서가 아닌 것으로 보입니다.',
      };
    }

    if (parsed.quality?.imageQuality < 0.5) {
      return {
        success: false,
        status: 'POOR_QUALITY',
        confidence: parsed.confidence || 0,
        warnings: parsed.warnings || [],
        error: '이미지 품질이 낮아 인식이 어려울 수 있습니다.',
      };
    }

    // 부분 인식 체크
    const hasMissingFields =
      !parsed.shopName ||
      !parsed.items ||
      parsed.items.length === 0 ||
      !parsed.totalAmount;

    const status = hasMissingFields ? 'PARTIAL' : 'COMPLETE';

    return {
      success: true,
      data: {
        shopName: parsed.shopName,
        date: parsed.date,
        registrationNumber: parsed.registrationNumber,
        items: parsed.items || [],
        totalAmount: parsed.totalAmount,
        vatIncluded: parsed.vatIncluded,
        vatAmount: parsed.vatAmount,
      },
      confidence: parsed.confidence,
      status,
      warnings: parsed.warnings || [],
    };
  } catch (error) {
    console.error('OpenAI Vision API 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다.',
    };
  }
}
```

### 3.2 OCR 결과 DB 저장 (임시)

**위치:** `lib/supabase/actions.ts`에 추가

```typescript
/**
 * OCR 결과를 DB에 저장 (임시 또는 최종)
 */
export async function saveOCRResult(
  estimateId: string,
  ocrResult: OCRResult,
  imageUrl: string
) {
  const supabase = await createServerClient();

  // OCR 결과를 JSONB로 저장
  const { error } = await supabase
    .from('estimates')
    .update({
      ocr_result_json: ocrResult as unknown as Record<string, unknown>,
      ocr_confidence: ocrResult.confidence || null,
      ocr_status: ocrResult.success ? 'completed' : 'failed',
      ocr_completed_at: new Date().toISOString(),
      image_url: imageUrl,
    })
    .eq('id', estimateId);

  if (error) {
    console.error('OCR 결과 저장 실패:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
```

---

## 4. 플로우 통합: 촬영 → OCR → Review

### 4.1 촬영/앨범 선택 후 OCR 호출

**위치:** `app/(main)/verify/camera/page.tsx` 또는 `app/(main)/verify/album/page.tsx`

**변경 사항:**
- 이미지 확정 후 → **즉시 OCR 호출** (Review 진입 전)
- OCR 결과를 sessionStorage에 저장
- Review 페이지로 이동 시 OCR 결과 사용

```typescript
// camera/page.tsx 또는 album/page.tsx
import { analyzeEstimateImage } from '@/lib/openai/vision';
import { uploadEstimateImageAction } from '@/lib/supabase/actions';

const handleUsePhoto = async () => {
  if (!capturedImage) return;

  setIsSubmitting(true);
  try {
    // 1. 이미지 업로드 (Supabase Storage)
    const uploadResult = await uploadEstimateImageAction(capturedImage, 'temp');
    if (!uploadResult.success) {
      throw new Error('이미지 업로드 실패');
    }
    const imageUrl = uploadResult.data?.url || capturedImage;

    // 2. OpenAI Vision API 호출
    const ocrResult = await analyzeEstimateImage(imageUrl);

    // 3. 에러 케이스 처리
    if (!ocrResult.success) {
      if (ocrResult.status === 'NOT_ESTIMATE') {
        // 견적서가 아님 → 사용자 안내
        const proceed = confirm(
          '견적서가 아닌 것으로 보입니다. 직접 입력으로 진행하시겠어요?'
        );
        if (proceed) {
          router.push('/verify/manual');
          return;
        }
        return; // 촬영 화면 유지
      }

      if (ocrResult.status === 'POOR_QUALITY') {
        // 품질 문제 → 재촬영 권장
        const proceed = confirm(
          '이미지 품질이 낮아 인식이 어려울 수 있습니다. 그래도 진행하시겠어요?'
        );
        if (!proceed) {
          return; // 촬영 화면 유지
        }
      }
    }

    // 4. OCR 결과를 sessionStorage에 저장
    sessionStorage.setItem('capturedEstimateImage', capturedImage);
    sessionStorage.setItem('ocrResult', JSON.stringify(ocrResult));

    // 5. Review 페이지로 이동
    router.push('/verify/review');
  } catch (error) {
    console.error('OCR 처리 오류:', error);
    alert('이미지 분석 중 오류가 발생했습니다. 직접 입력으로 진행해주세요.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4.2 Review 페이지에서 OCR 결과 표시

**위치:** `app/(main)/verify/review/page.tsx`

**변경 사항:**
- sessionStorage에서 OCR 결과 읽기
- OCR 결과로 초기 상태 설정
- 사용자가 수정 가능하도록 유지

```typescript
// review/page.tsx
useEffect(() => {
  const image = sessionStorage.getItem('capturedEstimateImage');
  const ocrResultJson = sessionStorage.getItem('ocrResult');

  if (image) setCapturedImage(image);

  if (ocrResultJson) {
    try {
      const ocrResult: OCRResult = JSON.parse(ocrResultJson);

      if (ocrResult.success && ocrResult.data) {
        // OCR 결과로 초기 상태 설정
        if (ocrResult.data.shopName) {
          setShopName(ocrResult.data.shopName);
        }
        if (ocrResult.data.date) {
          setRequestDate(ocrResult.data.date);
        }
        if (ocrResult.data.items && ocrResult.data.items.length > 0) {
          setItems(
            ocrResult.data.items.map((item, index) => ({
              id: `ocr-item-${index}`,
              name: item.name,
              partCost: item.partCost || 0,
              laborCost: item.laborCost || 0,
              totalCost: item.totalCost || item.partCost + item.laborCost || 0,
              category: item.category || '',
            }))
          );
        }
        if (ocrResult.data.totalAmount) {
          // totalAmount는 items 합계로 계산되므로 참고용
        }
        if (ocrResult.data.registrationNumber) {
          setVehicleNumber(ocrResult.data.registrationNumber);
        }
        if (ocrResult.data.vatIncluded !== undefined) {
          setVatIncluded(ocrResult.data.vatIncluded);
        }
        if (ocrResult.data.vatAmount) {
          setVatAmount(ocrResult.data.vatAmount);
        }

        // 부분 인식 안내
        if (ocrResult.status === 'PARTIAL') {
          // 토스트 또는 배지로 안내
          console.log('일부 항목만 인식되었습니다. 확인 후 수정해주세요.');
        }
      }
    } catch (error) {
      console.error('OCR 결과 파싱 오류:', error);
    }
  }
}, []);
```

---

## 5. 에러 케이스 처리 (ESTIMATE_VALIDATION_ERROR_HANDLING.md 참고)

### 5.1 견적서가 아닌 경우 (`NOT_ESTIMATE`)

**처리:**
- 촬영 화면에서 즉시 안내
- "직접 입력하기" / "다시 촬영하기" 버튼 제공
- 사용자가 "그래도 진행" 선택 시 → 직접 입력 플로우로 전환

**UI 예시:**
```typescript
if (ocrResult.status === 'NOT_ESTIMATE') {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm">
        <p className="text-sm text-hyundai-gray-900 mb-4">
          업로드하신 이미지는 견적서가 아닌 것으로 보입니다.
          정비소에서 받은 견적서를 촬영해 주세요.
        </p>
        <div className="flex gap-2">
          <button onClick={() => router.push('/verify/manual')}>
            직접 입력하기
          </button>
          <button onClick={retakePhoto}>다시 촬영하기</button>
        </div>
      </div>
    </div>
  );
}
```

### 5.2 이미지 품질 문제 (`POOR_QUALITY`)

**처리:**
- 촬영 화면에서 즉시 피드백
- "다시 촬영 권장" 안내
- "그래도 진행" 옵션 제공

**UI 예시:**
```typescript
if (ocrResult.status === 'POOR_QUALITY') {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm">
        <p className="text-sm text-hyundai-gray-900 mb-4">
          이미지가 흐릿하거나 어두워 보입니다.
          다시 촬영하시면 더 정확한 인식이 가능합니다.
        </p>
        <div className="flex gap-2">
          <button onClick={retakePhoto}>다시 촬영하기</button>
          <button onClick={() => proceedWithOCR()}>그래도 진행</button>
        </div>
      </div>
    </div>
  );
}
```

### 5.3 부분 인식 (`PARTIAL`)

**처리:**
- Review 화면에서 인식된 부분만 표시
- 누락된 필드에 "수동 입력 필요" 배지
- 전체 인식률 퍼센트 표시

**UI 예시:**
```typescript
{ocrResult.status === 'PARTIAL' && (
  <div className="mb-4 p-3 bg-amber-50 rounded-xl">
    <p className="text-xs text-amber-700">
      약 {Math.round((ocrResult.confidence || 0) * 100)}% 자동 인식되었습니다.
      누락된 정보는 직접 입력해 주세요.
    </p>
  </div>
)}
```

### 5.4 필수 정보 누락

**처리:**
- Review 화면에서 누락 필드 명시
- "검증하기" 버튼 비활성화 (차량 정보, 항목 최소 1개 등 필수 조건)
- 필수 필드 탭 시 즉시 입력 가능

**검증 로직:**
```typescript
const canVerify = () => {
  if (!vehicleInfo) return false;
  if (items.length === 0) return false;
  if (estimateMileage <= 0) return false;
  return true;
};
```

---

## 6. 검증 엔진에 OCR 결과 활용

### 6.1 검증 시 OCR 신뢰도 반영

**위치:** `lib/verification/engine.ts`

OCR 신뢰도가 낮은 항목은 검증 결과에 "확인 필요" 상태를 더 자주 부여할 수 있습니다.

```typescript
// 검증 엔진에서 OCR 신뢰도 고려
function verifyItem(
  item: EstimateItem,
  ocrConfidence?: number
): ItemVerification {
  // OCR 신뢰도가 낮으면 (0.7 미만) 검증 결과를 더 보수적으로
  const baseResult = calculateVerification(item);
  
  if (ocrConfidence && ocrConfidence < 0.7) {
    // 신뢰도 낮은 항목은 "확인 필요"로 더 자주 분류
    if (baseResult.status === 'appropriate') {
      return { ...baseResult, status: 'review_needed' };
    }
  }
  
  return baseResult;
}
```

### 6.2 검증 결과 저장 시 OCR 메타데이터 포함

**위치:** `lib/supabase/actions.ts` - `createVerificationResult`

```typescript
// 검증 결과 저장 시 OCR 신뢰도도 함께 저장 (선택)
const saveVerificationResult = await createVerificationResult({
  estimateId: savedEstimateId,
  totalAmount: estimate.totalAmount,
  status: verificationResult.status,
  confidence: verificationResult.confidence,
  ocrConfidence: ocrResult.confidence, // OCR 신뢰도 추가
  items: [...],
});
```

---

## 7. 환경 변수 설정

`.env.local`에 추가:

```bash
OPENAI_API_KEY=sk-...
```

---

## 8. 구현 단계별 체크리스트

### Phase 1: 기본 OCR 연동
- [ ] `lib/openai/vision.ts` 생성 및 `analyzeEstimateImage` 구현
- [ ] 촬영/앨범 페이지에서 OCR 호출 로직 추가
- [ ] Review 페이지에서 OCR 결과 표시
- [ ] 기본 에러 케이스 처리 (NOT_ESTIMATE, POOR_QUALITY)

### Phase 2: DB 저장 및 메타데이터
- [ ] `estimates` 테이블에 OCR 필드 추가 (마이그레이션)
- [ ] OCR 결과 DB 저장 로직 추가
- [ ] OCR 상태 추적 (pending → completed/failed)

### Phase 3: 고급 에러 처리
- [ ] 부분 인식 UI (PARTIAL 상태)
- [ ] 필수 정보 누락 검증
- [ ] 사용자 친화적 에러 메시지

### Phase 4: 검증 엔진 통합
- [ ] OCR 신뢰도를 검증 결과에 반영
- [ ] 검증 결과에 OCR 메타데이터 포함

---

## 9. 비용 최적화 고려사항

1. **모델 선택:**
   - `gpt-4o`: 높은 정확도, 비용 높음
   - `gpt-4o-mini`: 비용 절감, 정확도 약간 낮음

2. **캐싱:**
   - 동일 이미지 해시로 OCR 결과 캐싱 (선택)

3. **재시도 정책:**
   - 실패 시 1회 재시도 후 사용자에게 직접 입력 유도

4. **이미지 전처리:**
   - 업로드 전 이미지 리사이즈 (최대 2048x2048 권장)

---

이 설계대로 구현하면 견적서 이미지를 OCR로 자동 인식하고, 에러 케이스를 적절히 처리하며, 사용자가 수정한 최종 데이터로 검증을 수행하는 완전한 플로우가 완성됩니다.
