/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../config/constants';
import { UserRole } from '../../types/auth';
import { ChevronDown, Shield, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleBadge: React.FC = () => {
  const { user, currentRole, switchRole, isDevMode } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  if (!user || !currentRole) return null;

  const roleConfig = USER_ROLES[currentRole];

  const handleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setDropdownOpen(false);
    navigate(USER_ROLES[newRole].defaultPath);
  };

  return (
    <div className="relative">
      <button
        onClick={() => isDevMode && setDropdownOpen((v) => !v)}
        title={isDevMode ? 'Click to switch preview role (Development Mode)' : undefined}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
          roleConfig?.badgeColor || 'bg-slate-800 text-slate-200 border-slate-700'
        } ${isDevMode ? 'hover:brightness-110 cursor-pointer' : 'cursor-default'}`}
      >
        <Shield className="w-3.5 h-3.5" />
        <span className="whitespace-nowrap">{roleConfig?.label}</span>
        {isDevMode && <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />}
      </button>

      {/* Dev Mode Role Switcher Modal Dropdown */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 text-xs">
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-medium">
              Switch Role Preview (Dev Mode)
            </div>
            <div className="py-1 space-y-0.5">
              {(Object.keys(USER_ROLES) as UserRole[]).map((rKey) => {
                const conf = USER_ROLES[rKey];
                const active = rKey === currentRole;
                return (
                  <button
                    key={rKey}
                    onClick={() => handleSwitch(rKey)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{conf.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal line-clamp-1">
                        {conf.description}
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
