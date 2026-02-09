# 서비스 유저 플로우 (Mermaid 다이어그램)

아래 다이어그램은 현재 앱의 모든 화면·전환을 담은 유저 플로우입니다.  
Mermaid 지원 환경(GitHub, Notion, VS Code 확장 등)에서 렌더링해 보시면 됩니다.

**이미지로 보기:** 각 섹션 아래에 PNG 이미지가 있습니다.  
전체 이미지 파일: [`docs/images/user-flow/`](./images/user-flow/)

---

## 1. 전체 화면 맵 (스크린 & 주요 링크)

![전체 화면 맵](./images/user-flow/01-full-map.png)

```mermaid
flowchart TB
  subgraph Main["메인 영역 (하단 네비: 홈 | 검증 | 내 차 | 더보기)"]
    Home["/ 홈"]
    Camera["/verify/camera\n견적서 촬영"]
    Album["/verify/album\n앨범에서 선택"]
    Manual["/verify/manual\n직접 입력"]
    Review["/verify/review\n견적 확인 위자드"]
    Result["/verify/result\n검증 결과"]
    ResultItem["/verify/result/[itemId]\n항목 상세"]
    ResultGuide["/verify/result/guide\n정비소 질문 가이드"]
    Vehicle["/vehicle\n내 차"]
    VehicleEdit["/vehicle/edit\n차량 등록·수정"]
    History["/history/[id]\n검증 내역 상세"]
    Settings["/settings\n더보기"]
  end

  subgraph Auth["인증 (하단 네비 없음)"]
    Login["/auth/login\n로그인"]
    Signup["/auth/signup\n회원가입"]
  end

  Home --> Camera
  Home --> Review
  Home --> Vehicle
  Home --> Login
  Camera --> Album
  Camera --> Review
  Album --> Review
  Manual --> Result
  Review --> Result
  Review --> Camera
  Review --> Manual
  Result --> ResultItem
  Result --> ResultGuide
  Vehicle --> VehicleEdit
  Vehicle --> History
  Settings --> Login
  Login --> Signup
  Signup --> Home
  Login --> Home
```

---

## 2. 진입 & 네비게이션

![진입 & 네비게이션](./images/user-flow/02-nav.png)

```mermaid
flowchart LR
  subgraph Nav["하단 네비 탭"]
    N1[홈 /]
    N2[검증 /verify/camera]
    N3[내 차 /vehicle]
    N4[더보기 /settings]
  end

  N1 --> Home
  N2 --> Camera
  N3 --> Vehicle
  N4 --> Settings

  Home["홈"]
  Camera["견적서 촬영"]
  Vehicle["내 차"]
  Settings["설정"]
```

---

## 3. 인증 플로우 (Auth)

![인증 플로우](./images/user-flow/03-auth.png)

```mermaid
flowchart TB
  Start([비로그인 상태])
  Home["홈 /"]
  Login["/auth/login 로그인"]
  Signup["/auth/signup 회원가입"]
  SignupSuccess["회원가입 완료 화면"]
  BackHome([홈으로])

  Start --> Home
  Home -->|"로그인 유도 카드 클릭"| Login
  Login -->|"회원가입 링크"| Signup
  Signup -->|"이미 계정 있음 링크"| Login
  Signup -->|"회원가입 제출 성공"| SignupSuccess
  SignupSuccess -->|"잠시 후 자동"| BackHome
  Login -->|"로그인 성공"| BackHome
  Login -->|"뒤로가기"| Home
  Signup -->|"뒤로가기"| Home
  Settings["/settings"] -->|"로그인/회원가입 버튼"| Login
```

---

## 4. 검증 플로우 (Verify) — 전체

![검증 플로우 전체](./images/user-flow/04-verify-full.png)

```mermaid
flowchart TB
  subgraph Entry["진입"]
    Home["홈"]
    NavVerify["탭: 검증"]
  end

  subgraph Input["입력 경로"]
    Camera["견적서 촬영\n/verify/camera"]
    Album["앨범에서 선택\n/verify/album"]
    Direct["직접 입력\n/verify/manual"]
  end

  subgraph ReviewWizard["견적 확인 위자드 /verify/review"]
    S1["Step 1\nOCR 결과"]
    S2["Step 2\n정비 정보"]
    S3["Step 3\n차량 정보"]
    S4["Step 4\n견적 목록"]
  end

  subgraph Result["결과"]
    ResultList["검증 결과\n/verify/result"]
    ItemDetail["항목 상세\n/verify/result/[itemId]"]
    Guide["질문 가이드\n/verify/result/guide"]
  end

  Home -->|"견적서 촬영"| Camera
  Home -->|"직접 입력하기"| Direct
  NavVerify --> Camera
  Camera -->|"앨범에서 선택"| Album
  Camera -->|"직접 입력"| S2
  Camera -->|"촬영 → 분석하기"| S1
  Album -->|"사진 선택 → 분석하기"| S1
  Direct -->|"차량+항목 입력 → 검증하기"| ResultList
  S1 -->|"OCR 성공"| S2
  S1 -->|"OCR 실패 → 다시 촬영"| Camera
  S1 -->|"OCR 실패 → 직접 입력"| S2
  S2 --> S3
  S3 --> S4
  S4 -->|"견적 검증하기"| ResultList
  S2 -->|"뒤로가기"| Camera
  S3 -->|"뒤로가기"| S2
  S4 -->|"뒤로가기"| S3
  ResultList -->|"항목 탭"| ItemDetail
  ResultList -->|"정비소에 물어보기"| Guide
  ItemDetail -->|"뒤로가기"| ResultList
  Guide -->|"뒤로가기"| ResultList
```

---

