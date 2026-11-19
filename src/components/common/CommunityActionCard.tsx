/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CommunityActionCardProps {
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  badgeCount?: number;
  onClick: () => void;
}

export const CommunityActionCard: React.FC<CommunityActionCardProps> = ({
  title,
  subtitle,
  illustration,
  badgeCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className="w-full h-24 sm:h-28 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] px-5 py-3 flex items-center justify-between text-left transition-all duration-150 hover:border-[#673AB7]/30 hover:shadow-sm active:scale-[0.98] cursor-pointer group select-none relative overflow-hidden"
    >
      {/* Text Block */}
      <div className="z-10 pr-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-[#111111] group-hover:text-[#673AB7] transition-colors">
            {title}
          </h3>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#E53945] rounded-full">
              {badgeCount}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#A9B0B8] mt-0.5 line-clamp-1">
          {subtitle}
        </p>
      </div>

      {/* 3D Artwork on Right */}
      <div className="shrink-0 pointer-events-none group-hover:scale-105 transition-transform">
        {illustration}
      </div>
    </button>
  );
};
