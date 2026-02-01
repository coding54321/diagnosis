# 프로토타입 개발 계획서

## 📋 개요

claude.md를 중심으로 한 모바일 정비 견적 검증 서비스 프로토타입 개발 계획입니다.

## 🎯 MVP 범위 (최소 기능 제품)

### Phase 1: 핵심 기능 (우선순위 1)

#### 1. 홈 화면
- [x] 디자인 시스템 적용
- [ ] 견적서 검증하기 CTA 버튼
- [ ] 최근 검증 내역 (목업 데이터)
- [ ] 차량 정보 표시 (목업)
- [ ] 하단 네비게이션 (홈, 내 차 관리, 정비 상식, 설정)

#### 2. 견적서 입력 화면
- [ ] 입력 방식 선택 (사진 촬영, 앨범, 직접 입력)
- [ ] 카메라 촬영 UI (가이드 프레임)
- [ ] 앨범에서 선택
- [ ] 직접 입력 폼 (차량 정보, 정비 항목, 금액)

#### 3. OCR 결과 확인 화면 (목업)
- [ ] 인식된 차량 정보 표시
- [ ] 인식된 정비소 정보
- [ ] 인식된 정비 항목 리스트
- [ ] 수정 기능 (각 항목별)

#### 4. 검증 결과 요약 화면
- [ ] 총 견적 금액 표시
- [ ] 판정 결과 (적정/확인 필요/재검토 권장)
- [ ] 항목별 요약 (적정/확인 필요/재검토 개수)
- [ ] 항목별 상세 보기 링크

#### 5. 항목별 상세 화면
- [ ] 항목 카드 (부품비/공임비 분리)
- [ ] 가격 분포 그래프 (목업 데이터)
- [ ] 판정 결과 표시
- [ ] 부품 설명 토글
- [ ] 절감 팁

### Phase 2: 보강 기능 (우선순위 2)

#### 6. 정비사 상담 가이드
- [ ] 확인 질문 리스트
- [ ] 질문 복사 기능
- [ ] 상담 체크리스트

#### 7. 내 차 관리
- [ ] 정비 이력 타임라인
- [ ] 검증 내역 상세 보기

#### 8. 사후 검토 모드
- [ ] 저장된 검증 내역 상세 분석
- [ ] 통계 데이터 상세 보기

## 🏗️ 프로젝트 구조

```
diagnosis/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 인증 관련 (향후)
│   ├── (main)/                  # 메인 앱
│   │   ├── page.tsx            # 홈 화면
│   │   ├── verify/             # 견적 검증 플로우
│   │   │   ├── page.tsx        # 입력 방식 선택
│   │   │   ├── camera/         # 카메라 촬영
│   │   │   ├── manual/         # 직접 입력
│   │   │   ├── review/         # OCR 결과 확인
│   │   │   └── result/         # 검증 결과
│   │   ├── history/            # 검증 내역
│   │   └── vehicle/             # 내 차 관리
│   ├── globals.css
│   └── layout.tsx
├── components/                   # 재사용 컴포넌트
│   ├── ui/                      # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Progress.tsx
│   ├── layout/                  # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── Container.tsx
│   ├── verification/            # 검증 관련 컴포넌트
│   │   ├── EstimateCard.tsx
│   │   ├── PriceChart.tsx
│   │   ├── VerificationResult.tsx
│   │   └── QuestionGuide.tsx
│   └── vehicle/                 # 차량 관련 컴포넌트
│       └── VehicleInfo.tsx
├── lib/                         # 유틸리티 및 헬퍼
│   ├── utils.ts
│   ├── constants.ts
│   └── mockData.ts              # 목업 데이터
├── types/                       # TypeScript 타입
│   ├── estimate.ts
│   ├── vehicle.ts
│   └── verification.ts
└── design-system/               # 디자인 시스템
    └── tokens/
```

## 📱 화면별 상세 설계

### 1. 홈 화면 (`app/(main)/page.tsx`)

**기능:**
- 견적서 검증하기 메인 CTA
- 최근 검증 내역 2-3건 표시
- 차량 정보 표시 (등록된 경우)

**컴포넌트:**
- `Header` - 상단 헤더
- `VerificationCTA` - 메인 CTA 버튼
- `RecentHistory` - 최근 검증 내역 리스트
- `VehicleInfo` - 차량 정보 카드
- `BottomNav` - 하단 네비게이션

### 2. 견적서 입력 선택 (`app/(main)/verify/page.tsx`)

**기능:**
- 입력 방식 선택 (사진 촬영, 앨범, 직접 입력)

**컴포넌트:**
- `InputMethodCard` - 입력 방식 카드

### 3. 카메라 촬영 (`app/(main)/verify/camera/page.tsx`)

**기능:**
- 카메라 뷰파인더
- 가이드 프레임 표시
- 촬영 버튼
- 앨범/직접 입력 전환

**컴포넌트:**
- `CameraView` - 카메라 뷰
- `CaptureGuide` - 촬영 가이드

### 4. 직접 입력 (`app/(main)/verify/manual/page.tsx`)

**기능:**
- 차량 정보 입력 (제조사, 차종, 연식, 주행거리)
- 정비 항목 추가/수정
- 금액 입력 (부품비/공임비 분리)

