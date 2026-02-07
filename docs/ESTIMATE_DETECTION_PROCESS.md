# 견적서 여부 판단 프로세스

현재 시스템에서 **"이 문서가 견적서인지"**를 어떻게 판단하는지 정리한 문서입니다.

---

## 1. 입력 경로별 요약

| 입력 경로 | 판단 시점 | 판단 주체 |
|-----------|-----------|-----------|
| **이미지 촬영** (camera / album → review) | 이미지 분석 API 응답 후 | OpenAI Vision (GPT-4o) + 서버 검증 |
| **직접 입력** (manual) | 없음 | 사용자가 견적서를 입력한다고 가정 |

직접 입력은 사용자가 명시적으로 견적서를 입력하는 플로우이므로 **견적서 여부 판단을 하지 않습니다.**

---

## 2. 이미지 분석 시 견적서 여부 판단

**진입:** `app/(main)/verify/review/page.tsx`에서 이미지 전송 → `lib/openai/vision.ts`의 **`analyzeEstimateImage(imageUrl)`** 호출.

### 2.1 AI(OpenAI)가 내리는 판정

- **프롬프트 지시 (system):**  
  "다음 중 하나라도 해당하면 **isEstimate: true**로 판정:
  - 자동차점검·정비명세서, 견적서, 정비명세서
  - 정비 항목과 금액이 포함된 자동차 관련 문서
  - 블루핸즈, 오토큐, 공임나라 등 정비소 문서"

- 모델은 이미지 내용을 보고 JSON으로 다음을 반환:
  - **`isEstimate`**: boolean (문서가 견적서/정비명세서인지)
  - **`confidence`**: 0~1 (인식 신뢰도)
  - **`quality.imageQuality`**: 0~1 (이미지 품질)
  - **`items`**: 정비 항목 배열 (이름, 부품비, 공임비 등)

즉, **견적서인지 여부는 1차적으로 GPT-4o가 이미지 내용을 보고 isEstimate로 판단**합니다.

### 2.2 서버 측 검증 (vision.ts)

API 응답을 파싱한 뒤, 아래 **순서대로** 검사합니다.

1. **견적서 아님 + 유효 항목 없음**  
   - 조건: `!parsed.isEstimate && !hasValidItems`  
   - `hasValidItems` = `parsed.items && parsed.items.length > 0`  
   - 처리: **실패 반환**, `status: 'NOT_ESTIMATE'`, `error: '견적서가 아닌 것으로 보입니다.'`

2. **신뢰도 낮음 + 유효 항목 없음** (이미지 전용)  
   - 조건: `(parsed.confidence || 0) < 0.3 && !hasValidItems`  
   - 처리: **실패 반환**, `status: 'NOT_ESTIMATE'`, `error: '인식 신뢰도가 낮습니다. 더 선명한 이미지로 다시 시도해주세요.'`

3. **이미지 품질 낮음** (이미지 전용)  
   - 조건: `parsed.quality?.imageQuality < 0.5`  
   - 처리: **실패 반환**, `status: 'POOR_QUALITY'`, `error: '이미지 품질이 낮아 인식이 어려울 수 있습니다.'`

4. 위에 해당하지 않으면 **성공**으로 간주하고, `normalizeOCRItems(parsed.items)` 적용 후 결과 반환.

**정리:**  
- **isEstimate가 false여도** `items`가 유효하면(한 개 이상) **견적서로 인정**합니다. (오판 완화)
- **isEstimate가 true**이면 items가 없어도 통과할 수 있으나, 이후 플로우에서 항목이 없으면 의미가 없으므로 실질적으로는 **isEstimate 또는 hasValidItems 둘 중 하나만 만족하면** “견적서로 진행”됩니다.

---

## 3. UI에서의 처리

- **review 페이지:**  
  - `analyzeEstimateImage()` 결과가 `success: false`이고 `status === 'NOT_ESTIMATE'`이면  
    → `ocrError`에 메시지 설정: **"견적서가 아닌 것으로 보입니다. 정비소에서 받은 견적서를 촬영해 주세요."**  
  - `POOR_QUALITY`면 이미지 품질 안내, 그 외에는 일반 오류 메시지.

---

## 4. 플로우 요약

```
[이미지]
  → analyzeEstimateImage()
       → GPT-4o: isEstimate, confidence, quality, items
       → 검증: (!isEstimate && !hasValidItems) → NOT_ESTIMATE
       → 검증: confidence < 0.3 && !hasValidItems → NOT_ESTIMATE
       → 검증: imageQuality < 0.5 → POOR_QUALITY
       → 통과 시 정규화 후 success

[직접 입력]
  → 견적서 여부 판단 없음 (사용자 입력을 그대로 견적서로 처리)
```

**결론:**  
- **견적서인지 여부**는 **AI가 반환한 isEstimate**와 **유효한 items 존재 여부(hasValidItems)**로 결정됩니다.  
- 이미지의 경우 **confidence**, **imageQuality**로 한 번 더 걸러서, 견적서가 아니거나 인식이 불확실한 경우 사용자에게 "견적서가 아닌 것으로 보입니다" / "다시 촬영해 주세요" 등으로 안내합니다.
