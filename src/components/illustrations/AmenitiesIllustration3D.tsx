/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AmenitiesIllustration3D: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 90,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none drop-shadow-sm ${className}`}
    >
      <defs>
        <linearGradient id="calTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        <linearGradient id="calBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
        <linearGradient id="dicePurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
      </defs>

      {/* 3D Calendar */}
      <g transform="translate(32, 28) rotate(-6)">
        {/* Shadow */}
        <rect x="2" y="10" width="68" height="74" rx="8" fill="#0F172A" opacity="0.08" />

        {/* Back Page Thickness */}
        <rect x="0" y="4" width="68" height="74" rx="8" fill="#CBD5E1" />

        {/* Calendar Main Card */}
        <rect x="0" y="0" width="68" height="74" rx="8" fill="url(#calBody)" stroke="#E2E8F0" strokeWidth="1" />

        {/* Red/Magenta Header */}
        <path
          d="M0 8 C0 3.5 3.5 0 8 0 L60 0 C64.5 0 68 3.5 68 8 L68 24 L0 24 Z"
          fill="url(#calTop)"
        />

        {/* Calendar Binding Rings */}
        <rect x="14" y="-4" width="5" height="10" rx="2.5" fill="#475569" stroke="#94A3B8" strokeWidth="0.8" />
        <rect x="49" y="-4" width="5" height="10" rx="2.5" fill="#475569" stroke="#94A3B8" strokeWidth="0.8" />

        {/* Calendar Day Grid Tiles */}
        <g fill="#94A3B8" opacity="0.6">
          <rect x="10" y="32" width="9" height="7" rx="2" />
          <rect x="23" y="32" width="9" height="7" rx="2" />
          <rect x="36" y="32" width="9" height="7" rx="2" fill="#EC4899" opacity="0.9" />
          <rect x="49" y="32" width="9" height="7" rx="2" />

          <rect x="10" y="43" width="9" height="7" rx="2" />
          <rect x="23" y="43" width="9" height="7" rx="2" />
          <rect x="36" y="43" width="9" height="7" rx="2" />
          <rect x="49" y="43" width="9" height="7" rx="2" />

          <rect x="10" y="54" width="9" height="7" rx="2" />
          <rect x="23" y="54" width="9" height="7" rx="2" fill="#8B5CF6" opacity="0.9" />
          <rect x="36" y="54" width="9" height="7" rx="2" />
          <rect x="49" y="54" width="9" height="7" rx="2" />
        </g>
      </g>

      {/* 3D Amenities Dice / Activity Cube in Foreground */}
      <g transform="translate(68, 72) rotate(14)">
        <rect x="0" y="0" width="26" height="26" rx="5" fill="url(#dicePurple)" stroke="#D8B4FE" strokeWidth="1" />
        {/* Dice dots */}
        <circle cx="8" cy="8" r="2.2" fill="#FFFFFF" />
        <circle cx="13" cy="13" r="2.2" fill="#FFFFFF" />
        <circle cx="18" cy="18" r="2.2" fill="#FFFFFF" />
      </g>
    </svg>
  );
};
