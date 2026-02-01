'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Database, User, MessageCircle, FileText, Lock, LogIn } from 'lucide-react';
import { Header, Container } from '@/components/layout';
import UserMenu from '@/components/auth/UserMenu';
import { Card, Button } from '@/components/ui';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from '@/lib/supabase/auth-client';

type SettingItem = 
  | { label: string; value: boolean; action?: never }
  | { label: string; action: boolean; value?: never };

interface SettingsCategory {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  items: SettingItem[];
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Card variant="default" padding="md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-hyundai-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-hyundai-gray-200 rounded" />
            <div className="h-3 w-48 bg-hyundai-gray-100 rounded" />
          </div>
        </div>
      </Card>
      {[1, 2, 3].map((i) => (
        <Card key={i} variant="default" padding="md">
          <div className="h-5 w-24 bg-hyundai-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex justify-between py-2 border-b border-hyundai-gray-100 last:border-0">
                <div className="h-4 w-28 bg-hyundai-gray-100 rounded" />
                <div className="h-6 w-16 bg-hyundai-gray-100 rounded" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

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

  const settingsCategories: SettingsCategory[] = [
    {
      title: '알림 설정',
      Icon: Bell,
      items: [
        { label: '정비 시기 알림', value: true },
        { label: '검증 완료 알림', value: true },
        { label: '마케팅 알림', value: false },
      ],
    },
    {
      title: '데이터 관리',
      Icon: Database,
      items: [
        { label: '검증 내역 자동 저장', value: true },
        { label: '익명 데이터 기여', value: true },
      ],
    },
    {
      title: '계정',
      Icon: User,
      items: [
        { label: '프로필 수정', action: true },
        { label: '로그아웃', action: true },
      ],
    },
  ];

  return (
    <>
      <Header title="설정" rightAction={<UserMenu />} />
      
      <main className="min-h-screen bg-hyundai-gray-50 pb-20">
        <Container>
          <div className="py-6 space-y-6">
            {isLoading ? (
              <SettingsSkeleton />
            ) : !user ? (
              <>
                <LoginPrompt message="로그인하시면 설정을 관리하고 개인화된 서비스를 이용할 수 있어요" />
                <Card variant="default" padding="md">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-hyundai-gray-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-hyundai-gray-400" />
                    </div>
                    <p className="text-body-1 text-hyundai-gray-600 mb-4">
                      로그인하여 설정을 관리하세요
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => router.push('/auth/login')}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <LogIn className="w-4 h-4" />
                      로그인
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* 사용자 정보 (마이현대 스타일) */}
                <Card variant="default" padding="md">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-full bg-hyundai-gray-200 flex items-center justify-center">
                      <User className="w-7 h-7 text-hyundai-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-hyundai-gray-900 mb-0.5">
                        {(user.user_metadata?.name as string) || user.email?.split('@')[0] || '사용자'}님
                      </h3>
                      <p className="text-body-2 text-hyundai-gray-600 truncate">{user.email}</p>
                    </div>
                    <svg className="w-5 h-5 shrink-0 text-hyundai-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </>
            )}

            {/* 설정 카테고리 */}
            {user && settingsCategories.map((category) => {
              const CategoryIcon = category.Icon;
              return (
                <Card key={category.title} variant="default" padding="md">
                  <div className="flex items-center gap-2 mb-4">
                    <CategoryIcon className="w-5 h-5 text-hyundai-gray-600" />
                    <h3 className="text-h4 text-hyundai-gray-900">{category.title}</h3>
                  </div>
                <div className="space-y-3">
                  {category.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-hyundai-gray-100 last:border-0"
                    >
                      <span className="text-body-1 text-hyundai-gray-900">{item.label}</span>
                      {'action' in item ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (item.label === '로그아웃') {
                              handleLogout();
                            }
                          }}
                        >
                          {item.label === '로그아웃' ? '로그아웃' : '설정'}
                        </Button>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={item.value}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-hyundai-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-hyundai-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-hyundai-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hyundai-blue-500"></div>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
              );
            })}

            {/* 앱 정보 */}
            <Card variant="outlined" padding="md">
              <div className="space-y-2 text-center">
                <p className="text-body-2 text-hyundai-gray-600">앱 버전</p>
                <p className="text-body-1 text-hyundai-gray-900 font-medium">1.0.0</p>
              </div>
            </Card>

            {/* 고객 지원 */}
            <div className="space-y-3">
              <Button variant="outline" size="lg" fullWidth className="flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                고객센터 문의
              </Button>
              <Button variant="outline" size="lg" fullWidth className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                이용약관
              </Button>
              <Button variant="outline" size="lg" fullWidth className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                개인정보처리방침
              </Button>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
};

export default SettingsPage;
