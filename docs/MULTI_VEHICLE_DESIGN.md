# 사용자당 여러 차량 등록 지원 구상

현재는 **유저 1명당 차량 1대**만 다루고 있습니다.  
`getVehicle(userId)`가 최신 1건만 반환하고, `upsertVehicle`이 그 1건을 갱신하는 구조입니다.  
아래는 **한 유저가 여러 대를 등록·선택**할 수 있도록 녹이는 방안입니다.

---

## 1. 현재 구조 요약

| 구분 | 내용 |
|------|------|
| DB | `vehicles` 테이블: `id`, `user_id`, `manufacturer`, `model`, `variant`, `year`, `mileage`, `fuel_type` 등. `user_id`에 unique 없음 → **이미 여러 행 저장 가능** |
| 쿼리 | `getVehicle(userId)`: `limit(1)` + 최신순 → **1대만 반환** |
| 저장 | `upsertVehicle(userId, vehicle)`: 기존 1대 있으면 **update**, 없으면 **insert** → 사실상 1대만 유지 |
| 견적 | `estimates.vehicle_id` FK → 견적 1건당 차량 1대 연결 (유지) |
| UI | 홈 "내 차량" 카드 1개, 내 차 페이지에 1대 요약 또는 "등록해주세요", 수정 시 1대 폼 |

---

## 2. 목표

- 한 유저가 **여러 대** 등록 가능.
- 견적·검증 시 **어느 차량인지 선택** 가능 (기존 등록 차량 선택 또는 이번만 새로 등록).
- 홈·내 차·검증 플로우에서 **선택/목록 UX**로 자연스럽게 녹이기.

---

## 3. 데이터·API 계층

### 3.1 DB (선택 확장)

- **현재만으로도** `vehicles`에 `user_id`당 여러 행 저장 가능. 스키마 변경 없이 진행 가능.
- **선택**  
  - `vehicles`에 `registration_number` (차량번호, 표시·중복 방지용)  
  - `nickname` (예: "회사차", "엄마 차")  
  → 나중에 목록/선택 UI에서 구분용으로 추가해도 됨.

### 3.2 쿼리 (queries.ts)

| 현재 | 변경 후 |
|------|--------|
| `getVehicle(userId)` → 1대 | **유지** (기본/최근 1대 필요 시 사용) 또는 제거 |
| 없음 | **`getVehicles(userId)`** → `Vehicle[]` (최신순 등) |
| 없음 | **`getVehicleById(vehicleId, userId?)`** → 상세/소유 여부 확인 |
| `upsertVehicle(userId, vehicle)` | **`createVehicle(userId, vehicle)`** → insert, `id` 반환 |
| 위와 동일 | **`updateVehicle(vehicleId, userId, vehicle)`** → 해당 행만 update |
| 없음 | **`deleteVehicle(vehicleId, userId)`** → 소유자만 삭제 (선택) |

- `saveVehicle`는 **서버 액션**에서만 두고, 내부적으로  
  - `vehicleId` 있으면 `updateVehicle`  
  - 없으면 `createVehicle`  
  호출하도록 하면 기존 호출부를 점진적으로 바꾸기 좋습니다.

### 3.3 서버 액션 (actions.ts)

| 액션 | 변경 |
|------|------|
| `fetchVehicle()` | **`fetchVehicles()`**로 변경 → `getVehicles(user.id)` 호출, `{ success, data: Vehicle[] }` |
| `fetchVehicle(vehicleId)` 또는 새 함수 | 단건 필요 시 `getVehicleById(vehicleId, user.id)` 사용 |
| `saveVehicle(vehicle, vehicleId?: string)` | `vehicleId` 있으면 update, 없으면 create. 반환에 `data: Vehicle` (id 포함) |

- 견적 생성(`createEstimate` 등)은 이미 `vehicle_id`를 받고 있으므로, **선택된 차량 id**만 넘기면 됨.

---

## 4. 화면별 UX 구상

### 4.1 홈

- **현재**: "내 차량" 카드 1개 (있을 때만) → `/vehicle` 이동.
- **다차량**:
  - **A안**: 카드 1개 유지하되, 문구를 **"내 차량 (N대)"** 등으로 하고 탭 시 **내 차 목록**으로 이동.
  - **B안**: **최근 사용 1대**만 미리보기 (이전과 동일한 카드) + "전체 보기"로 목록.
- 추천: **B안**으로 최소 변경. "내 차량 · 제조사 모델 연식" 한 줄 + "전체 보기"로 `/vehicle` 유지.

### 4.2 내 차 페이지 (`/vehicle`)

- **현재**: 1대 요약 또는 "차량을 등록해주세요" + 정비 이력.
- **다차량**:
  - 상단: "내 차 관리" 유지.
  - **차량 목록**: 카드/리스트로 **여러 대** 표시.  
    각 행: 제조사·모델·연식·(선택) 차량번호/닉네임, [수정] [삭제(선택)].
  - **"차량 추가"** 버튼 → `/vehicle/edit` (새 차량).
  - **정비 이력**: 그대로 유지. 이력은 이미 `user_id` 기준이라 차량 여러 대여도 한 목록으로 두면 됨.  
    (나중에 "차량별 필터"만 넣을 수 있음.)

