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
      className="relative shrink-0 w-32 sm:w-36 h-40 sm:h-44 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] p-3 flex flex-col justify-between text-left overflow-hidden transition-all duration-150 hover:border-[#673AB7]/30 hover:shadow-sm active:scale-95 cursor-pointer group select-none"
    >
      {/* Title at Top-Left */}
      <div className="z-10">
        <h3 className="text-base sm:text-lg font-bold text-[#111111] leading-tight whitespace-pre-line group-hover:text-[#673AB7] transition-colors">
          {title}
        </h3>
      </div>

      {/* 3D Character Illustration at Bottom-Right */}
      <div className="absolute right-0 bottom-0 pointer-events-none transform translate-x-1 translate-y-1 group-hover:scale-105 transition-transform">
        {illustration}
      </div>
    </button>
  );
};
