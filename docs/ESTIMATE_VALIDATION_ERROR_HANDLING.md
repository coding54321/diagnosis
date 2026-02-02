# 견적서 검증 서비스 - 비정상 케이스 처리 기획

## 개요

멀티모달 AI API를 통한 견적서 인식 과정에서 발생할 수 있는 다양한 비정상 케이스에 대한 처리 방안을 정리한 문서입니다.  
네이버 영수증리뷰, OCR 실패 케이스 처리 방식을 참고하여, 사용자 경험을 해치지 않으면서도 서비스 품질을 유지할 수 있는 정책을 수립합니다.

---

## 1. 케이스 분류 및 처리 전략

### 1.1 완전히 관련 없는 문서 (Non-Estimate Documents)

**케이스 예시:**
- 일반 영수증 (음식점, 편의점 등)
- 명함, 전단지, 메뉴판
- 신분증, 운전면허증
- 차량 등록증, 보험증
- 완전히 무관한 이미지 (풍경, 인물사진 등)

**AI 판단 기준:**
- 견적서 관련 키워드 부재 (정비, 부품, 공임, 견적 등)
- 견적서 구조 패턴 부재 (항목 리스트, 금액 합계 등)
- 신뢰도 점수: **0.3 미만**

**처리 정책:**

```
[단계 1] 즉시 감지 및 안내
- AI가 업로드된 이미지를 분석하여 "견적서가 아닌 것으로 보입니다" 메시지 표시
- 구체적인 안내 문구:
  "업로드하신 이미지는 견적서가 아닌 것으로 보입니다. 
   정비소에서 받은 견적서를 촬영해 주세요."

[단계 2] 대안 제시
- "직접 입력하기" 버튼 제공 (기존 플로우로 이동)
- "다시 촬영하기" 버튼 제공 (카메라 화면으로 복귀)
- "도움말 보기" 링크 (견적서 예시 이미지 제공)

[단계 3] 사용자 선택
- 사용자가 "그래도 진행하기"를 선택하면 → 직접 입력 플로우로 전환
- 이 경우 AI 인식 결과는 무시하고, 사용자가 수동으로 모든 정보 입력
```

**UX 원칙:**
- ❌ "오류입니다" 같은 부정적 메시지 지양
- ✅ "이렇게 하면 됩니다" 같은 건설적 안내 제공
- ✅ 사용자가 실수했을 가능성을 고려한 친절한 톤

---

### 1.2 견적서이지만 형식이 비표준인 경우 (Non-Standard Estimate Formats)

**케이스 예시:**
- 수기 견적서 (정비사가 손으로 작성)
- 카카오톡/문자로 받은 텍스트 견적
- 엑셀/PDF로 받은 전자 견적서
- 정비소 자체 양식 (표준 견적서와 레이아웃이 다름)
- 복수 페이지 견적서 (한 장만 촬영)

**AI 판단 기준:**
- 견적서 관련 키워드는 존재하나 구조 파싱이 어려움
- 일부 필드만 인식 가능 (항목명은 있으나 금액 누락 등)
- 신뢰도 점수: **0.3 ~ 0.7**

**처리 정책:**

```
[단계 1] 부분 인식 결과 제시
- AI가 인식한 부분만 먼저 채워서 Review 화면에 표시
- 인식되지 않은 필드는 빈 칸으로 표시하되, 
  "이 부분은 직접 입력해 주세요" 안내 문구 추가

[단계 2] 신뢰도 표시
- 각 필드별로 "자동 인식됨" / "수동 입력 필요" 배지 표시
- 전체 인식률을 퍼센트로 표시 (예: "약 60% 자동 인식됨")

[단계 3] 사용자 보정 유도
- Review 화면에서 누락된 필드를 탭하면 즉시 수정 가능
- "인식이 어려운 견적서는 직접 입력이 더 빠를 수 있어요" 안내
- "직접 입력으로 전환" 버튼 제공 (기존 입력 플로우로 이동)
```

**UX 원칙:**
- ✅ AI가 도와주되, 사용자가 최종 검증/수정하는 구조 유지
- ✅ "인식 실패"가 아닌 "부분 인식 성공"으로 프레이밍
- ✅ 사용자가 직접 입력하는 것도 정상적인 플로우임을 강조

---

### 1.3 이미지 품질 문제로 인한 인식 실패 (Image Quality Issues)

**케이스 예시:**
- 흐릿한 이미지 (손떨림, 초점 불량)
- 어두운 조명, 그림자
- 반사/글로스로 인한 텍스트 가림
- 구겨지거나 찢어진 종이
- 잘린 이미지 (견적서 일부만 촬영)

