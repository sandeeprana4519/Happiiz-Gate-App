/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const GuestIllustration3D: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 110,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none drop-shadow-sm ${className}`}
    >
      <defs>
        {/* Soft 3D Lighting Gradients */}
        <radialGradient id="guestHeadLight" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE0D1" />
          <stop offset="60%" stopColor="#F9C6B2" />
          <stop offset="100%" stopColor="#E9A894" />
        </radialGradient>
        <linearGradient id="guestHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3845" />
          <stop offset="100%" stopColor="#1C1B20" />
        </linearGradient>
        <linearGradient id="guestShirtGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E6EDF5" />
          <stop offset="100%" stopColor="#CCD8E5" />
        </linearGradient>
        <linearGradient id="guestArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D5E1EC" />
        </linearGradient>
      </defs>

      {/* Body / Shirt */}
      <path
        d="M50 115 Q80 108 110 115 L116 160 Q80 160 44 160 Z"
        fill="url(#guestShirtGrad)"
      />
      {/* Shirt Collar */}
      <path
        d="M68 112 L80 126 L92 112 Q80 115 68 112 Z"
        fill="#FFFFFF"
        stroke="#CAD6E2"
        strokeWidth="1.5"
      />

      {/* Left Arm Resting */}
      <path
        d="M52 115 C42 125 32 140 28 155 C33 158 40 156 46 148 C49 138 52 125 54 116 Z"
        fill="url(#guestArmGrad)"
      />

      {/* Raised Waving Arm (Right) */}
      <path
        d="M106 117 C118 108 126 88 126 72 C122 70 117 72 114 78 C112 90 106 106 100 120 Z"
        fill="url(#guestArmGrad)"
      />

      {/* Waving Hand */}
      <g transform="translate(116, 52)">
        {/* Palm */}
        <ellipse cx="10" cy="16" rx="9" ry="10" fill="url(#guestHeadLight)" />
        {/* Thumb */}
        <path d="M4 18 Q0 16 2 12 Q5 12 7 15 Z" fill="url(#guestHeadLight)" />
        {/* Fingers */}
        <rect x="5" y="4" width="3.5" height="11" rx="1.75" fill="url(#guestHeadLight)" />
        <rect x="9.5" y="2" width="3.5" height="13" rx="1.75" fill="url(#guestHeadLight)" />
        <rect x="14" y="4" width="3.5" height="11" rx="1.75" fill="url(#guestHeadLight)" />
        <rect x="18" y="7" width="3" height="8" rx="1.5" fill="url(#guestHeadLight)" />
      </g>

      {/* Neck */}
      <rect x="74" y="98" width="12" height="18" rx="6" fill="#F0BCA7" />

      {/* Head */}
      <circle cx="80" cy="80" r="22" fill="url(#guestHeadLight)" />

      {/* Hair */}
      <path
        d="M58 76 C58 56 68 54 80 54 C92 54 102 56 102 76 C98 67 92 65 80 65 C68 65 62 70 58 76 Z"
        fill="url(#guestHairGrad)"
      />
      <path
        d="M60 74 C62 62 72 56 84 56 C96 56 101 64 101 74 C100 68 95 62 82 62 C70 62 63 68 60 74 Z"
        fill="#2A2930"
      />

      {/* Ears */}
      <circle cx="58" cy="82" r="4.5" fill="#F9C6B2" />
      <circle cx="102" cy="82" r="4.5" fill="#F9C6B2" />

      {/* Eyes */}
      <ellipse cx="73" cy="79" rx="2" ry="2.5" fill="#222" />
      <ellipse cx="87" cy="79" rx="2" ry="2.5" fill="#222" />
      {/* Eye highlights */}
      <circle cx="72.5" cy="78" r="0.8" fill="#FFF" />
      <circle cx="86.5" cy="78" r="0.8" fill="#FFF" />

      {/* Eyebrows */}
      <path d="M70 74 Q73 72 76 74" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M84 74 Q87 72 90 74" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />

      {/* Gentle Smile */}
      <path d="M75 88 Q80 93 85 88" stroke="#D0705E" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <circle cx="69" cy="84" r="3" fill="#FCA5A5" opacity="0.4" />
      <circle cx="91" cy="84" r="3" fill="#FCA5A5" opacity="0.4" />
    </svg>
  );
};
