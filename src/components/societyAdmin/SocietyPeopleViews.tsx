import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Briefcase, 
  Search, 
  Plus, 
  Check, 
  Home,
  Copy,
  Eye,
  Edit3,
  Trash2,
  QrCode,
  ShieldCheck,
  RefreshCw,
  X,
  FileDown,
  Phone,
  Clock,
  Building2,
  AlertTriangle,
  Lock,
  Mail,
  EyeOff,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { 
  SocietyResidentMember, 
  SocietyHouseholdMember, 
  SocietyVehicle, 
  SocietyDomesticHelper, 
  SocietyStaffMember,
  SocietyStaffRoleLabel,
  SocietyFlat
} from '../../types/societyAdmin';
import { Society } from '../../types/society';
import { SocietyPdfExportToolbar } from './SocietyPdfExportToolbar';
import {
  SocietyPeriodMode,
  matchesSocietyPeriod,
  buildSocietyPeriodLabel,
  buildSocietySlug,
  exportSocietyPdf,
  normalizeSocietyIsoDate,
} from './societyPdfExportUtils';
import {
  SOCIETY_STAFF_PERMISSIONS,
  DEFAULT_SOCIETY_STAFF_PERMISSIONS,
  getSocietyPermissionLabel,
} from './societyStaffPermissions';

// -------------------------------------------------------------
// MODULE 5: RESIDENT MANAGEMENT
// -------------------------------------------------------------
interface ResidentsViewProps {
  society: Society;
  residents: SocietyResidentMember[];
  flats: SocietyFlat[];
  onUpdateResidentStatus: (id: string, status: SocietyResidentMember['membershipStatus']) => Promise<void>;
  onAssignFlat: (id: string, flatNumber: string, occupantType: 'OWNER' | 'TENANT') => Promise<void>;
}