**AI 판단 기준:**
- 이미지 품질 지표 (해상도, 명도, 대비) 낮음
- 텍스트 인식률이 임계값 이하
- 신뢰도 점수: **0.5 미만**

**처리 정책:**

```
[단계 1] 품질 검사 및 즉시 피드백
- 이미지 업로드/촬영 직후 품질 검사 수행
- 문제가 감지되면 촬영 화면에서 즉시 안내:
  "이미지가 흐릿해 보입니다. 다시 촬영해 주세요."
  "조명이 어두워 보입니다. 밝은 곳에서 촬영해 주세요."

[단계 2] 촬영 가이드 제공
- 문제 유형별 구체적인 해결 방법 제시:
  - 흐릿함 → "손떨림 방지, 평평한 곳에 놓고 촬영"
  - 어두움 → "밝은 조명 아래에서 촬영"
  - 반사 → "각도를 조정하여 반사 피하기"
  - 잘림 → "견적서 전체가 보이도록 촬영"

[단계 3] 강제 재촬영 vs 선택적 진행
- 심각한 품질 문제 (신뢰도 0.3 미만): 
  → "다시 촬영하기" 강제, "그래도 진행" 옵션 제공
- 경미한 품질 문제 (신뢰도 0.3~0.5):
  → "다시 촬영 권장" 안내, 사용자 선택 허용
```

**UX 원칙:**
- ✅ 문제를 감지했을 때 즉시 피드백 (사용자가 아직 촬영 화면에 있을 때)
- ✅ 구체적인 해결 방법 제시 (추상적 안내 지양)
- ✅ 사용자가 "그래도 진행"을 선택할 수 있는 유연성 제공

---

### 1.4 필수 정보 누락 (Missing Critical Information)

**케이스 예시:**
- 항목명은 있으나 금액이 없음
- 총액만 있고 항목별 상세가 없음
- 정비소명이 없음
- 날짜가 없음

**AI 판단 기준:**
- 견적서 구조는 인식되었으나 필수 필드 누락
- 신뢰도 점수: **0.5 이상이지만 필수 필드 완성도 낮음**

**처리 정책:**

```
[단계 1] 누락 필드 명시
- Review 화면에서 누락된 필드를 명확히 표시
- 각 필드에 "필수 입력" 배지 및 경고 아이콘 표시

[단계 2] 단계별 입력 유도
- 필수 필드가 모두 채워질 때까지 "검증하기" 버튼 비활성화
- 누락된 필드를 탭하면 즉시 입력 가능하도록 UX 설계

[단계 3] 대안 제시
- "이 견적서에는 항목별 상세가 없어 보입니다. 
   총액만으로는 정확한 검증이 어렵습니다."
- "직접 입력하기" 또는 "정비소에 항목별 견적 요청" 안내
```

**UX 원칙:**
- ✅ 누락된 정보를 명확히 표시 (사용자가 무엇을 채워야 하는지 알 수 있게)
- ✅ 검증 진행을 막되, 사용자에게 선택권 제공
- ✅ "정확한 검증을 위해서는" 같은 이유 설명 포함

---

## 2. 멀티모달 AI API 통합 전략

### 2.1 API 호출 전 사전 검증 (Pre-Validation)

**목적:** 불필요한 API 호출 비용 절감 및 즉시 피드백

```typescript
// 이미지 업로드 직후 실행
async function preValidateImage(imageFile: File): Promise<PreValidationResult> {
  // 1. 파일 타입/크기 검증 (기존 로직)
  if (!imageFile.type.startsWith('image/')) {
    return { valid: false, reason: 'INVALID_FILE_TYPE' };
  }
  
  // 2. 이미지 품질 검사 (해상도, 명도, 대비)
  const qualityScore = await analyzeImageQuality(imageFile);
  if (qualityScore < 0.3) {
    return { valid: false, reason: 'POOR_QUALITY', score: qualityScore };
  }
  
  // 3. 기본 이미지 분석 (간단한 텍스트 감지)
  const hasText = await detectTextPresence(imageFile);
  if (!hasText) {
    return { valid: false, reason: 'NO_TEXT_DETECTED' };
  }
  
  return { valid: true };
}
```

### 2.2 멀티모달 AI API 호출 및 결과 해석

**API 응답 구조 가정:**

