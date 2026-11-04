/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const NoticeBoardIllustration3D: React.FC<{ className?: string; size?: number }> = ({
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
        <radialGradient id="hornGlow" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="60%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#581C87" />
        </radialGradient>
        <linearGradient id="hornCone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
        <linearGradient id="hornRim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      {/* 3D Purple Megaphone */}
      <g transform="translate(18, 22) rotate(-16)">
        {/* Megaphone Handle */}
        <path
          d="M32 62 L26 84 C25 87 29 90 33 88 L39 68 Z"
          fill="#581C87"
        />

        {/* Back Cap */}
        <ellipse cx="28" cy="54" rx="8" ry="14" fill="#3B0764" />

        {/* Megaphone Body Cone */}
        <path
          d="M28 40 L82 18 L82 90 L28 68 Z"
          fill="url(#hornCone)"
        />
        {/* Specular Light streak */}
        <path
          d="M32 44 L78 26 L78 36 L32 50 Z"
          fill="#FFFFFF"
          opacity="0.3"
        />

        {/* Front Bell Rim */}
        <ellipse cx="82" cy="54" rx="10" ry="36" fill="url(#hornRim)" stroke="#F3E8FF" strokeWidth="1.5" />
        <ellipse cx="82" cy="54" rx="7" ry="32" fill="#581C87" />

        {/* Sound Waves */}
        <g stroke="#818CF8" strokeWidth="3.5" strokeLinecap="round" opacity="0.85">
          <path d="M102 38 Q110 54 102 70" />
          <path d="M112 30 Q124 54 112 78" />
        </g>
      </g>
    </svg>
  );
};
