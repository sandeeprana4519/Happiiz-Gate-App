import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Menu, AlertTriangle, ShieldCheck, UserCheck, LogOut, User } from 'lucide-react';
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
  societyName,
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
    <div className="bg-[#FFFFFF] border-b border-[#E6F1F5] px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Title & Mobile Toggle */}
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
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                {societyCode}
              </span>
            </div>
            <p className="text-xs text-[#A9B0B8] font-medium hidden sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Role Switcher, Search, Alerts & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Active Role Selector */}
          {onRoleChange && (
            <div className="flex items-center gap-1.5 bg-[#F1F9FC] px-2.5 py-1 rounded-xl border border-[#E6F1F5]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#673AB7]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden md:inline">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => onRoleChange(e.target.value as SocietyAdminRole)}
                className="bg-transparent text-xs font-bold text-[#673AB7] focus:outline-none cursor-pointer"
                aria-label="Current Role Mode"
              >
                <option value="SOCIETY_ADMIN">Super / Society Admin</option>
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
              <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search society records..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] placeholder-[#A9B0B8] focus:bg-[#FFFFFF] focus:border-[#673AB7] focus:outline-none transition-colors"
              />
            </div>
          )}

          {activeEmergenciesCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activeEmergenciesCount} SOS Active</span>
            </div>
          )}

          {actionButton}

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E6F1F5]">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl bg-[#673AB7]/10 text-[#673AB7] flex items-center justify-center font-bold text-xs"
                title={user?.displayName || 'Society Admin'}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-[#111111] leading-tight truncate max-w-[120px]">
                  {user?.displayName || 'Society Admin'}
                </p>
                <p className="text-[10px] text-[#A9B0B8] leading-tight">Admin</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all text-xs font-bold cursor-pointer"
              title="Sign Out / लॉगआउट करें"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

