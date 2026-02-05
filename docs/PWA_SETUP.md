# PWA 설정 가이드

이 프로젝트는 **Next.js 15**로 구성되어 있으며, PWA(Progressive Web App)로 홈 화면에 설치할 수 있도록 기본 설정이 적용되어 있습니다.

## 적용된 설정

- **Web App Manifest** (`app/manifest.ts`): 앱 이름, 설명, 아이콘, 테마 색상, `standalone` 표시 모드
- **메타데이터** (`app/layout.tsx`): `manifest`, `themeColor`, `appleWebApp` 설정
- **보안 헤더** (`next.config.ts`): PWA 권장 헤더 (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

## PWA 아이콘 추가 (필수)

홈 화면에 표시될 아이콘을 위해 아래 파일을 `public/` 폴더에 추가하세요.

| 파일명 | 크기 |
|--------|------|
| `icon-192x192.png` | 192×192px |
| `icon-512x512.png` | 512×512px |

**추천 도구**

- [RealFaviconGenerator](https://realfavicongenerator.net/) – 한 번에 favicon + PWA 아이콘 생성
- [PWA Asset Generator](https://www.npmjs.com/package/pwa-asset-generator) – 로고 이미지 하나로 여러 크기 생성

아이콘을 넣지 않아도 manifest는 동작하지만, 일부 환경에서는 기본 아이콘이나 빈 아이콘으로 보일 수 있습니다.

## Vercel 배포

- Vercel은 **HTTPS**를 기본 제공하므로 PWA 설치 조건을 만족합니다.
- 별도 설정 없이 `next build` 결과를 그대로 배포하면 됩니다.
- 배포 후 브라우저에서 **설치** 또는 **홈 화면에 추가** 메뉴가 나타나면 PWA로 사용 가능합니다.

## 설치 방법 (사용자)

- **Android(Chrome)**: 주소창 또는 메뉴 → "앱 설치" / "홈 화면에 추가"
- **iOS(Safari)**: 공유 버튼 → "홈 화면에 추가"
- **데스크톱(Chrome/Edge)**: 주소창 오른쪽 설치 아이콘 또는 메뉴 → "앱 설치"

## 추가 기능 (선택)

나중에 다음을 붙이고 싶다면 문서/코드를 참고해 확장할 수 있습니다.

- **오프라인 지원**: [Serwist](https://serwist.pages.dev/) 등으로 Service Worker + 캐시
- **푸시 알림**: VAPID 키 생성 → Service Worker(`sw.js`) + Web Push API
- **설치 유도 UI**: `beforeinstallprompt` (Android Chrome) 또는 iOS용 "홈 화면에 추가" 안내 문구

현재는 **설치 가능한 PWA**만 적용된 상태이며, 푸시/오프라인은 필요 시 별도 구현하면 됩니다.
