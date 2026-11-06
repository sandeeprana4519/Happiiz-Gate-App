/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { societyAdminService } from '../../services/firebase/societyAdmin.service';
import { SocietyAdminSidebar, SocietyAdminTab } from '../../components/societyAdmin/SocietyAdminSidebar';
import { SocietyAdminHeader } from '../../components/societyAdmin/SocietyAdminHeader';
import { SocietyOverviewView } from '../../components/societyAdmin/SocietyOverviewView';
import { 
  SocietyProfileView, 
  SocietyBuildingsView, 
  SocietyFlatsView 
} from '../../components/societyAdmin/SocietyStructureViews';
import { 
  SocietyResidentsView, 
  SocietyHouseholdView, 
  SocietyStaffView 
} from '../../components/societyAdmin/SocietyPeopleViews';
import { 
  SocietyGuardsView, 
  SocietyGatesView, 
  SocietyVisitorsView, 
  SocietyPreApprovalsView, 
  SocietyEmergencyView,
  GuardItem
} from '../../components/societyAdmin/SocietySecurityViews';
import { 
  SocietyNoticesView, 
  SocietyHelpDeskView, 
  SocietyMaintenanceView, 
  SocietyAmenitiesView, 
  SocietyCommunityView, 
  SocietyServicePartnersView 
} from '../../components/societyAdmin/SocietyOperationsViews';
import { 
  SocietyReportsView, 
  SocietySettingsView 
} from '../../components/societyAdmin/SocietyReportsAndSettingsViews';
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
  SocietyAdminAnalytics,
  SocietyAuditLogEntry,
  SocietyAdminRole
} from '../../types/societyAdmin';
import { Society, GatePass } from '../../types/society';
import { syncBus } from '../../services/firebase/sync.service';
import { Loader2 } from 'lucide-react';

