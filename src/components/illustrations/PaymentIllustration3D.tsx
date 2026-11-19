/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const PaymentIllustration3D: React.FC<{ className?: string; size?: number }> = ({
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
        <radialGradient id="paySkin" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE0D1" />
          <stop offset="60%" stopColor="#F9C6B2" />
          <stop offset="100%" stopColor="#E9A894" />
        </radialGradient>
        <linearGradient id="cashTeal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="50%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* 3D Stack of Banknotes */}
      <g transform="translate(42, 38) rotate(-4)">
        {/* Bottom notes in stack */}
        <rect x="0" y="24" width="60" height="28" rx="4" fill="#0F766E" />
        <rect x="2" y="20" width="60" height="28" rx="4" fill="#14B8A6" />
        <rect x="4" y="16" width="60" height="28" rx="4" fill="#2DD4BF" />
        {/* Top Note */}
        <rect x="6" y="12" width="60" height="28" rx="4" fill="url(#cashTeal)" stroke="#5EEAD4" strokeWidth="1" />
        <circle cx="36" cy="26" r="6" fill="#CCFBF1" opacity="0.6" />
        <rect x="12" y="16" width="48" height="20" rx="2" fill="none" stroke="#CCFBF1" strokeWidth="0.8" opacity="0.5" />

        {/* Currency Band Wrapper */}
        <rect x="28" y="12" width="16" height="34" rx="2" fill="url(#bandGrad)" />
      </g>

      {/* 3D Palm & Forearm Holding the Stack */}
      <g transform="translate(14, 58)">
        {/* Forearm & Cuff */}
        <path
          d="M0 48 L22 36 L30 52 L6 62 Z"
          fill="#38BDF8"
        />
        {/* Wrist */}
        <path
          d="M20 38 L42 34 L48 50 L26 52 Z"
          fill="url(#paySkin)"
        />
        {/* Palm cupping the cash */}
        <path
          d="M40 34 C54 30 76 36 86 42 C82 52 64 54 48 50 Z"
          fill="url(#paySkin)"
        />
        {/* Thumb holding side */}
        <ellipse cx="48" cy="24" rx="6" ry="12" transform="rotate(25 48 24)" fill="url(#paySkin)" />
      </g>
    </svg>
  );
};
