'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import type { NavItem } from './BottomNav';

const HIDE_NAV_PATHS = ['/verify/camera', '/verify/album', '/verify/review', '/verify/result'];

export interface ConditionalBottomNavProps {
  items: NavItem[];
}

export function ConditionalBottomNav({ items }: ConditionalBottomNavProps) {
  const pathname = usePathname();
  const hideNav = pathname ? HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) : false;

  if (hideNav) {
    return null;
  }

  return (
    <>
      <BottomNav items={items} />
      <div className="h-[60px]" />
    </>
  );
}
