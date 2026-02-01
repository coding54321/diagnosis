# Supabase MCP 연동 가이드

이 문서는 Supabase MCP를 프로젝트에 연동하는 방법을 안내합니다.

## ✅ 완료된 작업

1. ✅ Supabase 클라이언트 라이브러리 설치 (`@supabase/supabase-js`)
2. ✅ Supabase 클라이언트 초기화 (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
3. ✅ 데이터베이스 스키마 생성 (MCP를 통한 마이그레이션)
4. ✅ TypeScript 타입 생성

## 📊 생성된 테이블

다음 테이블들이 생성되었습니다:

- **vehicles** - 차량 정보
- **estimates** - 견적서 정보
- **estimate_items** - 견적 항목
- **verification_results** - 검증 결과
- **item_verifications** - 항목별 검증 결과
- **verification_history** - 검증 내역 뷰

모든 테이블에는 Row Level Security (RLS)가 활성화되어 있으며, 사용자는 자신의 데이터만 접근할 수 있습니다.

## 🔧 사용 방법

### 클라이언트 사이드에서 사용

```typescript
import { supabase } from '@/lib/supabase';

// 차량 정보 조회
const { data: vehicles, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('user_id', userId);

// 견적서 저장
const { data: estimate, error } = await supabase
  .from('estimates')
  .insert({
    vehicle_id: vehicleId,
    user_id: userId,
    shop_name: '블루핸즈 강남점',
    total_amount: 203500,
  })
  .select()
  .single();
```

### 서버 사이드에서 사용

```typescript
import { createServerClient } from '@/lib/supabase/server';

// Server Component 또는 Server Action에서
const supabase = await createServerClient();

const { data, error } = await supabase
  .from('vehicles')
  .select('*');
```

## 🔐 인증 설정

현재 스키마는 Supabase Auth를 사용하도록 설계되었습니다. 인증을 활성화하려면:

1. Supabase Dashboard > Authentication > Providers에서 원하는 인증 방법 활성화
2. 클라이언트에서 인증 처리:

```typescript
import { supabase } from '@/lib/supabase';

// 로그인
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// 현재 사용자 확인
const { data: { user } } = await supabase.auth.getUser();
```

## 📝 다음 단계

1. ✅ 환경 변수 설정 (완료)
2. ✅ Supabase 클라이언트 초기화 (완료)
3. ✅ 데이터베이스 스키마 생성 (완료)
4. ✅ TypeScript 타입 생성 (완료)
5. ⏳ API 라우트 또는 Server Actions 구현
6. ⏳ 인증 플로우 구현
7. ⏳ 이미지 업로드 (Supabase Storage) 구현