```typescript
interface AIEstimateRecognitionResult {
  isEstimate: boolean;              // 견적서 여부 (0~1)
  confidence: number;                // 전체 신뢰도 (0~1)
  fields: {
    shopName?: { value: string; confidence: number };
    date?: { value: string; confidence: number };
    items: Array<{
      name: { value: string; confidence: number };
      partCost?: { value: number; confidence: number };
      laborCost?: { value: number; confidence: number };
      totalCost?: { value: number; confidence: number };
    }>;
    totalAmount?: { value: number; confidence: number };
  };
  quality: {
    imageQuality: number;           // 이미지 품질 (0~1)
    textRecognitionRate: number;     // 텍스트 인식률 (0~1)
  };
  warnings: string[];                // 경고 메시지 배열
}
```

**결과 해석 로직:**

```typescript
function interpretAIResult(result: AIEstimateRecognitionResult): ValidationStatus {
  // 케이스 1: 견적서가 아님
  if (result.isEstimate === false || result.confidence < 0.3) {
    return {
      status: 'NOT_ESTIMATE',
      message: '업로드하신 이미지는 견적서가 아닌 것으로 보입니다.',
      actions: ['RETRY_CAPTURE', 'MANUAL_INPUT']
    };
  }
  
  // 케이스 2: 이미지 품질 문제
  if (result.quality.imageQuality < 0.5) {
    return {
      status: 'POOR_QUALITY',
      message: '이미지 품질이 낮아 인식이 어려울 수 있습니다.',
      actions: ['RETRY_CAPTURE', 'PROCEED_ANYWAY']
    };
  }
  
  // 케이스 3: 필수 필드 누락
  const missingFields = detectMissingFields(result.fields);
  if (missingFields.length > 0) {
    return {
      status: 'MISSING_FIELDS',
      message: `다음 정보가 누락되었습니다: ${missingFields.join(', ')}`,
      actions: ['MANUAL_INPUT', 'PROCEED_PARTIAL'],
      missingFields
    };
  }
  
  // 케이스 4: 부분 인식 성공
  if (result.confidence < 0.7) {
    return {
      status: 'PARTIAL_RECOGNITION',
      message: '일부 정보만 자동 인식되었습니다. 확인 후 수정해 주세요.',
      actions: ['REVIEW_AND_EDIT'],
      recognizedFields: result.fields
    };
  }
  
  // 케이스 5: 정상 인식
  return {
    status: 'SUCCESS',
    message: '견적서가 성공적으로 인식되었습니다.',
    actions: ['REVIEW_AND_CONFIRM'],
    recognizedFields: result.fields
  };
}
```

---

## 3. 사용자 경험 플로우

### 3.1 전체 플로우 다이어그램

```
[이미지 업로드/촬영]
    ↓
[사전 검증] → [품질 문제] → [재촬영 안내]
    ↓
[멀티모달 AI API 호출]
    ↓
[결과 해석]
    ├─ [견적서 아님] → [안내 + 직접 입력 유도]
    ├─ [품질 문제] → [재촬영 권장 + 선택적 진행]
    ├─ [필수 정보 누락] → [누락 필드 표시 + 입력 유도]
    ├─ [부분 인식] → [인식된 부분 표시 + 보정 유도]
    └─ [정상 인식] → [Review 화면으로 이동]
```

### 3.2 각 케이스별 UI 컴포넌트 설계

#### 케이스 1: 견적서 아님

```tsx
<ErrorState 
  icon={<DocumentX />}
  title="견적서가 아닌 것으로 보입니다"
  message="정비소에서 받은 견적서를 촬영해 주세요."
  actions={[
    { label: '다시 촬영하기', action: 'RETRY_CAPTURE' },
    { label: '직접 입력하기', action: 'MANUAL_INPUT' },
    { label: '견적서 예시 보기', action: 'SHOW_EXAMPLE' }
  ]}
/>
```

#### 케이스 2: 품질 문제

```tsx
<WarningState 
  icon={<AlertCircle />}
  title="이미지 품질이 낮아 보입니다"
  message="다시 촬영하시면 더 정확하게 인식할 수 있어요."
  tips={[
    "밝은 조명 아래에서 촬영",
    "평평한 곳에 놓고 손떨림 방지",
    "견적서 전체가 보이도록 촬영"
  ]}
  actions={[
    { label: '다시 촬영하기', primary: true },
    { label: '그래도 진행하기', secondary: true }
  ]}
/>
```

#### 케이스 3: 필수 정보 누락