export const SocietyAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SocietyAdminTab>(
    (searchParams.get('tab') as SocietyAdminTab) || 'dashboard'
  );
  const [activeRole, setActiveRole] = useState<SocietyAdminRole>('SOCIETY_ADMIN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Authoritative Society Scope
  const currentSocietyId = user?.societyId || 'soc_emerald_heights';

  // Society State
  const [society, setSociety] = useState<Society>({
    id: currentSocietyId,
    societyName: user?.societyName || 'Emerald Heights Luxury Enclave',
    name: user?.societyName || 'Emerald Heights Luxury Enclave',
    societyCode: 'EMR-01',
    address: 'Survey No. 42, Hiranandani Estate, Thane West',
    city: 'Mumbai',
    state: 'Maharashtra',
    contactEmail: 'admin@emeraldheights.in',
    contactPhone: '+91 98765 00001',
    totalFlats: 450,
    occupiedFlats: 412,
    totalGates: 3,
    activeGuards: 8,
    subscriptionPlan: 'Enterprise',
    status: 'ACTIVE'
  });

  const [analytics, setAnalytics] = useState<SocietyAdminAnalytics | null>(null);
  const [buildings, setBuildings] = useState<SocietyBuilding[]>([]);
  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [residents, setResidents] = useState<SocietyResidentMember[]>([]);
  const [household, setHousehold] = useState<SocietyHouseholdMember[]>([]);
  const [vehicles, setVehicles] = useState<SocietyVehicle[]>([]);
  const [helpers, setHelpers] = useState<SocietyDomesticHelper[]>([]);
  const [guards, setGuards] = useState<GuardItem[]>([
    { id: 'grd_1', societyId: currentSocietyId, name: 'Bahadur Singh', phoneNumber: '+91 98765 00010', badgeNumber: 'SEC-101', gateAssigned: 'Main Gate #1', shift: 'DAY', status: 'ACTIVE', isSupervisor: true },
    { id: 'grd_2', societyId: currentSocietyId, name: 'Ranjit Roy', phoneNumber: '+91 98765 00011', badgeNumber: 'SEC-102', gateAssigned: 'North Service Gate', shift: 'DAY', status: 'ACTIVE' },
    { id: 'grd_3', societyId: currentSocietyId, name: 'Kalyan Das', phoneNumber: '+91 98765 00012', badgeNumber: 'SEC-103', gateAssigned: 'West Pedestrian Gate', shift: 'ROTATIONAL', status: 'ACTIVE' },
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
  const [staff, setStaff] = useState<SocietyStaffMember[]>([]);
  const [settings, setSettings] = useState<SocietyDetailedSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<SocietyAuditLogEntry[]>([]);

  const partners = [
    { id: 'sp_1', companyName: 'Bisleri Pure Water Delivery', category: 'Water Supply', contactPerson: 'Sunil Verma', phoneNumber: '+91 98201 11223' },
    { id: 'sp_2', companyName: 'Airtel Xstream Fiber Broadband', category: 'Internet / ISP', contactPerson: 'Pradeep Joshi', phoneNumber: '+91 98201 44556' },
    { id: 'sp_3', companyName: 'Otis Elevator AMC', category: 'Lift Maintenance', contactPerson: 'Anand Kumar', phoneNumber: '+91 98201 77889' },
  ];

  // Load All Society-Scoped Datasets
  const loadSocietyData = async () => {
    try {
      const [
        anaData,
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
        stfData,
        setData,
        audData
      ] = await Promise.all([
        societyAdminService.getSocietyAdminAnalytics(currentSocietyId),
        societyAdminService.getBuildings(currentSocietyId),
        societyAdminService.getFlats(currentSocietyId),
        societyAdminService.getResidents(currentSocietyId),
        societyAdminService.getHouseholdMembers(currentSocietyId),
        societyAdminService.getVehicles(currentSocietyId),
        societyAdminService.getDomesticHelpers(currentSocietyId),
        societyAdminService.getGates(currentSocietyId),
        societyAdminService.getVisitors(currentSocietyId),
        societyAdminService.getNotices(currentSocietyId),
        societyAdminService.getComplaints(currentSocietyId),
        societyAdminService.getInvoices(currentSocietyId),
        societyAdminService.getAmenities(currentSocietyId),
        societyAdminService.getBookings(currentSocietyId),
        societyAdminService.getEmergencyAlerts(currentSocietyId),
        societyAdminService.getCommunityPosts(currentSocietyId),
        societyAdminService.getStaff(currentSocietyId),
        societyAdminService.getSettings(currentSocietyId),
        societyAdminService.getAuditLogs(currentSocietyId)
      ]);

      setAnalytics(anaData);
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
      setStaff(stfData);
      setSettings(setData);
      setAuditLogs(audData);
    } catch (err) {
      console.error('Error loading society admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocietyData();
    const unsubscribeSync = syncBus.subscribeAll((event) => {
      if (event.societyId === currentSocietyId || event.societyId === 'all') {
        loadSocietyData();
      }
    });
    return () => {
      unsubscribeSync();
    };
  }, [currentSocietyId]);

  const handleSelectTab = (tab: SocietyAdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Action handlers
  const handleUpdateSociety = async (data: Partial<Society>) => {
    setSociety(prev => ({ ...prev, ...data }));
  };

  const handleCreateBuilding = async (bld: any) => {
    await societyAdminService.createBuilding(
      currentSocietyId,
      bld.name,
      bld.type,
      bld.floorsCount,
      bld.totalFlats
    );
    await loadSocietyData();
  };

  const handleUpdateBuilding = async (id: string, data: Partial<SocietyBuilding>) => {
    await societyAdminService.updateBuilding(id, data);
    await loadSocietyData();
  };

  const handleCreateFlat = async (flt: any) => {
    await societyAdminService.createFlat(currentSocietyId, flt);
    await loadSocietyData();
  };

  const handleUpdateFlat = async (id: string, data: Partial<SocietyFlat>) => {
    await societyAdminService.updateFlat(currentSocietyId, id, data);
    await loadSocietyData();
  };

  const handleUpdateResidentStatus = async (id: string, status: SocietyResidentMember['membershipStatus']) => {
    await societyAdminService.updateResidentStatus(currentSocietyId, id, status);
    await loadSocietyData();
  };

  const handleAssignFlat = async (id: string, flatNumber: string, occupantType: 'OWNER' | 'TENANT') => {
    await societyAdminService.assignFlatToResident(id, flatNumber, occupantType);
    await loadSocietyData();
  };

  const handleToggleHelperStatus = async (id: string, currentStatus: 'ACTIVE' | 'REVOKED') => {
    await societyAdminService.toggleHelperStatus(id, currentStatus);
    await loadSocietyData();
  };

  const handleAddVehicle = async (v: any) => {
    await societyAdminService.createVehicle(currentSocietyId, v);
    await loadSocietyData();
  };

  const handleAddGuard = async (g: any) => {
    setGuards(prev => [...prev, { ...g, id: `grd_${Date.now()}` }]);
  };

  const handleToggleGuardStatus = async (id: string, currentStatus: GuardItem['status']) => {
    setGuards(prev => prev.map(g => g.id === id ? { ...g, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : g));
  };

  const handleAddGate = async (g: any) => {
    await societyAdminService.createGate(
      currentSocietyId,
      g.name,
      g.locationDescription,
      g.hasBoomBarrier,
      g.hasLicensePlateCamera
    );
    await loadSocietyData();
  };

  const handleUpdateGate = async (id: string, data: Partial<SocietyGate>) => {
    await societyAdminService.updateGate(id, data);
    await loadSocietyData();
  };

  const handleCheckOutVisitor = async (id: string) => {
    await societyAdminService.checkOutVisitor(id);
    await loadSocietyData();
  };

  const handleCreateNotice = async (n: any) => {
    await societyAdminService.createNotice(currentSocietyId, n);
    await loadSocietyData();
  };

  const handleArchiveNotice = async (id: string) => {
    await societyAdminService.archiveNotice(id);
    await loadSocietyData();
  };

  const handleUpdateComplaint = async (id: string, data: Partial<SocietyComplaint>) => {
    await societyAdminService.updateComplaint(
      currentSocietyId,
      id,
      data.status || 'RESOLVED',
      data.adminReply,
      data.assignedStaff
    );
    await loadSocietyData();
  };

  const handleGenerateMonthlyInvoices = async (month: string, amountPerFlat: number) => {
    await societyAdminService.generateMonthlyInvoices(currentSocietyId, amountPerFlat, month);
    await loadSocietyData();
  };

  const handleRecordOfflinePayment = async (invoiceId: string, receiptNumber: string) => {
    await societyAdminService.recordOfflinePayment(
      currentSocietyId,
      invoiceId,
      'Bank Transfer / Cash',
      receiptNumber
    );
    await loadSocietyData();
  };

  const handleApproveBooking = async (id: string) => {
    await societyAdminService.updateBookingStatus(currentSocietyId, id, 'CONFIRMED');
    await loadSocietyData();
  };

  const handleRejectBooking = async (id: string) => {
    await societyAdminService.updateBookingStatus(currentSocietyId, id, 'CANCELLED');
    await loadSocietyData();
  };

  const handleResolveAlert = async (id: string, notes: string) => {
    await societyAdminService.resolveEmergencyAlert(currentSocietyId, id, notes);
    await societyAdminService.recordAuditLog(
      currentSocietyId,
      user?.uid || 'usr_admin',
      user?.fullName || 'Society Admin',
      activeRole,
      'EMERGENCY_RESOLVED',
      id,
      `Resolved emergency incident: ${notes}`
    );
    await loadSocietyData();
  };

  const handleRevokePass = async (passId: string, reason: string) => {
    await societyAdminService.revokeGatePassWithAudit(
      currentSocietyId,
      passId,
      reason,
      user?.fullName || 'Society Admin',
      user?.uid || 'usr_admin',
      activeRole
    );
    await loadSocietyData();
  };

  const handleModeratePost = async (id: string, action: 'APPROVED' | 'REPORTED' | 'HIDDEN') => {
    await societyAdminService.moderatePost(id, action);
    await loadSocietyData();
  };

  const handleToggleSocietyAccess = async (partnerId: string) => {
    await loadSocietyData();
  };

  const handleAddStaff = async (s: any) => {
    await societyAdminService.createStaff(s);
    await loadSocietyData();
  };

  const handleToggleStaffStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    await societyAdminService.toggleStaffStatus(id, currentStatus);
    await loadSocietyData();
  };

  const handleUpdateSettings = async (s: Partial<SocietyDetailedSettings>) => {
    if (!settings) return false;
    const merged = { ...settings, ...s };
    await societyAdminService.updateSettings(currentSocietyId, merged);
    await societyAdminService.recordAuditLog(
      currentSocietyId,
      user?.uid || 'usr_admin',
      user?.fullName || 'Society Admin',
      activeRole,
      'SETTINGS_UPDATED',
      undefined,
      'Updated society rules and operational configurations'
    );
    await loadSocietyData();
    return true;
  };

  if (loading || !analytics || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#673AB7] animate-spin" />
          <p className="text-sm font-semibold text-gray-600">Loading Society Command Center...</p>
        </div>
      </div>
    );
  }

  const activeAlertCount = emergencyAlerts.filter(a => a.status === 'ACTIVE').length;
  const openComplaintsCount = complaints.filter(c => c.status === 'OPEN').length;

  return (
    <div className="flex min-h-screen bg-[#FFFFFF] text-gray-900 font-sans antialiased">
      {/* Responsive Left Navigation Sidebar */}
      <SocietyAdminSidebar
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        activeEmergencyAlertsCount={activeAlertCount}
        openComplaintsCount={openComplaintsCount}
        societyName={society.societyName || society.name || 'Emerald Heights'}
        societyCode={society.societyCode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Header */}
        <SocietyAdminHeader
          title={
            activeTab === 'dashboard' ? 'Society Command Center' :
            activeTab === 'profile' ? 'Society Identity & Profile' :
            activeTab === 'buildings' ? 'Towers & Blocks Management' :
            activeTab === 'flats' ? 'Apartment & Flat Roster' :
            activeTab === 'residents' ? 'Resident Directory & Approvals' :
            activeTab === 'household' ? 'Household, Staff & Vehicles' :
            activeTab === 'guards' ? 'Security Guard Roster' :
            activeTab === 'gates' ? 'Gate Checkpoints & Access' :
            activeTab === 'visitors' ? 'Live Visitor Ingress Log' :
            activeTab === 'pre-approvals' ? 'Digital GatePasses' :
            activeTab === 'notices' ? 'Notice Board Management' :
            activeTab === 'helpdesk' ? 'HelpDesk & Complaint Triage' :
            activeTab === 'maintenance' ? 'Maintenance Dues & Invoicing' :
            activeTab === 'amenities' ? 'Amenities & Club Reservations' :
            activeTab === 'emergency' ? 'Emergency Panic Center' :
            activeTab === 'community' ? 'Community Discussion Feed' :
            activeTab === 'service-partners' ? 'Verified Commercial Vendors' :
            activeTab === 'reports' ? 'Reports, Exports & Audits' :
            activeTab === 'staff' ? 'Society Staff & Roles' :
            'Society Rules & Settings'
          }
          subtitle={`Managing ${society.societyName || society.name} (${society.societyCode})`}
          societyName={society.societyName || society.name || 'Emerald Heights'}
          societyCode={society.societyCode}
          activeEmergenciesCount={activeAlertCount}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <SocietyOverviewView
              analytics={analytics}
              onNavigateTab={(tab: any) => handleSelectTab(tab as SocietyAdminTab)}
            />
          )}

          {activeTab === 'profile' && (
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

          {activeTab === 'buildings' && (
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

          {activeTab === 'flats' && (
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

          {activeTab === 'residents' && (
            <SocietyResidentsView
              society={society}
              residents={residents}
              flats={flats}
              onUpdateResidentStatus={handleUpdateResidentStatus}
              onAssignFlat={handleAssignFlat}
            />
          )}

          {activeTab === 'household' && (
            <SocietyHouseholdView
              society={society}
              household={household}
              vehicles={vehicles}
              helpers={helpers}
              onToggleHelperStatus={handleToggleHelperStatus}
              onAddVehicle={handleAddVehicle}
            />
          )}

          {activeTab === 'guards' && (
            <SocietyGuardsView
              society={society}
              guards={guards}
              gates={gates}
              onAddGuard={handleAddGuard}
              onToggleGuardStatus={handleToggleGuardStatus}
            />
          )}

          {activeTab === 'gates' && (
            <SocietyGatesView
              society={society}
              gates={gates}
              onAddGate={handleAddGate}
              onUpdateGate={handleUpdateGate}
            />
          )}

          {activeTab === 'visitors' && (
            <SocietyVisitorsView
              society={society}
              visitors={visitors}
              onCheckOutVisitor={handleCheckOutVisitor}
            />
          )}

          {activeTab === 'pre-approvals' && (
            <SocietyPreApprovalsView
              society={society}
              passes={visitors}
              onRevokePass={handleRevokePass}
            />
          )}

          {activeTab === 'notices' && (
            <SocietyNoticesView
              society={society}
              notices={notices}
              onCreateNotice={handleCreateNotice}
              onArchiveNotice={handleArchiveNotice}
            />
          )}

          {activeTab === 'helpdesk' && (
            <SocietyHelpDeskView
              society={society}
              complaints={complaints}
              onUpdateComplaint={handleUpdateComplaint}
            />
          )}

          {activeTab === 'maintenance' && (
            <SocietyMaintenanceView
              society={society}
              invoices={invoices}
              flats={flats}
              onGenerateMonthlyInvoices={handleGenerateMonthlyInvoices}
              onRecordOfflinePayment={handleRecordOfflinePayment}
            />
          )}

          {activeTab === 'amenities' && (
            <SocietyAmenitiesView
              society={society}
              amenities={amenities}
              bookings={bookings}
              onApproveBooking={handleApproveBooking}
              onRejectBooking={handleRejectBooking}
            />
          )}

          {activeTab === 'emergency' && (
            <SocietyEmergencyView
              society={society}
              alerts={emergencyAlerts}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {activeTab === 'community' && (
            <SocietyCommunityView
              society={society}
              posts={communityPosts}
              onModeratePost={handleModeratePost}
            />
          )}

          {activeTab === 'service-partners' && (
            <SocietyServicePartnersView
              society={society}
              partners={partners}
              onToggleSocietyAccess={handleToggleSocietyAccess}
            />
          )}

          {activeTab === 'reports' && (
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
                auditLogs
              }}
            />
          )}

          {activeTab === 'staff' && (
            <SocietyStaffView
              society={society}
              staff={staff}
              onAddStaff={handleAddStaff}
              onToggleStaffStatus={handleToggleStaffStatus}
            />
          )}

          {activeTab === 'settings' && (
            <SocietySettingsView
              society={society}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
};
export default SocietyAdminDashboard;
