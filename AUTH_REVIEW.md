# Auth 처리 검토 및 개선 사항

## 1. 현재 Auth 구조 요약

### 1.1 인증 소스
| 위치 | 방식 | 사용처 |
|------|------|--------|
| **서버** | `getCurrentUser()` (auth-server) → `createServerClient()` + 쿠키 → `getUser()` | 메인, vehicle, history 페이지; Server Actions |
| **클라이언트** | `supabase.auth.getUser()` + `onAuthStateChange()` | UserMenu, 설정 페이지, verify/result |

### 1.2 라우트별 Auth 사용
| 라우트 | Auth 확인 | 비로그인 시 UI |
|--------|-----------|----------------|
| `/` (메인) | 서버 `getCurrentUser()` | "게스트" 인사 + LoginButtons, 검증 내역 숨김 |
| `/vehicle` | 서버 `getCurrentUser()` | LoginPrompt + 목업 차량/통계 표시 |
| `/history` | 서버 `getCurrentUser()` | LoginPrompt + 목업 검증 내역 표시 |
| `/settings` | 클라이언트 `getUser()` | LoginPrompt + 로그인 유도 카드 |
| `/auth/login`, `/auth/signup` | 없음 | 항상 폼 표시 (이미 로그인 시에도) |
| `/verify/result` | 클라이언트 `getUser()` | "저장" 시 로그인 여부 확인 → LoginModal |

---

## 2. 개선 필요 사항

### 2.1 🔴 보안·데이터 (즉시 수정 권장)

#### (1) 비로그인 시 타인 데이터 노출
- **문제**: `vehicle`, `history` 페이지에서 **user가 없어도** `fetchVehicle()`, `fetchRecentHistory()`를 호출함.  
  `queries.ts`에서 `userId`가 `''`일 때 `user_id` 필터를 걸지 않아, **전체 테이블에서 최근 1건/100건**을 가져옴.
- **결과**: 비로그인 사용자에게 **다른 사용자의 차량 정보·검증 내역**이 노출될 수 있음.
- **조치**: `getVehicle('')`, `getRecentVerificationHistory('', n)` 호출 시 **userId가 비어 있으면**  
  - `getVehicle` → `null` 반환  
  - `getRecentVerificationHistory` → `[]` 반환  
  (쿼리 전에 early return 처리)

#### (2) vehicle 페이지 데이터 호출 조건
- **문제**: 비로그인인데도 `fetchVehicle()`, `fetchRecentHistory(100)`를 호출하고, 실패 시 목업으로 채움.  
  위 (1) 수정 후에는 빈 데이터가 오지만, **비로그인일 때는 아예 호출하지 않는 편이 명확**함.
- **조치**: `user`가 없을 때는 `fetchVehicle` / `fetchRecentHistory` 호출 생략하고, 목업 또는 빈 데이터만 사용.

---

### 2.2 🟡 UX·일관성 (개선 권장)

#### (3) 로그인/회원가입 페이지 리다이렉트
- **문제**: 이미 로그인한 사용자가 `/auth/login`, `/auth/signup`에 접속해도 그대로 폼이 보임.
- **조치**:  
  - `auth/layout.tsx` 또는 login/signup 각 페이지에서 **서버/클라이언트로 로그인 여부 확인**  
  - 로그인되어 있으면 `redirect('/')` (또는 메인으로 이동).

#### (4) UserMenu와 서버 인사말 불일치 가능성 ✅ 적용됨
- **조치**: (main) layout에서 `getCurrentUser()`로 `initialUser`를 `AuthProvider`에 전달.  
  UserMenu는 `useAuth()`만 사용하므로 초기 렌더부터 서버와 동일한 로그인 상태 표시.

#### (5) 설정 페이지 로딩 상태 ✅ 적용됨
- **조치**: 설정 페이지에서 `useAuth()`의 `isLoading` 사용, 로딩 시 `SettingsSkeleton`(카드/플레이스홀더) 표시.

---

### 2.3 🟢 인프라 (장기 개선)

#### (6) Middleware에서 세션 갱신 ✅ 적용됨
- **조치**: `middleware.ts` + `lib/supabase/proxy.ts` 추가.  
  - `createServerClient`로 요청 쿠키 읽기, 응답에 갱신된 쿠키 반영  
  - `getUser()` 호출로 세션 갱신  
  - matcher로 정적/이미지 제외 경로만 적용

#### (7) Auth 전용 훅/컨텍스트 ✅ 적용됨
- **조치**: `components/auth/AuthProvider.tsx` 추가.  
  - `AuthProvider`: (main) layout에서 `initialUser`(서버 `getCurrentUser()`) 전달  
  - `useAuth()`: `{ user, isLoading }` 반환, Provider 밖에서는 `{ user: null, isLoading: false }`  
  - UserMenu, 설정, verify/result에서 `useAuth()` 사용

#### (8) 검증 내역 상세 `/history/[id]` ✅ 적용됨
- **조치**:  
  - `getVerificationHistoryById(userId, id)` (queries), `fetchHistoryById(id)` (actions) 추가  
  - `app/(main)/history/[id]/page.tsx`: 서버 컴포넌트로 전환, 로그인·소유자 검증 후 아니면 `notFound()`  
  - 상세 UI는 `HistoryDetailContent` 클라이언트 컴포넌트로 분리

---

## 3. Auth 상태에 따라 달라져야 할 UI 정리

| 화면 | 로그인 O | 로그인 X | 비고 |
|------|----------|----------|------|
| **메인** | "이름님," + 부제목, 차량 정보, 최근 검증 내역 | "게스트" + 부제목, LoginButtons, 검증 내역 미노출 | ✅ 구현됨 |
| **내 차 관리** | LoginPrompt 없음, 내 차/통계/이력 | LoginPrompt + 목업 차량·통계·이력 | ✅ 구현됨. (1)(2) 수정 후 비로그인 시 타인 데이터 미노출 |
| **검증 내역** | 내 검증 내역만 | LoginPrompt + 목업 내역 | ✅ 구현됨. (1)(2) 수정 후 비로그인 시 타인 데이터 미노출 |
| **설정** | 프로필 카드, 설정 목록 | LoginPrompt, 로그인 유도 카드 | ✅ 구현됨 |
| **헤더 UserMenu** | 사용자 아이콘 → 메뉴(설정, 로그아웃) | 로그인 아이콘 → /auth/login | ✅ 구현됨. (4) 적용 시 플래시 완화 |
| **로그인/회원가입** | (권장) 즉시 `/` 리다이렉트 | 로그인·회원가입 폼 | (3) 적용 권장 |
| **검증 결과** | "저장" 가능 | "저장" 클릭 시 LoginModal | ✅ 구현됨 |

---

## 4. 적용 순서 제안

1. **즉시**: (1) queries에서 `userId` 비었을 때 null/[] 반환, (2) vehicle/history에서 비로그인 시 fetch 생략.
2. **단기**: (3) 로그인/회원가입 페이지에서 이미 로그인 시 리다이렉트.
3. **중기**: (6) middleware 세션 갱신, (7) useAuth 훅 또는 AuthProvider 도입.
4. **선택**: (4) UserMenu 플래시 완화, (5) 설정 로딩 UI, (8) history/[id] 소유자 검증.
