# 배포 환경 "Invalid API key" 원인 분석

배포 환경에서 로그인 시 **"invalid api key"** 가 뜨는 경우의 원인과 확인 방법을 정리했습니다. (코드 수정 없이 점검용)

---

## 1. 에러가 나오는 경로

- **발생 위치**: 로그인 시 Supabase Auth API 호출 (`signInWithPassword`)
- **표시 경로**: `lib/supabase/auth-client.ts` → `signIn()` → Supabase가 반환한 `error.message` → `app/auth/login/page.tsx`에서 `setError(result.error)` 로 화면에 그대로 노출

즉, **Supabase 서버가 "Invalid API key" 라고 응답**하고 있고, 그 메시지를 그대로 보여주는 구조입니다.

---

## 2. 앱에서 API 키를 쓰는 곳

| 파일 | 용도 | 사용 변수 |
|------|------|-----------|
| `lib/supabase/client.ts` | 브라우저(클라이언트) Supabase 클라이언트 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `lib/supabase/server.ts` | 서버(페이지/액션) Supabase 클라이언트 | 동일 + `SUPABASE_SERVICE_ROLE_KEY` |
| `lib/supabase/proxy.ts` | 미들웨어 세션 갱신 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

로그인 요청은 **브라우저**에서 `createBrowserClient`(client.ts)로 나가므로, 배포 환경에서 문제가 된다면 **배포된 앱에 주입된 `NEXT_PUBLIC_SUPABASE_ANON_KEY`** 가 잘못되었을 가능성이 가장 큽니다.

---

## 3. 배포 환경에서 "Invalid API key" 가 나는 흔한 원인

### 3-1. 배포 플랫폼에 환경 변수 미설정

- 로컬은 `.env.local` 이 있어서 동작하지만, **Vercel / Netlify / 기타 호스팅**에는 환경 변수를 따로 설정해야 함.
- `.env.local` 은 보통 git에 안 올라가므로, 배포 쪽에는 **수동으로** 다음을 넣어줘야 함.
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 하나라도 비어 있으면 빌드/런타임에 `undefined` 가 전달되고, Supabase가 "Invalid API key" 로 응답할 수 있음.

### 3-2. NEXT_PUBLIC_ 변수는 빌드 시점에 박힘

- Next.js 에서 `NEXT_PUBLIC_*` 는 **빌드 타임**에 번들에 들어감.
- 배포 플랫폼에서:
  - 환경 변수를 **나중에 추가/수정**했는데 **재빌드 없이** 재배포만 한 경우, 예전(빈 값 또는 잘못된 값)이 그대로 남을 수 있음.
- **해결**: 환경 변수 추가/수정 후 **반드시 새로 빌드해서 재배포**.

### 3-3. 프로젝트/환경 불일치

- **로컬(개발)** Supabase 프로젝트의 anon key 를 쓰는데, **배포 도메인**은 다른 프로젝트용이거나, 반대로 **배포용 프로젝트**가 아닌 **개발용 프로젝트**의 key 를 넣은 경우.
- Supabase 대시보드에서 **프로젝트 선택**이 맞는지, **배포 URL 에서 쓰려는 프로젝트**와 key 가 같은 프로젝트 것인지 확인 필요.

### 3-4. 키 값 오류 (복사/형식)

- 앞뒤 **공백**, **줄바꿈**, **따옴표**가 들어가면 invalid 로 처리될 수 있음.
- **anon key** 와 **service_role key** 를 바꿔 넣은 경우 (로그인 플로우에서는 anon key 가 맞음).
- Supabase 에서 **Publishable key**(새 형식) 와 **anon key**(JWT 형식) 가 다를 수 있으므로, 대시보드에서 **사용 중인 키 종류**와 문서에 나온 변수명(예: anon key)이 일치하는지 확인.

### 3-5. URL 과 키의 프로젝트 불일치

- `NEXT_PUBLIC_SUPABASE_URL` = A 프로젝트, `NEXT_PUBLIC_SUPABASE_ANON_KEY` = B 프로젝트 처럼 **서로 다른 프로젝트** 조합이면 "Invalid API key" 가 날 수 있음.
- 같은 Supabase 프로젝트의 **Project URL** 과 **anon (public) key** 를 한 세트로 복사해 넣었는지 확인.

---

## 4. 점검 체크리스트 (코드 수정 없이)

1. **배포 플랫폼 환경 변수**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` 이 배포 환경에 설정되어 있는가?
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 배포 환경에 설정되어 있는가?
   - [ ] 값에 공백/따옴표/줄바꿈이 붙어 있지 않은가?

2. **빌드 반영**
   - [ ] 위 변수를 추가/수정한 뒤 **새 빌드** 후 재배포했는가?

3. **Supabase 대시보드**
   - [ ] 사용 중인 **Supabase 프로젝트**가 배포용과 일치하는가?
   - [ ] **Settings → API** 에서 **Project URL** 과 **anon public** 키를 복사해, 배포 쪽 값과 동일한가?

4. **(선택) 런타임 확인**
   - 배포된 앱에서 브라우저 개발자 도구 → Network 탭에서 로그인 시 `/auth/v1/token?grant_type=password` (또는 비슷한 Auth 요청) 이 **401** 이면, 서버가 키를 거부한 것이므로 위 항목을 다시 확인.

---

## 5. 요약

| 원인 | 확인 방법 |
|------|-----------|
| 배포에 env 미설정 | 호스팅 대시보드에서 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 존재 여부 확인 |
| 빌드 시점 값 사용 | env 수정 후 **재빌드 + 재배포** |
| 잘못된/다른 프로젝트 키 | Supabase 해당 프로젝트의 **Settings → API** 와 동일한지 비교 |
| 복사 오류 | 공백/따옴표 제거, anon key 인지 확인 |

가장 흔한 경우는 **배포 플랫폼에 `NEXT_PUBLIC_SUPABASE_ANON_KEY`(및 URL)를 넣지 않았거나, 넣었는데 재빌드를 하지 않은 경우**입니다. 위 체크리스트 순서대로 확인하면 원인 범위를 좁힐 수 있습니다.
