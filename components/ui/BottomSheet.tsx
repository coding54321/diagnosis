'use client';

import React, { useEffect } from 'react';
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
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* 시트 */}
      <div
        className={cn(
          'relative w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] flex flex-col',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-hyundai-gray-200" />
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
              className="w-8 h-8 flex items-center justify-center rounded-full text-hyundai-gray-400 active:bg-hyundai-gray-100 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1 min-h-0 px-5 pb-8">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
