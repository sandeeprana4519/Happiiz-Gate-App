/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Mobile-first touch hitbox guarantee: minimum 44px height for md and lg
    const sizeClasses = {
      sm: 'h-9 px-3 text-xs gap-1.5 min-h-[38px]',
      md: 'h-11 px-4 text-sm gap-2 min-h-[44px]',
      lg: 'h-13 px-6 text-base gap-2.5 min-h-[48px]',
    };

    const variantClasses = {
      // Reference Purple Primary Action Button (#673AB7 / #512DA8)
      primary:
        'bg-[#673AB7] hover:bg-[#512DA8] text-white font-semibold shadow-[0_4px_14px_rgba(103,58,183,0.3)] active:scale-[0.98]',
      secondary:
        'bg-[#050505] hover:bg-slate-800 text-white active:scale-[0.98]',
      glass:
        'bg-[#F1F9FC] border border-[#E6F1F5] hover:bg-[#E6F1F5] text-[#111111] shadow-xs active:scale-[0.98]',
      outline:
        'border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[#111111] active:scale-[0.98]',
      ghost:
        'hover:bg-[#F1F9FC] text-[#64748B] hover:text-[#111111]',
      danger:
        'bg-[#E53945] hover:bg-red-700 text-white shadow-[0_4px_14px_rgba(229,57,69,0.3)] active:scale-[0.98]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