### 4.3 차량 등록·수정 (`/vehicle/edit`, `/vehicle/edit?id=xxx`)

- **현재**: 단일 폼. 등록이면 insert, 수정이면 기존 1대 update.
- **다차량**:
  - **진입 경로**  
    - "차량 추가" → `id` 없음 → **새 차량 생성** (createVehicle).  
    - 목록에서 "수정" → `id=vehicleId` → **해당 차량만 수정** (updateVehicle).
  - 폼은 지금처럼 **차량번호 + 소유주 검증 → 저장**.  
    저장 시 `vehicleId` 없으면 create, 있으면 update.
  - "이 차량 삭제"는 목록 페이지에서만 두고, edit 페이지에서는 선택 사항.

### 4.4 검증 플로우 (리뷰/직접입력)

- **현재**: "저장된 내 차" 1대 제안 → 그대로 쓰거나, "다른 차량" 시 차량번호 입력.  
  저장 시 `saveVehicle` 1번 호출 후 그 `id`로 `createEstimate(vehicleId)`.
- **다차량**:
  - **저장된 차량이 여러 대일 때**  
    - "이 견적의 차량을 선택해 주세요" → **라디오/드롭다운**으로 N대 중 선택.  
    - 선택한 `vehicleId`로 estimate 생성.  
    - 선택한 차량의 주행거리만 수정 가능하게 두면 됨.
  - **"다른 차량" (목록에 없는 차)**  
    - 지금처럼 차량번호·소유주 입력.  
    - 저장 시 **"이번만 사용"** vs **"내 차량 목록에 추가"** 선택 가능하게 하면 좋음.  
      - 이번만: 임시 vehicle 생성 후 estimate에 연결 (또는 vehicle_id nullable로 이번 검증만 처리).  
      - 목록에 추가: createVehicle 후 그 id로 estimate 연결.
  - **저장된 차량 0대**  
    - 현재와 동일: 차량번호·소유주 입력 → "목록에 추가" 겸 이번 검증에 사용.

### 4.5 검증 결과·이력

- **현재**: 결과/이력에 차량 정보 표시 (estimate에 vehicle 연결됨).
- **다차량**: 변경 없이 **estimate.vehicle_id**로 연결된 차량만 표시하면 됨.  
  이력 목록에서 "차량별 필터"는 이후 확장으로 두면 됨.

---

## 5. 기본값·선택 경험

- **"기본 차량"**  
  - 목록이 있을 때, **가장 최근 수정한 차량**을 기본 선택으로 두면 됨.  
  - 또는 "마지막으로 검증에 사용한 차량"을 localStorage 등에 두고, 리뷰/직접입력 시 그걸 기본 선택할 수 있음.
- **홈 미리보기**  
  - `getVehicle(userId)`(최신 1대)를 그대로 쓰거나, "최근 사용 차량 id"가 있으면 그걸, 없으면 최신 1대로 표시.

---

## 6. 구현 순서 제안

1. **쿼리·액션**  
   - `getVehicles`, `getVehicleById`, `createVehicle`, `updateVehicle` 추가.  
   - `saveVehicle(vehicle, vehicleId?)`로 통합, `fetchVehicles()` 추가.  
   - 기존 `fetchVehicle()`는 "최신 1대" 필요 시에만 유지하고, 나머지는 `fetchVehicles()`로 전환.
2. **내 차 페이지**  
   - 목록 UI로 전환, "차량 추가" → `/vehicle/edit`, "수정" → `/vehicle/edit?id=xxx`.
3. **차량 등록·수정**  
   - 쿼리 파라미터 `id`로 수정 모드 판단, create/update 분기.
4. **홈**  
   - `fetchVehicles()` 사용, 첫 번째 또는 "최근 사용" 1대만 카드에 표시.
5. **리뷰/직접입력**  
   - 저장된 차량 N대일 때 선택 UI 추가, "다른 차량" 시 "목록에 추가" 옵션.
6. **(선택)** 차량 삭제, `registration_number`/`nickname` 스키마 추가.

---

## 7. 정리

- **DB**: 현재 스키마로도 다차량 가능. 필요 시 `registration_number`, `nickname`만 추가.
- **백엔드**: `getVehicles` / `getVehicleById` / `createVehicle` / `updateVehicle` 도입하고, `saveVehicle`를 id 유무로 create/update 분기.
- **UI**: 내 차는 **목록 + 추가/수정**, 홈은 **1대 미리보기**, 검증 플로우는 **차량 선택(기존 N대 + 새로 등록)** 으로 녹이면 됨.

이 구상대로 적용하면 "유저 1명당 여러 대 등록·선택"을 현재 서비스에 자연스럽게 녹일 수 있습니다.
