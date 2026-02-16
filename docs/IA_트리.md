# 정비 견적 검증 서비스 - IA (Information Architecture) 트리

## 전체 구조 다이어그램

```mermaid
graph TD
    Root[정비 견적 검증 서비스]
    
    Root --> Home[홈 /]
    Root --> Verify[검증 /verify]
    Root --> Vehicle[내 차 /vehicle]
    Root --> History[검증 내역]
    Root --> Settings[설정 /settings]
    Root --> Notifications[알림 /notifications]
    
    %% 검증 서브 트리
    Verify --> VerifyCamera[카메라 촬영<br/>/verify/camera]
    Verify --> VerifyAlbum[앨범 선택<br/>/verify/album]
    Verify --> VerifyManual[수기 입력<br/>/verify/manual]
    Verify --> VerifyReview[견적 확인<br/>/verify/review]
    Verify --> VerifyResult[검증 결과<br/>/verify/result]
    VerifyResult --> VerifyResultItem[항목 상세<br/>/verify/result/[itemId]]
    VerifyResult --> VerifyResultGuide[정비소 질문 가이드<br/>/verify/result/guide]
    
    %% 내 차 서브 트리
    Vehicle --> VehicleEdit[차량 등록/수정<br/>/vehicle/edit]
    
    %% 검증 내역 서브 트리
    History --> HistoryDetail[검증 내역 상세<br/>/history/[id]]
    
    %% 스타일링
    classDef mainPage fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef subPage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef detailPage fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class Home,Vehicle,Settings,Notifications mainPage
    class VerifyCamera,VerifyAlbum,VerifyManual,VerifyReview,VerifyResult,VehicleEdit,History subPage
    class VerifyResultItem,VerifyResultGuide,HistoryDetail detailPage
```

## 계층형 구조 (GNB 기준)

### 층위 구분 기준
- **카테고리 (Lv1)**: 하단 네비게이션(GNB)의 4개 메인 메뉴
- **페이지 (Lv2)**: 각 카테고리의 메인 페이지 또는 주요 기능 페이지
- **서브페이지 (Lv3)**: 페이지 하위의 세부 페이지 또는 모달/상세 화면

```
정비 견적 검증 서비스
│
├── [카테고리 1] 홈
│   └── [페이지] 홈 (/)
│       └── 메인 대시보드 (검증 CTA, 차량 정보, 최근 검증 내역)
│
├── [카테고리 2] 검증
│   ├── [페이지] 카메라 촬영 (/verify/camera)
│   │   └── 견적서 촬영 화면
│   │
│   ├── [서브페이지] 앨범 선택 (/verify/album)
│   │   └── 이미지 선택 화면
│   │
│   ├── [서브페이지] 수기 입력 (/verify/manual)
│   │   └── 직접 입력 화면
│   │
│   ├── [서브페이지] 견적 확인 (/verify/review)
│   │   └── OCR 결과 확인 및 수정
│   │
│   ├── [서브페이지] 검증 결과 (/verify/result)
│   │   └── 검증 결과 요약
│   │
│   ├── [서브페이지] 항목 상세 (/verify/result/[itemId])
│   │   └── 항목별 가격 비교 상세
│   │
│   └── [서브페이지] 정비소 질문 가이드 (/verify/result/guide)
│
├── [카테고리 3] 내 차
│   ├── [페이지] 내 차 (/vehicle)
│   │   └── 차량 목록 및 검증 이력
│   │
│   ├── [서브페이지] 차량 등록/수정 (/vehicle/edit)
│   │   └── 차량 정보 입력/수정
│   │
│   └── [서브페이지] 검증 내역 상세 (/history/[id])
│       └── 검증 내역 상세 정보
│
└── [카테고리 4] 더보기
    ├── [페이지] 설정 (/settings)
    │   └── 프로필, 알림, 고객센터 등 설정
    │
    └── [서브페이지] 알림 (/notifications)
        └── 알림 목록
```

### 층위별 상세 설명

#### Lv1: 카테고리 (하단 네비게이션 메뉴)
하단 네비게이션(GNB)에 표시되는 4개의 메인 카테고리입니다.

| 카테고리 | 경로 | 설명 | 하단 네비 표시 |
|---------|------|------|---------------|
| **홈** | `/` | 서비스 진입점, 메인 대시보드 | ✅ |
| **검증** | `/verify/camera` | 견적서 검증 플로우의 시작점 | ✅ (검증 플로우 중에는 숨김) |
| **내 차** | `/vehicle` | 차량 관리 및 검증 이력 | ✅ |
| **더보기** | `/settings` | 설정 및 기타 기능 | ✅ |

#### Lv2: 페이지
각 카테고리의 메인 페이지 또는 주요 기능을 담당하는 독립적인 페이지입니다.

| 카테고리 | 페이지 | 경로 | 설명 | 층위 |
|---------|--------|------|------|------|
| 홈 | 홈 | `/` | 메인 대시보드 (검증 CTA 3개 포함) | 페이지 |
| 검증 | 카메라 촬영 | `/verify/camera` | 견적서 촬영 화면 (GNB 진입점) | 페이지 |
| 내 차 | 내 차 | `/vehicle` | 차량 목록 및 관리 | 페이지 |
| 더보기 | 설정 | `/settings` | 프로필, 알림, 고객센터 등 설정 | 페이지 |

