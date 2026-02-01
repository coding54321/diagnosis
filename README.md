# 정비 견적 검증 서비스

정비소에서 받은 견적의 적정성을 데이터로 검증하는 서비스입니다.

## 기술 스택

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Design System**: Hyundai/Kia Design System
- **Font**: Hyundai Sans

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 디자인 시스템

현대/기아 디자인 시스템이 적용되어 있습니다. 자세한 내용은 [`design-system/README.md`](./design-system/README.md)를 참고하세요.

### 주요 특징

- Hyundai/Kia 브랜드 컬러 시스템
- Hyundai Sans 폰트 적용
- 일관된 간격 및 타이포그래피 시스템
- Tailwind CSS 통합

## 프로젝트 구조

```
diagnosis/
├── app/                    # Next.js App Router
│   ├── globals.css        # 글로벌 스타일 및 폰트 설정
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈 페이지
├── design-system/         # 디자인 시스템
│   ├── tokens/           # 디자인 토큰
│   └── README.md         # 디자인 시스템 문서
├── public/                # 정적 파일
│   └── fonts/            # 폰트 파일 (생성 필요)
└── ...
```

## 폰트 설정

Hyundai Sans 폰트를 사용합니다. 폰트 파일을 `public/fonts/` 폴더에 배치하거나, 로컬에 설치된 폰트를 사용할 수 있습니다.

자세한 설정은 `app/globals.css`를 참고하세요.

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
