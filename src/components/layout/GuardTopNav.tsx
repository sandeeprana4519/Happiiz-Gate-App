/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, ArrowDownUp, Mail, CheckCircle2 } from 'lucide-react';

export type GuardNavTab = 'home' | 'preapproved' | 'inout' | 'message';

interface GuardTopNavProps {
  activeTab: GuardNavTab;
  onTabChange: (tab: GuardNavTab) => void;
  preApprovedCount?: number;
  inOutCount?: number;
  unreadMessagesCount?: number;
}

export const GuardTopNav: React.FC<GuardTopNavProps> = ({
  activeTab,
  onTabChange,
  preApprovedCount = 0,
  inOutCount = 0,
  unreadMessagesCount = 0,
}) => {
  const navItems: { id: GuardNavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'preapproved', label: 'Pre-App', icon: CheckCircle2, badge: preApprovedCount },
    { id: 'inout', label: 'In-Out', icon: ArrowDownUp, badge: inOutCount },
    { id: 'message', label: 'Message', icon: Mail, badge: unreadMessagesCount },
  ];

  return (
    <nav className="bg-[#000000] text-white pt-1 pb-2 px-2 sm:px-4 select-none w-full shrink-0 overflow-hidden border-b border-white/5">
      <div className="grid grid-cols-4 max-w-md mx-auto text-center w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
              className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative group ${
                isActive ? 'text-white' : 'text-[#9DA3AD] hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && item.badge > 0 && !isActive && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-1 rounded-full bg-[#673AB7] text-white text-[8px] font-bold flex items-center justify-center border border-black">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium mt-1 leading-tight ${isActive ? 'text-white font-bold' : 'text-[#9DA3AD]'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-5 h-0.5 bg-white rounded-full mt-1 transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
