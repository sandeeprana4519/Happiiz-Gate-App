/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-200
        bg-[#FFFFFF]
        border border-[#E6F1F5]
        ${elevated ? 'shadow-[0_8px_24px_rgba(0,0,0,0.06)]' : 'shadow-[0_2px_8px_rgba(0,0,0,0.02)]'}
        p-4 sm:p-5
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlassCard: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-200
        bg-[#F1F9FC]
        border border-[#E6F1F5]
        ${elevated ? 'shadow-md' : 'shadow-xs'}
        p-4 sm:p-5
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp = true,
  className = '',
}) => {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#A9B0B8] tracking-wide uppercase">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111] font-mono tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[#A9B0B8]">{subtitle}</p>
          )}
        </div>
        <div className="p-3 rounded-2xl bg-white text-[#673AB7] border border-[#E6F1F5] shadow-xs shrink-0">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-[#E6F1F5] flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-[#A9B0B8]">vs last week</span>
        </div>
      )}
    </div>
  );
};
