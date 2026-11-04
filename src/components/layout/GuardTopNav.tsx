/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, ArrowDownUp, Mail } from 'lucide-react';

export type GuardNavTab = 'home' | 'inout' | 'message';

interface GuardTopNavProps {
  activeTab: GuardNavTab;
  onTabChange: (tab: GuardNavTab) => void;
  inOutCount?: number;
  unreadMessagesCount?: number;
}

export const GuardTopNav: React.FC<GuardTopNavProps> = ({
  activeTab,
  onTabChange,
  inOutCount = 12,
  unreadMessagesCount = 3,
}) => {
  const navItems: { id: GuardNavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'inout', label: 'In-Out', icon: ArrowDownUp, badge: inOutCount },
    { id: 'message', label: 'Message', icon: Mail, badge: unreadMessagesCount },
  ];

  return (
    <nav className="bg-[#000000] text-white pt-2 pb-8 px-6 select-none">
      <div className="grid grid-cols-3 max-w-sm mx-auto text-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
              className={`flex flex-col items-center justify-center py-2 transition-all cursor-pointer relative group ${
                isActive ? 'text-white' : 'text-[#9DA3AD] hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform group-hover:scale-105 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge !== undefined && item.badge > 0 && !isActive && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#673AB7] text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium mt-1.5 ${isActive ? 'text-white font-bold' : 'text-[#9DA3AD]'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-6 h-0.5 bg-white rounded-full mt-1.5 transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
