'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-hyundai-gray-100 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center h-[52px] max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5',
                'flex-1 h-full',
                'transition-colors duration-200',
                isActive
                  ? 'text-hyundai-gray-900'
                  : 'text-hyundai-gray-400 active:text-hyundai-gray-600'
              )}
            >
              <span className="flex items-center justify-center">
                {item.icon}
              </span>
              <span className={cn(
                'text-[10px]',
                isActive ? 'font-semibold text-hyundai-gray-900' : 'font-normal text-hyundai-gray-400'
              )}>
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
