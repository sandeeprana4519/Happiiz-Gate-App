/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { societyAdminService } from '../../services/firebase/societyAdmin.service';
import { getAllSocieties, getAllServicePartners } from '../../services/firebase/superadmin.service';
import { syncBus } from '../../services/firebase/sync.service';
import {
  SocietyProfileView,
  SocietyBuildingsView,
  SocietyFlatsView,
} from '../../components/societyAdmin/SocietyStructureViews';
import {
  SocietyResidentsView,
  SocietyHouseholdView,
} from '../../components/societyAdmin/SocietyPeopleViews';
import {
  SocietyGuardsView,
  SocietyGatesView,
  SocietyVisitorsView,
  SocietyPreApprovalsView,
  SocietyEmergencyView,
  GuardItem,
} from '../../components/societyAdmin/SocietySecurityViews';
import {
  SocietyNoticesView,
  SocietyHelpDeskView,
  SocietyMaintenanceView,
  SocietyAmenitiesView,
  SocietyCommunityView,
  SocietyServicePartnersView,
  ServicePartnerItem,
} from '../../components/societyAdmin/SocietyOperationsViews';
import {
  SocietyReportsView,
  SocietySettingsView,
} from '../../components/societyAdmin/SocietyReportsAndSettingsViews';
import { SOCIETY_STAFF_PERMISSIONS } from '../../components/societyAdmin/societyStaffPermissions';
import {
  SocietyBuilding,
  SocietyFlat,
  SocietyResidentMember,
  SocietyHouseholdMember,
  SocietyVehicle,
  SocietyDomesticHelper,
  SocietyGate,
  SocietyNotice,
  SocietyComplaint,
  SocietyInvoice,
  SocietyAmenity,
  SocietyAmenityBooking,
  SocietyEmergencyAlert,
  SocietyCommunityPost,
  SocietyStaffMember,
  SocietyDetailedSettings,
} from '../../types/societyAdmin';
import { Society, GatePass } from '../../types/society';
import {
  Building2,
  Layers,
  Home,
  Users,
  HeartHandshake,
  ShieldCheck,
  DoorOpen,
  UserCheck,
  Ticket,
  AlertTriangle,
  Megaphone,
  Headset,
  Sparkles,
  MessageSquare,
  Wrench,
  CreditCard,
  BarChart3,
  Settings,
  KeyRound,
  CheckCircle2,
  Lock,
  LogOut,
  RefreshCw,
  Menu,
  X,
  ArrowRight,
  UserCog,
} from 'lucide-react';

type SocietyStaffModuleId =
  | 'overview'
  | 'profile'
  | 'buildings'
  | 'flats'
  | 'residents'
  | 'household'
  | 'guards'
  | 'gates'
  | 'visitors'
  | 'pre-approvals'
  | 'emergency'
  | 'notices'
  | 'helpdesk'
  | 'amenities'
  | 'community'
  | 'service-partners'
  | 'maintenance'
  | 'reports'
  | 'settings';

