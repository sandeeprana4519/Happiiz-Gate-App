/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const DeliveryIllustration3D: React.FC<{ className?: string; size?: number }> = ({
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
        <radialGradient id="delivSkin" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE0D1" />
          <stop offset="60%" stopColor="#F9C6B2" />
          <stop offset="100%" stopColor="#E9A894" />
        </radialGradient>
        <linearGradient id="delivRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="60%" stopColor="#E53945" />
          <stop offset="100%" stopColor="#C62835" />
        </linearGradient>
        <linearGradient id="delivCap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5252" />
          <stop offset="100%" stopColor="#B71C1C" />
        </linearGradient>
      </defs>

      {/* Red Polo Shirt Body */}
      <path
        d="M50 116 Q80 110 110 116 L116 160 Q80 160 44 160 Z"
        fill="url(#delivRed)"
      />

      {/* Left Arm holding Smartphone */}
      <path
        d="M52 116 C42 124 38 136 44 146 C48 150 56 148 60 140 C62 134 56 126 54 116 Z"
        fill="url(#delivRed)"
      />
      {/* Smartphone */}
      <rect x="52" y="132" width="14" height="22" rx="3" fill="#0EA5E9" stroke="#0284C7" strokeWidth="1" />
      <circle cx="59" cy="150" r="1.5" fill="#FFFFFF" opacity="0.8" />
      <rect x="55" y="135" width="8" height="12" rx="1" fill="#E0F2FE" />

      {/* Raised Right Arm Waving */}
      <path
        d="M106 117 C118 108 126 88 126 72 C122 70 117 72 114 78 C112 90 106 106 100 120 Z"
        fill="url(#delivRed)"
      />
      {/* Waving Hand */}
      <g transform="translate(116, 52)">
        <ellipse cx="10" cy="16" rx="9" ry="10" fill="url(#delivSkin)" />
        <path d="M4 18 Q0 16 2 12 Q5 12 7 15 Z" fill="url(#delivSkin)" />
        <rect x="5" y="4" width="3.5" height="11" rx="1.75" fill="url(#delivSkin)" />
        <rect x="9.5" y="2" width="3.5" height="13" rx="1.75" fill="url(#delivSkin)" />
        <rect x="14" y="4" width="3.5" height="11" rx="1.75" fill="url(#delivSkin)" />
        <rect x="18" y="7" width="3" height="8" rx="1.5" fill="url(#delivSkin)" />
      </g>

      {/* Neck */}
      <rect x="74" y="98" width="12" height="18" rx="6" fill="#F0BCA7" />

      {/* Head */}
      <circle cx="80" cy="80" r="21" fill="url(#delivSkin)" />

      {/* Ears */}
      <circle cx="59" cy="82" r="4.5" fill="#F9C6B2" />
      <circle cx="101" cy="82" r="4.5" fill="#F9C6B2" />

      {/* Delivery Cap */}
      <path
        d="M58 75 C58 58 68 52 80 52 C92 52 102 58 102 75 Z"
        fill="url(#delivCap)"
      />
      {/* Cap Visor / Brim */}
      <path
        d="M56 74 Q80 70 106 74 Q80 80 56 74 Z"
        fill="#A61515"
      />

      {/* Modern Round Glasses */}
      <circle cx="72" cy="80" r="6" stroke="#4B5563" strokeWidth="1.8" fill="rgba(255,255,255,0.2)" />
      <circle cx="88" cy="80" r="6" stroke="#4B5563" strokeWidth="1.8" fill="rgba(255,255,255,0.2)" />
      <path d="M78 80 L82 80" stroke="#4B5563" strokeWidth="1.8" />

      {/* Eyes behind glasses */}
      <circle cx="72" cy="80" r="2" fill="#1F2937" />
      <circle cx="88" cy="80" r="2" fill="#1F2937" />

      {/* Big Friendly Smile */}
      <path d="M75 90 Q80 95 85 90" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="67" cy="85" r="3" fill="#FCA5A5" opacity="0.4" />
      <circle cx="93" cy="85" r="3" fill="#FCA5A5" opacity="0.4" />
    </svg>
  );
};
