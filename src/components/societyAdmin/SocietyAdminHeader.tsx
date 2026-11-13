/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Menu, AlertTriangle, ShieldCheck, LogOut, User } from 'lucide-react';
import { SocietyAdminRole } from '../../types/societyAdmin';

interface SocietyAdminHeaderProps {
  title: string;
  subtitle: string;
  societyName: string;
  societyCode: string;
  activeEmergenciesCount?: number;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onToggleMobileMenu?: () => void;
  actionButton?: React.ReactNode;
  activeRole?: SocietyAdminRole;
  onRoleChange?: (role: SocietyAdminRole) => void;
}

export const SocietyAdminHeader: React.FC<SocietyAdminHeaderProps> = ({
  title,
  subtitle,
  societyCode,
  activeEmergenciesCount = 0,
  searchTerm,
  onSearchChange,
  onToggleMobileMenu,
  actionButton,
  activeRole = 'SOCIETY_ADMIN',
  onRoleChange,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-teal-100/80 px-4 sm:px-6 py-3.5 sticky top-0 z-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Mobile Toggle */}
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {title}
              </h1>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 font-mono shrink-0">
                {societyCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Search, Role Mode, Alerts & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {onRoleChange && (
            <div className="flex items-center gap-1.5 bg-teal-50/80 px-2.5 py-1.5 rounded-xl border border-teal-200/80">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline">
                Role:
              </span>
              <select
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as SocietyAdminRole)}
                className="bg-transparent text-xs font-bold text-teal-800 focus:outline-none cursor-pointer"
                aria-label="Current Role Mode"
              >
                <option value="SOCIETY_ADMIN">Society Owner / Admin</option>
                <option value="SOCIETY_MANAGER">Society Manager</option>
                <option value="SECURITY_SUPERVISOR">Security Supervisor</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="FACILITY_MANAGER">Facility Manager</option>
                <option value="HELPDESK_MANAGER">HelpDesk Manager</option>
                <option value="READ_ONLY_ADMIN">Auditor (Read-Only)</option>
              </select>
            </div>
          )}

          {onSearchChange && (
            <div className="relative flex-1 sm:w-52">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search society records..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none transition-colors"
              />
            </div>
          )}

          {activeEmergenciesCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 tabular-nums">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activeEmergenciesCount} SOS Active</span>
            </div>
          )}

          {actionButton}

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
                title={user?.displayName || 'Society Admin'}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                  {user?.displayName || 'Society Admin'}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">Owner Admin</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 transition-all text-xs font-bold cursor-pointer whitespace-nowrap"
              title="Sign Out / लॉगआउट करें"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
