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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6F1F5] shadow-lg max-w-lg mx-auto safe-area-pb">
      <div className="grid grid-cols-5 h-16 items-center px-2 relative">
        {/* Tab 1: Home */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'home' ? 'text-[#673AB7] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Gate</span>
        </button>

        {/* Tab 2: Waiting */}
        <button
          onClick={() => onTabChange('waiting')}
          className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
            activeTab === 'waiting' ? 'text-[#673AB7] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {waitingCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center animate-pulse">
                {waitingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Waiting</span>
        </button>

        {/* Elevated Floating QR Scan Button in the Middle */}
        <div className="flex flex-col items-center justify-center relative -top-3">
          <button
            onClick={onQrPress}
            className="w-12 h-12 rounded-full bg-[#673AB7] text-white flex items-center justify-center shadow-lg hover:bg-[#5E35B1] transition-transform active:scale-95 border-2 border-white"
            aria-label="Scan Visitor QR"
          >
            <QrCode className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-semibold text-gray-600 mt-0.5">Scan QR</span>
        </div>

        {/* Tab 4: Inside */}
        <button
          onClick={() => onTabChange('inside')}
          className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
            activeTab === 'inside' ? 'text-[#673AB7] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <ArrowDownUp className="w-5 h-5" />
            {insideCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                {insideCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Inside</span>
        </button>

        {/* Tab 5: Alerts & More */}
        <button
          onClick={() => onTabChange('alerts')}
          className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
            activeTab === 'alerts' ? 'text-[#673AB7] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5" />
            {activeEmergenciesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center animate-bounce">
                {activeEmergenciesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">SOS & More</span>
        </button>
      </div>
    </nav>
  );
};
