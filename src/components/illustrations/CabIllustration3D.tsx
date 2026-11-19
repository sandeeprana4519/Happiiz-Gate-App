/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const CabIllustration3D: React.FC<{ className?: string; size?: number }> = ({
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
        <linearGradient id="cabYellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FACC15" />
          <stop offset="60%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="cabGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="cabBumper" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Modern 3D Front-Angle Yellow Cab */}
      <g transform="translate(10, 30)">
        {/* Shadow */}
        <ellipse cx="75" cy="116" rx="65" ry="10" fill="#0F172A" opacity="0.12" />

        {/* Roof & Cab Top Sign */}
        <g transform="translate(60, 22)">
          <rect x="0" y="0" width="28" height="10" rx="3" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" />
          <rect x="3" y="2.5" width="22" height="5" rx="1.5" fill="#F59E0B" />
          <text x="6" y="6.8" fontSize="4.5" fontWeight="900" fill="#000" fontFamily="sans-serif">TAXI</text>
        </g>

        {/* Cabin / Windshield Pillar */}
        <path
          d="M36 68 L50 36 L98 36 L114 68 Z"
          fill="url(#cabYellow)"
        />

        {/* Front Windshield Glass */}
        <path
          d="M42 66 L54 40 L94 40 L108 66 Z"
          fill="url(#cabGlass)"
        />
        {/* Windshield Reflection */}
        <path d="M50 42 L62 42 L48 64 L44 64 Z" fill="#FFFFFF" opacity="0.4" />

        {/* Car Hood & Front Body */}
        <path
          d="M22 84 L38 68 L112 68 L128 84 L126 102 L24 102 Z"
          fill="url(#cabYellow)"
        />
        {/* Hood Highlights */}
        <path d="M46 70 L104 70 L110 82 L40 82 Z" fill="#FDE047" opacity="0.5" />

        {/* Headlights */}
        {/* Left Headlight */}
        <rect x="25" y="85" width="16" height="8" rx="2" fill="#FEF08A" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="33" cy="89" r="2.5" fill="#FFFFFF" />
        {/* Right Headlight */}
        <rect x="109" y="85" width="16" height="8" rx="2" fill="#FEF08A" stroke="#E2E8F0" strokeWidth="1" />
        <circle cx="117" cy="89" r="2.5" fill="#FFFFFF" />

        {/* Front Radiator Grille */}
        <rect x="46" y="85" width="58" height="12" rx="3" fill="#1E293B" />
        <line x1="50" y1="89" x2="100" y2="89" stroke="#475569" strokeWidth="1.2" />
        <line x1="50" y1="93" x2="100" y2="93" stroke="#475569" strokeWidth="1.2" />

        {/* Front Bumper & Number Plate */}
        <path
          d="M18 100 L132 100 L128 110 L22 110 Z"
          fill="url(#cabBumper)"
        />
        {/* License Plate */}
        <rect x="62" y="99" width="26" height="8" rx="1.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="0.8" />
        <text x="66" y="105.5" fontSize="4.5" fontWeight="bold" fill="#000" fontFamily="monospace">MH 02 TAXI</text>

        {/* Wheels Peeking */}
        <ellipse cx="28" cy="112" rx="9" ry="5" fill="#0F172A" />
        <ellipse cx="122" cy="112" rx="9" ry="5" fill="#0F172A" />
      </g>
    </svg>
  );
};
