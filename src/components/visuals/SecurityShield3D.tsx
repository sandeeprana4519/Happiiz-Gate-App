/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const SecurityShield3D: React.FC<{ size?: number; className?: string }> = ({
  size = 64,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg" fill="none">
        <defs>
          <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <filter id="shieldGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Outer Hexagon Halo */}
        <polygon points="50,4 90,26 90,74 50,96 10,74 10,26" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
        
        {/* 3D Curved Shield Body */}
        <path
          d="M 50 14 L 82 27 C 82 58 50 82 50 86 C 50 82 18 58 18 27 Z"
          fill="url(#shieldBg)"
          stroke="url(#shieldBorder)"
          strokeWidth="2.5"
          filter="url(#shieldGlow)"
        />

        {/* Inner Tech Crest */}
        <path
          d="M 50 24 L 74 34 C 74 56 50 72 50 75 C 50 72 26 56 26 34 Z"
          fill="#0A192F"
          fillOpacity="0.8"
        />

        {/* Checkmark Lock Icon */}
        <path
          d="M 40 48 L 47 55 L 61 40"
          stroke="#38BDF8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
