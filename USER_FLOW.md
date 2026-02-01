# 정비 견적 검증 서비스 — 유저 플로우

## 1. 서비스 개요

**핵심 가치**: 정비소에서 받은 견적서를 입력하면, 적정 가격 대비 비교·검증 결과를 보여주는 서비스.

- **비로그인**: 견적 검증(입력·결과 확인) 가능, 저장·내역·차량 정보는 제한
- **로그인**: 차량 정보·검증 내역 저장·조회, 메인에 최근 검증 3건 노출

---

## 2. 진입점 및 네비게이션

### 2.1 진입

| 진입 | 경로 | 설명 |
|------|------|------|
| **메인(홈)** | `/` | 첫 화면. 인사말 + (로그인 시) 차량 정보 + **견적서 검증하기** CTA + (로그인 시) 최근 검증 내역 |
| **로그인/회원가입** | `/auth/login`, `/auth/signup` | 헤더 로그인 버튼, LoginButtons, LoginPrompt 등에서 이동. 이미 로그인 시 `/`로 리다이렉트 |

### 2.2 하단 네비게이션 (메인 영역 공통)

| 탭 | 경로 | 설명 |
|----|------|------|
| 홈 | `/` | 메인 |
| 내 차 관리 | `/vehicle` | 차량 정보, 정비 통계·이력 (비로그인 시 LoginPrompt + 목업) |
| 정비 상식 | `/guide` | 정비 상식 아코디언 (로그인 무관) |
| 설정 | `/settings` | 프로필, 알림·데이터·계정 설정 (비로그인 시 LoginPrompt) |

### 2.3 헤더

- **제목**: 페이지별 (정비 견적 검증, 내 차 관리, 검증 내역 등)
- **오른쪽**: UserMenu → 비로그인: 로그인 아이콘(`/auth/login`), 로그인: 사용자 아이콘 → 설정 / 로그아웃

---

## 3. 인증 플로우

```
[비로그인]  →  로그인 버튼 / LoginButtons / LoginPrompt
    →  /auth/login 또는 /auth/signup
    →  로그인·회원가입 성공
    →  router.push('/') + router.refresh()
    →  [메인, 로그인 상태]

[이미 로그인]  →  /auth/login 또는 /auth/signup 접속
    →  auth/layout에서 getCurrentUser() 후 redirect('/')
```

- **회원가입** (`/auth/signup`): 이름, 이메일, 비밀번호 → `user_metadata.name` 저장 → 성공 시 메인으로 이동
- **로그인** (`/auth/login`): 이메일, 비밀번호 → 성공 시 메인
- **로그아웃**: UserMenu 또는 설정 > 로그아웃 → `signOut()` → 메인으로 이동

---

## 4. 핵심 플로우: 견적서 검증

전체 흐름: **메인 → 견적서 검증하기 → 입력 방식 선택 → 입력 → (이미지 경로만) 확인·검증 실행 → 결과 → (선택) 저장**

### 4.1 시작

- **메인** (`/`)  
  - CTA: **견적서 검증하기** (`/verify`)  
- **견적서 입력** (`/verify`)  
  - 3가지 입력 방식 선택:
    1. **사진 촬영** → `/verify/camera`
    2. **앨범에서 선택** → `/verify/album`
    3. **직접 입력** → `/verify/manual`

### 4.2 경로 A: 사진 촬영

```
/verify/camera
  → 카메라 뷰파인더 → 촬영 → 미리보기 (재촬영 가능)
  → "이 사진 사용" 클릭
  → sessionStorage.setItem('capturedEstimateImage', image)
  → router.push('/verify/review')
```

### 4.3 경로 B: 앨범에서 선택

```
/verify/album
  → 파일 선택 (이미지, 10MB 이하)
  → 미리보기
  → "이 사진 사용"
  → sessionStorage.setItem('capturedEstimateImage', image)
  → router.push('/verify/review')
```

### 4.4 경로 C: 직접 입력

```
/verify/manual
  → 차량 정보 (제조사, 모델, 연식, 주행거리 등) + 정비 항목 추가 (이름, 부품비, 공임비)
  → "검증하기" 제출
  → saveVehicle() → createEstimate() → sessionStorage.setItem('currentEstimateId', id)
  → router.push('/verify/result')
  ※ 검증 엔진/결과 저장은 이 경로에서는 결과 페이지에서 처리되는 구조가 아니라,
     manual 제출 시엔 estimate만 저장하고 결과 페이지로 이동 (결과 페이지에서 estimateId로 조회/목업 표시)
```

### 4.5 견적 확인·검증 (이미지 경로: 카메라/앨범)

