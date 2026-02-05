# PWA 앱 UI/UX 정책 검토

PWA(홈 화면 설치) 환경에서의 UI/UX 정책·접근성·플랫폼 가이드라인 관점 검토 결과입니다.  
기준: Apple HIG(휴먼 인터페이스 가이드라인), Material Design, W3C PWA 가이드, 접근성(WCAG) 관련 권장사항.

---

## 1. 잘 적용된 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| **viewport** | ✅ | `viewport-fit=cover`, `width: device-width`, `initialScale: 1` — 노치/홈 인디케이터 대응 가능 |
| **하단 네비게이션** | ✅ | `pb-[env(safe-area-inset-bottom)]`, 56px 높이, 44px 이상 터치 영역 |
| **많은 하단 고정 버튼** | ✅ | review, vehicle edit 등 `pb-[calc(env(safe-area-inset-bottom)+16px)]` 적용 |
| **많은 상단 헤더** | ✅ | `pt-[env(safe-area-inset-top)]` 적용된 페이지 다수 (verify, auth, result 등) |
| **줌 제한 없음** | ✅ | `maximum-scale`/`user-scalable=no` 미사용 — 접근성(시각 장애 등)에 유리 |
| **터치 하이라이트** | ✅ | `-webkit-tap-highlight-color: transparent` 전역 적용 |
| **Button/Input** | ✅ | `touch-target`(min 44px) 적용 |
| **manifest** | ✅ | `display: standalone`, `orientation: portrait-primary`, 테마/아이콘 설정 |

---

## 2. 수정 권장 (부적절·위험)

### 2.1 Safe area 미적용 — PWA에서 콘텐츠가 노치/홈 인디케이터에 가림

| 위치 | 내용 | 권장 |
|------|------|------|
| **Header** (`components/layout/Header.tsx`) | `sticky top-0`만 사용, `pt-[env(safe-area-inset-top)]` 없음 | 상단 safe area 패딩 추가. 검증 내역·정비사 가이드 등에서 헤더가 노치와 겹칠 수 있음 |
| **BottomSheet** | 시트 하단에 `pb-8`만 사용, `env(safe-area-inset-bottom)` 없음 | 시트 콘텐츠/버튼 영역 하단에 `pb-[env(safe-area-inset-bottom)]` 추가. 홈 인디케이터와 겹침 방지 |
| **verify/result/page.tsx** (검증 결과 하단 바) | `fixed bottom-0` 바에 하단 패딩만 있고 safe area 없음 | `pb-[calc(env(safe-area-inset-bottom)+16px)]` 등으로 하단 여백에 safe area 반영 |
| **verify/manual/page.tsx** (수동 입력 하단 바) | 동일 | 동일하게 하단 safe area 반영 |

### 2.2 터치 타겟 44pt 미만 — Apple HIG / Material 48dp 권장 위반

| 위치 | 현재 | 권장 |
|------|------|------|
| **BottomSheet 닫기 버튼** | `w-8 h-8` (32px) | 최소 44×44px (예: `min-w-[44px] min-h-[44px]` 또는 `p-3`) |
| **LoginModal 닫기 버튼** | `p-2` (약 32px) | 최소 44×44px 터치 영역 |
| **ImageCropOverlay 상단 버튼** | `w-10 h-10` (40px) | 최소 44×44px |

---

## 3. 선택적 개선 (정책상 필수는 아님)

| 항목 | 내용 | 권장 |
|------|------|------|
| **Toast (Sonner)** | `position="top-center"` — standalone에서 상태바/노치와 겹칠 수 있음 | 토스트 컨테이너에 `top: env(safe-area-inset-top)` 반영 (Sonner `style`/`className` 또는 전역 CSS) |
| **LoginModal** | `fixed inset-0` 중앙 카드 — 노치 기기에서 카드가 상·하단에 너무 붙을 수 있음 | 모달 내부에 `env(safe-area-inset-*)` 여백 적용 시 가독성·안정감 향상 |
| **ImageCropOverlay** | 전체 화면 오버레이, 상단 바에 safe area 없음 | 상단 바에 `pt-[env(safe-area-inset-top)]` 적용 시 노치 구간과 겹침 방지 |
| **외부 링크** | `lib/share.ts`에서 카카오톡 공유 시 `window.open(..., '_blank')` | PWA에서는 인앱 브라우저로 열릴 수 있음. 동작 확인 후 필요 시 `noopener` 등 보안 속성 유지 |
| **화면 방향** | manifest `orientation: portrait-primary` | 차량 견적 앱 특성상 세로 고정은 타당. 필요 시 `any`로 완화 검토 |

---

## 4. 정책·접근성 요약

- **Safe area**: 고정/스티키 UI(헤더, 하단 바, 바텀시트)는 모두 `env(safe-area-inset-*)`를 적용하는 것이 PWA 정책·실무 관점에서 적절함.
- **터치 타겟**: 주요 액션(닫기, 확인 등)은 최소 44×44px 유지 권장.
- **줌**: 현재처럼 제한하지 않는 설정 유지 권장.
- **포커스/키보드**: Button·Input에 `focus:ring` 등 포커스 스타일 있음 — 유지 권장.

이 문서는 검토 시점 기준이며, 새 화면·컴포넌트 추가 시 safe area와 터치 타겟을 함께 점검하는 것을 권장합니다.
