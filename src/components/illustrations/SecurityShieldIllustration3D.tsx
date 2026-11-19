/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const SecurityShieldIllustration3D: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = '', size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none pointer-events-none drop-shadow-md ${className}`}
    >
      <defs>
        <linearGradient id="shieldCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7E57C2" />
          <stop offset="50%" stopColor="#673AB7" />
          <stop offset="100%" stopColor="#512DA8" />
        </linearGradient>
        <radialGradient id="shieldInnerGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Main Purple Circle */}
      <circle cx="32" cy="32" r="30" fill="url(#shieldCircleGrad)" stroke="#FFFFFF" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="28" fill="url(#shieldInnerGlow)" />

      {/* White Crisp Security Shield Icon */}
      <path
        d="M32 15 L44 20 C44 32 38 41 32 45 C26 41 20 32 20 20 Z"
        fill="#FFFFFF"
      />
      {/* Subtle Inner shield contour */}
      <path
        d="M32 18 L41 22 C41 31 36 38 32 41 C28 38 23 31 23 22 Z"
        fill="#673AB7"
        opacity="0.15"
      />
      {/* Checkmark or Keyhole center */}
      <path
        d="M28 29 L31 32 L37 25"
        stroke="#673AB7"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
