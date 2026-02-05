'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** PWA/앱 하단바 콘텐츠 높이 (터치 타겟 44px 이상, iOS/Android 탭바 참고) */
export const BOTTOM_NAV_CONTENT_HEIGHT = 56;

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

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white',
        'border-t border-black/[0.06]',
        'shadow-[0_-1px_3px_rgba(0,0,0,0.06)]',
        'pb-[env(safe-area-inset-bottom,0px)]'
      )}
    >
      <div className="flex items-stretch h-[56px] min-h-[56px] max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'flex-1 min-h-[44px]',
                'py-2 px-1',
                'transition-colors duration-200',
                'touch-manipulation',
                '[-webkit-tap-highlight-color:transparent]',
                '[&_svg]:w-6 [&_svg]:h-6',
                isActive
                  ? 'text-hyundai-gray-900'
                  : 'text-hyundai-gray-400 active:text-hyundai-gray-600'
              )}
            >
              <span className="flex items-center justify-center shrink-0 w-6 h-6" aria-hidden>
                {item.icon}
              </span>
              <span
                className={cn(
                  'text-[11px] leading-tight truncate max-w-full',
                  isActive ? 'font-semibold text-hyundai-gray-900' : 'font-normal text-hyundai-gray-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
