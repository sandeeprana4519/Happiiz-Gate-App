/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
    neutral: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success'
            ? 'bg-emerald-500'
            : variant === 'warning'
            ? 'bg-amber-500'
            : variant === 'danger'
            ? 'bg-rose-500'
            : variant === 'info'
            ? 'bg-sky-500'
            : 'bg-slate-400'
        }`}
        aria-hidden="true"
      />
      <span>{status}</span>
    </span>
  );
};

export const MetadataText: React.FC<{ items: (string | React.ReactNode)[]; className?: string }> = ({
  items,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>}
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
};
