'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, MessageCircle, FileText, Lock, LogIn } from 'lucide-react';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from '@/lib/supabase/auth-client';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    router.push('/');
    router.refresh();
  };

  const userName = user
    ? (user.user_metadata?.name as string | undefined) || user.email?.split('@')[0] || '사용자'
    : null;

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-52px)] bg-hyundai-gray-50">
        <div className="bg-white pb-1">
          <Container>
            <div className="pt-6 pb-5 px-1">
              <p className="text-xs text-hyundai-gray-400 mb-1">더보기</p>
              <div className="h-7 w-32 bg-hyundai-gray-100 rounded animate-pulse" />
            </div>
          </Container>
        </div>
        <Container>
          <div className="py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-52px)] bg-hyundai-gray-50">
      {/* 페이지 타이틀 */}
      <div className="bg-white pb-1">
        <Container>
          <div className="pt-6 pb-5 px-1">
            <p className="text-xs text-hyundai-gray-400 mb-1">더보기</p>
            {user ? (
              <>
                <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                  {userName}님
                </h2>
                <p className="text-sm text-hyundai-gray-400 mt-1 truncate">{user.email}</p>
              </>
            ) : (
              <>
                <h2 className="text-[22px] font-bold text-hyundai-gray-900 leading-tight tracking-tight">
                  로그인해주세요
                </h2>
                <p className="text-sm text-hyundai-gray-400 mt-1">
                  검증 이력과 차량 정보를 관리할 수 있어요
                </p>
              </>
            )}
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-4 space-y-4">

          {/* 비로그인: 로그인 유도 */}
          {!user && (
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              <Card variant="default" padding="none">
                <div className="flex items-center gap-3.5 px-5 py-4 active:bg-hyundai-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-hyundai-gray-50 flex items-center justify-center shrink-0">
                    <LogIn className="w-4 h-4 text-hyundai-gray-500" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-hyundai-gray-900">로그인 / 회원가입</p>
                    <p className="text-xs text-hyundai-gray-400 mt-0.5">로그인하면 모든 기능을 이용할 수 있어요</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-hyundai-gray-300 shrink-0" strokeWidth={1.5} />
                </div>
              </Card>
            </button>
          )}

          {/* 알림 설정 (로그인 시만) */}
          {user && (
            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">알림</p>
              <Card variant="default" padding="none">
                <ToggleRow label="정비 시기 알림" defaultValue={true} />
                <div className="mx-5 border-b border-hyundai-gray-100" />
                <ToggleRow label="검증 완료 알림" defaultValue={true} />
                <div className="mx-5 border-b border-hyundai-gray-100" />
                <ToggleRow label="마케팅 알림" defaultValue={false} />
              </Card>
            </div>
          )}

          {/* 데이터 (로그인 시만) */}
          {user && (
            <div>
              <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">데이터</p>
              <Card variant="default" padding="none">
                <ToggleRow label="검증 내역 자동 저장" defaultValue={true} />
                <div className="mx-5 border-b border-hyundai-gray-100" />
                <ToggleRow label="익명 데이터 기여" defaultValue={true} />
              </Card>
            </div>
          )}

          {/* 고객 지원 */}
          <div>
            <p className="text-sm font-bold text-hyundai-gray-900 px-1 mb-2">지원</p>
            <Card variant="default" padding="none">
              <MenuRow
                icon={<MessageCircle className="w-4 h-4" strokeWidth={1.5} />}
                label="고객센터 문의"
              />
              <div className="mx-5 border-b border-hyundai-gray-100" />
              <MenuRow
                icon={<FileText className="w-4 h-4" strokeWidth={1.5} />}
                label="이용약관"
              />
              <div className="mx-5 border-b border-hyundai-gray-100" />
              <MenuRow
                icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                label="개인정보처리방침"
              />
            </Card>
          </div>

          {/* 로그아웃 */}
          {user && (
            <Card variant="default" padding="none">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-5 py-4 active:bg-hyundai-gray-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-hyundai-gray-400" strokeWidth={1.5} />
                <span className="text-sm text-hyundai-gray-500">
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                </span>
              </button>
            </Card>
          )}

          {/* 앱 버전 */}
          <p className="text-center text-[11px] text-hyundai-gray-300 py-2">
            앱 버전 1.0.0
          </p>
        </div>
      </Container>
    </main>
  );
};

/* ===== 서브 컴포넌트 ===== */

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3.5 active:bg-hyundai-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-hyundai-gray-400">{icon}</span>
        <span className="text-sm text-hyundai-gray-900">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-hyundai-gray-300" strokeWidth={1.5} />
    </button>
  );
}

function ToggleRow({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue: boolean;
}) {
  const [checked, setChecked] = useState(defaultValue);

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-hyundai-gray-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={`relative w-10 h-[22px] rounded-full transition-colors ${
          checked ? 'bg-hyundai-gray-900' : 'bg-hyundai-gray-200'
        }`}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-sm ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default SettingsPage;
