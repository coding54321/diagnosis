# Supabase Storage 버킷 설정 가이드

## 📦 버킷 생성 방법

Supabase Storage 버킷은 SQL로 직접 생성할 수 없으므로 Dashboard에서 수동으로 생성해야 합니다.

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택

### 2. Storage 메뉴로 이동
1. 왼쪽 사이드바에서 **Storage** 메뉴 클릭
2. **Buckets** 탭 확인

### 3. 새 버킷 생성
1. **New bucket** 버튼 클릭
2. 다음 설정 입력:
   - **Bucket name**: `estimate-images`
   - **Public bucket**: ✅ **체크** (공개 버킷으로 설정)
   - **File size limit**: `10MB` (또는 원하는 크기)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 4. RLS 정책 설정 (선택사항)
버킷 생성 후, SQL Editor에서 다음 정책을 적용할 수 있습니다:

```sql
-- 공개 읽기 권한
CREATE POLICY "Public Access for estimate-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'estimate-images');

-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload estimate images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'estimate-images' 
    AND auth.role() = 'authenticated'
  );

-- 사용자는 자신이 업로드한 이미지만 삭제 가능
CREATE POLICY "Users can delete their own estimate images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'estimate-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## ✅ 확인 방법

버킷이 제대로 생성되었는지 확인:

1. Storage > Buckets에서 `estimate-images` 버킷이 보이는지 확인
2. 버킷을 클릭하여 설정이 올바른지 확인
3. 테스트 이미지 업로드 시도

## 🔧 문제 해결

### 버킷을 찾을 수 없는 경우
- 버킷 이름이 정확히 `estimate-images`인지 확인
- 다른 프로젝트에 생성되지 않았는지 확인

### 업로드 권한 오류
- RLS 정책이 올바르게 설정되었는지 확인
- Public bucket으로 설정되어 있는지 확인

### 파일 크기 제한 오류
- File size limit 설정 확인
- 업로드하려는 이미지 크기 확인
