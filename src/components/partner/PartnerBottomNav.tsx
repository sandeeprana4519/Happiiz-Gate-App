/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  Briefcase, 
  Calendar, 
  Wallet, 
  User 
} from 'lucide-react';

export type PartnerTab = 'home' | 'bookings' | 'calendar' | 'earnings' | 'profile';

interface PartnerBottomNavProps {
  activeTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
  newRequestsCount?: number;
}

export const PartnerBottomNav: React.FC<PartnerBottomNavProps> = ({
  activeTab,
  onTabChange,
  newRequestsCount = 0,
}) => {
  const tabs: { id: PartnerTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Briefcase, badge: newRequestsCount },
    { id: 'calendar', label: 'Schedule', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Service Partner Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#000000] border-t border-slate-900 shadow-[0_-4px_25px_rgba(0,0,0,0.6)] max-w-lg mx-auto w-full select-none pb-safe"
    >
      <div className="grid grid-cols-5 h-16 sm:h-18 items-center px-1 sm:px-2 relative w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer group active:scale-95 ${
                isActive ? 'text-white font-bold' : 'text-[#9DA3AD] hover:text-white'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'stroke-[2.5] text-white scale-110' : 'stroke-[1.8] text-[#9DA3AD]'
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#E53945] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-black animate-pulse shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight ${
                  isActive ? 'text-white font-bold' : 'text-[#9DA3AD]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-4 h-0.5 bg-[#673AB7] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
