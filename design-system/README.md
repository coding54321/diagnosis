# Hyundai/Kia Design System

현대/기아 디자인 시스템 기반 디자인 토큰 및 스타일 가이드입니다.

## 구조

```
design-system/
├── tokens/
│   ├── colors.ts          # 색상 토큰
│   ├── typography.ts      # 타이포그래피 토큰
│   ├── spacing.ts         # 간격 토큰
│   ├── borderRadius.ts    # 둥근 모서리 토큰
│   ├── shadows.ts         # 그림자 토큰
│   └── index.ts          # 통합 export
└── README.md
```

## 사용 방법

### 1. 디자인 토큰 직접 사용

```typescript
import { colors, typography, spacing } from '@/design-system/tokens';

// 색상 사용
const primaryColor = colors.hyundai.blue[500];

// 타이포그래피 사용
const fontSize = typography.fontSize.lg.size;
```

### 2. Tailwind CSS 클래스 사용

Tailwind 설정이 완료되어 있으므로 클래스로 바로 사용 가능합니다.

```tsx
// 색상
<div className="bg-hyundai-blue-500 text-white">
  현대 블루
</div>

<div className="bg-kia-red-500 text-white">
  기아 레드
</div>

// 타이포그래피
<h1 className="text-display-1">Display 1</h1>
<h2 className="text-h2">Heading 2</h2>
<p className="text-body-1">Body 1</p>
```

## 색상 시스템

### Hyundai Blue
- Primary: `hyundai-blue-500` (#0069A3)
- 사용 예: 주요 CTA 버튼, 브랜드 강조

### Kia Red
- Primary: `kia-red-500` (#E11919)
- 사용 예: 기아 브랜드 관련 UI

### Semantic Colors
- Success: `semantic-success` (#00C853)
- Warning: `semantic-warning` (#FFA726)
- Error: `semantic-error` (#E53935)
- Info: `semantic-info` (#2196F3)

## 타이포그래피

### 폰트
- **Primary**: Hyundai Sans (로컬 설치)
- Fallback: 시스템 폰트

### 텍스트 스타일
- `text-display-1`: 대형 제목 (48px, Bold)
- `text-display-2`: 중형 제목 (36px, Bold)
- `text-h1`: 제목 1 (30px, Bold)
- `text-h2`: 제목 2 (24px, Semibold)
- `text-h3`: 제목 3 (20px, Semibold)
- `text-h4`: 제목 4 (18px, Medium)
- `text-body-1`: 본문 1 (16px, Normal)
- `text-body-2`: 본문 2 (14px, Normal)
- `text-caption`: 캡션 (12px, Normal)

## 간격 시스템

4px 기준의 일관된 간격 시스템을 사용합니다.

- `spacing-1`: 4px
- `spacing-2`: 8px
- `spacing-4`: 16px
- `spacing-6`: 24px
- 등등...

## 폰트 설정

Hyundai Sans 폰트는 로컬에 설치되어 있다고 가정합니다.

### 폰트 파일 위치
폰트 파일을 다음 경로에 배치해주세요:
```
public/
└── fonts/
    ├── HyundaiSans-Regular.woff2
    ├── HyundaiSans-Regular.woff
    ├── HyundaiSans-Regular.ttf
    ├── HyundaiSans-Medium.woff2
    ├── HyundaiSans-Medium.woff
    ├── HyundaiSans-Medium.ttf
    ├── HyundaiSans-Bold.woff2
    ├── HyundaiSans-Bold.woff
    └── HyundaiSans-Bold.ttf
```

### 로컬 폰트 사용
로컬 시스템에 설치된 폰트를 사용하는 경우, `globals.css`의 `@font-face`에서 `local()` 우선순위를 조정하세요.

## 참고 자료

- 현대자동차 공식 웹사이트: https://www.hyundai.com
- 기아 공식 웹사이트: https://www.kia.com
- 마이현대 앱 UI/UX 패턴 참고

## 업데이트 이력

- 2025-01-XX: 초기 디자인 시스템 구축
