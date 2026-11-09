/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building,
  Layers,
  Home,
  Users,
  HeartHandshake,
  ShieldCheck,
  DoorOpen,
  UserCheck,
  Ticket,
  Megaphone,
  Headset,
  CreditCard,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  Wrench,
  BarChart3,
  UserCog,
  Settings,
  ChevronRight,
  Building2,
  X,
  LogOut,
} from 'lucide-react';

export type SocietyAdminTab =
  | 'dashboard'
  | 'profile'
  | 'buildings'
  | 'flats'
  | 'residents'
  | 'household'
  | 'guards'
  | 'gates'
  | 'visitors'
  | 'pre-approvals'
  | 'notices'
  | 'helpdesk'
  | 'maintenance'
  | 'amenities'
  | 'emergency'
  | 'community'
  | 'service-partners'
  | 'reports'
  | 'staff'
  | 'settings';

interface SocietyAdminSidebarProps {
  currentTab: SocietyAdminTab;
  onSelectTab: (tab: SocietyAdminTab) => void;
  openComplaintsCount?: number;
  activeEmergencyAlertsCount?: number;
  societyName: string;
  societyCode: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const SocietyAdminSidebar: React.FC<SocietyAdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  openComplaintsCount = 0,
  activeEmergencyAlertsCount = 0,
  societyName,
  societyCode,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    onCloseMobile?.();
    await logout();
    navigate('/login');
  };

  const navSections: {
    category: string;
    items: {
      id: SocietyAdminTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
      badgeVariant?: 'warning' | 'danger';
    }[];
  }[] = [
    {
      category: 'Overview',
      items: [{ id: 'dashboard', label: 'Command Center', icon: LayoutDashboard }],
    },
    {
      category: 'Physical Structure',
      items: [
        { id: 'profile', label: 'Society Profile & Rules', icon: Building2 },
        { id: 'buildings', label: 'Towers, Blocks & Wings', icon: Layers },
        { id: 'flats', label: 'Flat Inventory & Units', icon: Home },
      ],
    },
    {
      category: 'People & Households',
      items: [
        { id: 'residents', label: 'Residents Roster', icon: Users },
        { id: 'household', label: 'Family, Vehicles & Helpers', icon: HeartHandshake },
        { id: 'staff', label: 'Management & Staff', icon: UserCog },
      ],
    },
    {
      category: 'Security & Access Gates',
      items: [
        { id: 'guards', label: 'Security Guard Sentinels', icon: ShieldCheck },
        { id: 'gates', label: 'Gate Checkpoints', icon: DoorOpen },
        { id: 'visitors', label: 'Live Visitor Ingress', icon: UserCheck },
        { id: 'pre-approvals', label: 'Visitor Pre-Approvals', icon: Ticket },
        {
          id: 'emergency',
          label: 'Emergency & SOS Alerts',
          icon: AlertTriangle,
          badge: activeEmergencyAlertsCount,
          badgeVariant: 'danger',
        },
      ],
    },
    {
      category: 'Community & Facilities',
      items: [
        { id: 'notices', label: 'Digital Notice Board', icon: Megaphone },
        {
          id: 'helpdesk',
          label: 'HelpDesk & Complaints',
          icon: Headset,
          badge: openComplaintsCount,
          badgeVariant: 'warning',
        },
        { id: 'amenities', label: 'Amenities & Bookings', icon: Sparkles },
        { id: 'community', label: 'Community Feed & Events', icon: MessageSquare },
        { id: 'service-partners', label: 'Service Partners', icon: Wrench },
      ],
    },
    {
      category: 'Finance & Administration',
      items: [
        { id: 'maintenance', label: 'Dues & Maintenance Invoices', icon: CreditCard },
        { id: 'reports', label: 'Reports & Exports', icon: BarChart3 },
        { id: 'settings', label: 'Society Settings', icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] select-none w-full">
      {/* Society Admin Identity Badge */}
      <div className="p-4 border-b border-[#E6F1F5] bg-[#F1F9FC]/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-[#111111] truncate">{societyName}</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-[#A9B0B8]">
              <span className="font-mono">{societyCode}</span>
              <span>•</span>
              <span className="text-[#673AB7] font-semibold">Society Admin</span>
            </div>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-[#E6F1F5] cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {navSections.map((sec) => (
          <div key={sec.category} className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold text-[#A9B0B8] uppercase tracking-wider">
              {sec.category}
            </div>
            {sec.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#673AB7] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F1F9FC] hover:text-[#673AB7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A9B0B8]'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          item.badgeVariant === 'danger'
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sign Out / Logout Option */}
      <div className="p-3 border-t border-[#E6F1F5] bg-white">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-red-500 group-hover:translate-x-0.5 transition-transform" />
            <span>Sign Out (लॉगआउट)</span>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#E6F1F5] bg-[#F1F9FC]/40 text-[10px] text-[#A9B0B8] flex items-center justify-between font-mono">
        <span>Gated Security Suite</span>
        <span className="text-emerald-600 font-semibold">Active Enclave</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[#FFFFFF] border-r border-[#E6F1F5] flex-col sticky top-0 h-screen select-none z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 bg-white">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
