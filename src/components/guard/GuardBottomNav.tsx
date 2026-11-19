/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Clock, ArrowDownUp, BookOpen, ShieldAlert, QrCode } from 'lucide-react';

export type GuardBottomTab = 'home' | 'waiting' | 'inside' | 'directory' | 'alerts';

interface GuardBottomNavProps {
  activeTab: GuardBottomTab;
  onTabChange: (tab: GuardBottomTab) => void;
  waitingCount: number;
  insideCount: number;
  activeEmergenciesCount: number;
  onQrPress: () => void;
}

export const GuardBottomNav: React.FC<GuardBottomNavProps> = ({
  activeTab,
  onTabChange,
  waitingCount,
  insideCount,
  activeEmergenciesCount,
  onQrPress,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#000000] border-t border-slate-900 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] max-w-lg mx-auto w-full select-none pb-safe">
      <div className="grid grid-cols-5 h-16 sm:h-18 items-center px-1 sm:px-2 relative w-full">
        {/* Tab 1: Home / Gate */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer group ${
            activeTab === 'home' ? 'text-white font-bold' : 'text-[#9DA3AD] hover:text-white'
          }`}
          aria-label="Gate Home"
        >
          <Home className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-1 tracking-tight ${activeTab === 'home' ? 'text-white font-bold' : 'text-[#9DA3AD]'}`}>
            Gate
          </span>
          {activeTab === 'home' && (
            <span className="w-4 h-0.5 bg-[#673AB7] rounded-full mt-0.5" />
          )}
        </button>

        {/* Tab 2: Waiting */}
        <button
          type="button"
          onClick={() => onTabChange('waiting')}
          className={`flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer group ${
            activeTab === 'waiting' ? 'text-white font-bold' : 'text-[#9DA3AD] hover:text-white'
          }`}
          aria-label="Waiting Visitors"
        >
          <div className="relative">
            <Clock className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'waiting' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {waitingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-black animate-pulse">
                {waitingCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${activeTab === 'waiting' ? 'text-white font-bold' : 'text-[#9DA3AD]'}`}>
            Waiting
          </span>
          {activeTab === 'waiting' && (
            <span className="w-4 h-0.5 bg-[#673AB7] rounded-full mt-0.5" />
          )}
        </button>

        {/* Elevated Floating QR Scan Button in the Middle */}
        <div className="flex flex-col items-center justify-center relative -top-3.5 sm:-top-4 z-10">
          <button
            type="button"
            onClick={onQrPress}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#673AB7] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(103,58,183,0.55)] hover:bg-[#5E35B1] transition-transform active:scale-95 border-[3px] border-[#000000] cursor-pointer"
            aria-label="Scan Visitor QR"
          >
            <QrCode className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
          </button>
          <span className="text-[10px] font-bold text-slate-300 mt-0.5 tracking-tight leading-none">
            Scan QR
          </span>
        </div>

        {/* Tab 4: Inside */}
        <button
          type="button"
          onClick={() => onTabChange('inside')}
          className={`flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer group ${
            activeTab === 'inside' ? 'text-white font-bold' : 'text-[#9DA3AD] hover:text-white'
          }`}
          aria-label="Inside Visitors"
        >
          <div className="relative">
            <ArrowDownUp className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'inside' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {insideCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#673AB7] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-black">
                {insideCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${activeTab === 'inside' ? 'text-white font-bold' : 'text-[#9DA3AD]'}`}>
            In-Out
          </span>
          {activeTab === 'inside' && (
            <span className="w-4 h-0.5 bg-[#673AB7] rounded-full mt-0.5" />
          )}
        </button>

        {/* Tab 5: Alerts & More */}
        <button
          type="button"
          onClick={() => onTabChange('alerts')}
          className={`flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer group ${
            activeTab === 'alerts' ? 'text-white font-bold' : 'text-[#9DA3AD] hover:text-white'
          }`}
          aria-label="SOS Alerts & More"
        >
          <div className="relative">
            <ShieldAlert className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'alerts' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {activeEmergenciesCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#E53945] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-black animate-bounce">
                {activeEmergenciesCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${activeTab === 'alerts' ? 'text-white font-bold' : 'text-[#9DA3AD]'}`}>
            SOS & More
          </span>
          {activeTab === 'alerts' && (
            <span className="w-4 h-0.5 bg-[#673AB7] rounded-full mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