#### Lv3: 서브페이지
각 페이지에서 파생되는 세부 페이지 또는 모달/상세 화면입니다.

| 카테고리 | 상위 페이지 | 서브페이지 | 경로 | 설명 | 층위 |
|---------|------------|-----------|------|------|------|
| 검증 | 카메라 촬영 | 앨범 선택 | `/verify/album` | 이미지 선택 화면 | 서브페이지 |
| 검증 | 카메라 촬영 | 수기 입력 | `/verify/manual` | 직접 입력 화면 | 서브페이지 |
| 검증 | 카메라 촬영 | 견적 확인 | `/verify/review` | OCR 결과 확인 및 수정 | 서브페이지 |
| 검증 | 카메라 촬영 | 검증 결과 | `/verify/result` | 검증 결과 요약 | 서브페이지 |
| 검증 | 검증 결과 | 항목 상세 | `/verify/result/[itemId]` | 항목별 가격 비교 상세 | 서브페이지 |
| 검증 | 검증 결과 | 정비소 질문 가이드 | `/verify/result/guide` | 정비소 질문 가이드 | 서브페이지 |
| 내 차 | 내 차 | 차량 등록/수정 | `/vehicle/edit` | 차량 정보 입력/수정 | 서브페이지 |
| 내 차 | 내 차 | 검증 내역 상세 | `/history/[id]` | 검증 내역 상세 정보 | 서브페이지 |
| 더보기 | 설정 | 알림 | `/notifications` | 알림 목록 | 서브페이지 |

### 층위별 특징

#### 카테고리 (Lv1)
- 하단 네비게이션에 항상 표시되는 메인 메뉴
- 사용자가 서비스의 주요 기능 영역을 구분하는 기준
- 총 4개: 홈, 검증, 내 차, 더보기

#### 페이지 (Lv2)
- 각 카테고리의 진입점이 되는 메인 페이지
- 독립적인 기능을 가진 화면 단위
- 하단 네비게이션이 표시되는 경우가 많음 (검증 플로우 제외)
- **참고**: 홈 페이지(`/`)는 하나의 페이지이며, 내부에 3개의 검증 CTA 버튼이 포함되어 있습니다. 이 CTA들은 별도의 페이지가 아니라 홈 페이지 내의 UI 요소입니다.

#### 서브페이지 (Lv3)
- 상위 페이지에서 파생되는 세부 화면
- 사용자 액션(클릭, 입력 등)에 따라 이동하는 화면
- 하단 네비게이션이 숨겨지는 경우가 많음 (검증 플로우, 상세 화면 등)
- **참고**: 홈 페이지의 CTA 버튼들이 연결하는 페이지들(`/verify/camera`, `/verify/album`, `/verify/review`)은 검증 카테고리의 서브페이지로 분류됩니다.

### 페이지 내부 구조에 대한 참고사항

**IA 트리 vs 화면 구조의 차이:**
- **IA 트리**: 페이지 레벨까지만 표시 (카테고리 → 페이지 → 서브페이지)
- **화면 구조**: 페이지 내부의 섹션, 버튼, UI 요소까지 표시 (와이어프레임, 사이트맵 등)

**홈 페이지 내부 구조 (참고용):**
홈 페이지(`/`)는 하나의 페이지이며, 내부에 다음과 같은 영역이 포함되어 있습니다:
- 히어로 섹션 (인사말)
- 검증 CTA 영역 (견적서 촬영하기, 앨범에서 가져오기, 직접 입력하기)
- 차량 정보 (로그인 시)
- 최근 검증 내역 (로그인 시)

각 CTA 버튼이 연결하는 페이지들(`/verify/camera`, `/verify/album`, `/verify/review`)은 검증 카테고리의 서브페이지로 분류됩니다.

**참고**: 페이지 내부의 상세한 UI 구조는 와이어프레임이나 화면 설계 문서에서 다루는 것이 일반적입니다.

## 하단 네비게이션 구조

```
┌─────────────────────────────────────────────────────────┐
│              하단 네비게이션 (메인 영역 공통)              │
├──────────┬──────────┬──────────┬──────────────────────┤
│   홈     │   검증   │  내 차   │      더보기          │
│    /     │/verify/  │/vehicle  │    /settings         │
│          │ camera   │          │                      │
└──────────┴──────────┴──────────┴──────────────────────┘
```

**하단 네비게이션 표시 규칙:**
- 표시: `/`, `/vehicle`, `/settings`, `/notifications`
- 숨김: `/verify/*`, `/history/*` (검증 플로우 중에는 네비게이션 숨김)

## 페이지별 상세 정보 (GNB 기준)

### 카테고리 1: 홈
| 층위 | 경로 | 페이지명 | 설명 | 하단 네비 |
|------|------|---------|------|----------|
| 페이지 | `/` | 홈 | 메인 대시보드, 견적서 검증 CTA | 표시 |

