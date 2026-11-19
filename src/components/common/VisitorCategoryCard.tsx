/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface VisitorCategoryCardProps {
  title: string;
  onClick: () => void;
  illustration: React.ReactNode;
}

export const VisitorCategoryCard: React.FC<VisitorCategoryCardProps> = ({
  title,
  onClick,
  illustration,
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="relative w-full min-w-0 h-20 sm:h-24 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] p-2 flex flex-col justify-between items-center text-center overflow-hidden transition-all duration-150 hover:border-[#673AB7]/50 hover:shadow-sm active:scale-95 cursor-pointer group select-none shadow-xs shrink-0"
    >
      {/* Compact Title */}
      <span className="text-[11px] sm:text-xs font-extrabold text-[#111111] leading-tight group-hover:text-[#673AB7] transition-colors truncate w-full px-0.5">
        {title}
      </span>

      {/* 3D Illustration Container */}
      <div className="flex-1 w-full flex items-end justify-center overflow-hidden pointer-events-none pb-0.5 transform group-hover:scale-105 transition-transform">
        {illustration}
      </div>
    </button>
  );
};