interface SocietyStaffModuleDef {
  id: SocietyStaffModuleId;
  label: string;
  group: string;
  description: string;
  requiredPermission: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SOCIETY_STAFF_MODULES: SocietyStaffModuleDef[] = [
  {
    id: 'profile',
    label: 'Society Profile & Rules',
    group: 'Physical Structure',
    description: 'View society identity, address, and structural overview',
    requiredPermission: 'society.structure.view',
    icon: Building2,
  },
  {
    id: 'buildings',
    label: 'Towers, Blocks & Wings',
    group: 'Physical Structure',
    description: 'Manage residential towers, blocks, floors, and wings',
    requiredPermission: 'society.structure.view',
    icon: Layers,
  },
  {
    id: 'flats',
    label: 'Flat Inventory & Units',
    group: 'Physical Structure',
    description: 'Manage apartment units, occupancy status, and flat PDF exports',
    requiredPermission: 'society.structure.view',
    icon: Home,
  },
  {
    id: 'residents',
    label: 'Residents Roster',
    group: 'People & Households',
    description: 'Approve residents, assign flats, and export resident rosters',
    requiredPermission: 'society.residents.manage',
    icon: Users,
  },
  {
    id: 'household',
    label: 'Family, Vehicles & Helpers',
    group: 'People & Households',
    description: 'Manage family members, vehicles, domestic helpers & guard gate passes',
    requiredPermission: 'society.household.manage',
    icon: HeartHandshake,
  },
  {
    id: 'guards',
    label: 'Security Guard Sentinels',
    group: 'Security & Gates',
    description: 'Manage security guard roster, shifts, and gate assignments',
    requiredPermission: 'society.guards_gates.manage',
    icon: ShieldCheck,
  },
  {
    id: 'gates',
    label: 'Gate Checkpoints',
    group: 'Security & Gates',
    description: 'Monitor and configure entry/exit gate checkpoints & barriers',
    requiredPermission: 'society.guards_gates.manage',
    icon: DoorOpen,
  },
  {
    id: 'visitors',
    label: 'Live Visitor Ingress',
    group: 'Security & Gates',
    description: 'Track live visitors inside the society and process check-outs',
    requiredPermission: 'society.visitors.manage',
    icon: UserCheck,
  },
  {
    id: 'pre-approvals',
    label: 'Visitor Pre-Approvals',
    group: 'Security & Gates',
    description: 'Review digital gate passes and revoke unauthorized passes',
    requiredPermission: 'society.visitors.manage',
    icon: Ticket,
  },
  {
    id: 'emergency',
    label: 'Emergency & SOS Alerts',
    group: 'Security & Gates',
    description: 'Respond to and resolve active emergency SOS alerts',
    requiredPermission: 'society.emergency.monitor',
    icon: AlertTriangle,
  },
  {
    id: 'notices',
    label: 'Digital Notice Board',
    group: 'Community & Facilities',
    description: 'Publish and archive official society announcements & notices',
    requiredPermission: 'society.notices.manage',
    icon: Megaphone,
  },
  {
    id: 'helpdesk',
    label: 'HelpDesk & Complaints',
    group: 'Community & Facilities',
    description: 'Assign staff, reply to residents, and resolve maintenance tickets',
    requiredPermission: 'society.helpdesk.manage',
    icon: Headset,
  },
  {
    id: 'amenities',
    label: 'Amenities & Bookings',
    group: 'Community & Facilities',
    description: 'Approve or reject clubhouse, banquet hall & facility reservations',
    requiredPermission: 'society.amenities.manage',
    icon: Sparkles,
  },
  {
    id: 'community',
    label: 'Community Feed & Events',
    group: 'Community & Facilities',
    description: 'Moderate community discussion posts and announcements',
    requiredPermission: 'society.community.manage',
    icon: MessageSquare,
  },
  {
    id: 'service-partners',
    label: 'Service Partners',
    group: 'Community & Facilities',
    description: 'View and coordinate verified society service vendors',
    requiredPermission: 'society.community.manage',
    icon: Wrench,
  },
  {
    id: 'maintenance',
    label: 'Dues & Maintenance Invoices',
    group: 'Finance & Admin',
    description: 'Generate monthly maintenance invoices and record manual payments',
    requiredPermission: 'society.maintenance.manage',
    icon: CreditCard,
  },
  {
    id: 'reports',
    label: 'Reports & Exports',
    group: 'Finance & Admin',
    description: 'Export society directories, maintenance logs & view audit trail',
    requiredPermission: 'society.reports.view',
    icon: BarChart3,
  },
  {
    id: 'settings',
    label: 'Society Settings',
    group: 'Finance & Admin',
    description: 'Update society rules, security policies & billing settings',
    requiredPermission: 'society.settings.manage',
    icon: Settings,
  },
];

export const SocietyStaffDashboard: React.FC = () => {
  const { user, activeMembership, logout } = useAuth();
  const navigate = useNavigate();

  // Strict Single-Society Isolation: resolved exclusively from logged-in staff's society assignment
  const assignedSocietyId =
    user?.societyId || activeMembership?.societyId || 'soc_emerald_heights';

  const [activeTab, setActiveTab] = useState<SocietyStaffModuleId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [staffRecord, setStaffRecord] = useState<SocietyStaffMember | null>(null);
  const [society, setSociety] = useState<Society>({
    id: assignedSocietyId,
    societyName: user?.societyName || activeMembership?.societyName || 'Assigned Society',
    name: user?.societyName || activeMembership?.societyName || 'Assigned Society',
    societyCode: user?.societyCode || activeMembership?.societyCode || 'SOC',
    address: '',
    city: '',
    state: '',
    contactEmail: '',
    contactPhone: '',
    totalFlats: 0,
    occupiedFlats: 0,
    totalGates: 0,
    activeGuards: 0,
    subscriptionPlan: 'Enterprise',
    status: 'ACTIVE',
  });

  const [buildings, setBuildings] = useState<SocietyBuilding[]>([]);
  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [residents, setResidents] = useState<SocietyResidentMember[]>([]);
  const [household, setHousehold] = useState<SocietyHouseholdMember[]>([]);
  const [vehicles, setVehicles] = useState<SocietyVehicle[]>([]);
  const [helpers, setHelpers] = useState<SocietyDomesticHelper[]>([]);
  const [guards, setGuards] = useState<GuardItem[]>([
    {
      id: 'grd_1',
      societyId: assignedSocietyId,
      name: 'Bahadur Singh',
      phoneNumber: '+91 98765 00010',
      badgeNumber: 'SEC-101',
      gateAssigned: 'Main Gate #1',
      shift: 'DAY',
      status: 'ACTIVE',
      isSupervisor: true,
    },
    {
      id: 'grd_2',
      societyId: assignedSocietyId,
      name: 'Ranjit Roy',
      phoneNumber: '+91 98765 00011',
      badgeNumber: 'SEC-102',
      gateAssigned: 'North Service Gate',
      shift: 'DAY',
      status: 'ACTIVE',
    },
  ]);
  const [gates, setGates] = useState<SocietyGate[]>([]);
  const [visitors, setVisitors] = useState<GatePass[]>([]);
  const [notices, setNotices] = useState<SocietyNotice[]>([]);
  const [complaints, setComplaints] = useState<SocietyComplaint[]>([]);
  const [invoices, setInvoices] = useState<SocietyInvoice[]>([]);
  const [amenities, setAmenities] = useState<SocietyAmenity[]>([]);
  const [bookings, setBookings] = useState<SocietyAmenityBooking[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<SocietyEmergencyAlert[]>([]);
  const [communityPosts, setCommunityPosts] = useState<SocietyCommunityPost[]>([]);
  const [partners, setPartners] = useState<ServicePartnerItem[]>([]);
  const [settings, setSettings] = useState<SocietyDetailedSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadSocietyScopedData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        staffList,
        allSocieties,
        bldData,
        fltData,
        resData,
        hhData,
        vehData,
        hlpData,
        gatData,
        visData,
        notData,
        cmpData,
        invData,
        amnData,
        bkgData,
        emgData,
        pstData,
        setData,
        audData,
        allSp,
      ] = await Promise.all([
        societyAdminService.getStaff(assignedSocietyId),
        getAllSocieties(),
        societyAdminService.getBuildings(assignedSocietyId),
        societyAdminService.getFlats(assignedSocietyId),
        societyAdminService.getResidents(assignedSocietyId),
        societyAdminService.getHouseholdMembers(assignedSocietyId),
        societyAdminService.getVehicles(assignedSocietyId),
        societyAdminService.getDomesticHelpers(assignedSocietyId),
        societyAdminService.getGates(assignedSocietyId),
        societyAdminService.getVisitors(assignedSocietyId),
        societyAdminService.getNotices(assignedSocietyId),
        societyAdminService.getComplaints(assignedSocietyId),
        societyAdminService.getInvoices(assignedSocietyId),
        societyAdminService.getAmenities(assignedSocietyId),
        societyAdminService.getBookings(assignedSocietyId),
        societyAdminService.getEmergencyAlerts(assignedSocietyId),
        societyAdminService.getCommunityPosts(assignedSocietyId),
        societyAdminService.getSettings(assignedSocietyId),
        societyAdminService.getAuditLogs(assignedSocietyId),
        getAllServicePartners(),
      ]);

      const matchedStaff = staffList.find(
        (s) =>
          !s.isOwner &&
          s.role !== 'Society Admin' &&
          ((user?.societyStaffId && s.id === user.societyStaffId) ||
            (user?.uid && s.uid === user.uid) ||
            (user?.email && s.email && s.email.toLowerCase() === user.email.toLowerCase()))
      );
      setStaffRecord(matchedStaff || null);

      const matchedSoc = allSocieties.find((s) => s.id === assignedSocietyId);
      if (matchedSoc) {
        setSociety((prev) => ({ ...prev, ...matchedSoc }));
      } else {
        setSociety((prev) => ({
          ...prev,
          id: assignedSocietyId,
          societyName:
            matchedStaff?.societyName ||
            user?.societyName ||
            activeMembership?.societyName ||
            prev.societyName,
          name:
            matchedStaff?.societyName ||
            user?.societyName ||
            activeMembership?.societyName ||
            prev.name,
          societyCode:
            matchedStaff?.societyCode ||
            user?.societyCode ||
            activeMembership?.societyCode ||
            prev.societyCode,
        }));
      }

      setBuildings(bldData);
      setFlats(fltData);
      setResidents(resData);
      setHousehold(hhData);
      setVehicles(vehData);
      setHelpers(hlpData);
      setGates(gatData);
      setVisitors(visData);
      setNotices(notData);
      setComplaints(cmpData);
      setInvoices(invData);
      setAmenities(amnData);
      setBookings(bkgData);
      setEmergencyAlerts(emgData);
      setCommunityPosts(pstData);
      setSettings(setData);
      setAuditLogs(audData);

      const mappedSp = allSp
        .filter(
          (sp) =>
            !sp.assignedSocietyId ||
            sp.assignedSocietyId === assignedSocietyId ||
            sp.assignedSocietyName === (matchedSoc?.societyName || user?.societyName)
        )
        .map((sp) => ({
          id: sp.uid,
          companyName: sp.businessName || sp.name || 'Service Partner',
          category:
            (sp.serviceDomain && sp.serviceDomain[0]) ||
            (sp.serviceCategories && sp.serviceCategories[0]) ||
            'General',
          contactPerson: sp.name || sp.businessName || 'Representative',
          phoneNumber: sp.contactNumber || sp.phone || '',
          status: sp.verificationStatus || sp.status || 'ACTIVE',
          onboardedBy: sp.onboardedBy,
        }));
      setPartners(mappedSp);
    } catch (err) {
      console.warn('[SocietyStaffPortal] Notice loading society data:', err);
    } finally {
      setLoading(false);
    }
  }, [
    assignedSocietyId,
    activeMembership?.societyCode,
    activeMembership?.societyName,
    user?.email,
    user?.societyCode,
    user?.societyName,
    user?.societyStaffId,
    user?.uid,
  ]);

  useEffect(() => {
    loadSocietyScopedData();
    const unsubscribeSync = syncBus.subscribeAll((event) => {
      if (event.societyId === assignedSocietyId || event.societyId === 'all') {
        loadSocietyScopedData();
      }
    });
    return () => {
      unsubscribeSync();
    };
  }, [assignedSocietyId, loadSocietyScopedData]);

  // Live resolved staff identity & Society Admin granted permissions
  const effectivePermissions = useMemo(() => {
    if (staffRecord) return staffRecord.permissions || [];
    return user?.societyPermissions || [];
  }, [staffRecord, user?.societyPermissions]);

  const effectiveName = staffRecord?.fullName || user?.fullName || 'Society Staff';
  const effectiveRoleLabel = staffRecord?.role || user?.societyStaffRole || 'Society Staff';
  const effectiveDepartment =
    staffRecord?.assignedArea || user?.societyDepartment || 'Estate Office';
  const effectiveEmail = staffRecord?.email || user?.email || '';
  const effectiveSocietyName =
    society.societyName ||
    society.name ||
    staffRecord?.societyName ||
    user?.societyName ||
    'Assigned Society';
  const effectiveSocietyCode =
    society.societyCode || staffRecord?.societyCode || user?.societyCode || 'SOC';
  const isStaffDeactivated = staffRecord ? staffRecord.status === 'INACTIVE' : false;

  const hasPermission = useCallback(
    (key: string) => effectivePermissions.includes('*') || effectivePermissions.includes(key),
    [effectivePermissions]
  );

  const authorizedModules = useMemo(() => {
    if (isStaffDeactivated) return [];
    return SOCIETY_STAFF_MODULES.filter((mod) => hasPermission(mod.requiredPermission));
  }, [hasPermission, isStaffDeactivated]);

  // Ensure activeTab returns to overview if Society Admin revokes that module live
  useEffect(() => {
    if (activeTab === 'overview') return;
    const allowed = authorizedModules.some((m) => m.id === activeTab);
    if (!allowed) {
      setActiveTab('overview');
    }
  }, [activeTab, authorizedModules]);

  const grantedPermissionDefs = useMemo(
    () => SOCIETY_STAFF_PERMISSIONS.filter((p) => hasPermission(p.key)),
    [hasPermission]
  );
  const restrictedPermissionDefs = useMemo(
    () => SOCIETY_STAFF_PERMISSIONS.filter((p) => !hasPermission(p.key)),
    [hasPermission]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login?role=SOCIETY_STAFF', { replace: true });
  };

  const activeModuleMeta = SOCIETY_STAFF_MODULES.find((m) => m.id === activeTab);

  // Scoped Handlers (strictly operating on assignedSocietyId)
  const handleUpdateSociety = async (data: Partial<Society>) => {
    setSociety((prev) => ({ ...prev, ...data }));
  };
  const handleCreateBuilding = async (bld: any) => {
    await societyAdminService.createBuilding(
      assignedSocietyId,
      bld.name,
      bld.type,
      bld.floorsCount,
      bld.totalFlats
    );
    await loadSocietyScopedData();
  };
  const handleUpdateBuilding = async (id: string, data: Partial<SocietyBuilding>) => {
    await societyAdminService.updateBuilding(id, data);
    await loadSocietyScopedData();
  };
  const handleCreateFlat = async (flt: any) => {
    await societyAdminService.createFlat(assignedSocietyId, flt);
    await loadSocietyScopedData();
  };
  const handleUpdateFlat = async (id: string, data: Partial<SocietyFlat>) => {
    await societyAdminService.updateFlat(assignedSocietyId, id, data);
    await loadSocietyScopedData();
  };
  const handleUpdateResidentStatus = async (
    id: string,
    status: SocietyResidentMember['membershipStatus']
  ) => {
    await societyAdminService.updateResidentStatus(assignedSocietyId, id, status);
    await loadSocietyScopedData();
  };
  const handleAssignFlat = async (
    id: string,
    flatNumber: string,
    occupantType: 'OWNER' | 'TENANT'
  ) => {
    await societyAdminService.assignFlatToResident(id, flatNumber, occupantType);
    await loadSocietyScopedData();
  };
  const handleToggleHelperStatus = async (id: string, currentStatus: 'ACTIVE' | 'REVOKED') => {
    await societyAdminService.toggleHelperStatus(id, currentStatus, assignedSocietyId);
    await loadSocietyScopedData();
  };
  const handleAddHelper = async (helperData: any) => {
    await societyAdminService.createDomesticHelper(assignedSocietyId, {
      ...helperData,
      societyName: helperData.societyName || effectiveSocietyName,
    });
    await loadSocietyScopedData();
  };
  const handleUpdateHelper = async (id: string, updates: Partial<SocietyDomesticHelper>) => {
    await societyAdminService.updateDomesticHelper(assignedSocietyId, id, updates);
    await loadSocietyScopedData();
  };
  const handleDeleteHelper = async (id: string) => {
    await societyAdminService.deleteDomesticHelper(assignedSocietyId, id);
    await loadSocietyScopedData();
  };
  const handleAddVehicle = async (v: any) => {
    await societyAdminService.createVehicle(assignedSocietyId, v);
    await loadSocietyScopedData();
  };
  const handleUpdateVehicle = async (id: string, updates: Partial<SocietyVehicle>) => {
    await societyAdminService.updateVehicle(assignedSocietyId, id, updates);
    await loadSocietyScopedData();
  };
  const handleDeleteVehicle = async (id: string) => {
    await societyAdminService.deleteVehicle(assignedSocietyId, id);
    await loadSocietyScopedData();
  };
  const handleAddHouseholdMember = async (member: any) => {
    await societyAdminService.createHouseholdMember(assignedSocietyId, member);
    await loadSocietyScopedData();
  };
  const handleUpdateHouseholdMember = async (
    id: string,
    updates: Partial<SocietyHouseholdMember>
  ) => {
    await societyAdminService.updateHouseholdMember(assignedSocietyId, id, updates);
    await loadSocietyScopedData();
  };
  const handleDeleteHouseholdMember = async (id: string) => {
    await societyAdminService.deleteHouseholdMember(assignedSocietyId, id);
    await loadSocietyScopedData();
  };
  const handleAddGuard = async (g: any) => {
    setGuards((prev) => [...prev, { ...g, societyId: assignedSocietyId, id: `grd_${Date.now()}` }]);
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
      assignedSocietyId,
      g.name,
      g.locationDescription,
      g.hasBoomBarrier,
      g.hasLicensePlateCamera
    );
    await loadSocietyScopedData();
  };
  const handleUpdateGate = async (id: string, data: Partial<SocietyGate>) => {
    await societyAdminService.updateGate(id, data);
    await loadSocietyScopedData();
  };
  const handleCheckOutVisitor = async (id: string) => {
    await societyAdminService.checkOutVisitor(id);
    await loadSocietyScopedData();
  };
  const handleRevokePass = async (passId: string, reason: string) => {
    await societyAdminService.revokeGatePassWithAudit(
      assignedSocietyId,
      passId,
      reason,
      effectiveName,
      user?.uid || 'usr_soc_staff',
      effectiveRoleLabel
    );
    await loadSocietyScopedData();
  };
  const handleCreateNotice = async (n: any) => {
    await societyAdminService.createNotice(assignedSocietyId, n);
    await loadSocietyScopedData();
  };
  const handleArchiveNotice = async (id: string) => {
    await societyAdminService.archiveNotice(id);
    await loadSocietyScopedData();
  };
  const handleUpdateComplaint = async (id: string, data: Partial<SocietyComplaint>) => {
    await societyAdminService.updateComplaint(
      assignedSocietyId,
      id,
      data.status || 'RESOLVED',
      data.adminReply,
      data.assignedStaff
    );
    await loadSocietyScopedData();
  };
  const handleGenerateMonthlyInvoices = async (month: string, amountPerFlat: number) => {
    await societyAdminService.generateMonthlyInvoices(assignedSocietyId, amountPerFlat, month);
    await loadSocietyScopedData();
  };
  const handleRecordOfflinePayment = async (invoiceId: string, receiptNumber: string) => {
    await societyAdminService.recordOfflinePayment(
      assignedSocietyId,
      invoiceId,
      'Bank Transfer / Cash',
      receiptNumber
    );
    await loadSocietyScopedData();
  };
  const handleApproveBooking = async (id: string) => {
    await societyAdminService.updateBookingStatus(assignedSocietyId, id, 'CONFIRMED');
    await loadSocietyScopedData();
  };
  const handleRejectBooking = async (id: string) => {
    await societyAdminService.updateBookingStatus(assignedSocietyId, id, 'CANCELLED');
    await loadSocietyScopedData();
  };
  const handleResolveAlert = async (id: string, notes: string) => {
    await societyAdminService.resolveEmergencyAlert(assignedSocietyId, id, notes);
    await societyAdminService.recordAuditLog(
      assignedSocietyId,
      user?.uid || 'usr_soc_staff',
      effectiveName,
      effectiveRoleLabel,
      'EMERGENCY_RESOLVED',
      id,
      `Resolved emergency incident: ${notes}`
    );
    await loadSocietyScopedData();
  };
  const handleModeratePost = async (id: string, action: 'APPROVED' | 'REPORTED' | 'HIDDEN') => {
    await societyAdminService.moderatePost(id, action);
    await loadSocietyScopedData();
  };
  const handleUpdateSettings = async (s: Partial<SocietyDetailedSettings>) => {
    if (!settings) return false;
    const merged = { ...settings, ...s };
    await societyAdminService.updateSettings(assignedSocietyId, merged);
    await societyAdminService.recordAuditLog(
      assignedSocietyId,
      user?.uid || 'usr_soc_staff',
      effectiveName,
      effectiveRoleLabel,
      'SETTINGS_UPDATED',
      undefined,
      `Staff (${effectiveName}) updated society settings`
    );
    await loadSocietyScopedData();
    return true;
  };

  const renderSidebarContent = () => (
    <aside className="w-64 xl:w-72 shrink-0 bg-gradient-to-b from-[#0B2524] via-[#0F3331] to-[#081C1B] text-slate-100 flex flex-col h-full min-h-0 select-none">
      {/* Assigned Society + Staff Identity Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.04] space-y-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-lg shadow-teal-950/50 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300/80 block">
              Assigned Society
            </span>
            <h3 className="font-extrabold text-sm text-white truncate leading-tight">
              {effectiveSocietyName}
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              Code: {effectiveSocietyCode}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-black/25 border border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-200 flex items-center justify-center font-extrabold text-xs shrink-0">
            {effectiveName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">{effectiveName}</p>
            <p className="text-[10px] font-bold text-teal-300 truncate">
              {effectiveRoleLabel}
            </p>
            <p className="text-[10px] text-slate-300/75 truncate font-mono">{effectiveEmail}</p>
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
              ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-950/50'
              : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>My Role & Permissions</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-teal-500/20 text-teal-200'
            }`}
          >
            {grantedPermissionDefs.length}
          </span>
        </button>

        <div className="pt-2 pb-1 px-2 text-[10px] font-extrabold uppercase tracking-wider text-teal-200/60">
          Authorized Modules ({authorizedModules.length})
        </div>

        {authorizedModules.length === 0 ? (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30 text-[11px] text-amber-200">
            No modules assigned yet. Contact your Society Admin to enable permissions.
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
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-950/50'
                    : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-teal-300/75'}`} />
                  <span className="truncate">{mod.label}</span>
                </span>
              </button>
            );
          })
        )}
      </nav>

      {/* Bottom Portal Status + Sign Out */}
      <div className="p-3 border-t border-white/10 bg-black/20 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-teal-200/75">
          <span className="font-mono">Society Staff Portal</span>
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              isStaffDeactivated ? 'text-rose-400' : 'text-emerald-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStaffDeactivated ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
            />
            {isStaffDeactivated ? 'Inactive' : 'Active'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25 text-xs font-bold cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8F7] text-slate-900 font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">{renderSidebarContent()}</div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/50 backdrop-blur-xs">
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0B2524] shadow-2xl flex flex-col min-h-0">
            <div className="p-3 border-b border-white/10 flex items-center justify-between shrink-0">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-200 pl-1">
                Society Staff Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-teal-200 hover:text-white cursor-pointer"
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
        {/* Top Header clearly displaying Society Name, Code & Staff Role */}
        <header className="px-4 sm:px-6 lg:px-8 py-3.5 border-b border-teal-100/90 bg-white/95 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 cursor-pointer"
              aria-label="Open staff navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200">
                  <Building2 className="w-3.5 h-3.5 text-teal-700" />
                  {effectiveSocietyName} ({effectiveSocietyCode})
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Role: {effectiveRoleLabel}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate mt-1">
                {activeTab === 'overview'
                  ? `Society Staff Workspace — ${effectiveName}`
                  : activeModuleMeta?.label || 'Society Workspace'}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {activeTab === 'overview'
                  ? `${effectiveDepartment} • Scoped strictly to ${effectiveSocietyName} permissions granted by Society Admin`
                  : activeModuleMeta?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadSocietyScopedData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-teal-50 text-teal-700 cursor-pointer"
              title="Refresh Society Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-xs font-bold text-rose-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Main Scroll Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          {isStaffDeactivated ? (
            <div className="max-w-xl mx-auto mt-8 p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <Lock className="w-10 h-10 text-rose-600 mx-auto" />
              <h2 className="text-base font-extrabold text-rose-900">
                Staff Account Deactivated by Society Admin
              </h2>
              <p className="text-xs text-rose-700 leading-relaxed">
                Your access for <strong>{effectiveSocietyName}</strong> has been deactivated by your
                Society Admin. Please contact your Society Admin to restore access.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Society Identity & Assigned Role Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-600/10 via-emerald-50 to-white border border-teal-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <UserCog className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-extrabold text-slate-900">
                            Welcome, {effectiveName}
                          </h2>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ACTIVE SOCIETY STAFF
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">
                          Society: <strong className="text-teal-800">{effectiveSocietyName}</strong>{' '}
                          <span className="font-mono text-slate-500">({effectiveSocietyCode})</span>
                        </p>
                        <p className="text-xs text-slate-600">
                          Assigned Role: <strong className="text-indigo-700">{effectiveRoleLabel}</strong> •
                          Department: <strong>{effectiveDepartment}</strong> • Login:{' '}
                          <span className="font-mono font-semibold">{effectiveEmail}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 shrink-0">
                      <div className="px-4 py-2.5 rounded-xl bg-white border border-teal-100 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Granted Permissions
                        </span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          {grantedPermissionDefs.length}
                        </span>
                      </div>
                      <div className="px-4 py-2.5 rounded-xl bg-white border border-teal-100 text-center shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Unlocked Modules
                        </span>
                        <span className="text-lg font-extrabold text-teal-700">
                          {authorizedModules.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Society Modules */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Your Authorized Modules in {effectiveSocietyName}
                    </h3>
                    {authorizedModules.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                        Your Society Admin has not assigned any operational modules to your account yet.
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
                              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500 hover:shadow-sm text-left transition-all group cursor-pointer space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-teal-800">
                                  {mod.group}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
                                  <span>{mod.label}</span>
                                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                  {mod.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Granted vs Restricted Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
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
                              <p className="font-bold text-slate-900">{perm.label}</p>
                              <p className="text-[11px] text-slate-500">{perm.description}</p>
                            </div>
                          </div>
                        ))}
                        {grantedPermissionDefs.length === 0 && (
                          <p className="text-xs text-slate-500">No active permissions granted.</p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-slate-500" />
                          Restricted Permissions ({restrictedPermissionDefs.length})
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          SOCIETY ADMIN ONLY
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
                            All listed society operational permissions are currently granted.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Permission-Guarded Society Operational Modules */}
              {activeTab === 'profile' && hasPermission('society.structure.view') && (
                <SocietyProfileView
                  society={society}
                  buildings={buildings}
                  flats={flats}
                  onUpdateSociety={handleUpdateSociety}
                  onCreateBuilding={handleCreateBuilding}
                  onUpdateBuilding={handleUpdateBuilding}
                  onCreateFlat={handleCreateFlat}
                  onUpdateFlat={handleUpdateFlat}
                />
              )}

              {activeTab === 'buildings' && hasPermission('society.structure.view') && (
                <SocietyBuildingsView
                  society={society}
                  buildings={buildings}
                  flats={flats}
                  onUpdateSociety={handleUpdateSociety}
                  onCreateBuilding={handleCreateBuilding}
                  onUpdateBuilding={handleUpdateBuilding}
                  onCreateFlat={handleCreateFlat}
                  onUpdateFlat={handleUpdateFlat}
                />
              )}

              {activeTab === 'flats' && hasPermission('society.structure.view') && (
                <SocietyFlatsView
                  society={society}
                  buildings={buildings}
                  flats={flats}
                  onUpdateSociety={handleUpdateSociety}
                  onCreateBuilding={handleCreateBuilding}
                  onUpdateBuilding={handleUpdateBuilding}
                  onCreateFlat={handleCreateFlat}
                  onUpdateFlat={handleUpdateFlat}
                />
              )}

              {activeTab === 'residents' && hasPermission('society.residents.manage') && (
                <SocietyResidentsView
                  society={society}
                  residents={residents}
                  flats={flats}
                  onUpdateResidentStatus={handleUpdateResidentStatus}
                  onAssignFlat={handleAssignFlat}
                />
              )}

              {activeTab === 'household' && hasPermission('society.household.manage') && (
                <SocietyHouseholdView
                  society={society}
                  flats={flats}
                  household={household}
                  vehicles={vehicles}
                  helpers={helpers}
                  onToggleHelperStatus={handleToggleHelperStatus}
                  onAddHelper={handleAddHelper}
                  onUpdateHelper={handleUpdateHelper}
                  onDeleteHelper={handleDeleteHelper}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onAddHouseholdMember={handleAddHouseholdMember}
                  onUpdateHouseholdMember={handleUpdateHouseholdMember}
                  onDeleteHouseholdMember={handleDeleteHouseholdMember}
                />
              )}

              {activeTab === 'guards' && hasPermission('society.guards_gates.manage') && (
                <SocietyGuardsView
                  society={society}
                  guards={guards}
                  gates={gates}
                  onAddGuard={handleAddGuard}
                  onToggleGuardStatus={handleToggleGuardStatus}
                />
              )}

              {activeTab === 'gates' && hasPermission('society.guards_gates.manage') && (
                <SocietyGatesView
                  society={society}
                  gates={gates}
                  onAddGate={handleAddGate}
                  onUpdateGate={handleUpdateGate}
                />
              )}

              {activeTab === 'visitors' && hasPermission('society.visitors.manage') && (
                <SocietyVisitorsView
                  society={society}
                  visitors={visitors}
                  onCheckOutVisitor={handleCheckOutVisitor}
                />
              )}

              {activeTab === 'pre-approvals' && hasPermission('society.visitors.manage') && (
                <SocietyPreApprovalsView
                  society={society}
                  passes={visitors}
                  onRevokePass={handleRevokePass}
                />
              )}

              {activeTab === 'emergency' && hasPermission('society.emergency.monitor') && (
                <SocietyEmergencyView
                  society={society}
                  alerts={emergencyAlerts}
                  onResolveAlert={handleResolveAlert}
                />
              )}

              {activeTab === 'notices' && hasPermission('society.notices.manage') && (
                <SocietyNoticesView
                  society={society}
                  notices={notices}
                  onCreateNotice={handleCreateNotice}
                  onArchiveNotice={handleArchiveNotice}
                />
              )}

              {activeTab === 'helpdesk' && hasPermission('society.helpdesk.manage') && (
                <SocietyHelpDeskView
                  society={society}
                  complaints={complaints}
                  onUpdateComplaint={handleUpdateComplaint}
                />
              )}

              {activeTab === 'amenities' && hasPermission('society.amenities.manage') && (
                <SocietyAmenitiesView
                  society={society}
                  amenities={amenities}
                  bookings={bookings}
                  onApproveBooking={handleApproveBooking}
                  onRejectBooking={handleRejectBooking}
                />
              )}

              {activeTab === 'community' && hasPermission('society.community.manage') && (
                <SocietyCommunityView
                  society={society}
                  posts={communityPosts}
                  onModeratePost={handleModeratePost}
                />
              )}

              {activeTab === 'service-partners' && hasPermission('society.community.manage') && (
                <SocietyServicePartnersView
                  society={society}
                  partners={partners}
                  onToggleSocietyAccess={async () => {
                    await loadSocietyScopedData();
                  }}
                  onRefresh={loadSocietyScopedData}
                />
              )}

              {activeTab === 'maintenance' && hasPermission('society.maintenance.manage') && (
                <SocietyMaintenanceView
                  society={society}
                  invoices={invoices}
                  flats={flats}
                  onGenerateMonthlyInvoices={handleGenerateMonthlyInvoices}
                  onRecordOfflinePayment={handleRecordOfflinePayment}
                />
              )}

              {activeTab === 'reports' && hasPermission('society.reports.view') && (
                <SocietyReportsView
                  society={society}
                  data={{
                    residents,
                    flats,
                    visitors,
                    invoices,
                    complaints,
                    guards,
                    amenities,
                    auditLogs,
                  }}
                />
              )}

              {activeTab === 'settings' &&
                hasPermission('society.settings.manage') &&
                settings && (
                  <SocietySettingsView
                    society={society}
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                  />
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocietyStaffDashboard;