**컴포넌트:**
- `VehicleForm` - 차량 정보 폼
- `EstimateItemForm` - 정비 항목 폼
- `PriceInput` - 금액 입력

### 5. OCR 결과 확인 (`app/(main)/verify/review/page.tsx`)

**기능:**
- 인식된 정보 표시
- 수정 기능
- 검증하기 버튼

**컴포넌트:**
- `ReviewCard` - 인식 결과 카드
- `EditableField` - 수정 가능 필드

### 6. 검증 결과 요약 (`app/(main)/verify/result/page.tsx`)

**기능:**
- 총 견적 금액 및 판정
- 항목별 요약
- 항목별 상세 보기 링크
- 액션 버튼 (진행하기, 상담하기, 저장)

**컴포넌트:**
- `VerificationSummary` - 요약 카드
- `ItemList` - 항목 리스트
- `ActionButtons` - 액션 버튼 그룹

### 7. 항목별 상세 (`app/(main)/verify/result/[itemId]/page.tsx`)

**기능:**
- 항목 상세 정보
- 가격 분포 차트
- 부품비/공임비 분해
- 부품 설명
- 절감 팁

**컴포넌트:**
- `ItemDetailCard` - 상세 카드
- `PriceChart` - 가격 분포 차트
- `CostBreakdown` - 비용 분해
- `PartInfo` - 부품 정보

## 🎨 디자인 시스템 적용

### 컴포넌트 스타일 가이드

#### 버튼
- Primary: `bg-hyundai-blue-500 text-white`
- Secondary: `bg-hyundai-gray-100 text-hyundai-gray-900`
- Danger: `bg-semantic-error text-white`

#### 카드
- 기본: `bg-white rounded-lg shadow-md p-6`
- 강조: `bg-hyundai-blue-50 border border-hyundai-blue-200`

#### 타이포그래피
- 제목: `text-h1`, `text-h2`, `text-h3`
- 본문: `text-body-1`, `text-body-2`
- 캡션: `text-caption`

## 📊 데이터 구조

### 목업 데이터 구조

```typescript
// types/estimate.ts
export interface EstimateItem {
  id: string;
  name: string;           // 정비 항목명
  partCost: number;       // 부품비
  laborCost: number;      // 공임비
  totalCost: number;      // 총액
  category: string;       // 카테고리 (엔진, 변속기, 제동 등)
}

export interface Estimate {
  id: string;
  vehicleId: string;
  shopName: string;
  items: EstimateItem[];
  totalAmount: number;
  createdAt: Date;
}

// types/verification.ts
export type VerificationStatus = 'appropriate' | 'review_needed' | 'recheck_recommended';

export interface VerificationResult {
  estimateId: string;
  totalAmount: number;
  status: VerificationStatus;
  items: ItemVerification[];
  confidence: number;     // 데이터 신뢰도 (표본 수 기반)
}

export interface ItemVerification {
  itemId: string;
  status: VerificationStatus;
  userPrice: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
    median: number;
  };
  sampleCount: number;
  breakdown: {
    partCost: {
      user: number;
      average: number;
    };
    laborCost: {
      user: number;
      average: number;
    };
  };
}
```

## 🚀 개발 단계

### Week 1: 기초 설정 및 홈 화면
- [x] 디자인 시스템 구축
- [ ] 기본 UI 컴포넌트 (Button, Card, Input)
- [ ] 레이아웃 컴포넌트 (Header, BottomNav)
- [ ] 홈 화면 구현
- [ ] 목업 데이터 구조 설계

### Week 2: 견적서 입력 플로우
- [ ] 입력 방식 선택 화면
- [ ] 직접 입력 폼 구현
- [ ] 카메라 촬영 UI (목업)
- [ ] OCR 결과 확인 화면 (목업 데이터)

### Week 3: 검증 결과 화면
- [ ] 검증 결과 요약 화면
- [ ] 항목별 상세 화면
- [ ] 가격 분포 차트 (목업)
- [ ] 판정 로직 구현 (목업)

### Week 4: 보강 기능
- [ ] 정비사 상담 가이드
- [ ] 검증 내역 저장/조회
- [ ] 내 차 관리 화면
- [ ] 반응형 디자인 최적화

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts 또는 Chart.js (가격 분포 차트용)
- **Icons**: Lucide React 또는 Heroicons
- **State Management**: React Context API (초기) → Zustand (필요시)

## 📝 다음 단계

1. **기본 컴포넌트 라이브러리 구축**
   - Button, Card, Input 등 기본 UI 컴포넌트
   - 디자인 시스템 토큰 적용

2. **홈 화면 구현**
   - 레이아웃 구조
   - 목업 데이터로 최근 내역 표시

3. **견적서 입력 플로우**
   - 직접 입력 폼 우선 구현
   - 카메라/OCR은 이후 단계

4. **검증 결과 화면**
   - 목업 데이터로 검증 결과 표시
   - 차트 라이브러리 통합

## 💡 고려사항

1. **모바일 우선**: 모바일 화면을 우선으로 설계
2. **목업 데이터**: 실제 OCR/검증 로직은 목업으로 시작
3. **점진적 개선**: MVP 완성 후 기능 추가
4. **성능**: 이미지 처리 시 최적화 고려
5. **접근성**: 키보드 네비게이션, 스크린 리더 지원
