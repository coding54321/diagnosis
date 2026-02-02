'use client';

import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 배경 오버레이 */}
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-white rounded-t-2xl shadow-lg min-h-[50vh] max-h-[85vh] flex flex-col mb-[60px]',
          'transition-transform duration-200 ease-out',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-hyundai-gray-300" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-hyundai-gray-100">
            <h2 id="bottom-sheet-title" className="text-h4 text-hyundai-gray-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-hyundai-gray-500 hover:bg-hyundai-gray-100 rounded-lg"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 min-h-0 px-4 py-4 pb-6">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
