/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  DoorClosed,
  Users,
  QrCode,
  Car,
  AlertTriangle,
  FileBarChart2,
  LogOut,
  Menu,
  X,
  Download,
  RefreshCw,
  Loader2,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { societyAdminService } from '../../services/firebase/societyAdmin.service';
import { getAllSocieties, exportToCsv } from '../../services/firebase/superadmin.service';
import { syncBus } from '../../services/firebase/sync.service';
import {
  SocietyBuilding,
  SocietyEmergencyAlert,
  SocietyFlat,
  SocietyGate,
  SocietyResidentMember,
} from '../../types/societyAdmin';
import { GatePass, Society } from '../../types/society';
import {
  GuardItem,
  SocietyEmergencyView,
  SocietyGatesView,
  SocietyGuardsView,
  SocietyPreApprovalsView,
  SocietyVisitorsView,
} from '../../components/societyAdmin/SocietySecurityViews';
import { SocietyVehiclesAnprView } from '../../components/societyAdmin/SocietyVehiclesAnprView';

type SecurityStaffTab =
  | 'overview'
  | 'gates'
  | 'guards'
  | 'visitors'
  | 'pre-approvals'
  | 'vehicles'
  | 'emergency'
  | 'reports';

export const SecurityStaffDashboard: React.FC = () => {
  const { user, activeMembership, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as SecurityStaffTab) || 'overview';
  const [activeTab, setActiveTab] = useState<SecurityStaffTab>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentSocietyId =
    activeMembership?.societyId || user?.societyId || 'soc_emerald_heights';

  const [society, setSociety] = useState<Society>({
    id: currentSocietyId,
    societyName:
      activeMembership?.societyName || user?.societyName || 'Emerald Heights Luxury Enclave',
    name: activeMembership?.societyName || user?.societyName || 'Emerald Heights Luxury Enclave',
    societyCode: activeMembership?.societyCode || 'EMR-01',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '',
    totalFlats: 320,
    occupiedFlats: 280,
    totalGates: 3,
    activeGuards: 6,
    subscriptionPlan: 'Enterprise',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  });

  const [buildings, setBuildings] = useState<SocietyBuilding[]>([]);
  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [residents, setResidents] = useState<SocietyResidentMember[]>([]);
  const [gates, setGates] = useState<SocietyGate[]>([]);
  const [visitors, setVisitors] = useState<GatePass[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<SocietyEmergencyAlert[]>([]);
  const [guards, setGuards] = useState<GuardItem[]>([
    {
      id: 'grd_1',
      societyId: currentSocietyId,
      name: 'Bahadur Singh',
      phoneNumber: '+91 97000 11223',
      badgeNumber: 'EMP-G-101',
      gateAssigned: 'Main Entrance (Gate 1)',
      towerAssigned: 'All Towers',
      shift: 'DAY',
      status: 'ACTIVE',
      isSupervisor: true,
    },
    {
      id: 'grd_2',
      societyId: currentSocietyId,
      name: 'Manoj Kumar',
      phoneNumber: '+91 97112 23344',
      badgeNumber: 'EMP-G-102',
      gateAssigned: 'Service & Delivery Gate (Gate 2)',
      towerAssigned: 'Tower A',
      shift: 'NIGHT',
      status: 'ACTIVE',
    },
    {
      id: 'grd_3',
      societyId: currentSocietyId,
      name: 'Dilip Rathi',
      phoneNumber: '+91 97334 45566',
      badgeNumber: 'EMP-G-103',
      gateAssigned: 'East Pedestrian Gate',
      towerAssigned: 'Tower B',
      shift: 'ROTATIONAL',
      status: 'ACTIVE',
    },
  ]);

  const loadSecurityData = async () => {
    try {
      const [bldData, fltData, resData, gatData, visData, emgData, allSocs] = await Promise.all([
        societyAdminService.getBuildings(currentSocietyId),
        societyAdminService.getFlats(currentSocietyId),
        societyAdminService.getResidents(currentSocietyId),
        societyAdminService.getGates(currentSocietyId),
        societyAdminService.getVisitors(currentSocietyId),
        societyAdminService.getEmergencyAlerts(currentSocietyId),
        getAllSocieties(),
      ]);

      setBuildings(bldData);
      setFlats(fltData);
      setResidents(resData);
      setGates(gatData);
      setVisitors(visData);
      setEmergencyAlerts(emgData);

      const matched = allSocs.find(
        (s) => s.id === currentSocietyId || s.societyName === user?.societyName
      );
      if (matched) {
        setSociety((prev) => ({ ...prev, ...matched }));
      }
    } catch (err) {
      console.error('[SecurityStaff] Failed loading society security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
    const unsubscribe = syncBus.subscribeAll((ev) => {
      if (ev.societyId === currentSocietyId || ev.societyId === 'all') {
        loadSecurityData();
      }
    });
    return () => unsubscribe();
  }, [currentSocietyId]);

  const selectTab = (tab: SecurityStaffTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setMobileMenuOpen(false);
  };

  const handleAddGuard = async (g: any) => {
    setGuards((prev) => [...prev, { ...g, id: `grd_${Date.now()}`, societyId: currentSocietyId }]);
  };

  const handleToggleGuardStatus = async (id: string, currentStatus: GuardItem['status']) => {
    setGuards((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : g
      )
    );
  };

  const handleAddGate = async (g: any) => {
    await societyAdminService.createGate(
      currentSocietyId,
      g.name,
      g.locationDescription,
      g.hasBoomBarrier,
      g.hasLicensePlateCamera,
      g.gateType || 'VEHICULAR',
      g.servingTower || 'All Towers'
    );
    await loadSecurityData();
  };

  const handleUpdateGate = async (id: string, data: Partial<SocietyGate>) => {
    await societyAdminService.updateGate(id, data);
    await loadSecurityData();
  };

  const handleCheckOutVisitor = async (id: string) => {
    await societyAdminService.checkOutVisitor(id);
    await loadSecurityData();
  };

  const handleRevokePass = async (passId: string, reason: string) => {
    await societyAdminService.revokeGatePassWithAudit(
      currentSocietyId,
      passId,
      reason,
      user?.fullName || 'Security Staff',
      user?.uid || 'usr_security_staff',
      'SECURITY_STAFF'
    );
    await loadSecurityData();
  };

  const handleResolveAlert = async (id: string, notes: string) => {
    await societyAdminService.resolveEmergencyAlert(currentSocietyId, id, notes);
    await societyAdminService.recordAuditLog(
      currentSocietyId,
      user?.uid || 'usr_security_staff',
      user?.fullName || 'Security Staff',
      'SECURITY_STAFF',
      'EMERGENCY_RESOLVED',
      id,
      `Resolved emergency incident: ${notes}`
    );
    await loadSecurityData();
  };

  const handleExportSecurityCsv = () => {
    exportToCsv(
      `security_activity_${society.societyCode || currentSocietyId}_${new Date()
        .toISOString()
        .slice(0, 10)}`,
      visitors.map((v) => ({
        PassId: v.id,
        VisitorName: v.visitorName,
        VisitorType: v.visitorType,
        Flat: v.hostFlat,
        Vehicle: v.vehicleNumber || 'None',
        Status: v.status,
        CheckIn: v.checkInTime || v.createdAt || '',
        CheckOut: v.checkOutTime || '',
      }))
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const activeAlertsCount = emergencyAlerts.filter((a) => a.status === 'ACTIVE').length;
  const activeVisitorsCount = visitors.filter((v) => v.status === 'CheckedIn').length;
  const activeGuardsCount = guards.filter((g) => g.status === 'ACTIVE').length;

  const navItems: { id: SecurityStaffTab; label: string; icon: React.ComponentType<any>; badge?: number }[] = [
    { id: 'overview', label: 'Security Overview', icon: LayoutDashboard },
    { id: 'gates', label: 'Gate Monitoring', icon: DoorClosed },
    { id: 'guards', label: 'Guard Management', icon: Users },
    { id: 'visitors', label: 'Visitor Monitoring', icon: Users, badge: activeVisitorsCount },
    { id: 'pre-approvals', label: 'Digital GatePasses', icon: QrCode },
    { id: 'vehicles', label: 'Vehicle & ANPR Logs', icon: Car },
    { id: 'emergency', label: 'Emergency & SOS', icon: AlertTriangle, badge: activeAlertsCount },
    { id: 'reports', label: 'Security Reports', icon: FileBarChart2 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F8F7]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">
            Loading Society Security Command Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F8F7] text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#062C22] text-white border-r border-emerald-900/50 shrink-0">
        <div className="p-5 border-b border-emerald-800/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold truncate">Security Command</h2>
            <p className="text-[11px] text-emerald-300/80 truncate">
              {society.societyCode || 'SOC'} · Staff Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.id === 'emergency' ? 'bg-red-500 text-white' : 'bg-emerald-400/20 text-emerald-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-emerald-800/60">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#062C22] text-white flex flex-col h-full shadow-2xl">
            <div className="p-4 border-b border-emerald-800 flex items-center justify-between">
              <span className="text-sm font-extrabold">Security Command</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      activeTab === item.id ? 'bg-emerald-600 text-white' : 'text-emerald-100/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {navItems.find((i) => i.id === activeTab)?.label || 'Security Control Portal'}
              </h1>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-700 shrink-0" />
                {society.societyName} ({society.societyCode}) · {user?.fullName || 'Security Staff'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSecurityData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Active Gates</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{gates.length}</div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    {gates.filter((g) => g.operatingStatus === 'OPEN').length} Open · Camera / Boom Enabled
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">On-Duty Guards</span>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                    {activeGuardsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Out of {guards.length} registered security personnel
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Visitors Inside</span>
                  <div className="text-2xl font-extrabold text-blue-700 mt-1">
                    {activeVisitorsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {visitors.length} total logged passes today
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">Active SOS Alerts</span>
                  <div
                    className={`text-2xl font-extrabold mt-1 ${
                      activeAlertsCount > 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {activeAlertsCount}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {emergencyAlerts.length} historical incidents logged
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Gate Monitoring',
                    desc: 'Inspect boom barriers, ANPR cameras & gate access points',
                    tab: 'gates' as SecurityStaffTab,
                  },
                  {
                    title: 'Guard Roster & Shifts',
                    desc: 'Add gate guards, assign towers/gates & manage active duty status',
                    tab: 'guards' as SecurityStaffTab,
                  },
                  {
                    title: 'Vehicle & ANPR Logs',
                    desc: 'Audit AI plate recognitions, vehicle movements & unknown entries',
                    tab: 'vehicles' as SecurityStaffTab,
                  },
                ].map((card) => (
                  <button
                    key={card.tab}
                    type="button"
                    onClick={() => selectTab(card.tab)}
                    className="text-left bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 p-5 shadow-xs transition-all cursor-pointer"
                  >
                    <h3 className="text-sm font-extrabold text-slate-900">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gates' && (
            <SocietyGatesView
              society={society}
              gates={gates}
              buildings={buildings}
              flats={flats}
              onAddGate={handleAddGate}
              onUpdateGate={handleUpdateGate}
            />
          )}

          {activeTab === 'guards' && (
            <SocietyGuardsView
              society={society}
              guards={guards}
              gates={gates}
              buildings={buildings}
              onAddGuard={handleAddGuard}
              onToggleGuardStatus={handleToggleGuardStatus}
            />
          )}

          {activeTab === 'visitors' && (
            <SocietyVisitorsView
              society={society}
              visitors={visitors}
              buildings={buildings}
              flats={flats}
              onCheckOutVisitor={handleCheckOutVisitor}
            />
          )}

          {activeTab === 'pre-approvals' && (
            <SocietyPreApprovalsView
              society={society}
              passes={visitors}
              buildings={buildings}
              flats={flats}
              onRevokePass={handleRevokePass}
            />
          )}

          {activeTab === 'vehicles' && (
            <SocietyVehiclesAnprView
              society={society}
              buildings={buildings}
              flats={flats}
              residents={residents}
              gates={gates}
              onVehiclesChanged={loadSecurityData}
            />
          )}

          {activeTab === 'emergency' && (
            <SocietyEmergencyView
              society={society}
              alerts={emergencyAlerts}
              buildings={buildings}
              flats={flats}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Gate Activity & Security Compliance Reports
                  </h2>
                  <p className="text-xs text-slate-500">
                    Download visitor entry/exit logs and checkpoint audit summaries for{' '}
                    {society.societyName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportSecurityCsv}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 hover:bg-emerald-800 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Export Security CSV
                </button>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Visitor</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Flat</th>
                      <th className="p-3">Vehicle</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visitors.slice(0, 20).map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{v.visitorName}</td>
                        <td className="p-3 text-slate-600">{v.visitorType}</td>
                        <td className="p-3 font-mono text-slate-700">{v.hostFlat}</td>
                        <td className="p-3 font-mono text-slate-600">{v.vehicleNumber || '—'}</td>
                        <td className="p-3 font-bold text-emerald-700">{v.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SecurityStaffDashboard;
