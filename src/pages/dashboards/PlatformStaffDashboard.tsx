/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Briefcase,
  Store,
  Wrench,
  UserPlus,
  CreditCard,
  DollarSign,
  ShieldAlert,
  Headset,
  Bell,
  BookUser,
  Users,
  BarChart3,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  RefreshCw,
  Menu,
  X,
  KeyRound,
  ArrowRight,
  UsersRound,
} from 'lucide-react';
import { SocietiesSection } from '../../components/superadmin/SocietiesSection';
import { CompaniesSection } from '../../components/superadmin/CompaniesSection';
import { SubscriptionsSection } from '../../components/superadmin/SubscriptionsSection';
import { FinanceSection } from '../../components/superadmin/FinanceSection';
import { MarketplaceServicesSection } from '../../components/superadmin/MarketplaceServicesSection';
import { Partner360CrmSection } from '../../components/superadmin/Partner360CrmSection';
import { ServicePartnersSection } from '../../components/superadmin/ServicePartnersSection';
import { DirectorySection } from '../../components/superadmin/DirectorySection';
import { GlobalUsersSection } from '../../components/superadmin/GlobalUsersSection';
import { EmergencyMonitoringSection } from '../../components/superadmin/EmergencyMonitoringSection';
import { SupportTicketsSection } from '../../components/superadmin/SupportTicketsSection';
import { NotificationsSection } from '../../components/superadmin/NotificationsSection';
import { ReportsSection } from '../../components/superadmin/ReportsSection';
import { FeatureFlagsSection } from '../../components/superadmin/FeatureFlagsSection';
import { PLATFORM_STAFF_PERMISSIONS } from '../../components/superadmin/platformStaffPermissions';
import {
  getSuperAdminAnalytics,
  getAllSocieties,
  getSocietyAdmins,
  getAllResidents,
  getAllSecurityGuards,
  getAllServicePartners,
  getSubscriptionPlans,
  getSocietySubscriptions,
  getFinancialTransactions,
  getSupportTickets,
  getPlatformNotifications,
  getManagedCompanies,
  getGlobalUsers,
  getGlobalEmergencyIncidents,
  getFeatureFlags,
  getPlatformStaff,
} from '../../services/firebase/superadmin.service';
import { syncBus } from '../../services/firebase/sync.service';
import { Society } from '../../types/society';
import { ServicePartnerProfile } from '../../types/auth';
import {
  SubscriptionPlan,
  SocietySubscription,
  FinancialTransaction,
  SupportTicket,
  PlatformNotification,
  SuperAdminStats,
  ManagedCompany,
  GlobalUserRecord,
  GlobalEmergencyIncident,
  FeatureFlagItem,
  PlatformStaffMember,
} from '../../types/admin';

type StaffModuleId =
  | 'overview'
  | 'societies'
  | 'companies'
  | 'marketplace-services'
  | 'partners'
  | 'partner-kyc'
  | 'subscriptions'
  | 'finance'
  | 'emergency'
  | 'support'
  | 'directory'
  | 'notifications'
  | 'users'
  | 'reports'
  | 'feature-flags';