## 5. 검증 플로우 — 리뷰 위자드 상세 (Step 1~4)

![리뷰 위자드 상세](./images/user-flow/05-review-wizard.png)

```mermaid
stateDiagram-v2
  [*] --> Step1: 카메라/앨범에서 이미지 입력 후

  Step1: Step 1 OCR 결과
  Step2: Step 2 정비 정보 (날짜·정비소)
  Step3: Step 3 차량 정보 (차량번호·소유주)
  Step4: Step 4 견적 목록 확인

  Step1 --> Step2: OCR 성공 (또는 직접입력 진입)
  Step1 --> 카메라: 다시 촬영하기
  Step1 --> Step2: 직접 입력하기
  Step2 --> Step3: 다음
  Step2 --> 카메라: 뒤로가기
  Step3 --> Step4: 다음 (차량 확정 후)
  Step3 --> Step3: 차량 조회·소유주 확인
  Step4 --> 검증결과: 견적 검증하기
  Step4 --> Step3: 뒤로가기
```

---

## 6. 촬영 화면 상태 (Camera)

![촬영 화면 상태](./images/user-flow/06-camera-states.png)

```mermaid
stateDiagram-v2
  [*] --> 카메라뷰: 진입
  카메라뷰 --> 카메라로딩: 카메라 초기화 중
  카메라로딩 --> 카메라뷰: 준비 완료
  카메라뷰 --> 카메라에러: 권한 거부 등
  카메라에러 --> 카메라뷰: 다시 시도
  카메라뷰 --> 촬영완료: 촬영 → 사진 확인
  촬영완료 --> 카메라뷰: 재촬영
  촬영완료 --> 품질경고: 분석하기 (품질 이슈 시)
  품질경고 --> 카메라뷰: 다시 촬영하기
  촬영완료 --> 리뷰: 분석하기 (품질 OK)
  카메라뷰 --> 앨범: 앨범에서 선택
  카메라뷰 --> 리뷰: 직접 입력
```

---

## 7. 내 차 & 검증 내역

![내 차 & 검증 내역](./images/user-flow/07-vehicle-history.png)

```mermaid
flowchart TB
  Vehicle["/vehicle 내 차"]
  VehicleEdit["/vehicle/edit\n차량 등록·수정"]
  History["/history/[id]\n검증 내역 상세"]

  Vehicle -->|"수정 / 등록"| VehicleEdit
  Vehicle -->|"이력 행 탭"| History
  VehicleEdit -->|"저장 / 뒤로가기"| Vehicle
  History -->|"뒤로가기"| Vehicle

  Home["홈"] -->|"내 차량 카드"| Vehicle
  Home -->|"최근 검증 전체보기"| Vehicle
  Home -->|"최근 검증 행 탭"| History
```

---

## 8. 설정(더보기) 플로우

![설정 플로우](./images/user-flow/08-settings.png)

```mermaid
flowchart TB
  Settings["/settings 더보기"]
  Login["/auth/login"]

  Settings -->|"비로그인: 로그인/회원가입"| Login
  Settings -->|"로그인: 로그아웃"| Home
  Login -->|"성공"| Home

  subgraph 로그인시["로그인 시 표시"]
    알림["알림 설정 토글"]
    데이터["데이터: 내 차량, 검증 이력 등"]
    로그아웃["로그아웃"]
  end

  Settings --> 알림
  Settings --> 데이터
  Settings --> 로그아웃
  Home([홈])
```

---

## 9. 한 장 요약 (심플 플로우)

![한 장 요약](./images/user-flow/09-summary.png)

```mermaid
flowchart LR
  A[홈] --> B[검증 입력]
  B --> C[촬영 / 앨범 / 직접입력]
  C --> D[리뷰 위자드]
  C --> E[직접입력 → 결과]
  D --> F[검증 결과]
  E --> F
  F --> G[항목상세 / 질문가이드]
  A --> H[내 차]
  H --> I[차량등록·수정]
  H --> J[검증 내역 상세]
  A --> K[설정]
  K --> L[로그인/회원가입]
```

---

## 10. 조건 분기 (로그인 여부)

![로그인 여부 분기](./images/user-flow/10-login-branch.png)

```mermaid
flowchart TB
  Home["홈 /"]
  Home --> LoggedOut{비로그인?}
  LoggedOut -->|Yes| Guest["CTA 촬영 + 직접입력\n+ 로그인 유도 카드"]
  LoggedOut -->|No| LoggedIn["CTA 촬영 + 직접입력\n+ 내 차량 카드\n+ 최근 검증"]
  Guest --> Login["/auth/login"]
  LoggedIn --> Vehicle["/vehicle"]
  LoggedIn --> History["/history/[id]"]
  Vehicle --> VehicleNeedLogin{로그인 필요}
  VehicleNeedLogin -->|차량/이력 보기| VehiclePage["내 차 페이지"]
  VehicleNeedLogin -->|비로그인| VehicleGuest["차량 등록 유도\n로그인 안내"]
  History --> HistoryLogin["로그인 필수\n미로그인 시 404"]
```

---

- **라우트 정리**
  - 메인: `/`, `/verify/camera`, `/verify/album`, `/verify/manual`, `/verify/review`, `/verify/result`, `/verify/result/[itemId]`, `/verify/result/guide`, `/vehicle`, `/vehicle/edit`, `/history/[id]`, `/settings`
  - 인증: `/auth/login`, `/auth/signup`
- **직접 입력**: 홈 또는 촬영 화면에서 “직접 입력” 시 `directInput` 플래그로 `/verify/review`가 Step 2(정비 정보)부터 시작.
- **검증 내역 상세**: 로그인한 사용자만 `/history/[id]` 접근 가능, 그 외 404.
