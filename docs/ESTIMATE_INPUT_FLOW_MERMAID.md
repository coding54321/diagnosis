# 견적서 데이터 입력 플로우 (Mermaid)

플로우 기준: **사용자는 반드시 전국정비업체를 선택**합니다.  
입력 방식(촬영/앨범/직접입력)별로 차량 정보 → 전국정비업체 선택(필수) → 견적 항목이 반영된 전체 데이터 입력 플로우입니다.

## 플로우차트

```mermaid
flowchart TD
    Start([견적서 검증하기])
    InputChoice{입력 방식 선택}
    Camera[사진 촬영]
    Album[앨범에서 선택]
    Manual[직접 입력]

    Shoot[촬영 / 파일 선택]
    Preview[미리보기]
    UsePhoto[이 사진 사용]
    Review[견적서 확인 화면]
    OCR[이미지 OCR 인식]
    Step2[정비 정보 입력]
    ShopSelect[전국정비업체 선택]
    Step3[차량 정보 확인]
    VehicleConfirm[차량번호 조회 / 내 차 적용]
    Step4[견적 항목 확인·수정]
    DoVerify[검증하기]
    Result[검증 결과 화면]
    Save[(저장 / 메인)]

    ManualScreen[직접 입력 화면]
    ManualVehicle[차량 정보 입력]
    ManualVehicleLookup[차량번호 조회 또는 내 차]
    ManualShop[전국정비업체 선택]
    ManualItems[정비 항목 추가]
    ManualVerify[검증하기]

    Start --> InputChoice
    InputChoice -->|촬영| Camera
    InputChoice -->|앨범| Album
    InputChoice -->|직접 입력| Manual

    Camera --> Shoot
    Album --> Shoot
    Shoot --> Preview
    Preview --> UsePhoto
    UsePhoto --> Review

    Review --> OCR
    OCR --> Step2
    Step2 --> ShopSelect
    ShopSelect --> Step3
    Step3 --> VehicleConfirm
    VehicleConfirm --> Step4
    Step4 --> DoVerify
    DoVerify --> Result

    Manual --> ManualScreen
    ManualScreen --> ManualVehicle
    ManualVehicle --> ManualVehicleLookup
    ManualVehicleLookup --> ManualShop
    ManualShop --> ManualItems
    ManualItems --> ManualVerify
    ManualVerify --> Result

    Result --> Save
```

## 데이터 입력 단계 요약

| 단계 | 이미지 경로 (촬영/앨범) | 직접 입력 경로 |
|------|-------------------------|----------------|
| 1 | 이미지 촬영 또는 선택 → OCR | — |
| 2 | **전국정비업체 선택** (필수) | **전국정비업체 선택** (필수) |
| 3 | 차량 정보 확인 (차량번호 조회 등) | 차량 정보 입력 (차량번호 조회 또는 내 차) |
| 4 | 견적 항목 확인·수정 | 정비 항목 추가 (이름, 부품비, 공임비) |
| 5 | 검증하기 → 결과 | 검증하기 → 결과 |