interface StaffModuleDef {
  id: StaffModuleId;
  label: string;
  group: string;
  description: string;
  requiredAnyPermissions: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const STAFF_MODULES: StaffModuleDef[] = [
  {
    id: 'societies',
    label: 'Societies',
    group: 'Ecosystem',
    description: 'View, create, approve, or manage tenant residential societies',
    requiredAnyPermissions: ['society.read', 'society.create', 'society.approve', 'society.suspend'],
    icon: Building2,
  },
  {
    id: 'companies',
    label: 'Companies & Campuses',
    group: 'Ecosystem',
    description: 'Inspect corporate campuses, factories, and commercial buildings',
    requiredAnyPermissions: ['society.read', 'society.create'],
    icon: Briefcase,
  },
  {
    id: 'marketplace-services',
    label: 'Service Catalog',
    group: 'Marketplace',
    description: 'Configure home service catalog items, base pricing & commissions',
    requiredAnyPermissions: ['marketplace.manage'],
    icon: Store,
  },
  {
    id: 'partners',
    label: 'Our Partners (360° CRM)',
    group: 'Marketplace',
    description: 'Manage partner performance, ratings & earnings statements',
    requiredAnyPermissions: ['partner.verify'],
    icon: Wrench,
  },
  {
    id: 'partner-kyc',
    label: 'Partner Onboarding & KYC',
    group: 'Marketplace',
    description: 'Verify new partner documents, police clearance & approval status',
    requiredAnyPermissions: ['partner.verify'],
    icon: UserPlus,
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    group: 'Billing',
    description: 'Manage tenant SaaS plans, trials & renewals',
    requiredAnyPermissions: ['subscription.manage'],
    icon: CreditCard,
  },
  {
    id: 'finance',
    label: 'Billing & Revenue',
    group: 'Billing',
    description: 'View payment transactions, revenue splits & refunds',
    requiredAnyPermissions: ['billing.read', 'billing.refund'],
    icon: DollarSign,
  },
  {
    id: 'emergency',
    label: 'Emergency Monitoring',
    group: 'Operations',
    description: 'Monitor live SOS emergency alerts across communities',
    requiredAnyPermissions: ['emergency.monitor'],
    icon: ShieldAlert,
  },
  {
    id: 'support',
    label: 'Support Tickets',
    group: 'Operations',
    description: 'Handle resident and admin support tickets & escalations',
    requiredAnyPermissions: ['support.manage'],
    icon: Headset,
  },
  {
    id: 'directory',
    label: 'Community Directory',
    group: 'Operations',
    description: 'View society admins, residents, and security guards directory',
    requiredAnyPermissions: ['support.manage', 'society.read'],
    icon: BookUser,
  },
  {
    id: 'notifications',
    label: 'Announcements',
    group: 'Operations',
    description: 'Publish and export platform & community announcements',
    requiredAnyPermissions: ['announcements.manage'],
    icon: Bell,
  },
  {
    id: 'users',
    label: 'Global Users',
    group: 'Operations',
    description: 'Inspect user accounts and enforce account suspensions',
    requiredAnyPermissions: ['user.suspend'],
    icon: Users,
  },
  {
    id: 'reports',
    label: 'Analytics & Reports',
    group: 'Intelligence',
    description: 'Filter and export day/month/year intelligence PDF reports',
    requiredAnyPermissions: ['reports.view'],
    icon: BarChart3,
  },
  {
    id: 'feature-flags',
    label: 'Feature Management',
    group: 'Control Bar',
    description: 'Manage enabled application modules and feature flags',
    requiredAnyPermissions: ['system.configure'],
    icon: Sliders,
  },
];

export const PlatformStaffDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<StaffModuleId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [staffRecord, setStaffRecord] = useState<PlatformStaffMember | null>(null);
  const [stats, setStats] = useState<SuperAdminStats>({
    totalSocieties: 0,
    activeSocieties: 0,
    pendingSocieties: 0,
    suspendedSocieties: 0,
    totalCompanies: 0,
    totalBuildings: 0,
    totalFlats: 0,
    totalResidents: 0,
    totalSecurityGuards: 0,
    totalSocietyAdmins: 0,
    totalServicePartners: 0,
    pendingServicePartners: 0,
    totalPlatformUsers: 0,
    visitorsToday: 0,
    totalServiceBookings: 0,
    activeEmergencyAlerts: 0,
    mrr: 0,
    arr: 0,
    totalSubscriptionRevenue: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
    expiredSubscriptions: 0,
    trialSubscriptions: 0,
    pendingPaymentsCount: 0,
    failedPaymentsCount: 0,
    outstandingInvoicesAmount: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    pendingSupportTickets: 0,
    growthChartData: [],
  });
  const [societies, setSocieties] = useState<Society[]>([]);
  const [companies, setCompanies] = useState<ManagedCompany[]>([]);
  const [societyAdmins, setSocietyAdmins] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [partners, setPartners] = useState<ServicePartnerProfile[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [societySubs, setSocietySubs] = useState<SocietySubscription[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [globalUsers, setGlobalUsers] = useState<GlobalUserRecord[]>([]);
  const [emergencyIncidents, setEmergencyIncidents] = useState<GlobalEmergencyIncident[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        staffList,
        analyticsData,
        socList,
        cmpList,
        adminsList,
        resList,
        guardList,
        partnerList,
        planList,
        subList,
        txList,
        tktList,
        notifList,
        userList,
        emgList,
        flagsList,
      ] = await Promise.all([
        getPlatformStaff(),
        getSuperAdminAnalytics(),
        getAllSocieties(),
        getManagedCompanies(),
        getSocietyAdmins(),
        getAllResidents(),
        getAllSecurityGuards(),
        getAllServicePartners(),
        getSubscriptionPlans(),
        getSocietySubscriptions(),
        getFinancialTransactions(),
        getSupportTickets(),
        getPlatformNotifications(),
        getGlobalUsers(),
        getGlobalEmergencyIncidents(),
        getFeatureFlags(),
      ]);

      const matchedStaff = staffList.find(
        (s) =>
          (user?.platformStaffId && s.id === user.platformStaffId) ||
          (user?.uid && s.uid === user.uid) ||
          (user?.email && s.email.toLowerCase() === user.email.toLowerCase())
      );

      setStaffRecord(matchedStaff || null);
      setStats(analyticsData);
      setSocieties(socList);
      setCompanies(cmpList);
      setSocietyAdmins(adminsList);
      setResidents(resList);
      setGuards(guardList);
      setPartners(partnerList);
      setPlans(planList);
      setSocietySubs(subList);
      setTransactions(txList);
      setTickets(tktList);
      setNotifications(notifList);
      setGlobalUsers(userList);
      setEmergencyIncidents(emgList);
      setFeatureFlags(flagsList);
    } catch (err) {
      console.warn('[PlatformStaffPortal] Notice loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.platformStaffId, user?.uid]);

  useEffect(() => {
    loadAllData();
    const unsubscribeSync = syncBus.subscribeAll(() => {
      loadAllData();
    });
    return () => {
      unsubscribeSync();
    };
  }, [loadAllData]);

  // Live resolved staff identity & granted permissions
  const effectivePermissions = useMemo(() => {
    if (staffRecord) return staffRecord.permissions || [];
    return user?.platformPermissions || [];
  }, [staffRecord, user?.platformPermissions]);

  const effectiveRoleLabel = staffRecord?.role || user?.platformRole || 'PLATFORM_OPERATIONS';
  const effectiveDepartment = staffRecord?.department || user?.platformDepartment || 'Operations';
  const effectiveName = staffRecord?.fullName || user?.fullName || 'Platform Staff';
  const effectiveEmail = staffRecord?.email || user?.email || '';
  const isStaffDeactivated = staffRecord ? staffRecord.status === 'INACTIVE' : false;
  const hasWildcard = effectivePermissions.includes('*');

  const hasPermission = useCallback(
    (key: string) => hasWildcard || effectivePermissions.includes(key),
    [effectivePermissions, hasWildcard]
  );

  const authorizedModules = useMemo(() => {
    if (isStaffDeactivated) return [];
    return STAFF_MODULES.filter((mod) =>
      hasWildcard || mod.requiredAnyPermissions.some((perm) => effectivePermissions.includes(perm))
    );
  }, [effectivePermissions, hasWildcard, isStaffDeactivated]);

  // Ensure activeTab remains valid if Super Admin revokes a permission live
  useEffect(() => {
    if (activeTab === 'overview') return;
    const stillAllowed = authorizedModules.some((m) => m.id === activeTab);
    if (!stillAllowed) {
      setActiveTab('overview');
    }
  }, [activeTab, authorizedModules]);

  const grantedPermissionDefs = useMemo(
    () => PLATFORM_STAFF_PERMISSIONS.filter((p) => hasPermission(p.key)),
    [hasPermission]
  );
  const restrictedPermissionDefs = useMemo(
    () => PLATFORM_STAFF_PERMISSIONS.filter((p) => !hasPermission(p.key)),
    [hasPermission]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const activeModuleMeta = STAFF_MODULES.find((m) => m.id === activeTab);

  const renderSidebarContent = () => (
    <aside className="w-64 xl:w-72 shrink-0 bg-white border-r border-[#E6F1F5] flex flex-col h-full min-h-0 select-none">
      {/* Staff Identity Header */}
      <div className="p-4 border-b border-[#E6F1F5] bg-[#F1F9FC]/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
            {effectiveName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-[#111111] truncate">{effectiveName}</span>
            </div>
            <p className="text-[11px] font-bold text-[#673AB7] truncate">
              {effectiveDepartment} • {effectiveRoleLabel}
            </p>
            <p className="text-[10px] text-[#64748B] truncate font-mono">{effectiveEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => {
            setActiveTab('overview');
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#673AB7] text-white shadow-xs'
              : 'text-[#111111] hover:bg-[#F1F9FC] hover:text-[#673AB7]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>My Role & Permissions</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-[#673AB7]/10 text-[#673AB7]'
            }`}
          >
            {grantedPermissionDefs.length}
          </span>
        </button>

        <div className="pt-2 pb-1 px-2 text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
          Authorized Modules ({authorizedModules.length})
        </div>

        {authorizedModules.length === 0 ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            No modules assigned yet. Contact Super Admin to enable permissions.
          </div>
        ) : (
          authorizedModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveTab(mod.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#673AB7] text-white shadow-xs'
                    : 'text-[#111111] hover:bg-[#F1F9FC] hover:text-[#673AB7]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                  <span className="truncate">{mod.label}</span>
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {mod.group}
                </span>
              </button>
            );
          })
        )}
      </nav>

      {/* Bottom Portal Badge + Logout */}
      <div className="p-3 border-t border-[#E6F1F5] bg-[#F1F9FC]/40 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-[#64748B]">
          <span className="font-mono">Staff Portal</span>
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              isStaffDeactivated ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStaffDeactivated ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
            {isStaffDeactivated ? 'Inactive' : 'Active'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FFFFFF] text-gray-900 font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">{renderSidebarContent()}</div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-xs">
          <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col min-h-0">
            <div className="p-3 border-b border-[#E6F1F5] flex items-center justify-between shrink-0">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#64748B] pl-1">
                Staff Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#A9B0B8] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{renderSidebarContent()}</div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Portal Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[#E6F1F5] bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E6F1F5] text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              aria-label="Open staff navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-[#111111] truncate">
                  {activeTab === 'overview'
                    ? 'Platform Staff Operations Portal'
                    : activeModuleMeta?.label || 'Workspace'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#673AB7]/10 text-[#673AB7] border border-[#673AB7]/20">
                  {effectiveRoleLabel}
                </span>
              </div>
              <p className="text-xs text-[#64748B] truncate">
                {activeTab === 'overview'
                  ? `Signed in as ${effectiveName} (${effectiveDepartment}) • Scoped strictly to Super Admin granted permissions`
                  : activeModuleMeta?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadAllData}
              disabled={loading}
              className="p-2 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[#673AB7] cursor-pointer"
              title="Refresh Workspace Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6F1F5] hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-bold text-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Portal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FFFFFF] scrollbar-thin">
          {isStaffDeactivated ? (
            <div className="max-w-xl mx-auto mt-8 p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
              <Lock className="w-10 h-10 text-red-600 mx-auto" />
              <h2 className="text-base font-extrabold text-red-900">
                Staff Account Deactivated by Super Admin
              </h2>
              <p className="text-xs text-red-700 leading-relaxed">
                Your platform staff access has been temporarily deactivated. Please contact the Super
                Admin to reactivate your account and restore module permissions.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Role & Identity Summary */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#673AB7]/8 via-purple-50 to-[#F1F9FC] border border-[#673AB7]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#673AB7] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <UsersRound className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-extrabold text-[#111111]">
                            Welcome, {effectiveName}
                          </h2>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE STAFF SESSION
                          </span>
                        </div>
                        <p className="text-xs text-[#475569]">
                          Role: <strong className="text-[#673AB7]">{effectiveRoleLabel}</strong> •
                          Department: <strong>{effectiveDepartment}</strong> • Login ID:{' '}
                          <span className="font-mono font-semibold">{effectiveEmail}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="px-4 py-2.5 rounded-xl bg-white border border-[#E6F1F5] text-center">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase block">
                          Granted Permissions
                        </span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          {grantedPermissionDefs.length}
                        </span>
                      </div>
                      <div className="px-4 py-2.5 rounded-xl bg-white border border-[#E6F1F5] text-center">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase block">
                          Unlocked Modules
                        </span>
                        <span className="text-lg font-extrabold text-[#673AB7]">
                          {authorizedModules.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Launch Authorized Workspaces */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-[#111111]">
                      Your Authorized Workspace Modules
                    </h3>
                    {authorizedModules.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                        Super Admin has not assigned any operational modules to your account yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {authorizedModules.map((mod) => {
                          const Icon = mod.icon;
                          return (
                            <button
                              key={mod.id}
                              type="button"
                              onClick={() => setActiveTab(mod.id)}
                              className="p-4 rounded-2xl bg-white border border-[#E6F1F5] hover:border-[#673AB7] hover:shadow-sm text-left transition-all group cursor-pointer space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="w-9 h-9 rounded-xl bg-[#673AB7]/10 text-[#673AB7] flex items-center justify-center">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-[#673AB7]">
                                  {mod.group}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-[#111111] group-hover:text-[#673AB7] flex items-center justify-between">
                                  <span>{mod.label}</span>
                                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                </h4>
                                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
                                  {mod.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Granted vs Restricted Permissions Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-[#E6F1F5] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-2.5">
                        <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Granted Permissions ({grantedPermissionDefs.length})
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ALLOWED
                        </span>
                      </div>
                      <div className="space-y-2">
                        {grantedPermissionDefs.map((perm) => (
                          <div
                            key={perm.key}
                            className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 flex items-start gap-2.5 text-xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[#111111]">{perm.label}</p>
                              <p className="text-[11px] text-[#64748B]">{perm.description}</p>
                            </div>
                          </div>
                        ))}
                        {grantedPermissionDefs.length === 0 && (
                          <p className="text-xs text-[#64748B]">No active permissions granted.</p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-[#E6F1F5] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-2.5">
                        <h3 className="text-sm font-extrabold text-[#111111] flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-500" />
                          Restricted Permissions ({restrictedPermissionDefs.length})
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          SUPER ADMIN ONLY
                        </span>
                      </div>
                      <div className="space-y-2">
                        {restrictedPermissionDefs.map((perm) => (
                          <div
                            key={perm.key}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs opacity-75"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-700">{perm.label}</p>
                              <p className="text-[11px] text-slate-500">{perm.description}</p>
                            </div>
                          </div>
                        ))}
                        {restrictedPermissionDefs.length === 0 && (
                          <p className="text-xs text-emerald-700 font-semibold">
                            All listed operational permissions are currently granted.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'societies' && (
                <SocietiesSection societies={societies} onRefresh={loadAllData} />
              )}
              {activeTab === 'companies' && (
                <CompaniesSection companies={companies} onRefresh={loadAllData} />
              )}
              {activeTab === 'marketplace-services' && (
                <MarketplaceServicesSection onRefresh={loadAllData} partners={partners} />
              )}
              {activeTab === 'partners' && <Partner360CrmSection onRefresh={loadAllData} />}
              {activeTab === 'partner-kyc' && (
                <ServicePartnersSection
                  partners={partners}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'subscriptions' && (
                <SubscriptionsSection
                  plans={plans}
                  societySubscriptions={societySubs}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'finance' && (
                <FinanceSection
                  transactions={transactions}
                  monthlyRevenue={stats.monthlyRevenue}
                  yearlyRevenue={stats.yearlyRevenue}
                />
              )}
              {activeTab === 'emergency' && (
                <EmergencyMonitoringSection
                  incidents={emergencyIncidents}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'support' && (
                <SupportTicketsSection
                  tickets={tickets}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'directory' && (
                <DirectorySection
                  societyAdmins={societyAdmins}
                  residents={residents}
                  guards={guards}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'notifications' && (
                <NotificationsSection
                  notifications={notifications}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'users' && (
                <GlobalUsersSection
                  users={globalUsers}
                  societies={societies}
                  onRefresh={loadAllData}
                />
              )}
              {activeTab === 'reports' && (
                <ReportsSection
                  societies={societies}
                  transactions={transactions}
                  societySubs={societySubs}
                  partners={partners}
                  guards={guards}
                  residents={residents}
                  globalUsers={globalUsers}
                  tickets={tickets}
                />
              )}
              {activeTab === 'feature-flags' && (
                <FeatureFlagsSection flags={featureFlags} onRefresh={loadAllData} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
