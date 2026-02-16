'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => {
        setVisible(false);
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* 배경 오버레이 */}
      <button
        type="button"
        aria-label="닫기"
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animating ? 'opacity-40' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] flex flex-col transition-transform duration-300 ease-out',
          animating ? 'translate-y-0' : 'translate-y-full',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* 핸들 바 — 포인트 컬러 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-hyundai-blue-300" />
        </div>

        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 id="bottom-sheet-title" className="text-lg font-bold text-hyundai-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full text-hyundai-gray-400 active:bg-hyundai-gray-100 transition-colors -mr-2"
              aria-label="닫기"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* 콘텐츠 — PWA 홈 인디케이터 구간 회피 */}
        <div className="overflow-y-auto flex-1 min-h-0 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
