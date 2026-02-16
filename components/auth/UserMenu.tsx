'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { BottomSheet } from '@/components/ui';

const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="touch-target p-2 text-hyundai-gray-700 hover:text-hyundai-gray-900"
        aria-label="사용자 메뉴"
      >
        <User className="w-5 h-5" strokeWidth={1.5} />
      </button>

      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
        {/* 사용자 정보 */}
        <div className="pb-4 mb-2 border-b border-hyundai-gray-100">
          <p className="text-sm font-medium text-hyundai-gray-900">
            {user.is_anonymous ? '익명 사용자' : user.email || '사용자'}
          </p>
        </div>

        {/* 메뉴 항목 */}
        <div className="space-y-1">
          <button
            onClick={() => {
              setSheetOpen(false);
              router.push('/settings');
            }}
            className="w-full flex items-center gap-3 px-1 py-3.5 text-left active:bg-hyundai-gray-50 rounded-xl transition-colors"
          >
            <Settings className="w-4.5 h-4.5 text-hyundai-gray-500" strokeWidth={1.5} />
            <span className="text-sm text-hyundai-gray-900">설정</span>
          </button>
        </div>
      </BottomSheet>
    </>
  );
};

export default UserMenu;
