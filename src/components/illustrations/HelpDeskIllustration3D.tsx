/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const HelpDeskIllustration3D: React.FC<{ className?: string; size?: number }> = ({
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
        <radialGradient id="helpSkin" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE0D1" />
          <stop offset="60%" stopColor="#F9C6B2" />
          <stop offset="100%" stopColor="#E9A894" />
        </radialGradient>
        <linearGradient id="helpShirt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="qMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      {/* Floating 3D Question Marks */}
      <g transform="translate(18, 25) rotate(-12)">
        <path
          d="M6 14 C6 8 16 6 16 14 C16 19 11 20 11 24"
          stroke="url(#qMarkGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="11" cy="30" r="2.2" fill="url(#qMarkGrad)" />
      </g>
      <g transform="translate(104, 22) rotate(14)">
        <path
          d="M6 14 C6 8 16 6 16 14 C16 19 11 20 11 24"
          stroke="url(#qMarkGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="11" cy="30" r="2.2" fill="url(#qMarkGrad)" />
      </g>

      {/* Orange Shirt Body */}
      <path
        d="M45 106 Q70 100 95 106 L100 140 Q70 140 40 140 Z"
        fill="url(#helpShirt)"
      />

      {/* Arm Raising Hand to Chin/Head */}
      <path
        d="M86 108 C96 100 104 88 98 76 C94 72 88 74 86 82 C84 90 84 98 82 108 Z"
        fill="url(#helpShirt)"
      />
      {/* Hand at chin / thinking */}
      <circle cx="94" cy="74" r="6" fill="url(#helpSkin)" />

      {/* Neck */}
      <rect x="64" y="90" width="12" height="18" rx="6" fill="#F0BCA7" />

      {/* Head */}
      <circle cx="70" cy="72" r="20" fill="url(#helpSkin)" />

      {/* Brown Hair & Beard */}
      <path
        d="M50 68 C50 50 60 46 70 46 C80 46 90 50 90 68 C86 60 80 58 70 58 C60 58 54 62 50 68 Z"
        fill="#5C3A21"
      />
      {/* Beard & Mustache */}
      <path
        d="M56 76 C56 90 84 90 84 76 C84 84 78 86 70 86 C62 86 56 84 56 76 Z"
        fill="#5C3A21"
      />
      <path d="M64 78 Q70 82 76 78" stroke="#3E2713" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Ears */}
      <circle cx="50" cy="74" r="3.5" fill="#F9C6B2" />
      <circle cx="90" cy="74" r="3.5" fill="#F9C6B2" />

      {/* Round Glasses */}
      <circle cx="63" cy="71" r="5.5" stroke="#374151" strokeWidth="1.6" fill="rgba(255,255,255,0.3)" />
      <circle cx="77" cy="71" r="5.5" stroke="#374151" strokeWidth="1.6" fill="rgba(255,255,255,0.3)" />
      <path d="M68.5 71 L71.5 71" stroke="#374151" strokeWidth="1.6" />

      {/* Eyes */}
      <circle cx="63" cy="71" r="1.8" fill="#111" />
      <circle cx="77" cy="71" r="1.8" fill="#111" />
    </svg>
  );
};
