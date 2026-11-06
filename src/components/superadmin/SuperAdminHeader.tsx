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
  ShieldAlert,
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
  activePlatformRole = 'SUPER_ADMIN',
  onPlatformRoleChange,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const { user, isFirebaseConfigured, logout } = useAuth();

  return (
    <div className="bg-[#FFFFFF] border-b border-[#E6F1F5] px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[#111111] cursor-pointer"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#111111] tracking-tight">
                {title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5] uppercase">
                Enterprise Root
              </span>
            </div>
            <p className="text-xs text-[#A9B0B8] font-medium hidden sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Search, Role Selector, Status & Profile Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Active Platform Role Simulator Switcher */}
          {onPlatformRoleChange && (
            <div className="flex items-center gap-1.5 bg-[#F1F9FC] px-2.5 py-1.5 rounded-xl border border-[#E6F1F5]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#673AB7]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Role:</span>
              <select
                value={activePlatformRole}
                onChange={(e) => onPlatformRoleChange(e.target.value as PlatformRole)}
                className="bg-transparent text-xs font-bold text-[#673AB7] focus:outline-none cursor-pointer"
                aria-label="Platform Role Scope"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
                <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT</option>
                <option value="PLATFORM_FINANCE">PLATFORM_FINANCE</option>
                <option value="PLATFORM_OPERATIONS">PLATFORM_OPERATIONS</option>
                <option value="PLATFORM_READ_ONLY">PLATFORM_READ_ONLY</option>
              </select>
            </div>
          )}

          {onSearchChange && (
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Global search..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] placeholder-[#A9B0B8] focus:bg-[#FFFFFF] focus:border-[#673AB7] focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* System Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[11px] font-semibold text-[#111111]">
            <Database
              className={`w-3.5 h-3.5 ${
                isFirebaseConfigured ? 'text-emerald-500' : 'text-[#673AB7]'
              }`}
            />
            <span>{isFirebaseConfigured ? 'Live Cloud DB' : 'Preview Sandbox'}</span>
          </div>

          {/* Notifications Button */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-gray-700 transition"
              title="Global Announcements"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Action Button (e.g. Refresh) */}
          {actionButton}

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#E6F1F5]">
            <div className="w-8 h-8 rounded-xl bg-[#673AB7]/10 text-[#673AB7] flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="p-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 transition"
              title="Sign Out of Super Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
