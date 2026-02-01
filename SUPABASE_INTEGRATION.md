# Supabase 연동 완료 가이드

## ✅ 완료된 작업

1. **데이터베이스 스키마 생성** ✅
   - `vehicles` - 차량 정보
   - `estimates` - 견적서 정보
   - `estimate_items` - 견적 항목
   - `verification_results` - 검증 결과
   - `item_verifications` - 항목별 검증 결과
   - `verification_history` - 검증 내역 뷰
   - RLS 정책 설정 (임시로 모든 사용자 조회 가능)

2. **데이터베이스 함수 생성** ✅
   - `lib/supabase/queries.ts` - 데이터베이스 쿼리 함수
   - `lib/supabase/actions.ts` - Server Actions
   - `lib/supabase/storage.ts` - 이미지 업로드 함수
   - `lib/supabase/estimate.ts` - 견적서 조회 함수

3. **페이지 연동** ✅
   - 홈 페이지 (`app/(main)/page.tsx`) - Supabase에서 차량 정보 및 검증 내역 조회
   - 검증 내역 페이지 (`app/(main)/history/page.tsx`) - Supabase에서 전체 검증 내역 조회
   - 내 차 관리 페이지 (`app/(main)/vehicle/page.tsx`) - Supabase에서 차량 정보 및 통계 조회
   - 직접 입력 페이지 (`app/(main)/verify/manual/page.tsx`) - 견적서 저장 기능 연결
   - Review 페이지 (`app/(main)/verify/review/page.tsx`) - 견적서 저장 및 검증 실행
   - 검증 결과 페이지 (`app/(main)/verify/result/page.tsx`) - 검증 결과 조회 및 저장

4. **검증 엔진 구현** ✅
   - `lib/verification/engine.ts` - 검증 로직 구현
   - 목업 데이터 기반 검증 (실제 데이터베이스 쿼리로 확장 가능)
   - 항목별 및 전체 견적서 검증 기능

## 📝 현재 상태

- **인증**: 아직 구현되지 않음 (임시로 고정된 userId 사용)
- **데이터 조회**: Supabase에서 조회하되, 실패 시 목업 데이터로 fallback ✅
- **데이터 저장**: 
  - ✅ 직접 입력 페이지: 견적서 저장 기능 연결 완료
  - ✅ Review 페이지: 견적서 저장 기능 연결 완료
  - ✅ 검증 결과 페이지: 검증 결과 저장 기능 연결 완료
- **이미지 업로드**: Supabase Storage 연동 준비 완료 (버킷 생성 필요)

## 🔄 다음 단계

### 1. Supabase Storage 버킷 생성 ⚠️
Supabase Dashboard에서 수동으로 버킷을 생성해야 합니다:

1. Supabase Dashboard > Storage 메뉴로 이동
2. "New bucket" 클릭
3. 설정:
   - **Bucket name**: `estimate-images`
   - **Public bucket**: ✅ 체크 (공개 버킷)
   - **File size limit**: 10MB (또는 원하는 크기)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 2. 인증 구현
```typescript
// Supabase Auth를 사용하여 사용자 인증
// lib/supabase/auth.ts 생성 필요
// TEMP_USER_ID 대신 실제 auth.uid() 사용
```

### 3. 검증 로직 개선
- ✅ 기본 검증 엔진 구현 완료
- ⏳ 실제 데이터베이스에서 유사 사례 조회 및 통계 계산 (목업 데이터 → 실제 데이터)
- ⏳ 검증 알고리즘 고도화 (머신러닝/통계 모델 적용)

### 4. 실시간 업데이트 (선택사항)
```typescript
// Supabase Realtime을 사용하여 실시간 데이터 동기화
```

## 🧪 테스트 방법

1. Supabase Dashboard에서 직접 데이터 삽입하여 테스트
2. 또는 Server Actions를 직접 호출하여 데이터 저장 테스트

## 📚 참고 자료

- [Supabase 문서](https://supabase.com/docs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
