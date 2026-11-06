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
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E6F1F5] shadow-lg max-w-lg mx-auto pb-safe select-none">
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer ${
                isActive ? 'text-[#673AB7] font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-black text-[#673AB7]' : 'font-medium text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
