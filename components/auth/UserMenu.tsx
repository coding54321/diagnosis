'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, LogIn } from 'lucide-react';
import { signOut } from '@/lib/supabase/auth-client';
import { useAuth } from '@/components/auth/AuthProvider';

const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.refresh();
    setShowMenu(false);
  };

  if (!user) {
    return (
      <button
        onClick={() => router.push('/auth/login')}
        className="touch-target p-2 text-hyundai-gray-700 hover:text-hyundai-gray-900"
        aria-label="로그인"
      >
        <LogIn className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="touch-target p-2 text-hyundai-gray-700 hover:text-hyundai-gray-900"
        aria-label="사용자 메뉴"
      >
        <User className="w-5 h-5" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-hyundai-gray-200 z-50">
            <div className="p-3 border-b border-hyundai-gray-100">
              <p className="text-body-1 text-hyundai-gray-900 font-medium">
                {user.email}
              </p>
            </div>
            <button
              onClick={() => {
                setShowMenu(false);
                router.push('/settings');
              }}
              className="w-full px-4 py-3 text-left text-body-2 text-hyundai-gray-700 hover:bg-hyundai-gray-50 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              설정
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-body-2 text-hyundai-gray-700 hover:bg-hyundai-gray-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