### 카테고리 2: 검증
| 층위 | 경로 | 페이지명 | 설명 | 하단 네비 |
|------|------|---------|------|----------|
| 페이지 | `/verify/camera` | 카메라 촬영 | 견적서 촬영 화면 (GNB 진입점) | 숨김 |
| 서브페이지 | `/verify/album` | 앨범 선택 | 이미지 선택 화면 | 숨김 |
| 서브페이지 | `/verify/manual` | 수기 입력 | 직접 입력 화면 | 숨김 |
| 서브페이지 | `/verify/review` | 견적 확인 | OCR 결과 확인 및 수정 | 숨김 |
| 서브페이지 | `/verify/result` | 검증 결과 | 검증 결과 요약 | 숨김 |
| 서브페이지 | `/verify/result/[itemId]` | 항목 상세 | 항목별 가격 비교 상세 | 숨김 |
| 서브페이지 | `/verify/result/guide` | 정비소 질문 가이드 | 정비소 질문 가이드 | 숨김 |

### 카테고리 3: 내 차
| 층위 | 경로 | 페이지명 | 설명 | 하단 네비 |
|------|------|---------|------|----------|
| 페이지 | `/vehicle` | 내 차 | 차량 목록 및 관리 | 표시 |
| 서브페이지 | `/vehicle/edit` | 차량 등록/수정 | 차량 정보 입력/수정 | 표시 |
| 서브페이지 | `/history/[id]` | 검증 내역 상세 | 검증 내역 상세 정보 | 숨김 |

### 카테고리 4: 더보기
| 층위 | 경로 | 페이지명 | 설명 | 하단 네비 |
|------|------|---------|------|----------|
| 페이지 | `/settings` | 설정 | 프로필, 알림, 고객센터 | 표시 |
| 서브페이지 | `/notifications` | 알림 | 알림 목록 | 표시 |

## 네비게이션 플로우

```mermaid
flowchart LR
    A[홈 /] -->|견적서 촬영| B[카메라 /verify/camera]
    A -->|앨범 선택| C[앨범 /verify/album]
    A -->|직접 입력| D[수기 입력 /verify/manual]
    A -->|내 차 보기| E[내 차 /vehicle]
    A -->|설정| F[설정 /settings]
    
    B -->|이미지 선택| G[리뷰 /verify/review]
    C -->|이미지 선택| G
    D -->|검증 실행| H[결과 /verify/result]
    G -->|검증 실행| H
    
    H -->|항목 클릭| I[항목 상세 /verify/result/[itemId]]
    H -->|가이드 보기| J[가이드 /verify/result/guide]
    
    E -->|차량 등록/수정| K[차량 수정 /vehicle/edit]
    E -->|검증 이력 클릭| L[내역 상세 /history/[id]]
    
    F -->|알림| M[알림 /notifications]
    
    style A fill:#e1f5ff
    style B fill:#f3e5f5
    style C fill:#f3e5f5
    style D fill:#f3e5f5
    style E fill:#e1f5ff
    style F fill:#e1f5ff
    style G fill:#f3e5f5
    style H fill:#f3e5f5
    style I fill:#fff3e0
    style J fill:#fff3e0
    style K fill:#f3e5f5
    style L fill:#fff3e0
    style M fill:#e1f5ff
```

## 기능별 그룹핑

### 1. 검증 플로우 그룹
- 카메라 촬영 → 리뷰 → 결과
- 앨범 선택 → 리뷰 → 결과
- 수기 입력 → 결과
- 결과 → 항목 상세 / 가이드

### 2. 차량 관리 그룹
- 내 차 → 차량 등록/수정
- 내 차 → 검증 이력 → 내역 상세

### 3. 설정 그룹
- 설정 → 알림
- 설정 → 프로필 관리
- 설정 → 고객센터 문의

## 접근 권한

| 페이지 | 익명 사용자 | 로그인 사용자 |
|--------|-----------|-------------|
| 홈 | ✅ | ✅ |
| 검증 플로우 | ✅ | ✅ |
| 검증 결과 | ✅ | ✅ |
| 내 차 | ⚠️ (제한적) | ✅ |
| 검증 내역 | ❌ | ✅ |
| 설정 | ⚠️ (제한적) | ✅ |

## 주요 사용자 여정

### 여정 1: 견적서 검증 (카메라)
```
홈 → 카메라 촬영 → 리뷰 → 검증 결과 → 항목 상세
```

### 여정 2: 견적서 검증 (앨범)
```
홈 → 앨범 선택 → 리뷰 → 검증 결과 → 항목 상세
```

### 여정 3: 견적서 검증 (수기)
```
홈 → 수기 입력 → 검증 결과 → 항목 상세
```

### 여정 4: 차량 관리
```
홈 → 내 차 → 차량 등록 → 내 차 → 검증 이력 → 내역 상세
```

### 여정 5: 검증 내역 확인
```
홈 → 내 차 → 검증 이력 → 내역 상세 → 항목 상세
```
