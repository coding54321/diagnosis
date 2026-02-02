# 배포 환경 로그인 실패 원인 분석

배포 환경에서 로그인이 안 될 때 점검할 수 있는 원인과 확인 방법을 정리했습니다.

---

## 1. 이 프로젝트의 로그인 흐름

| 단계 | 위치 | 설명 |
|------|------|------|
| 1 | `app/auth/login/page.tsx` | 사용자가 이메일/비밀번호 입력 후 제출 |
| 2 | `lib/supabase/auth-client.ts` → `signIn()` | `supabase.auth.signInWithPassword()` 호출 |
| 3 | `lib/supabase/client.ts` | `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` 로 브라우저에서 Supabase Auth API 직접 호출 |
| 4 | 응답 | 성공 시 세션(쿠키) 저장, 실패 시 `error.message` 를 로그인 페이지에 표시 |

즉, **로그인 요청은 브라우저 → Supabase Auth API** 로 나가고, 에러 메시지는 Supabase가 반환한 값을 그대로 보여줍니다.

---

## 2. 원인별 점검

### 2-1. "Invalid API key" / "Invalid JWT" 가 보일 때

Supabase가 **API 키를 거부**한 경우입니다. 상세한 점검 방법은 **프로젝트 루트의 `DEPLOY_INVALID_API_KEY_ANALYSIS.md`** 를 참고하세요.

**요약:**

- **배포 플랫폼(Vercel, Netlify 등)에 환경 변수 설정**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **`NEXT_PUBLIC_*` 는 빌드 시점에 번들에 포함**되므로, 환경 변수 추가/수정 후 **반드시 재빌드 후 재배포**
- Supabase 대시보드 **Settings → API** 에서 **Project URL** 과 **anon (public) key** 를 복사해, 배포 쪽 값과 **같은 프로젝트** 것인지 확인
- 키 값에 **공백/따옴표/줄바꿈** 이 들어가지 않았는지 확인

---

### 2-2. Supabase URL 설정 (Site URL / Redirect URLs)

이 프로젝트는 **이메일/비밀번호 로그인**(`signInWithPassword`)만 사용하고, OAuth/이메일 확인 링크는 `resetPasswordForEmail` 시 `window.location.origin` 을 쓰고 있습니다.

- **Site URL**  
  - Supabase 대시보드: **Authentication → URL Configuration → Site URL**  
  - 이메일 확인, 비밀번호 재설정 등에서 **기본 리다이렉트**로 사용됩니다.  
  - 배포 도메인에서 쓸 때는 **배포 URL**(예: `https://your-app.vercel.app`) 로 맞춰 두는 것이 좋습니다.  
  - `signInWithPassword` 자체는 Site URL과 무관하게 동작할 수 있지만, **세션/쿠키 도메인**과 맞추려면 배포 URL로 설정하는 것을 권장합니다.

- **Redirect URLs**  
  - **Authentication → URL Configuration → Redirect URLs**  
  - 비밀번호 재설정 등에서 `redirectTo` 로 쓰는 URL은 여기에 등록되어 있어야 합니다.  
  - 예: `https://your-app.vercel.app/**` 또는 `https://your-app.vercel.app/auth/reset-password`  
  - Vercel이면 프리뷰까지 쓸 경우 `https://*-your-team.vercel.app/**` 형태로 와일드카드 추가 가능.

**점검:**

- [ ] Supabase **Authentication → URL Configuration** 에서 **Site URL** 이 배포 URL인가?
- [ ] **Redirect URLs** 에 배포 도메인(및 필요 시 프리뷰 URL)이 포함되어 있는가?

---

### 2-3. 로그인은 되는데 곧바로 로그아웃되거나 세션이 유지되지 않을 때 (쿠키/세션)

세션은 **쿠키**로 관리됩니다. 미들웨어(`lib/supabase/proxy.ts`)에서 매 요청마다 `getUser()` 로 검증·갱신합니다.

**배포 환경에서 자주 생기는 원인:**

- **쿠키 도메인**
  - 앱이 `https://app.example.com` 인데 쿠키가 다른 도메인으로 설정되면 브라우저가 쿠키를 보내지 않습니다.
  - `@supabase/ssr` 은 보통 현재 도메인 기준으로 설정하므로, **배포 URL과 Supabase Site URL이 같은 “앱”으로 쓰는 도메인**인지 확인하면 됩니다.

- **SameSite / Secure**
  - 배포가 **HTTPS**인지 확인. HTTPS가 아니면 `Secure` 쿠키가 제대로 동작하지 않을 수 있습니다.
  - 리버스 프록시/CDN 뒤에 있다면, **실제 요청이 HTTPS로 오는지** 확인.

