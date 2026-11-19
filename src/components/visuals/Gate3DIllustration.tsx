/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface Gate3DIllustrationProps {
  className?: string;
  interactive?: boolean;
}

export const Gate3DIllustration: React.FC<Gate3DIllustrationProps> = ({
  className = 'w-full max-w-lg mx-auto',
}) => {
  return (
    <div className={`relative select-none ${className}`}>
      {/* Background Soft Glow Orbs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />

      {/* 3D Isometric Smart Gate Vector Canvas */}
      <svg
        viewBox="0 0 600 420"
        className="w-full h-auto drop-shadow-[0_20px_35px_rgba(2,12,27,0.45)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gateArchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#0F284E" />
            <stop offset="100%" stopColor="#0A192F" />
          </linearGradient>
          <linearGradient id="neonBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="glassShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.08)" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Isometric Ground Base & Roadway */}
        <polygon points="300,100 560,230 300,380 40,250" fill="url(#roadGrad)" stroke="#1E293B" strokeWidth="2" />
        
        {/* Subtle Speed Lane Markings */}
        <line x1="300" y1="180" x2="300" y2="340" stroke="#38BDF8" strokeOpacity="0.25" strokeDasharray="16 12" strokeWidth="3" />

        {/* High-Rise Society Towers in Isometric Distance */}
        <polygon points="120,130 180,100 180,210 120,240" fill="#0A192F" stroke="#1E3A8A" strokeWidth="1.5" />
        <polygon points="180,100 240,130 240,240 180,210" fill="#0F284E" stroke="#1E3A8A" strokeWidth="1.5" />
        <polygon points="120,130 180,100 240,130 180,160" fill="#172554" />
        {/* Glowing Tower Windows */}
        <line x1="140" y1="145" x2="165" y2="132" stroke="#38BDF8" strokeOpacity="0.6" strokeWidth="2" />
        <line x1="140" y1="165" x2="165" y2="152" stroke="#38BDF8" strokeOpacity="0.6" strokeWidth="2" />
        <line x1="140" y1="185" x2="165" y2="172" stroke="#38BDF8" strokeOpacity="0.6" strokeWidth="2" />
        <line x1="195" y1="135" x2="225" y2="150" stroke="#60A5FA" strokeOpacity="0.7" strokeWidth="2" />
        <line x1="195" y1="155" x2="225" y2="170" stroke="#60A5FA" strokeOpacity="0.7" strokeWidth="2" />
        <line x1="195" y1="175" x2="225" y2="190" stroke="#60A5FA" strokeOpacity="0.7" strokeWidth="2" />

        {/* Left Security Pylon / Column */}
        <polygon points="190,170 230,150 230,290 190,310" fill="url(#gateArchGrad)" stroke="#38BDF8" strokeWidth="2" />
        <polygon points="230,150 250,160 250,300 230,290" fill="#0A192F" stroke="#1D4ED8" strokeWidth="1.5" />
        <polygon points="190,170 230,150 250,160 210,180" fill="#2563EB" />
        
        {/* Right Security Pylon / Column */}
        <polygon points="370,260 410,240 410,380 370,400" fill="url(#gateArchGrad)" stroke="#38BDF8" strokeWidth="2" />
        <polygon points="410,240 430,250 430,390 410,380" fill="#0A192F" stroke="#1D4ED8" strokeWidth="1.5" />
        <polygon points="370,260 410,240 430,250 390,270" fill="#2563EB" />

        {/* Modern Overhead Gantry Canopy */}
        <polygon points="180,160 360,250 390,235 210,145" fill="url(#glassShieldGrad)" stroke="#38BDF8" strokeWidth="2.5" />
        <polygon points="180,160 180,175 360,265 360,250" fill="#1D4ED8" />

        {/* Automated Smart Barrier Boom (Holographic Laser Beam) */}
        <line x1="240" y1="275" x2="380" y2="345" stroke="#38BDF8" strokeWidth="8" strokeLinecap="round" filter="url(#vectorGlow)" />
        <line x1="240" y1="275" x2="380" y2="345" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />

        {/* Interactive Biometric Kiosk Totem */}
        <rect x="255" y="240" width="22" height="50" rx="4" fill="#0A192F" stroke="#38BDF8" strokeWidth="1.5" />
        <rect x="259" y="246" width="14" height="20" rx="2" fill="#1E3A8A" />
        <circle cx="266" cy="256" r="4" fill="#38BDF8" filter="url(#vectorGlow)" />
        <line x1="259" y1="275" x2="273" y2="275" stroke="#60A5FA" strokeWidth="2" />

        {/* Verified Access Icon Badge Hovering Above Barrier */}
        <g transform="translate(290, 215)">
          <circle cx="20" cy="20" r="22" fill="#0A192F" stroke="#38BDF8" strokeWidth="2.5" filter="url(#vectorGlow)" />
          <path d="M 12 20 L 17 25 L 28 14" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Text Kicker inside SVG */}
        <text x="300" y="415" textAnchor="middle" fill="#64748B" fontSize="12" fontWeight="600" letterSpacing="2">
          HAPPIIZ SMART GATE SENTINEL · ISOMETRIC ARCHITECTURE
        </text>
      </svg>
    </div>
  );
};
