/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SuperAdminSidebar, SuperAdminTab } from '../../components/superadmin/SuperAdminSidebar';
import {
  findNavItemByPath,
  findNavItemByTab,
  normalizeSuperAdminTab,
} from '../../components/superadmin/sidebarNavConfig';
import { SuperAdminHeader } from '../../components/superadmin/SuperAdminHeader';
import { OverviewSection } from '../../components/superadmin/OverviewSection';
import { SocietiesSection } from '../../components/superadmin/SocietiesSection';
import { ApprovalsSection } from '../../components/superadmin/ApprovalsSection';
import { DirectorySection } from '../../components/superadmin/DirectorySection';
import { ServicePartnersSection } from '../../components/superadmin/ServicePartnersSection';
import { MarketplaceServicesSection } from '../../components/superadmin/MarketplaceServicesSection';
import { Partner360CrmSection } from '../../components/superadmin/Partner360CrmSection';
import { SubscriptionsSection } from '../../components/superadmin/SubscriptionsSection';
import { FinanceSection } from '../../components/superadmin/FinanceSection';
import { SupportTicketsSection } from '../../components/superadmin/SupportTicketsSection';
import { NotificationsSection } from '../../components/superadmin/NotificationsSection';
import { ReportsSection } from '../../components/superadmin/ReportsSection';
import { RolesPermissionsSection } from '../../components/superadmin/RolesPermissionsSection';
import { AuditLogsSection } from '../../components/superadmin/AuditLogsSection';
import { SettingsSection } from '../../components/superadmin/SettingsSection';
import { CompaniesSection } from '../../components/superadmin/CompaniesSection';
import { OnboardingSection } from '../../components/superadmin/OnboardingSection';
import { GlobalUsersSection } from '../../components/superadmin/GlobalUsersSection';
import { EmergencyMonitoringSection } from '../../components/superadmin/EmergencyMonitoringSection';
import { FeatureFlagsSection } from '../../components/superadmin/FeatureFlagsSection';
import { SystemHealthSection } from '../../components/superadmin/SystemHealthSection';
import { PlatformStaffSection } from '../../components/superadmin/PlatformStaffSection';
import {
  getSuperAdminAnalytics,
  getAllSocieties,
  getSocietyApplications,
  getSocietyAdmins,
  getAllResidents,
  getAllSecurityGuards,
  getAllServicePartners,
  getSubscriptionPlans,
  getSocietySubscriptions,
  getFinancialTransactions,
  getSupportTickets,
  getPlatformNotifications,
  getAuditLogs,
  getPlatformSettings,
  getManagedCompanies,
  getOnboardingCases,
  getGlobalUsers,
  getGlobalEmergencyIncidents,
  getFeatureFlags,
  getPlatformStaff,
} from '../../services/firebase/superadmin.service';
import { syncBus } from '../../services/firebase/sync.service';
import { Society } from '../../types/society';
import { AccessRequest, ServicePartnerProfile } from '../../types/auth';
import {
  SubscriptionPlan,
  SocietySubscription,
  FinancialTransaction,
  SupportTicket,
  PlatformNotification,
  AuditLog,
  PlatformSettings,
  SuperAdminStats,
  ManagedCompany,
  SocietyOnboardingCase,
  GlobalUserRecord,
  GlobalEmergencyIncident,
  FeatureFlagItem,
  PlatformStaffMember,
  PlatformRole,
} from '../../types/admin';
import {
  MOCK_PLATFORM_SETTINGS,
} from '../../services/mock/mockData';
import { X, RefreshCw, ChevronRight } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { user, isFirebaseConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Resolve initial tab from URL pathname (/admin/...) or ?tab= query param
  const resolveTabFromUrl = useCallback((): SuperAdminTab => {
    const matchedByPath = findNavItemByPath(location.pathname);
    if (matchedByPath) {
      if (
        location.pathname.replace(/\/+$/, '') === '/dashboard/super-admin' &&
        searchParams.get('tab')
      ) {
        return normalizeSuperAdminTab(searchParams.get('tab'));
      }
      return matchedByPath.id;
    }
    return normalizeSuperAdminTab(searchParams.get('tab'));
  }, [location.pathname, searchParams]);

  const [currentTab, setCurrentTab] = useState<SuperAdminTab>(() => resolveTabFromUrl());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentTab(resolveTabFromUrl());
  }, [resolveTabFromUrl]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [partnerSubTab, setPartnerSubTab] = useState<'CRM' | 'COMPLIANCE'>('CRM');

  // Data states
  const [stats, setStats] = useState<SuperAdminStats>({
    totalSocieties: 3,
    activeSocieties: 2,
    pendingSocieties: 1,
    suspendedSocieties: 0,
    totalCompanies: 4,
    totalBuildings: 18,
    totalFlats: 1420,
    totalResidents: 720,
    totalSecurityGuards: 16,
    totalSocietyAdmins: 6,
    totalServicePartners: 3,
    pendingServicePartners: 1,
    totalPlatformUsers: 2150,
    visitorsToday: 342,
    totalServiceBookings: 89,
    activeEmergencyAlerts: 0,
    mrr: 31395,
    arr: 376740,
    totalSubscriptionRevenue: 218500,
    activeSubscriptions: 2,
    expiringSubscriptions: 1,
    expiredSubscriptions: 0,
    trialSubscriptions: 1,
    pendingPaymentsCount: 2,
    failedPaymentsCount: 0,
    outstandingInvoicesAmount: 12400,
    monthlyRevenue: 31395,
    yearlyRevenue: 376740,
    pendingSupportTickets: 2,
    growthChartData: [],
  });
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyApps, setSocietyApps] = useState<AccessRequest[]>([]);
  const [societyAdmins, setSocietyAdmins] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [guards, setGuards] = useState<any[]>([]);
  const [partners, setPartners] = useState<ServicePartnerProfile[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [societySubs, setSocietySubs] = useState<SocietySubscription[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(MOCK_PLATFORM_SETTINGS);

  // Phase 10 new state
  const [companies, setCompanies] = useState<ManagedCompany[]>([]);
  const [onboardingCases, setOnboardingCases] = useState<SocietyOnboardingCase[]>([]);
  const [globalUsers, setGlobalUsers] = useState<GlobalUserRecord[]>([]);
  const [emergencyIncidents, setEmergencyIncidents] = useState<GlobalEmergencyIncident[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagItem[]>([]);
  const [platformStaff, setPlatformStaff] = useState<PlatformStaffMember[]>([]);
  const [activePlatformRole, setActivePlatformRole] = useState<PlatformRole>('SUPER_ADMIN');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        analyticsData,
        socList,
        apps,
        adminsList,
        resList,
        guardList,
        partnerList,
        planList,
        subList,
        txList,
        tktList,
        notifList,
        logList,
        settingsData,
        cmpList,
        onbList,
        userList,
        emgList,
        flagsList,
        staffList,
      ] = await Promise.all([
        getSuperAdminAnalytics(),
        getAllSocieties(),
        getSocietyApplications(),
        getSocietyAdmins(),
        getAllResidents(),
        getAllSecurityGuards(),
        getAllServicePartners(),
        getSubscriptionPlans(),
        getSocietySubscriptions(),
        getFinancialTransactions(),
        getSupportTickets(),
        getPlatformNotifications(),
        getAuditLogs(),
        getPlatformSettings(),
        getManagedCompanies(),
        getOnboardingCases(),
        getGlobalUsers(),
        getGlobalEmergencyIncidents(),
        getFeatureFlags(),
        getPlatformStaff(),
      ]);

      setStats(analyticsData);
      setSocieties(socList);
      setSocietyApps(apps);
      setSocietyAdmins(adminsList);
      setResidents(resList);
      setGuards(guardList);
      setPartners(partnerList);
      setPlans(planList);
      setSocietySubs(subList);
      setTransactions(txList);
      setTickets(tktList);
      setNotifications(notifList);
      setAuditLogs(logList);
      setPlatformSettings(settingsData);
      setCompanies(cmpList);
      setOnboardingCases(onbList);
      setGlobalUsers(userList);
      setEmergencyIncidents(emgList);
      setFeatureFlags(flagsList);
      setPlatformStaff(staffList);
    } catch (err) {
      console.warn('[SuperAdmin] Notice loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    const unsubscribeSync = syncBus.subscribeAll(() => {
      loadAllData();
    });
    return () => {
      unsubscribeSync();
    };
  }, [loadAllData]);

  const handleSelectTab = (tab: SuperAdminTab | string) => {
    const normalizedTab = normalizeSuperAdminTab(tab);
    setCurrentTab(normalizedTab);
    const navItem = findNavItemByTab(normalizedTab);
    if (navItem && location.pathname !== navItem.path) {
      navigate(navItem.path);
    }
    setMobileMenuOpen(false);
  };

  const getTabTitleAndSubtitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Master Control Command Center', subtitle: 'Global multi-tenant network telemetry & financial analytics' };
      case 'societies':
        return { title: 'Societies Directory & Management', subtitle: 'Manage tenant societies, gate checkpoints, and operational licenses' };
      case 'companies':
        return { title: 'Corporate Campuses & Companies', subtitle: 'Centralized control for corporate campuses, tech parks, factories and commercial enterprises' };
      case 'onboarding':
        return { title: 'Society Onboarding & Verification Portal', subtitle: '10-step enterprise society review, legal document verification, and tenant provisioning' };
      case 'subscriptions':
        return { title: 'Active Subscriptions & Tenant Licenses', subtitle: 'Track active society SaaS licenses, trial statuses, and upcoming renewals' };
      case 'subscription-tiers':
        return { title: 'Subscription Tiers & Packages', subtitle: 'Configure tenant pricing tiers, trial durations, and gate capacity quotas' };
      case 'assign-plan':
        return { title: 'Assign or Upgrade Society Plan', subtitle: 'Provision new SaaS subscriptions, upgrade packages, and extend license terms' };
      case 'finance':
        return { title: 'Billing & Revenue Ledger', subtitle: 'Platform subscription collections, payment gateways, and automated financial accounting' };
      case 'marketplace-services':
        return { title: 'Service Catalog & Management', subtitle: 'Configure doorstep services, pricing models, platform commission cuts, and scope of work' };
      case 'partners':
        return { title: 'Our Partners · 360° CRM & Analytics', subtitle: 'Complete 360° partner directory, date-wise ledger, customer ratings, revenue splits, and PDF statements' };
      case 'partner-kyc':
        return { title: 'Add New Partner & Verification Portal', subtitle: 'Onboard service partners, review KYC documents, police clearance, and verify applications' };
      case 'directory':
        return { title: 'Community Operations Directory', subtitle: 'Unified registry of Society Admins, Residents, and Security Guards across all communities' };
      case 'users':
        return { title: 'Global User Security Directory', subtitle: 'Centralized registry across all tenant societies, guards, service partners and platform staff' };
      case 'roles':
        return { title: 'Security Rules & Permissions', subtitle: 'Super Admin exclusive role permissions & open/hide service visibility controls' };
      case 'emergency':
        return { title: 'Global Emergency Monitoring & Panic SOS', subtitle: 'Platform-wide emergency overview, live lift entrapments, medical alerts and escalation status' };
      case 'support':
        return { title: 'Helpdesk & Support Escalations', subtitle: 'Multi-tenant customer support tickets, priority escalation, and resolution workflows' };
      case 'notifications':
        return { title: 'Broadcasts & Announcements', subtitle: 'Platform-wide maintenance alerts, society broadcasts, and push notifications' };
      case 'reports':
        return { title: 'Global Analytics, Intelligence & Reports', subtitle: 'Export compliance audits, visitor ingress logs, and platform revenue statements' };
      case 'feature-flags':
        return { title: 'Feature Management & Module Control', subtitle: 'Dynamically toggle tenant features, SaaS plan gating, and application modules' };
      case 'system-health':
        return { title: 'Security & Health Diagnostics', subtitle: 'Live infrastructure uptime, regional Firestore connectivity, and core microservices health' };
      case 'platform-staff':
        return { title: 'Platform Staff & Internal Administration Team', subtitle: 'Manage Happiiz Gate corporate staff, departmental access roles, and permissions' };
      case 'audit-logs':
        return { title: 'System Audit Trail & Security Center', subtitle: 'Cryptographically timestamped and immutable administrative activity log' };
      case 'settings':
        return { title: 'System / Platform Settings', subtitle: 'Branding defaults, public registration gates, and maintenance switches' };
    }
  };

  const { title, subtitle } = getTabTitleAndSubtitle();

  const pendingApprovalsCount = onboardingCases.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'SUBMITTED').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const activeEmergenciesCount = emergencyIncidents.filter((e) => e.status === 'ACTIVE' || e.status === 'ESCALATED').length;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FFFFFF] text-gray-900 font-sans antialiased">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <SuperAdminSidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          pendingApprovalsCount={pendingApprovalsCount}
          openTicketsCount={openTicketsCount}
          activeEmergenciesCount={activeEmergenciesCount}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-72 max-w-[85vw] h-full bg-[#13102B] shadow-2xl flex flex-col min-h-0">
            <div className="p-3 border-b border-white/10 bg-[#100D24] flex items-center justify-between shrink-0">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200 pl-1">
                Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <SuperAdminSidebar
                currentTab={currentTab}
                onSelectTab={handleSelectTab}
                pendingApprovalsCount={pendingApprovalsCount}
                openTicketsCount={openTicketsCount}
                activeEmergenciesCount={activeEmergenciesCount}
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <SuperAdminHeader
          title={title}
          subtitle={subtitle}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          unreadNotificationsCount={notifications.length}
          onOpenNotifications={() => handleSelectTab('notifications')}
          actionButton={
            <button
              type="button"
              onClick={loadAllData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          }
        />

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] scrollbar-thin">
          <div className="w-full">
            {currentTab === 'dashboard' && (
              <OverviewSection
                stats={stats}
                recentAuditLogs={auditLogs}
                onNavigateTab={handleSelectTab}
              />
            )}

            {currentTab === 'societies' && (
              <SocietiesSection societies={societies} onRefresh={loadAllData} />
            )}

            {currentTab === 'companies' && (
              <CompaniesSection companies={companies} onRefresh={loadAllData} />
            )}



            {(currentTab === 'subscriptions' ||
              currentTab === 'subscription-tiers' ||
              currentTab === 'assign-plan') && (
              <SubscriptionsSection
                plans={plans}
                societySubscriptions={societySubs}
                societies={societies}
                onRefresh={loadAllData}
                initialSubTab={
                  currentTab === 'subscription-tiers'
                    ? 'PLANS'
                    : currentTab === 'assign-plan'
                    ? 'ASSIGN'
                    : 'ASSIGNED'
                }
                onSubTabChange={(subTab) =>
                  handleSelectTab(
                    subTab === 'PLANS'
                      ? 'subscription-tiers'
                      : subTab === 'ASSIGN'
                      ? 'assign-plan'
                      : 'subscriptions'
                  )
                }
              />
            )}

            {currentTab === 'finance' && (
              <FinanceSection
                transactions={transactions}
                monthlyRevenue={stats.monthlyRevenue}
                yearlyRevenue={stats.yearlyRevenue}
              />
            )}

            {currentTab === 'marketplace-services' && (
              <MarketplaceServicesSection
                onRefresh={loadAllData}
                partners={partners}
              />
            )}

            {currentTab === 'partners' && (
              <Partner360CrmSection onRefresh={loadAllData} />
            )}

            {currentTab === 'partner-kyc' && (
              <ServicePartnersSection
                partners={partners}
                societies={societies}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'directory' && (
              <DirectorySection
                societyAdmins={societyAdmins}
                residents={residents}
                guards={guards}
                societies={societies}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'users' && (
              <GlobalUsersSection
                users={globalUsers}
                societies={societies}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'roles' && (
              <RolesPermissionsSection
                isSuperAdmin={
                  activePlatformRole === 'SUPER_ADMIN' &&
                  Boolean(
                    user?.isSuperAdmin ||
                      user?.primaryRole === 'SUPER_ADMIN' ||
                      user?.role === 'SUPER_ADMIN'
                  )
                }
                actorEmail={user?.email || undefined}
              />
            )}

            {currentTab === 'emergency' && (
              <EmergencyMonitoringSection
                incidents={emergencyIncidents}
                societies={societies}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'support' && (
              <SupportTicketsSection
                tickets={tickets}
                societies={societies}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationsSection
                notifications={notifications}
                societies={societies}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'reports' && (
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

            {currentTab === 'feature-flags' && (
              <FeatureFlagsSection
                flags={featureFlags}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'system-health' && (
              <SystemHealthSection />
            )}

            {currentTab === 'platform-staff' && (
              <PlatformStaffSection
                staff={platformStaff}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'audit-logs' && (
              <AuditLogsSection logs={auditLogs} />
            )}

            {currentTab === 'settings' && (
              <SettingsSection
                initialSettings={platformSettings}
                onRefresh={loadAllData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