- **미들웨어에서 env 없음**
  - `proxy.ts` 에서 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 비어 있으면 `supabase.auth.getUser()` 가 제대로 동작하지 않을 수 있고, 세션 갱신이 안 되어 **랜덤 로그아웃**처럼 보일 수 있습니다.
  - 배포 플랫폼에서 **Edge/Serverless 환경**에도 이 환경 변수가 주입되는지 확인하세요.

**점검:**

- [ ] 배포 URL이 **HTTPS** 인가?
- [ ] 배포 플랫폼에서 **미들웨어가 실행되는 런타임**(Edge 등)에도 `NEXT_PUBLIC_SUPABASE_*` 가 설정되어 있는가?

---

### 2-4. 에러 메시지가 안 뜨고 그냥 실패할 때

- **브라우저 개발자 도구 → Network**
  - 로그인 버튼 클릭 시 `/auth/v1/token?grant_type=password` (또는 비슷한 Supabase Auth 요청) 이 나가는지 확인.
  - **상태 코드**: 401 → API 키/인증 문제, 403 → 권한/URL 설정, 4xx/5xx → 응답 본문으로 Supabase 에러 메시지 확인.
- **Console**
  - CORS/네트워크 에러가 있으면 요청이 아예 실패할 수 있음. Supabase는 보통 anon key 기준으로 CORS를 허용하므로, **혹시 다른 도메인/포트로 요청이 나가고 있지는 않은지** 확인.

---

### 2-5. 이메일 확인이 켜져 있는 경우

Supabase **Authentication → Providers → Email** 에서 **Confirm email** 이 켜져 있으면, **회원가입 후 이메일 확인 전에는 `signInWithPassword` 가 실패**할 수 있습니다. (프로젝트 설정에 따라 “이메일 미확인” 같은 메시지로 나올 수 있음.)

- 로그인만 안 되는 것이면: 해당 사용자가 **이메일 인증을 완료했는지** Supabase 대시보드 **Authentication → Users** 에서 확인.
- 배포 환경에서만 확인 메일이 안 오면: **Site URL / Redirect URLs** 이 배포 URL로 되어 있는지, **SMTP(이메일 발송)** 설정이 되어 있는지 확인.

---

## 3. 점검 체크리스트 (순서대로)

1. **에러 문구 확인**
   - [ ] 로그인 실패 시 화면에 뜨는 메시지가 무엇인가? (예: Invalid API key, Invalid login credentials, Email not confirmed 등)

2. **배포 환경 변수**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정 여부 및 값
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정 여부 및 값
   - [ ] 값 수정 후 **재빌드 후 재배포** 했는가?

3. **Supabase 대시보드**
   - [ ] **Settings → API**: Project URL / anon key 가 배포에 넣은 값과 **같은 프로젝트**인가?
   - [ ] **Authentication → URL Configuration**: Site URL = 배포 URL, Redirect URLs 에 배포 도메인 포함 여부
   - [ ] **Authentication → Users**: 테스트 계정이 “이메일 확인됨” 상태인가? (Confirm email 사용 시)

4. **네트워크**
   - [ ] 브라우저 Network 탭에서 로그인 시 Supabase Auth 요청이 나가나? 상태 코드와 응답 본문은?
   - [ ] HTTPS 로 서비스되고 있나?

5. **세션 유지 문제인 경우**
   - [ ] 미들웨어(Edge 등)에도 동일한 Supabase env 가 들어가나?
   - [ ] 배포 URL이 HTTPS 인가?

---

## 4. 요약 표

| 증상 | 우선 확인할 것 |
|------|----------------|
| "Invalid API key" | 배포 env 설정, 재빌드, Supabase API 설정과 키 일치 여부 → `DEPLOY_INVALID_API_KEY_ANALYSIS.md` |
| "Invalid login credentials" | 비밀번호/이메일 오타, 해당 사용자 존재 여부, 이메일 확인 필요 시 확인 완료 여부 |
| 로그인 후 곧바로 로그아웃/세션 안 유지 | HTTPS 여부, 미들웨어 env, 쿠키 도메인(Site URL과 앱 URL 일치) |
| 에러 없이 실패 | Network 탭에서 Auth 요청 성공 여부, 상태 코드, 응답 본문 |
| 배포에서만 실패 | 위 항목 전부 + Site URL / Redirect URLs 가 배포 URL로 설정되었는지 |

가장 흔한 경우는 **배포 플랫폼에 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 넣지 않았거나, 넣은 뒤 재빌드를 하지 않은 경우**입니다. 에러 메시지가 "Invalid API key" 라면 `DEPLOY_INVALID_API_KEY_ANALYSIS.md` 를 먼저 따라가 보시면 됩니다.
