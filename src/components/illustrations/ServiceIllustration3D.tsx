/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const ServiceIllustration3D: React.FC<{ className?: string; size?: number }> = ({
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
        <radialGradient id="serviceSkin" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE0D1" />
          <stop offset="60%" stopColor="#F9C6B2" />
          <stop offset="100%" stopColor="#E9A894" />
        </radialGradient>
        <linearGradient id="yellowHelmet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="overallsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="wrenchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      {/* Blue Dungarees / Overalls & Orange Under-shirt */}
      <path
        d="M50 118 Q80 112 110 118 L116 160 Q80 160 44 160 Z"
        fill="url(#overallsGrad)"
      />
      {/* Orange t-shirt neck peeking */}
      <path d="M68 116 Q80 125 92 116 Z" fill="#FB923C" />

      {/* Raised Arm holding Wrench (Left of illustration) */}
      <path
        d="M56 120 C46 112 36 90 38 74 C43 73 47 75 49 82 C51 92 56 108 62 122 Z"
        fill="#FB923C"
      />
      {/* Hand holding wrench */}
      <circle cx="39" cy="74" r="7" fill="url(#serviceSkin)" />

      {/* 3D Metallic Wrench */}
      <g transform="translate(26, 42) rotate(-15)">
        <path
          d="M10 28 L10 52 L15 52 L15 28 Z"
          fill="url(#wrenchGrad)"
        />
        {/* Open wrench jaw top */}
        <path
          d="M6 14 C4 18 6 26 12 28 C19 26 21 18 19 14 C16 18 9 18 6 14 Z"
          fill="url(#wrenchGrad)"
          stroke="#64748B"
          strokeWidth="0.8"
        />
        {/* Ring wrench jaw bottom */}
        <circle cx="12.5" cy="56" r="5" fill="url(#wrenchGrad)" stroke="#64748B" strokeWidth="0.8" />
        <circle cx="12.5" cy="56" r="2.5" fill="#F1F9FC" />
      </g>

      {/* Other Arm (Resting) */}
      <path
        d="M104 120 C114 128 122 142 124 156 C118 158 112 155 108 147 C104 138 102 128 100 120 Z"
        fill="#FB923C"
      />

      {/* Neck */}
      <rect x="74" y="98" width="12" height="18" rx="6" fill="#F0BCA7" />

      {/* Head */}
      <circle cx="80" cy="80" r="21" fill="url(#serviceSkin)" />

      {/* Yellow Construction Hard Hat Helmet */}
      <path
        d="M56 74 C56 50 66 45 80 45 C94 45 104 50 104 74 Z"
        fill="url(#yellowHelmet)"
      />
      {/* Helmet Brim */}
      <path
        d="M52 74 Q80 70 108 74 Q80 80 52 74 Z"
        fill="#B45309"
      />
      {/* Helmet Ridge */}
      <path
        d="M78 45 L78 68"
        stroke="#FEF08A"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Ears */}
      <circle cx="59" cy="82" r="4" fill="#F9C6B2" />
      <circle cx="101" cy="82" r="4" fill="#F9C6B2" />

      {/* Eyes */}
      <circle cx="73" cy="79" r="2" fill="#1E293B" />
      <circle cx="87" cy="79" r="2" fill="#1E293B" />

      {/* Cheerful Smile */}
      <path d="M75 88 Q80 94 85 88" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="68" cy="84" r="3" fill="#FCA5A5" opacity="0.4" />
      <circle cx="92" cy="84" r="3" fill="#FCA5A5" opacity="0.4" />
    </svg>
  );
};
