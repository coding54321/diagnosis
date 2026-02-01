import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className, id, icon, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-body-2 text-hyundai-gray-700 mb-2 font-medium"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-hyundai-gray-400 pointer-events-none">
              {React.createElement(icon, { className: 'w-5 h-5' })}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'touch-target py-3 text-body-1',
              'bg-white border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors',
              icon ? 'pl-10 pr-4' : 'px-4',
              error
                ? 'border-semantic-error-main focus:ring-semantic-error-main'
                : 'border-hyundai-gray-300 focus:border-hyundai-blue-500 focus:ring-hyundai-blue-500',
              'disabled:bg-hyundai-gray-100 disabled:text-hyundai-gray-500 disabled:cursor-not-allowed',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-caption text-semantic-error-main mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-caption text-hyundai-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
