import React from 'react';
import { cn } from '@/lib/utils';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      title,
      leftAction,
      rightAction,
      showBackButton = false,
      onBack,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50',
          'bg-white border-b border-hyundai-gray-200',
          'min-h-[56px] flex items-center justify-between gap-3',
          'px-4',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBackButton && (
            <button
              onClick={onBack}
              className="touch-target p-2 -ml-2 shrink-0 text-hyundai-gray-700 hover:text-hyundai-gray-900"
              aria-label="뒤로 가기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {leftAction}
          {title && (
            <h1 className="text-xl font-bold text-hyundai-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightAction}
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';

export default Header;
