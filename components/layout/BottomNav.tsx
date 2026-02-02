'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface BottomNavProps {
  items: NavItem[];
}

const BottomNav: React.FC<BottomNavProps> = ({ items }) => {
  const pathname = usePathname();

  // items를 2그룹으로 나눔: 중앙 CTA 기준 좌/우
  const leftItems = items.slice(0, 1);
  const rightItems = items.slice(1);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-hyundai-gray-100 safe-area-bottom">
      <div className="flex items-end justify-around h-[60px] relative">
        {/* 좌측 탭 */}
        {leftItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* 중앙 CTA 버튼 */}
        <div className="flex flex-col items-center justify-end pb-1.5">
          <Link
            href="/verify/camera"
            className="relative -mt-5 w-12 h-12 rounded-full bg-[#002C5F] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={2} />
          </Link>
          <span className="text-[10px] font-medium text-[#002C5F] mt-1">검증</span>
        </div>

        {/* 우측 탭 */}
        {rightItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5',
        'min-w-[64px] px-2 py-2',
        'transition-colors duration-200',
        isActive
          ? 'text-hyundai-gray-900'
          : 'text-hyundai-gray-400 active:text-hyundai-gray-600'
      )}
    >
      <span className="flex items-center justify-center">
        {item.icon}
      </span>
      <span className={cn('text-[10px]', isActive ? 'font-semibold text-hyundai-gray-900' : 'font-normal text-hyundai-gray-400')}>
        {item.label}
      </span>
    </Link>
  );
}

export default BottomNav;
