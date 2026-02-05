'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav, { BOTTOM_NAV_CONTENT_HEIGHT } from './BottomNav';
import type { NavItem } from './BottomNav';

const HIDE_NAV_PATHS = ['/verify/camera', '/verify/album', '/verify/review', '/verify/result', '/verify/manual'];

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
      <div
        className="shrink-0"
        style={{ height: `calc(${BOTTOM_NAV_CONTENT_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}
      />
    </>
  );
}
