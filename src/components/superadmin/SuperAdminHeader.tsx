/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Bell,
  Database,
  ShieldCheck,
  Menu,
  LogOut,
  User,
} from 'lucide-react';
import { PlatformRole } from '../../types/admin';

interface SuperAdminHeaderProps {
  title: string;
  subtitle: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onToggleMobileMenu?: () => void;
  actionButton?: React.ReactNode;
  activePlatformRole?: PlatformRole;
  onPlatformRoleChange?: (role: PlatformRole) => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  onToggleMobileMenu,
  actionButton,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const { user, isFirebaseConfigured, logout } = useAuth();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Mobile Menu Button */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 cursor-pointer shrink-0"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Search, Super Admin Identity, DB Status & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Static Super Admin Role Identity (No Dropdown) */}
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/80 text-xs font-bold text-indigo-700 whitespace-nowrap shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Super Admin</span>
          </div>

          {onSearchChange && (
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* System Status Indicator */}
          <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 whitespace-nowrap shrink-0">
            <Database
              className={`w-3.5 h-3.5 ${
                isFirebaseConfigured ? 'text-emerald-600' : 'text-indigo-600'
              }`}
            />
            <span>{isFirebaseConfigured ? 'Live Cloud DB' : 'Preview Sandbox'}</span>
          </div>

          {/* Notifications Button */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shrink-0"
              title="Global Announcements"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Action Button (e.g. Refresh) */}
          {actionButton}

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 shrink-0">
            <div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
              title={user?.email || 'Super Admin'}
            >
              <User className="w-4 h-4" />
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer whitespace-nowrap"
              title="Sign Out of Super Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
