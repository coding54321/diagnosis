# Hyundai/Kia 디자인 시스템 정보

## 📋 개요

이 문서는 현대/기아 디자인 시스템 적용을 위한 정보를 정리한 것입니다.

## 🔍 조사 결과

### 1. 공식 디자인 시스템

**현대/기아 그룹의 공식 디자인 시스템 문서는 공개되지 않았습니다.**

하지만 다음 리소스를 통해 디자인 패턴을 파악할 수 있습니다:

- **마이현대(MyHyundai) 앱**: 현대자동차 공식 모바일 앱
- **마이기아(MyKia) 앱**: 기아 공식 모바일 앱
- **블루핸즈 웹사이트**: 현대 정비 서비스 플랫폼
- **현대/기아 공식 웹사이트**: 브랜드 컬러 및 UI 패턴

### 2. 참고 가능한 공개 디자인 시스템

- **KRDS (Korea Design System)**: 정부 표준 UI/UX 가이드라인
  - URL: https://www.krds.go.kr
  - 한국 기업의 디자인 표준 참고 가능

## 🎨 적용된 디자인 토큰

### 색상 시스템

#### Hyundai Blue (현대 블루)
- **Primary**: `#0069A3` (hyundai-blue-500)
- **사용 용도**: 주요 CTA, 브랜드 강조, 링크
- **팔레트**: 50~900 단계로 구성

#### Kia Red (기아 레드)
- **Primary**: `#E11919` (kia-red-500)
- **사용 용도**: 기아 브랜드 관련 UI
- **팔레트**: 50~900 단계로 구성

#### Semantic Colors (상태 색상)
- **Success**: `#00C853` - 성공 메시지, 완료 상태
- **Warning**: `#FFA726` - 경고 메시지, 주의 필요
- **Error**: `#E53935` - 오류 메시지, 실패 상태
- **Info**: `#2196F3` - 정보 메시지, 안내

### 타이포그래피

#### 폰트
- **Primary**: Hyundai Sans (로컬 설치)
- **Fallback**: 시스템 폰트 (-apple-system, BlinkMacSystemFont, Segoe UI)

#### 폰트 웨이트
- Light: 300
- Regular: 400 (기본)
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

#### 텍스트 스타일
- Display 1: 48px / Bold
- Display 2: 36px / Bold
- Heading 1-4: 30px~18px / Bold~Medium
- Body 1-2: 16px~14px / Normal
- Caption: 12px / Normal

### 간격 시스템

4px 기준의 일관된 간격 시스템:
- 1 = 4px
- 2 = 8px
- 4 = 16px
- 6 = 24px
- 8 = 32px
- 등등...

### 둥근 모서리

- sm: 2px
- base: 4px
- md: 6px
- lg: 8px
- xl: 12px
- 2xl: 16px
- 3xl: 24px
- full: 완전한 원

### 그림자

- sm: 작은 그림자
- base: 기본 그림자
- md: 중간 그림자
- lg: 큰 그림자
- xl: 매우 큰 그림자
- 2xl: 초대형 그림자

## 🔤 Hyundai Sans 폰트

### 폰트 정보

- **이름**: Hyundai Sans
- **제작사**: 현대자동차
- **용도**: 현대/기아 그룹 공식 브랜드 폰트
- **설치 상태**: 로컬에 설치됨

### 폰트 파일 구조

로컬 시스템에 설치된 폰트를 사용하거나, 다음 경로에 폰트 파일을 배치할 수 있습니다:

```
public/fonts/
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

### 폰트 적용 방법

`app/globals.css`에서 `@font-face`로 선언되어 있으며, 다음 순서로 폰트를 로드합니다:

1. 로컬 시스템 폰트 (local())
2. 웹폰트 파일 (woff2, woff, ttf 순서)

## 📁 파일 구조

```
design-system/
├── tokens/
│   ├── colors.ts          # 색상 토큰 정의
│   ├── typography.ts      # 타이포그래피 토큰 정의
│   ├── spacing.ts         # 간격 토큰 정의
│   ├── borderRadius.ts    # 둥근 모서리 토큰 정의
│   ├── shadows.ts         # 그림자 토큰 정의
│   └── index.ts          # 통합 export
├── README.md             # 사용 가이드
└── DESIGN_SYSTEM_INFO.md # 이 문서
```

## 🚀 사용 방법

### TypeScript에서 직접 사용

```typescript
import { colors, typography } from '@/design-system/tokens';

const primaryColor = colors.hyundai.blue[500];
const fontSize = typography.fontSize.lg.size;
```

### Tailwind CSS 클래스 사용

```tsx
<div className="bg-hyundai-blue-500 text-white">
  현대 블루 버튼
</div>

<h1 className="text-display-1">대형 제목</h1>
<p className="text-body-1">본문 텍스트</p>
```

## 📝 참고 사항

1. **공식 문서 부재**: 현대/기아의 공식 디자인 시스템 문서가 공개되지 않아, 공식 웹사이트와 앱의 UI 패턴을 분석하여 토큰을 정의했습니다.

2. **색상 값**: 실제 브랜드 컬러는 공식 브랜드 가이드라인을 참고하여 정확한 값으로 업데이트가 필요할 수 있습니다.

3. **폰트 라이선스**: Hyundai Sans 폰트 사용 시 라이선스 확인이 필요합니다.

4. **향후 업데이트**: 현대/기아 공식 디자인 시스템 문서를 확보하면 토큰 값을 업데이트해야 합니다.

## 🔗 참고 링크

- 현대자동차 공식 웹사이트: https://www.hyundai.com
- 기아 공식 웹사이트: https://www.kia.com
- KRDS (Korea Design System): https://www.krds.go.kr
- 블루핸즈 표준정비시간: https://www.hyundai.com/kr/ko/customer-service/service-network/bluehands-information/standard-maintenance-time-guide.html

## 📅 업데이트 이력

- 2025-01-XX: 초기 디자인 시스템 구축 및 문서 작성