```
/verify/review
  → sessionStorage에서 'capturedEstimateImage' 로드
  → 인식된 내용 확인 UI (현재 목업: mockEstimate)
  → "검증하기" 클릭
  → saveVehicle() → createEstimate() → (캡처 이미지 있으면) uploadEstimateImageAction()
  → VerificationEngine.verifyEstimate() 로 검증
  → createVerificationResult() 로 결과 저장
  → sessionStorage.setItem('currentEstimateId', savedEstimateId)
  → router.push('/verify/result')
```

### 4.6 검증 결과

```
/verify/result
  → sessionStorage에서 'currentEstimateId' 로드
  → fetchVerificationResult(estimateId) 또는 목업
  → 결과 요약 + 항목별 상세 (가격대, 적정/확인필요/재검토 등)
  → 액션:
    - "저장만 하기": 로그인 시 createVerificationResult 등 저장 후 메인 이동
    - 비로그인 시 "저장" 클릭 → LoginModal → 로그인 성공 시 router.refresh()
    - (기타: 정비사에게 질문 등)
```

- **저장**: 로그인 사용자만 가능. 비로그인 시 저장 시도 시 LoginModal 노출.

---

## 5. 검증 내역·상세

- **검증 내역 목록** (`/history`)
  - 로그인: `fetchRecentHistory()` 로 **본인** 검증 내역만 표시
  - 비로그인: LoginPrompt + 목업 목록
  - 각 항목 클릭 → `/history/[id]`

- **검증 내역 상세** (`/history/[id]`)
  - 서버에서 `fetchHistoryById(id)` → **본인 소유만** 조회
  - 비로그인 또는 타인 내역 → `notFound()` (404)
  - 소유한 경우만 `HistoryDetailContent` 로 상세 표시 (일부 목업 데이터 사용)

---

## 6. 내 차 관리

- **내 차 관리** (`/vehicle`)
  - 로그인: `fetchVehicle()` + `fetchRecentHistory()` 로 **본인** 차량·통계·이력
  - 비로그인: LoginPrompt + 목업 차량/통계/이력
  - 차량 정보 카드, 정비 통계(총 횟수·누적 비용·평균), 정비 이력 타임라인, 다음 예상 정비 등

---

## 7. 설정

- **설정** (`/settings`)
  - 로그인: 프로필 카드(이름, 이메일) + 알림/데이터/계정 설정 + 앱 버전·고객센터 등
  - 비로그인: LoginPrompt + 로그인 유도 카드
  - 로그아웃 시 메인으로 이동

---

## 8. 정비 상식

- **정비 상식** (`/guide`)
  - 로그인 불필요. 기본 정비 상식·비용·안전 관련 아코디언 콘텐츠

---

## 9. 플로우 다이어그램 (요약)

```
                    ┌─────────────┐
                    │     /      │  메인
                    │  (홈)      │
                    └──────┬─────┘
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   [로그인 버튼]    [견적서 검증하기]   [내 차 관리] [검증 내역] [정비 상식] [설정]
         │                │                │
         ▼                ▼                ▼
   /auth/login      /verify (입력방식)   각 탭 페이지
   /auth/signup           │
         │                ├─ camera → 촬영 → review → 검증 → result
         │                ├─ album  → 선택 → review → 검증 → result
         │                └─ manual → 입력 → result (estimate 저장 후)
         │
         └─ 로그인/가입 성공 → / (메인)
```

---

## 10. 데이터·상태 정리

| 구분 | 비로그인 | 로그인 |
|------|----------|--------|
| **견적 입력·검증** | 가능 (카메라/앨범/직접입력) | 가능 |
| **검증 결과 보기** | 가능 (현재 세션 기준) | 가능 |
| **검증 결과 저장** | 불가 (LoginModal) | 가능 |
| **차량 정보** | 메인/내 차 관리: 목업 또는 빈 상태 | DB 저장·조회 |
| **검증 내역 목록** | 목업 + LoginPrompt | 본인 내역만 |
| **검증 내역 상세** | 404 (소유자 아님) | 본인 것만 200 |
| **설정·프로필** | LoginPrompt | 프로필·설정 사용 |

- **세션 유지**: middleware에서 Supabase 세션 갱신, AuthProvider로 클라이언트에 `user` 전달.
- **견적·결과 연결**: 카메라/앨범 경로는 `sessionStorage`(`capturedEstimateImage`, `currentEstimateId`)로 페이지 간 연결.

이 문서는 앱 라우트·컴포넌트·auth 정책을 기준으로 정리한 **전체 유저 플로우** 요약입니다.