```tsx
<ReviewScreen 
  fields={recognizedFields}
  missingFields={[
    { name: '정비 항목', required: true },
    { name: '총 금액', required: true }
  ]}
  message="일부 정보가 누락되었습니다. 직접 입력해 주세요."
  actions={[
    { label: '누락된 정보 입력하기', action: 'FILL_MISSING' },
    { label: '직접 입력으로 전환', action: 'SWITCH_TO_MANUAL' }
  ]}
/>
```

---

## 4. 정책 및 운영 가이드라인

### 4.1 사용자 안내 원칙

1. **부정적 메시지 지양**
   - ❌ "오류가 발생했습니다"
   - ✅ "이렇게 하면 더 잘 인식됩니다"

2. **구체적인 해결 방법 제시**
   - ❌ "다시 시도해 주세요"
   - ✅ "밝은 곳에서 평평하게 놓고 촬영해 주세요"

3. **사용자 선택권 보장**
   - 모든 오류 케이스에서 "그래도 진행하기" 옵션 제공
   - 사용자가 직접 입력하는 것도 정상적인 플로우임을 강조

### 4.2 데이터 수집 및 학습 전략

**목적:** AI 모델 지속적 개선

```
[오류 케이스 수집]
- 사용자가 "그래도 진행"을 선택한 경우
- 사용자가 직접 입력으로 전환한 경우
- 이러한 케이스의 이미지와 최종 입력 데이터를 매칭하여 수집

[학습 데이터로 활용]
- 오류 케이스 이미지를 라벨링하여 재학습
- 비표준 견적서 형식에 대한 학습 데이터 확보
- 시간이 지날수록 인식률 향상 기대
```

### 4.3 비용 관리 전략

**API 호출 최적화:**

1. **사전 검증으로 불필요한 호출 차단**
   - 이미지 품질이 너무 낮으면 API 호출 전에 차단
   - 텍스트가 전혀 없는 이미지는 API 호출 생략

2. **캐싱 전략**
   - 동일 이미지 해시에 대한 중복 호출 방지
   - 사용자가 "다시 촬영" 후 동일 이미지 업로드 시 캐시 활용

3. **사용자 동의 기반 호출**
   - 품질 문제가 감지되면 사용자에게 "그래도 분석할까요?" 확인
   - 사용자가 명시적으로 동의한 경우에만 API 호출

---

## 5. 네이버 영수증리뷰 참고 사항

### 5.1 유사점

1. **대체 인증 방법 제공**
   - 네이버: 카드 결제 내역, 네이버페이 결제
   - 본 서비스: 직접 입력, 수동 보정

2. **재촬영 유도**
   - 네이버: 촬영 가이드 제공
   - 본 서비스: 품질 문제 시 구체적인 촬영 팁 제공

3. **사용자 선택권**
   - 네이버: 영수증 없이도 리뷰 작성 가능 (인증만 안 됨)
   - 본 서비스: 인식 실패해도 직접 입력으로 검증 가능

### 5.2 차별점

1. **목적의 차이**
   - 네이버: 리뷰 작성이 목적 (인증은 부가)
   - 본 서비스: 검증이 목적 (정확한 데이터 입력이 필수)

2. **데이터 요구사항**
   - 네이버: 최소한의 정보만 있으면 됨
   - 본 서비스: 항목별 상세 정보가 검증에 필수

3. **오류 허용도**
   - 네이버: 인증 실패해도 리뷰는 작성 가능
   - 본 서비스: 필수 정보 누락 시 검증 진행 불가

---

## 6. 구현 우선순위

### Phase 1: 기본 오류 처리 (MVP)
- [ ] 이미지 품질 사전 검증
- [ ] "견적서 아님" 케이스 감지 및 안내
- [ ] 필수 필드 누락 감지 및 입력 유도

### Phase 2: 고도화 (V1.1)
- [ ] 부분 인식 결과 표시 및 보정 UX
- [ ] 촬영 가이드 인터랙티브 제공
- [ ] 오류 케이스 데이터 수집 파이프라인

### Phase 3: 학습 및 개선 (V1.2+)
- [ ] 수집된 오류 케이스로 모델 재학습
- [ ] 비표준 견적서 형식 인식률 향상
- [ ] 사용자 피드백 기반 개선

---

## 7. 참고 자료

- [네이버 영수증리뷰 작성 가이드](https://help.naver.com/service/19485/contents/11540)
- [OCR 정확도 결정 요소](https://www.koreadeep.com/blog/ocr-core-factors)
- [VLM OCR 기술 동향](https://www.koreadeep.com/blog/vlm-ocr)