export const SocietyResidentsView: React.FC<ResidentsViewProps> = ({
  society,
  residents,
  flats,
  onUpdateResidentStatus,
  onAssignFlat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));
  const [selectedResident, setSelectedResident] = useState<SocietyResidentMember | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetFlat, setTargetFlat] = useState('');
  const [targetType, setTargetType] = useState<'OWNER' | 'TENANT'>('OWNER');

  const filteredResidents = residents.filter((r) => {
    const matchSearch =
      searchTerm === '' ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber.includes(searchTerm) ||
      r.flatNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOcc = occupancyFilter === 'ALL' || r.occupantType === occupancyFilter;
    const matchStatus = statusFilter === 'ALL' || r.membershipStatus === statusFilter;
    const matchPeriod = matchesSocietyPeriod(
      r.moveInDate || r.joinedAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    return matchSearch && matchOcc && matchStatus && matchPeriod;
  });

  const handleDownloadResidentsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Full Name',
      'UID',
      'Phone',
      'Email',
      'Tower / Block',
      'Flat No',
      'Type',
      'Status',
      'Joined Date',
      'Move-In Date',
    ];
    const rows = filteredResidents.map((r) => ({
      'Full Name': r.fullName,
      UID: r.uid,
      Phone: r.phoneNumber,
      Email: r.email || '—',
      'Tower / Block': r.buildingName || '—',
      'Flat No': r.flatNumber || 'Unassigned',
      Type: r.occupantType,
      Status: r.membershipStatus,
      'Joined Date': normalizeSocietyIsoDate(r.joinedAt) || '—',
      'Move-In Date': normalizeSocietyIsoDate(r.moveInDate) || '—',
    }));

    const searchPart = searchTerm.trim() ? ` | Search: "${searchTerm.trim()}"` : '';
    const filterSummary = `Period: ${period.label} | Occupancy: ${
      occupancyFilter === 'ALL' ? 'Owner & Tenant' : occupancyFilter
    } | Status: ${statusFilter === 'ALL' ? 'All' : statusFilter}${searchPart} | Residents: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Residents Roster Report',
      subtitle: 'People & Households • Verified Owners, Tenants & Flat Allocations',
      filename: `${socSlug}_residents_roster_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  const handleOpenAssign = (r: SocietyResidentMember) => {
    setSelectedResident(r);
    setTargetFlat(r.flatNumber || (flats[0]?.flatNumber || ''));
    setTargetType(r.occupantType || 'OWNER');
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedResident || !targetFlat) return;
    await onAssignFlat(selectedResident.uid, targetFlat, targetType);
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Resident Directory & Approvals</h2>
          <p className="text-sm text-gray-500">Manage resident verifications, flat allotments, owners and tenants</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-[#F1F9FC] text-gray-700 font-semibold rounded-xl border border-gray-200">
            Total Residents: {residents.length}
          </span>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by resident name, phone, flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Types (Owner/Tenant)</option>
            <option value="OWNER">Owners Only</option>
            <option value="TENANT">Tenants Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending Approval</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <span className="text-xs text-gray-500 ml-auto md:ml-0 font-medium tabular-nums">
            Showing {filteredResidents.length}
          </span>
        </div>
      </div>

      {/* PDF Export Toolbar */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredResidents.length}
        onExportPdf={handleDownloadResidentsPdf}
        pdfButtonLabel="Download Residents PDF"
        onResetPeriod={() => setPeriodMode('ALL')}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Resident</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">Flat Allocated</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No residents found.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.uid} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#673AB7]/10 text-[#673AB7] font-bold flex items-center justify-center text-sm">
                          {r.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{r.fullName}</div>
                          <div className="text-xs text-gray-400">UID: {r.uid.slice(0, 10)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <div>{r.phoneNumber}</div>
                      {r.email && <div className="text-gray-400">{r.email}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.flatNumber ? (
                        <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-[#673AB7]" />
                          {r.flatNumber}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.occupantType === 'OWNER' 
                          ? 'bg-purple-100 text-[#673AB7]' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.occupantType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.membershipStatus === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.membershipStatus === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {r.membershipStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.membershipStatus === 'PENDING' && (
                          <button
                            onClick={() => onUpdateResidentStatus(r.uid, 'ACTIVE')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Approve Resident"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {r.membershipStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => onUpdateResidentStatus(r.uid, 'SUSPENDED')}
                            className="text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                          >
                            Suspend
                          </button>
                        ) : r.membershipStatus === 'SUSPENDED' ? (
                          <button
                            onClick={() => onUpdateResidentStatus(r.uid, 'ACTIVE')}
                            className="text-xs px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition"
                          >
                            Reactivate
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleOpenAssign(r)}
                          className="text-xs text-[#673AB7] hover:bg-purple-50 px-2.5 py-1 rounded-lg font-semibold transition"
                        >
                          Flat & Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flat Assign Modal */}
      {showAssignModal && selectedResident && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Assign Flat & Occupancy</h3>
            <p className="text-xs text-gray-500 mb-4">Set flat address and role for {selectedResident.fullName}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Flat</label>
                <select
                  value={targetFlat}
                  onChange={(e) => setTargetFlat(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  {flats.map((f) => (
                    <option key={f.id} value={f.flatNumber}>
                      {f.flatNumber} ({f.buildingName} - {f.flatType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Occupancy Classification</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="OWNER">Owner (Primary Member)</option>
                  <option value="TENANT">Tenant (Leased Resident)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  Save Allotment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 6: FAMILY & HOUSEHOLD MANAGEMENT
// -------------------------------------------------------------
interface HouseholdViewProps {
  society: Society;
  flats?: SocietyFlat[];
  household: SocietyHouseholdMember[];
  vehicles: SocietyVehicle[];
  helpers: SocietyDomesticHelper[];
  onToggleHelperStatus: (id: string, currentStatus: 'ACTIVE' | 'REVOKED') => Promise<void>;
  onAddHelper: (h: Omit<SocietyDomesticHelper, 'id' | 'societyId'>) => Promise<void>;
  onUpdateHelper: (id: string, updates: Partial<SocietyDomesticHelper>) => Promise<void>;
  onDeleteHelper: (id: string) => Promise<void>;
  onAddVehicle: (v: any) => Promise<void>;
  onUpdateVehicle: (id: string, updates: Partial<SocietyVehicle>) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  onAddHouseholdMember: (m: Omit<SocietyHouseholdMember, 'id' | 'societyId'>) => Promise<void>;
  onUpdateHouseholdMember: (id: string, updates: Partial<SocietyHouseholdMember>) => Promise<void>;
  onDeleteHouseholdMember: (id: string) => Promise<void>;
}

const generateOtpCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

export const SocietyHouseholdView: React.FC<HouseholdViewProps> = ({
  society,
  flats = [],
  household,
  vehicles,
  helpers,
  onToggleHelperStatus,
  onAddHelper,
  onUpdateHelper,
  onDeleteHelper,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onAddHouseholdMember,
  onUpdateHouseholdMember,
  onDeleteHouseholdMember,
}) => {
  const [activeTab, setActiveTab] = useState<'HELPERS' | 'VEHICLES' | 'FAMILY'>('HELPERS');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const defaultFlat = flats[0]?.flatNumber || 'A-402';
  const societyDisplayName = society.societyName || society.name || 'Emerald Heights';

  // Helper Add/Edit Modal State
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [editingHelper, setEditingHelper] = useState<SocietyDomesticHelper | null>(null);
  const [helperName, setHelperName] = useState('');
  const [helperRole, setHelperRole] = useState<SocietyDomesticHelper['role']>('Maid');
  const [helperPhone, setHelperPhone] = useState('');
  const [helperFlat, setHelperFlat] = useState(defaultFlat);
  const [helperWorkingHours, setHelperWorkingHours] = useState('08:00 AM - 12:00 PM');
  const [helperPassCode, setHelperPassCode] = useState(generateOtpCode);
  const [helperStaffCode, setHelperStaffCode] = useState('');
  const [helperPoliceVerified, setHelperPoliceVerified] = useState(true);
  const [helperStatus, setHelperStatus] = useState<'ACTIVE' | 'REVOKED'>('ACTIVE');

  // Vehicle Add/Edit Modal State (NO RFID)
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<SocietyVehicle | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Motorcycle' | 'EV' | 'Bicycle'>('Car');
  const [flatNumber, setFlatNumber] = useState(defaultFlat);
  const [parkingSlot, setParkingSlot] = useState('');

  // Family Member Add/Edit Modal State
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<SocietyHouseholdMember | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState<SocietyHouseholdMember['relationship']>('Spouse');
  const [familyFlat, setFamilyFlat] = useState(defaultFlat);
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyAge, setFamilyAge] = useState('');
  const [familyEmergency, setFamilyEmergency] = useState(false);

  // View Modals
  const [viewingHelper, setViewingHelper] = useState<SocietyDomesticHelper | null>(null);
  const [helperQrDataUrl, setHelperQrDataUrl] = useState<string>('');
  const [viewingVehicle, setViewingVehicle] = useState<SocietyVehicle | null>(null);
  const [viewingFamily, setViewingFamily] = useState<SocietyHouseholdMember | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'HELPER' | 'VEHICLE' | 'FAMILY';
    id: string;
    label: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!viewingHelper) {
      setHelperQrDataUrl('');
      return;
    }
    const payload =
      viewingHelper.qrToken ||
      JSON.stringify({
        type: 'DOMESTIC_HELPER_PASS',
        id: viewingHelper.id,
        helperId: viewingHelper.helperId || viewingHelper.id,
        code: viewingHelper.passCode,
        gatePassNumber: viewingHelper.gatePassNumber || `GP-HLP-${viewingHelper.passCode}`,
        societyId: society.id,
        societyName: societyDisplayName,
        flatNumber: viewingHelper.flatNumber,
        name: viewingHelper.name,
        role: viewingHelper.role,
      });

    QRCode.toDataURL(payload, { width: 220, margin: 1, color: { dark: '#0B2524', light: '#FFFFFF' } })
      .then((url) => setHelperQrDataUrl(url))
      .catch(() => setHelperQrDataUrl(''));
  }, [viewingHelper, society.id, societyDisplayName]);

  const showCopyFeedback = (id: string, text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setToastMsg(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
    setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  const q = searchTerm.trim().toLowerCase();

  const filteredHelpers = helpers.filter((h) => {
    const matchPeriod = matchesSocietyPeriod(
      h.createdAt || h.updatedAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    const matchSearch =
      !q ||
      h.name.toLowerCase().includes(q) ||
      (h.helperId || '').toLowerCase().includes(q) ||
      h.flatNumber.toLowerCase().includes(q) ||
      h.role.toLowerCase().includes(q) ||
      h.passCode.toLowerCase().includes(q) ||
      h.phone.toLowerCase().includes(q);
    return matchPeriod && matchSearch;
  });

  const filteredVehicles = vehicles.filter((v) => {
    const matchPeriod = matchesSocietyPeriod(
      v.createdAt || v.updatedAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    const matchSearch =
      !q ||
      v.plateNumber.toLowerCase().includes(q) ||
      v.makeModel.toLowerCase().includes(q) ||
      v.flatNumber.toLowerCase().includes(q) ||
      v.parkingSlot.toLowerCase().includes(q);
    return matchPeriod && matchSearch;
  });

  const filteredHousehold = household.filter((m) => {
    const matchPeriod = matchesSocietyPeriod(
      m.createdAt || m.updatedAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.flatNumber.toLowerCase().includes(q) ||
      m.relationship.toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q);
    return matchPeriod && matchSearch;
  });

  // PDF Export Handlers
  const handleDownloadActiveTabPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const searchPart = q ? ` | Search: "${searchTerm.trim()}"` : '';

    if (activeTab === 'HELPERS') {
      const columns = [
        'Helper ID',
        'Gate Pass No',
        'Helper Name',
        'Role',
        'Phone',
        'Flat No',
        'Guard OTP',
        'Working Hours',
        'Police Verified',
        'Status',
        'Added Date',
      ];
      const rows = filteredHelpers.map((h) => ({
        'Helper ID': h.helperId || h.id,
        'Gate Pass No': h.gatePassNumber || `GP-HLP-${h.passCode}`,
        'Helper Name': h.name,
        Role: h.role,
        Phone: h.phone,
        'Flat No': h.flatNumber,
        'Guard OTP': h.passCode,
        'Working Hours': h.workingHours,
        'Police Verified': h.policeVerificationVerified ? 'Verified' : 'Pending',
        Status: h.status,
        'Added Date': normalizeSocietyIsoDate(h.createdAt || h.updatedAt) || '—',
      }));
      exportSocietyPdf({
        society,
        title: 'Domestic Helpers & Staff Directory',
        subtitle: 'People & Households • Gate Pass, Guard OTP & Police Verification Register',
        filename: `${socSlug}_domestic_helpers_${period.slug}`,
        columns,
        rows,
        filterSummary: `Period: ${period.label} | Tab: Domestic Helpers & Staff${searchPart} | Records: ${rows.length}`,
      });
    } else if (activeTab === 'VEHICLES') {
      const columns = [
        'Plate Number',
        'Vehicle Type',
        'Make & Model',
        'Flat No',
        'Parking Slot',
        'Registered Date',
      ];
      const rows = filteredVehicles.map((v) => ({
        'Plate Number': v.plateNumber,
        'Vehicle Type': v.vehicleType,
        'Make & Model': v.makeModel,
        'Flat No': v.flatNumber,
        'Parking Slot': v.parkingSlot,
        'Registered Date': normalizeSocietyIsoDate(v.createdAt || v.updatedAt) || '—',
      }));
      exportSocietyPdf({
        society,
        title: 'Society Vehicles Registry',
        subtitle: 'People & Households • Registered Resident Vehicles & Parking Slots',
        filename: `${socSlug}_society_vehicles_${period.slug}`,
        columns,
        rows,
        filterSummary: `Period: ${period.label} | Tab: Society Vehicles${searchPart} | Records: ${rows.length}`,
      });
    } else {
      const columns = [
        'Member Name',
        'Relationship',
        'Flat No',
        'Phone',
        'Age',
        'Emergency Contact',
        'Added Date',
      ];
      const rows = filteredHousehold.map((m) => ({
        'Member Name': m.name,
        Relationship: m.relationship,
        'Flat No': m.flatNumber,
        Phone: m.phone || '—',
        Age: m.age !== undefined ? String(m.age) : '—',
        'Emergency Contact': m.isEmergencyContact ? 'Yes (Primary)' : 'Standard',
        'Added Date': normalizeSocietyIsoDate(m.createdAt || m.updatedAt) || '—',
      }));
      exportSocietyPdf({
        society,
        title: 'Family & Household Members Roster',
        subtitle: 'People & Households • Registered Dependents & Emergency Contacts',
        filename: `${socSlug}_family_members_${period.slug}`,
        columns,
        rows,
        filterSummary: `Period: ${period.label} | Tab: Family Members${searchPart} | Records: ${rows.length}`,
      });
    }
  };

  const handleDownloadFullHouseholdPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const searchPart = q ? ` | Search: "${searchTerm.trim()}"` : '';

    const familyColumns = ['Member Name', 'Relationship', 'Flat No', 'Phone', 'Age', 'Emergency Contact', 'Added Date'];
    const familyRows = filteredHousehold.map((m) => ({
      'Member Name': m.name,
      Relationship: m.relationship,
      'Flat No': m.flatNumber,
      Phone: m.phone || '—',
      Age: m.age !== undefined ? String(m.age) : '—',
      'Emergency Contact': m.isEmergencyContact ? 'Yes (Primary)' : 'Standard',
      'Added Date': normalizeSocietyIsoDate(m.createdAt || m.updatedAt) || '—',
    }));

    const vehicleColumns = ['Plate Number', 'Vehicle Type', 'Make & Model', 'Flat No', 'Parking Slot', 'Registered Date'];
    const vehicleRows = filteredVehicles.map((v) => ({
      'Plate Number': v.plateNumber,
      'Vehicle Type': v.vehicleType,
      'Make & Model': v.makeModel,
      'Flat No': v.flatNumber,
      'Parking Slot': v.parkingSlot,
      'Registered Date': normalizeSocietyIsoDate(v.createdAt || v.updatedAt) || '—',
    }));

    const helperColumns = ['Helper ID', 'Gate Pass No', 'Helper Name', 'Role', 'Phone', 'Flat No', 'Guard OTP', 'Working Hours', 'Police Verified', 'Status', 'Added Date'];
    const helperRows = filteredHelpers.map((h) => ({
      'Helper ID': h.helperId || h.id,
      'Gate Pass No': h.gatePassNumber || `GP-HLP-${h.passCode}`,
      'Helper Name': h.name,
      Role: h.role,
      Phone: h.phone,
      'Flat No': h.flatNumber,
      'Guard OTP': h.passCode,
      'Working Hours': h.workingHours,
      'Police Verified': h.policeVerificationVerified ? 'Verified' : 'Pending',
      Status: h.status,
      'Added Date': normalizeSocietyIsoDate(h.createdAt || h.updatedAt) || '—',
    }));

    const totalCount = familyRows.length + vehicleRows.length + helperRows.length;

    exportSocietyPdf({
      society,
      title: 'Family, Vehicles & Domestic Helpers Complete Report',
      subtitle: 'People & Households • Unified Family, Vehicle & Helper Gate Pass Register',
      filename: `${socSlug}_family_vehicles_helpers_${period.slug}`,
      columns: familyColumns,
      rows: familyRows,
      filterSummary: `Period: ${period.label} | Scope: Family (${familyRows.length}), Vehicles (${vehicleRows.length}), Helpers (${helperRows.length})${searchPart} | Total: ${totalCount}`,
      extraSections: [
        {
          sectionTitle: `Society Vehicles (${vehicleRows.length})`,
          columns: vehicleColumns,
          rows: vehicleRows,
        },
        {
          sectionTitle: `Domestic Helpers & Staff (${helperRows.length})`,
          columns: helperColumns,
          rows: helperRows,
        },
      ],
    });
  };

  // Download Individual Helper Gate Pass PDF Card
  const handleDownloadHelperGatePassPdf = (h: SocietyDomesticHelper) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a5' });
    doc.setFillColor(11, 37, 36);
    doc.rect(0, 0, 420, 76, 'F');
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 72, 420, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(societyDisplayName.toUpperCase(), 24, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(204, 251, 241);
    doc.text('DOMESTIC HELPER & STAFF DIGITAL GATE PASS', 24, 50);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(h.name, 24, 108);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Staff ID: ${h.helperId || h.id}   |   Role: ${h.role}`, 24, 126);
    doc.text(`Gate Pass No: ${h.gatePassNumber || `GP-HLP-${h.passCode}`}`, 24, 142);

    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(24, 158, 372, 74, 8, 8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136);
    doc.text('GUARD VERIFICATION OTP', 40, 180);
    doc.setFontSize(22);
    doc.setTextColor(11, 37, 36);
    doc.text(h.passCode, 40, 210);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Assigned Flat: ${h.flatNumber}`, 215, 182);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Phone: ${h.phone}`, 215, 198);
    doc.text(`Status: ${h.status}`, 215, 214);

    if (helperQrDataUrl) {
      doc.addImage(helperQrDataUrl, 'PNG', 135, 252, 150, 150);
    }

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Shift: ${h.workingHours}`, 210, 422, { align: 'center' });
    doc.text(`Police Verification: ${h.policeVerificationVerified ? 'Verified' : 'Pending'}`, 210, 438, { align: 'center' });
    doc.text('Show this QR Pass or 6-Digit OTP to Security Guard at Main Gate', 210, 560, { align: 'center' });

    doc.save(`${(h.helperId || h.name).toLowerCase().replace(/[^a-z0-9]+/g, '_')}_gate_pass.pdf`);
  };

  // Open Add / Edit Modals
  const handleOpenAddHelper = () => {
    const newOtp = generateOtpCode();
    setEditingHelper(null);
    setHelperName('');
    setHelperRole('Maid');
    setHelperPhone('');
    setHelperFlat(defaultFlat);
    setHelperWorkingHours('08:00 AM - 12:00 PM');
    setHelperPassCode(newOtp);
    setHelperStaffCode(`HLP-${new Date().getFullYear()}-${newOtp.slice(-4)}`);
    setHelperPoliceVerified(true);
    setHelperStatus('ACTIVE');
    setShowHelperModal(true);
  };

  const handleOpenEditHelper = (h: SocietyDomesticHelper) => {
    setEditingHelper(h);
    setHelperName(h.name);
    setHelperRole(h.role);
    setHelperPhone(h.phone);
    setHelperFlat(h.flatNumber);
    setHelperWorkingHours(h.workingHours);
    setHelperPassCode(h.passCode);
    setHelperStaffCode(h.helperId || `HLP-${new Date().getFullYear()}-${h.passCode.slice(-4)}`);
    setHelperPoliceVerified(h.policeVerificationVerified);
    setHelperStatus(h.status);
    setShowHelperModal(true);
  };

  const handleSaveHelper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helperName.trim() || !helperPhone.trim() || !helperFlat.trim()) return;
    setSubmitting(true);
    try {
      const matchedFlat = flats.find((f) => f.flatNumber === helperFlat.trim());
      const cleanOtp = (helperPassCode.replace(/\D/g, '') || generateOtpCode()).padEnd(6, '0').slice(0, 6);
      const staffId = helperStaffCode.trim() || `HLP-${new Date().getFullYear()}-${cleanOtp.slice(-4)}`;
      if (editingHelper) {
        await onUpdateHelper(editingHelper.id, {
          name: helperName.trim(),
          role: helperRole,
          phone: helperPhone.trim(),
          flatNumber: helperFlat.trim(),
          buildingName: matchedFlat?.buildingName || editingHelper.buildingName,
          societyName: societyDisplayName,
          workingHours: helperWorkingHours.trim() || '08:00 AM - 06:00 PM',
          passCode: cleanOtp,
          helperId: staffId,
          gatePassNumber: `GP-HLP-${cleanOtp}`,
          policeVerificationVerified: helperPoliceVerified,
          status: helperStatus,
        });
      } else {
        await onAddHelper({
          name: helperName.trim(),
          role: helperRole,
          phone: helperPhone.trim(),
          flatNumber: helperFlat.trim(),
          buildingName: matchedFlat?.buildingName,
          societyName: societyDisplayName,
          workingHours: helperWorkingHours.trim() || '08:00 AM - 06:00 PM',
          passCode: cleanOtp,
          helperId: staffId,
          gatePassNumber: `GP-HLP-${cleanOtp}`,
          policeVerificationVerified: helperPoliceVerified,
          status: helperStatus,
        });
      }
      setShowHelperModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddVehicle = () => {
    setEditingVehicle(null);
    setPlateNumber('');
    setMakeModel('');
    setVehicleType('Car');
    setFlatNumber(defaultFlat);
    setParkingSlot('');
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: SocietyVehicle) => {
    setEditingVehicle(v);
    setPlateNumber(v.plateNumber);
    setMakeModel(v.makeModel);
    setVehicleType(v.vehicleType);
    setFlatNumber(v.flatNumber);
    setParkingSlot(v.parkingSlot);
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !flatNumber.trim()) return;
    setSubmitting(true);
    try {
      const matchedFlat = flats.find((f) => f.flatNumber === flatNumber.trim());
      if (editingVehicle) {
        await onUpdateVehicle(editingVehicle.id, {
          plateNumber: plateNumber.trim().toUpperCase(),
          makeModel: makeModel.trim() || 'Sedan',
          vehicleType,
          flatNumber: flatNumber.trim(),
          flatId: matchedFlat?.id || editingVehicle.flatId,
          parkingSlot: parkingSlot.trim() || 'P-OPEN',
        });
      } else {
        await onAddVehicle({
          societyId: society.id,
          flatId: matchedFlat?.id || 'flt_1',
          flatNumber: flatNumber.trim(),
          vehicleType,
          makeModel: makeModel.trim() || 'Sedan',
          plateNumber: plateNumber.trim().toUpperCase(),
          parkingSlot: parkingSlot.trim() || 'P-OPEN',
        });
      }
      setShowVehicleModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddFamily = () => {
    setEditingFamily(null);
    setFamilyName('');
    setFamilyRelation('Spouse');
    setFamilyFlat(defaultFlat);
    setFamilyPhone('');
    setFamilyAge('');
    setFamilyEmergency(false);
    setShowFamilyModal(true);
  };

  const handleOpenEditFamily = (m: SocietyHouseholdMember) => {
    setEditingFamily(m);
    setFamilyName(m.name);
    setFamilyRelation(m.relationship);
    setFamilyFlat(m.flatNumber);
    setFamilyPhone(m.phone || '');
    setFamilyAge(m.age !== undefined ? String(m.age) : '');
    setFamilyEmergency(Boolean(m.isEmergencyContact));
    setShowFamilyModal(true);
  };

  const handleSaveFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || !familyFlat.trim()) return;
    setSubmitting(true);
    try {
      const matchedFlat = flats.find((f) => f.flatNumber === familyFlat.trim());
      const parsedAge = familyAge.trim() ? Number(familyAge) : undefined;
      if (editingFamily) {
        await onUpdateHouseholdMember(editingFamily.id, {
          name: familyName.trim(),
          relationship: familyRelation,
          flatNumber: familyFlat.trim(),
          flatId: matchedFlat?.id || editingFamily.flatId,
          phone: familyPhone.trim() || undefined,
          age: parsedAge && !Number.isNaN(parsedAge) ? parsedAge : undefined,
          isEmergencyContact: familyEmergency,
        });
      } else {
        await onAddHouseholdMember({
          flatId: matchedFlat?.id || 'flt_1',
          flatNumber: familyFlat.trim(),
          name: familyName.trim(),
          relationship: familyRelation,
          phone: familyPhone.trim() || undefined,
          age: parsedAge && !Number.isNaN(parsedAge) ? parsedAge : undefined,
          isEmergencyContact: familyEmergency,
        });
      }
      setShowFamilyModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.type === 'HELPER') {
        await onDeleteHelper(deleteTarget.id);
      } else if (deleteTarget.type === 'VEHICLE') {
        await onDeleteVehicle(deleteTarget.id);
      } else {
        await onDeleteHouseholdMember(deleteTarget.id);
      }
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const activeMatchedCount =
    activeTab === 'HELPERS'
      ? filteredHelpers.length
      : activeTab === 'VEHICLES'
      ? filteredVehicles.length
      : filteredHousehold.length;

  const activePdfLabel =
    activeTab === 'HELPERS'
      ? 'Helpers PDF'
      : activeTab === 'VEHICLES'
      ? 'Vehicles PDF'
      : 'Family PDF';

  const flatSuggestions = flats.map((f) => f.flatNumber);

  return (
    <div className="space-y-5">
      {/* Copy Feedback Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#0B2524] text-white text-xs font-bold shadow-lg border border-teal-500/40 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header + Primary Add Button for active tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Family, Vehicles & Helpers Directory</h2>
          <p className="text-sm text-gray-500">
            Manage domestic staff with Gate Pass & Guard OTP, registered society vehicles, and family members
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'HELPERS' && (
            <button
              type="button"
              onClick={handleOpenAddHelper}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold text-sm transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Helper / Staff</span>
            </button>
          )}
          {activeTab === 'VEHICLES' && (
            <button
              type="button"
              onClick={handleOpenAddVehicle}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold text-sm transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Vehicle</span>
            </button>
          )}
          {activeTab === 'FAMILY' && (
            <button
              type="button"
              onClick={handleOpenAddFamily}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold text-sm transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Family Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, flat, vehicle plate, helper ID or OTP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium tabular-nums">
          Helpers: {filteredHelpers.length} · Vehicles: {filteredVehicles.length} · Family: {filteredHousehold.length}
        </span>
      </div>

      {/* Single-Line PDF Period Toolbar */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={activeMatchedCount}
        onExportPdf={handleDownloadActiveTabPdf}
        pdfButtonLabel={activePdfLabel}
        secondaryExportLabel="Full Household PDF"
        onSecondaryExportPdf={handleDownloadFullHouseholdPdf}
        onResetPeriod={() => setPeriodMode('ALL')}
      />

      {/* Tabs (Society Vehicles — NO RFID) */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('HELPERS')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'HELPERS'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Domestic Helpers & Staff ({filteredHelpers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('VEHICLES')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'VEHICLES'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Car className="w-4 h-4" />
          Society Vehicles ({filteredVehicles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('FAMILY')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'FAMILY'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Family Members ({filteredHousehold.length})
        </button>
      </div>

      {/* 1. Helpers Subtab */}
      {activeTab === 'HELPERS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Helper / Staff ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Flat & Society</th>
                  <th className="py-3 px-4">Gate Pass / Guard OTP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredHelpers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No domestic helpers match the selected period or search filter.
                    </td>
                  </tr>
                ) : (
                  filteredHelpers.map((h) => {
                    const helperCode = h.helperId || h.id;
                    const gatePassNo = h.gatePassNumber || `GP-HLP-${h.passCode}`;
                    const copyString = `Helper: ${h.name} (${h.role}) | ID: ${helperCode} | Gate Pass: ${gatePassNo} | Guard OTP: ${h.passCode} | Society: ${h.societyName || societyDisplayName} | Flat: ${h.flatNumber} | Phone: ${h.phone}`;

                    return (
                      <tr key={h.id} className="hover:bg-teal-50/20 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{h.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{helperCode}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-semibold">
                            {h.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-600">{h.phone}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-bold text-gray-900">Flat {h.flatNumber}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {h.societyName || societyDisplayName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-xs font-mono font-bold text-teal-800">
                              OTP: {h.passCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingHelper(h)}
                              className="p-1 rounded-md text-teal-700 hover:bg-teal-100 cursor-pointer"
                              title="View QR Gate Pass"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{gatePassNo}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => onToggleHelperStatus(h.id, h.status)}
                            title={h.status === 'ACTIVE' ? 'Click to Revoke' : 'Click to Authorize'}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                              h.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {h.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => showCopyFeedback(h.id, copyString, 'Helper Gate Pass')}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                              title="Copy Helper & OTP Details"
                            >
                              {copiedId === h.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewingHelper(h)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                              title="View Gate Pass & Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditHelper(h)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                              title="Edit Helper"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'HELPER',
                                  id: h.id,
                                  label: `${h.name} (${h.role})`,
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Helper"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Vehicles Subtab (NO RFID) */}
      {activeTab === 'VEHICLES' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Model & Type</th>
                  <th className="py-3 px-4">Flat</th>
                  <th className="py-3 px-4">Parking Slot</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                      No vehicles match the selected period or search filter.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => {
                    const copyString = `Vehicle: ${v.plateNumber} | ${v.makeModel} (${v.vehicleType}) | Flat: ${v.flatNumber} | Parking: ${v.parkingSlot}`;
                    return (
                      <tr key={v.id} className="hover:bg-teal-50/20 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-900 font-mono tracking-wide">
                          {v.plateNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-semibold text-gray-900 text-xs">{v.makeModel}</span>
                            <span className="ml-2 px-2 py-0.5 rounded-md bg-[#F1F9FC] text-gray-700 text-[11px] font-semibold">
                              {v.vehicleType}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800">{v.flatNumber}</td>
                        <td className="py-3.5 px-4 text-xs font-mono text-teal-700 font-bold">
                          {v.parkingSlot}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => showCopyFeedback(v.id, copyString, 'Vehicle Details')}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                              title="Copy Vehicle Info"
                            >
                              {copiedId === v.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewingVehicle(v)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                              title="View Vehicle Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditVehicle(v)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                              title="Edit Vehicle"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'VEHICLE',
                                  id: v.id,
                                  label: `${v.plateNumber} (${v.makeModel})`,
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Vehicle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Family Members Subtab */}
      {activeTab === 'FAMILY' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Flat</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredHousehold.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                      No family members match the selected period or search filter.
                    </td>
                  </tr>
                ) : (
                  filteredHousehold.map((m) => {
                    const copyString = `Family Member: ${m.name} | Relation: ${m.relationship} | Flat: ${m.flatNumber} | Phone: ${m.phone || 'N/A'}`;
                    return (
                      <tr key={m.id} className="hover:bg-teal-50/20 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{m.name}</div>
                          {m.age !== undefined && (
                            <div className="text-[11px] text-slate-400">Age: {m.age} yrs</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-medium">
                            {m.relationship}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800">{m.flatNumber}</td>
                        <td className="py-3.5 px-4 text-xs text-gray-600">{m.phone || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            m.isEmergencyContact ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {m.isEmergencyContact ? 'Yes (Primary)' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => showCopyFeedback(m.id, copyString, 'Family Member')}
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                              title="Copy Family Member Details"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewingFamily(m)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                              title="View Family Member"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditFamily(m)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                              title="Edit Family Member"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'FAMILY',
                                  id: m.id,
                                  label: `${m.name} (${m.relationship})`,
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Family Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: ADD / EDIT DOMESTIC HELPER & STAFF + GATE PASS */}
      {/* ======================================================= */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  {editingHelper ? `Edit Helper: ${editingHelper.name}` : 'Add Domestic Helper / Staff'}
                </h3>
                <p className="text-xs text-gray-500">
                  Auto-generates Staff ID, Scannable QR Gate Pass & 6-Digit Guard OTP
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHelper} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Devi"
                    value={helperName}
                    onChange={(e) => setHelperName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Role / Category</label>
                  <select
                    value={helperRole}
                    onChange={(e) => setHelperRole(e.target.value as SocietyDomesticHelper['role'])}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Maid">Maid</option>
                    <option value="Cook">Cook</option>
                    <option value="Driver">Driver</option>
                    <option value="Nanny">Nanny</option>
                    <option value="Elderly Care">Elderly Care</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Gardener">Gardener</option>
                    <option value="Staff">Society Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={helperPhone}
                    onChange={(e) => setHelperPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Flat No</label>
                  <input
                    type="text"
                    list="society-flats-list"
                    placeholder="e.g. B-704"
                    value={helperFlat}
                    onChange={(e) => setHelperFlat(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Working Hours / Shift</label>
                <input
                  type="text"
                  placeholder="e.g. 08:00 AM - 11:00 AM, 06:00 PM - 08:00 PM"
                  value={helperWorkingHours}
                  onChange={(e) => setHelperWorkingHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Generated Staff ID & Guard OTP Box */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-teal-800">
                    Gate Pass Credentials (Guard Verification)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextOtp = generateOtpCode();
                      setHelperPassCode(nextOtp);
                      setHelperStaffCode(`HLP-${new Date().getFullYear()}-${nextOtp.slice(-4)}`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate OTP</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff / Helper ID</label>
                    <input
                      type="text"
                      value={helperStaffCode}
                      onChange={(e) => setHelperStaffCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">6-Digit Guard OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={helperPassCode}
                      onChange={(e) => setHelperPassCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white text-xs font-mono font-black tracking-widest text-teal-700 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-teal-800/80">
                  Society: <strong>{societyDisplayName}</strong> • Entering this OTP or scanning the generated QR Gate Pass at Security Gate shows Flat <strong>{helperFlat || defaultFlat}</strong> & Society name.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={helperPoliceVerified}
                    onChange={(e) => setHelperPoliceVerified(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Police Verification Completed</span>
                </label>

                <select
                  value={helperStatus}
                  onChange={(e) => setHelperStatus(e.target.value as 'ACTIVE' | 'REVOKED')}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="REVOKED">REVOKED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowHelperModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingHelper ? 'Save Changes' : 'Create Helper & Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: ADD / EDIT SOCIETY VEHICLE (NO RFID)           */}
      {/* ======================================================= */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  {editingVehicle ? `Edit Vehicle: ${editingVehicle.plateNumber}` : 'Register Vehicle'}
                </h3>
                <p className="text-xs text-gray-500">Add vehicle number plate and assign parking slot</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Registration Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH 02 CD 9811"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Make / Model / Color</label>
                <input
                  type="text"
                  placeholder="e.g. Honda City (White)"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Car">4-Wheeler Car / SUV</option>
                  <option value="Motorcycle">2-Wheeler Motorcycle / Scooter</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Flat</label>
                  <input
                    type="text"
                    list="society-flats-list"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Parking Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. P-402"
                    value={parkingSlot}
                    onChange={(e) => setParkingSlot(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: ADD / EDIT FAMILY MEMBER                       */}
      {/* ======================================================= */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  {editingFamily ? `Edit Member: ${editingFamily.name}` : 'Add Family Member'}
                </h3>
                <p className="text-xs text-gray-500">Assign flat, relationship and contact number</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFamilyModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFamily} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Member Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Meera Sharma"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship</label>
                  <select
                    value={familyRelation}
                    onChange={(e) => setFamilyRelation(e.target.value as SocietyHouseholdMember['relationship'])}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Relative">Relative</option>
                    <option value="Roommate">Roommate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Flat Number</label>
                  <input
                    type="text"
                    list="society-flats-list"
                    placeholder="e.g. A-101"
                    value={familyFlat}
                    onChange={(e) => setFamilyFlat(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={familyPhone}
                    onChange={(e) => setFamilyPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Age (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={familyAge}
                    onChange={(e) => setFamilyAge(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={familyEmergency}
                  onChange={(e) => setFamilyEmergency(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Mark as Primary Emergency Contact</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFamilyModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingFamily ? 'Save Changes' : 'Add Family Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flat suggestions datalist */}
      <datalist id="society-flats-list">
        {flatSuggestions.map((fl) => (
          <option key={fl} value={fl} />
        ))}
      </datalist>

      {/* ======================================================= */}
      {/* VIEW MODAL 1: HELPER DIGITAL GATE PASS (QR + OTP)       */}
      {/* ======================================================= */}
      {viewingHelper && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B2524] to-teal-700 p-5 text-white relative">
              <button
                type="button"
                onClick={() => setViewingHelper(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-200">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Domestic Helper Gate Pass</span>
              </div>
              <h3 className="text-lg font-extrabold mt-1">{viewingHelper.name}</h3>
              <p className="text-xs text-teal-100 mt-0.5">
                {viewingHelper.role} · ID: <span className="font-mono font-bold">{viewingHelper.helperId || viewingHelper.id}</span>
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Destination Details */}
              <div className="p-3.5 rounded-2xl bg-[#F4F8F7] border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" /> Society
                  </span>
                  <span className="font-bold text-slate-900">{viewingHelper.societyName || societyDisplayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-teal-600" /> Target Flat
                  </span>
                  <span className="font-bold text-teal-700">Flat {viewingHelper.flatNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-600" /> Contact
                  </span>
                  <span className="font-semibold text-slate-800">{viewingHelper.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Shift Hours
                  </span>
                  <span className="font-medium text-slate-700 text-right">{viewingHelper.workingHours}</span>
                </div>
              </div>

              {/* Guard OTP Box */}
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  6-Digit Guard Verification OTP
                </span>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="text-3xl font-black font-mono tracking-widest text-teal-800">
                    {viewingHelper.passCode}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      showCopyFeedback(
                        viewingHelper.id,
                        `Gate Pass OTP: ${viewingHelper.passCode} | ID: ${viewingHelper.helperId || viewingHelper.id} | Name: ${viewingHelper.name} | Society: ${viewingHelper.societyName || societyDisplayName} | Flat: ${viewingHelper.flatNumber}`,
                        'Gate Pass & OTP'
                      )
                    }
                    className="p-1.5 rounded-lg bg-white border border-teal-200 text-teal-700 hover:bg-teal-100 cursor-pointer"
                    title="Copy OTP & Pass"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-teal-700/80">
                  Pass No: <span className="font-mono font-bold">{viewingHelper.gatePassNumber || `GP-HLP-${viewingHelper.passCode}`}</span>
                </p>
              </div>

              {/* Scannable QR Code */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200">
                {helperQrDataUrl ? (
                  <img
                    src={helperQrDataUrl}
                    alt={`Gate Pass QR for ${viewingHelper.name}`}
                    className="w-36 h-36 rounded-xl"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-xl bg-slate-100 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-teal-700" />
                  </div>
                )}
                <span className="text-[10px] text-slate-500 mt-1.5">
                  Guard can scan QR or enter 6-digit OTP at Gate
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadHelperGatePassPdf(viewingHelper)}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Pass PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingHelper(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* VIEW MODAL 2: SOCIETY VEHICLE DETAILS                   */}
      {/* ======================================================= */}
      {viewingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Car className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 font-mono">{viewingVehicle.plateNumber}</h3>
                  <p className="text-xs text-gray-500">Registered Society Vehicle</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingVehicle(null)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F8F7] border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Society</span>
                <span className="font-bold text-slate-900">{societyDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Make & Model</span>
                <span className="font-semibold text-slate-900">{viewingVehicle.makeModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Type</span>
                <span className="font-semibold text-teal-700">{viewingVehicle.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Flat</span>
                <span className="font-bold text-slate-900">{viewingVehicle.flatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Parking Slot</span>
                <span className="font-mono font-bold text-teal-700">{viewingVehicle.parkingSlot}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  showCopyFeedback(
                    viewingVehicle.id,
                    `${viewingVehicle.plateNumber} | ${viewingVehicle.makeModel} | Flat ${viewingVehicle.flatNumber} | Parking ${viewingVehicle.parkingSlot}`,
                    'Vehicle Details'
                  )
                }
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Vehicle Info</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingVehicle(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* VIEW MODAL 3: FAMILY MEMBER DETAILS                     */}
      {/* ======================================================= */}
      {viewingFamily && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center">
                  {viewingFamily.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{viewingFamily.name}</h3>
                  <p className="text-xs text-teal-700 font-semibold">{viewingFamily.relationship}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingFamily(null)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F4F8F7] border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Society</span>
                <span className="font-bold text-slate-900">{societyDisplayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flat Number</span>
                <span className="font-bold text-teal-700">{viewingFamily.flatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Relationship</span>
                <span className="font-semibold text-slate-900">{viewingFamily.relationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Phone</span>
                <span className="font-semibold text-slate-900">{viewingFamily.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age</span>
                <span className="font-semibold text-slate-900">
                  {viewingFamily.age !== undefined ? `${viewingFamily.age} yrs` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Emergency Contact</span>
                <span className="font-bold text-emerald-700">
                  {viewingFamily.isEmergencyContact ? 'Yes (Primary)' : 'Standard'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  showCopyFeedback(
                    viewingFamily.id,
                    `${viewingFamily.name} (${viewingFamily.relationship}) | Flat ${viewingFamily.flatNumber} | Phone: ${viewingFamily.phone || 'N/A'}`,
                    'Family Member'
                  )
                }
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Member Info</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingFamily(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* DELETE CONFIRMATION MODAL                               */}
      {/* ======================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-rose-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Confirm Deletion</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to permanently remove <strong className="text-gray-900">{deleteTarget.label}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                {submitting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 19: STAFF & ROLE MANAGEMENT (WITH CREDENTIALS & PERMISSIONS)
// -------------------------------------------------------------
interface StaffViewProps {
  society: Society;
  staff: SocietyStaffMember[];
  onAddStaff: (s: any) => Promise<SocietyStaffMember | void>;
  onUpdateStaff?: (id: string, updates: Partial<SocietyStaffMember>) => Promise<void>;
  onToggleStaffStatus: (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  onDeleteStaff?: (id: string) => Promise<void>;
}

const generateSocietyStaffPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = 'Soc@';
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const SocietyStaffView: React.FC<StaffViewProps> = ({
  society,
  staff,
  onAddStaff,
  onUpdateStaff,
  onToggleStaffStatus,
  onDeleteStaff
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<SocietyStaffMember | null>(null);
  const [viewingMember, setViewingMember] = useState<SocietyStaffMember | null>(null);
  const [revealViewPassword, setRevealViewPassword] = useState(false);
  const [deletingMember, setDeletingMember] = useState<SocietyStaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<SocietyStaffRoleLabel>('Society Manager');
  const [assignedArea, setAssignedArea] = useState('Estate Office');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    DEFAULT_SOCIETY_STAFF_PERMISSIONS['Society Manager']
  );

  // Newly Issued Credentials Card
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
    role: string;
    societyName: string;
    permissionsCount: number;
  } | null>(null);

  const societyNameLabel = society.societyName || society.name || 'Assigned Society';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleCopyValue = (fieldKey: string, value: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedField(fieldKey);
    triggerToast(`${label} copied to clipboard`);
    window.setTimeout(() => {
      setCopiedField((prev) => (prev === fieldKey ? null : prev));
    }, 2000);
  };

  const q = searchTerm.trim().toLowerCase();
  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.assignedArea || '').toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchPeriod = matchesSocietyPeriod(
      s.joinedAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    return matchSearch && matchRole && matchStatus && matchPeriod;
  });

  const handleDownloadStaffPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Staff ID',
      'Full Name',
      'Role',
      'Department / Scope',
      'Phone',
      'Login Email',
      'Permissions',
      'Status',
      'Joined Date',
    ];
    const rows = filteredStaff.map((s) => ({
      'Staff ID': s.id,
      'Full Name': s.fullName,
      Role: s.role,
      'Department / Scope': s.assignedArea || 'General Administration',
      Phone: s.phone,
      'Login Email': s.email || '—',
      Permissions: `${(s.permissions || []).length} modules`,
      Status: s.status,
      'Joined Date': normalizeSocietyIsoDate(s.joinedAt) || '—',
    }));

    const searchPart = q ? ` | Search: "${searchTerm.trim()}"` : '';
    const filterSummary = `Period: ${period.label} | Role: ${
      roleFilter === 'ALL' ? 'All Roles' : roleFilter
    } | Status: ${statusFilter === 'ALL' ? 'All' : statusFilter}${searchPart} | Staff: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Management & Staff Roster',
      subtitle: 'People & Households • Administrative Staff, Credentials & Role Permissions',
      filename: `${socSlug}_management_staff_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  const openAddModal = () => {
    setFormError(null);
    setEditingMember(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword(generateSocietyStaffPassword());
    setShowPassword(true);
    setRole('Society Manager');
    setAssignedArea('Estate Office');
    setSelectedPermissions(DEFAULT_SOCIETY_STAFF_PERMISSIONS['Society Manager']);
    setShowAddModal(true);
  };

  const openEditModal = (member: SocietyStaffMember) => {
    setFormError(null);
    setEditingMember(member);
    setFullName(member.fullName);
    setPhone(member.phone);
    setEmail(member.email || '');
    setPassword(member.password || '');
    setShowPassword(false);
    setRole(member.role);
    setAssignedArea(member.assignedArea || 'Estate Office');
    setSelectedPermissions(
      Array.isArray(member.permissions) && member.permissions.length > 0
        ? member.permissions
        : DEFAULT_SOCIETY_STAFF_PERMISSIONS[member.role] || []
    );
    setShowAddModal(true);
  };

  const handleRoleChange = (nextRole: SocietyStaffRoleLabel) => {
    setRole(nextRole);
    if (!editingMember && DEFAULT_SOCIETY_STAFF_PERMISSIONS[nextRole]) {
      setSelectedPermissions(DEFAULT_SOCIETY_STAFF_PERMISSIONS[nextRole]);
    }
  };

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setFormError('Full Name, Phone Number, and Login Email ID are required.');
      return;
    }

    if (!editingMember && password.trim().length < 6) {
      setFormError('Login password must be at least 6 characters.');
      return;
    }

    if (editingMember && password.trim().length > 0 && password.trim().length < 6) {
      setFormError('Updated password must be at least 6 characters.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setFormError('Please assign at least one permission for this staff member.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMember && onUpdateStaff) {
        await onUpdateStaff(editingMember.id, {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          role,
          assignedArea: assignedArea.trim(),
          permissions: selectedPermissions,
          societyName: societyNameLabel,
          societyCode: society.societyCode,
          ...(password.trim().length >= 6 ? { password: password.trim() } : {}),
        });
        setShowAddModal(false);
        setEditingMember(null);
        triggerToast(`Updated access & credentials for ${fullName.trim()}`);
      } else {
        const created = await onAddStaff({
          societyId: society.id,
          societyName: societyNameLabel,
          societyCode: society.societyCode,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          assignedArea: assignedArea.trim(),
          permissions: selectedPermissions,
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
        });
        setCreatedCredentials({
          fullName: (created && created.fullName) || fullName.trim(),
          email: (created && created.email) || email.trim().toLowerCase(),
          password: password.trim(),
          role,
          societyName: societyNameLabel,
          permissionsCount: selectedPermissions.length,
        });
        setShowAddModal(false);
        triggerToast(`Staff login issued for ${fullName.trim()}`);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Unable to save society staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember || !onDeleteStaff) return;
    await onDeleteStaff(deletingMember.id);
    triggerToast(`Removed ${deletingMember.fullName} from staff roster`);
    setDeletingMember(null);
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Staff & Role Access</h2>
          <p className="text-sm text-gray-500">
            Issue dedicated Email + Password logins and assign exact society permissions for{' '}
            <strong className="text-teal-700">{societyNameLabel}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-semibold text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Newly Provisioned Credentials Banner */}
      {createdCredentials && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-extrabold text-emerald-900">
                  Society Staff Login Created for {createdCredentials.fullName} ({createdCredentials.role})
                </h3>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Share these credentials with your staff member. They will only open{' '}
                  <strong>{createdCredentials.societyName}</strong> and see their{' '}
                  <strong>{createdCredentials.permissionsCount} assigned permissions</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Login Email</span>
                <span className="font-mono font-bold text-slate-900 truncate block">
                  {createdCredentials.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyValue('cred_email', createdCredentials.email, 'Login Email')}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shrink-0"
                title="Copy Email"
              >
                {copiedField === 'cred_email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Login Password</span>
                <span className="font-mono font-bold text-slate-900 truncate block">
                  {createdCredentials.password}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyValue('cred_pwd', createdCredentials.password, 'Login Password')}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shrink-0"
                title="Copy Password"
              >
                {copiedField === 'cred_pwd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Society Staff Portal</span>
                <span className="font-bold text-teal-700 truncate block">
                  /login?role=SOCIETY_STAFF
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopyValue(
                    'cred_url',
                    `${window.location.origin}/login?role=SOCIETY_STAFF`,
                    'Staff Login URL'
                  )
                }
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shrink-0"
                title="Copy Login Link"
              >
                {copiedField === 'cred_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff name, phone, email, scope..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="Society Admin">Society Admin</option>
            <option value="Society Manager">Society Manager</option>
            <option value="Accountant">Accountant</option>
            <option value="Security Supervisor">Security Supervisor</option>
            <option value="Maintenance Staff">Maintenance Staff</option>
            <option value="HelpDesk Executive">HelpDesk Executive</option>
            <option value="Facility Coordinator">Facility Coordinator</option>
            <option value="Society Staff">Society Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <span className="text-xs text-gray-500 ml-auto md:ml-0 font-medium tabular-nums">
            Showing {filteredStaff.length} of {staff.length}
          </span>
        </div>
      </div>

      {/* PDF Export Toolbar */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredStaff.length}
        onExportPdf={handleDownloadStaffPdf}
        pdfButtonLabel="Download Staff Roster PDF"
        onResetPeriod={() => setPeriodMode('ALL')}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Login & Contact</th>
                <th className="py-3 px-4">Role & Scope</th>
                <th className="py-3 px-4">Granted Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                    No staff members match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => {
                  const isOwner = Boolean(s.isOwner || s.role === 'Society Admin');
                  const perms = s.permissions || [];
                  return (
                    <tr key={s.id} className="hover:bg-teal-50/20 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm shrink-0">
                            {s.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{s.fullName}</div>
                            <div className="text-[11px] font-mono text-gray-400">ID: {s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        <div className="font-semibold text-gray-800">{s.phone}</div>
                        {s.email ? (
                          <div className="text-teal-700 font-mono text-[11px]">{s.email}</div>
                        ) : (
                          <div className="text-gray-400 italic">No email set</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 inline-block">
                          {s.role}
                        </span>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {s.assignedArea || 'General Administration'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Full Society Owner Access
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {perms.slice(0, 3).map((pKey) => (
                              <span
                                key={pKey}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {getSocietyPermissionLabel(pKey)}
                              </span>
                            ))}
                            {perms.length > 3 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                +{perms.length - 3} more
                              </span>
                            )}
                            {perms.length === 0 && (
                              <span className="text-[11px] text-amber-600">No permissions</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyValue(
                                `row_${s.id}`,
                                `Society: ${societyNameLabel}\nStaff: ${s.fullName} (${s.role})\nEmail: ${s.email || 'N/A'}\nPhone: ${s.phone}\nPortal: ${window.location.origin}/login?role=SOCIETY_STAFF`,
                                'Staff summary'
                              )
                            }
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                            title="Copy Details"
                          >
                            {copiedField === `row_${s.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRevealViewPassword(false);
                              setViewingMember(s);
                            }}
                            className="p-1.5 rounded-lg border border-teal-200 bg-teal-50/70 text-teal-700 hover:bg-teal-100 cursor-pointer"
                            title="View Credentials & Permissions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {!isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(s)}
                                className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                                title="Edit Role, Password & Permissions"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onToggleStaffStatus(s.id, s.status)}
                                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                                  s.status === 'ACTIVE'
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </button>

                              {onDeleteStaff && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingMember(s)}
                                  className="p-1.5 rounded-lg border border-red-200 bg-red-50/70 text-red-600 hover:bg-red-100 cursor-pointer"
                                  title="Delete Staff Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  {editingMember
                    ? `Edit Staff Access & Credentials — ${editingMember.fullName}`
                    : `Add Society Staff Member — ${societyNameLabel}`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Staff members log in with their own Email & Password and can ONLY access{' '}
                  <strong>{societyNameLabel}</strong> with the exact permissions ticked below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kulkarni"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dedicated Society Staff Login Credentials Box */}
              <div className="p-3.5 rounded-xl bg-[#F1F9FC] border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-teal-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Society Staff Portal Login Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(generateSocietyStaffPassword());
                      setShowPassword(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Generate Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Login Email ID *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="staff@yoursociety.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {editingMember ? 'New Password (optional)' : 'Login Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingMember}
                        minLength={6}
                        placeholder={editingMember ? 'Leave unchanged or enter new' : 'Min 6 characters'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Role *</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as SocietyStaffRoleLabel)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Society Manager">Society Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Security Supervisor">Security Supervisor</option>
                    <option value="Maintenance Staff">Maintenance Staff</option>
                    <option value="HelpDesk Executive">HelpDesk Executive</option>
                    <option value="Facility Coordinator">Facility Coordinator</option>
                    <option value="Society Staff">Society Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department / Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. Estate Office / Billing Desk"
                    value={assignedArea}
                    onChange={(e) => setAssignedArea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Society Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Assigned Society Permissions ({selectedPermissions.length} selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(SOCIETY_STAFF_PERMISSIONS.map((p) => p.key))}
                      className="font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="font-semibold text-gray-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-56 overflow-y-auto">
                  {SOCIETY_STAFF_PERMISSIONS.map((perm) => {
                    const checked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] cursor-pointer transition ${
                          checked
                            ? 'bg-teal-50/70 border-teal-200 text-slate-900'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermission(perm.key)}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <div className="min-w-0">
                          <span className="font-bold block">{perm.label}</span>
                          <span className="text-[10px] text-gray-500 block leading-snug">
                            {perm.moduleGroup} • {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingMember
                    ? 'Save Permissions & Password'
                    : 'Create Staff & Issue Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Staff Credentials & Permissions Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-base">
                  {viewingMember.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">{viewingMember.fullName}</h3>
                  <p className="text-xs text-teal-700 font-semibold">
                    {viewingMember.role} • {viewingMember.assignedArea || 'General Administration'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F1F9FC] border border-teal-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned Society:</span>
                <span className="font-bold text-teal-800">{societyNameLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Login Email:</span>
                <span className="font-mono font-bold text-gray-900">{viewingMember.email || '—'}</span>
              </div>
              {!viewingMember.isOwner && viewingMember.password && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Login Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">
                      {revealViewPassword ? viewingMember.password : '••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRevealViewPassword((prev) => !prev)}
                      className="text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      {revealViewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-mono font-semibold text-gray-800">{viewingMember.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-emerald-700">{viewingMember.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                Assigned Permissions ({(viewingMember.permissions || []).length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(viewingMember.permissions || []).map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-800"
                  >
                    {getSocietyPermissionLabel(p)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              {viewingMember.email && (
                <button
                  type="button"
                  onClick={() =>
                    handleCopyValue(
                      'view_copy',
                      `Society: ${societyNameLabel}\nLogin URL: ${window.location.origin}/login?role=SOCIETY_STAFF\nEmail: ${viewingMember.email}\nPassword: ${viewingMember.password || '(Set by Admin)'}`,
                      'Credentials'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Credentials
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Remove Staff Member?</h3>
                <p className="text-xs text-gray-500">
                  This will revoke portal login access for <strong>{deletingMember.fullName}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
