import React, { useMemo, useState } from 'react';
import {
  Shield,
  DoorClosed,
  QrCode,
  Flame,
  HeartPulse,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Clock,
  Phone,
  Camera,
  Search,
} from 'lucide-react';
import {
  SocietyGate,
  SocietyEmergencyAlert,
  SocietyBuilding,
  SocietyFlat,
} from '../../types/societyAdmin';
import { Society, GatePass } from '../../types/society';
import { SocietyPdfExportToolbar } from './SocietyPdfExportToolbar';
import {
  SocietyPeriodMode,
  buildSocietyPeriodLabel,
  buildSocietySlug,
  exportSocietyPdf,
  matchesSocietyPeriod,
  normalizeSocietyIsoDate,
} from './societyPdfExportUtils';

export interface GuardItem {
  id: string;
  societyId: string;
  name: string;
  phoneNumber: string;
  badgeNumber: string;
  gateAssigned: string;
  towerAssigned?: string;
  shift: 'DAY' | 'NIGHT' | 'ROTATIONAL';
  status: 'ACTIVE' | 'INACTIVE';
  isSupervisor?: boolean;
  createdAt?: string;
}

// Shared helper to map flats / location strings to Tower/Block names
const resolveTowerForLocation = (
  locationOrFlat: string | undefined,
  flats?: SocietyFlat[],
  buildings?: SocietyBuilding[]
): string => {
  const raw = (locationOrFlat || '').trim();
  if (!raw) return 'General / Perimeter';

  if (flats && flats.length > 0) {
    const matchedFlat = flats.find(
      (f) => f.flatNumber.trim().toLowerCase() === raw.toLowerCase()
    );
    if (matchedFlat?.buildingName) return matchedFlat.buildingName;
  }

  if (buildings && buildings.length > 0) {
    const matchedBuilding = buildings.find((b) =>
      raw.toLowerCase().includes(b.name.toLowerCase())
    );
    if (matchedBuilding) return matchedBuilding.name;
  }

  // Infer from flat prefix like "A-1201" -> "Tower A", "B-704" -> "Tower B"
  const prefixMatch = raw.match(/^([A-Za-z]+)-\d+/);
  if (prefixMatch) {
    return `Tower ${prefixMatch[1].toUpperCase()}`;
  }

  const towerMention = raw.match(/(Tower\s+[A-Za-z0-9]+|Block\s+[A-Za-z0-9]+|Wing\s+[A-Za-z0-9]+)/i);
  if (towerMention) {
    return towerMention[1];
  }

  return 'General / Perimeter';
};

const collectTowerOptions = (
  buildings?: SocietyBuilding[],
  flats?: SocietyFlat[],
  extraLocations: (string | undefined)[] = []
): string[] => {
  const set = new Set<string>();
  (buildings || []).forEach((b) => {
    if (b.name?.trim()) set.add(b.name.trim());
  });
  (flats || []).forEach((f) => {
    if (f.buildingName?.trim()) set.add(f.buildingName.trim());
  });
  extraLocations.forEach((loc) => {
    const resolved = resolveTowerForLocation(loc, flats, buildings);
    if (resolved && resolved !== 'General / Perimeter') {
      set.add(resolved);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const collectFlatOptions = (
  towerFilter: string,
  flats?: SocietyFlat[],
  buildings?: SocietyBuilding[],
  recordFlats: (string | undefined)[] = []
): string[] => {
  const set = new Set<string>();
  (flats || []).forEach((f) => {
    if (!f.flatNumber?.trim()) return;
    if (towerFilter === 'ALL' || f.buildingName === towerFilter) {
      set.add(f.flatNumber.trim());
    }
  });
  recordFlats.forEach((loc) => {
    const trimmed = (loc || '').trim();
    if (!trimmed) return;
    if (
      towerFilter === 'ALL' ||
      resolveTowerForLocation(trimmed, flats, buildings) === towerFilter
    ) {
      set.add(trimmed);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const formatDisplayTime = (val?: string): string => {
  if (!val) return '—';
  const parsed = new Date(val);
  if (!Number.isNaN(parsed.getTime()) && /\d{4}-\d{2}-\d{2}/.test(val)) {
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return val;
};

// -------------------------------------------------------------
// MODULE 7: SECURITY GUARD MANAGEMENT
// -------------------------------------------------------------
interface GuardsViewProps {
  society: Society;
  guards: GuardItem[];
  gates: SocietyGate[];
  buildings?: SocietyBuilding[];
  flats?: SocietyFlat[];
  onAddGuard: (g: any) => Promise<void>;
  onToggleGuardStatus: (id: string, currentStatus: GuardItem['status']) => Promise<void>;
}

export const SocietyGuardsView: React.FC<GuardsViewProps> = ({
  society,
  guards,
  gates,
  buildings = [],
  flats = [],
  onAddGuard,
  onToggleGuardStatus,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [gateAssigned, setGateAssigned] = useState(gates[0]?.name || 'Main Gate #1');
  const [towerAssigned, setTowerAssigned] = useState('All Towers');
  const [shift, setShift] = useState<'DAY' | 'NIGHT' | 'ROTATIONAL'>('DAY');
  const [isSupervisor, setIsSupervisor] = useState(false);

  // Filter & PDF Period state
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const towerOptions = useMemo(
    () =>
      collectTowerOptions(
        buildings,
        flats,
        guards.map((g) => g.towerAssigned)
      ),
    [buildings, flats, guards]
  );

  const filteredGuards = useMemo(() => {
    return guards.filter((g) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.badgeNumber.toLowerCase().includes(q) ||
        g.gateAssigned.toLowerCase().includes(q) ||
        g.phoneNumber.toLowerCase().includes(q);
      const matchShift = shiftFilter === 'ALL' || g.shift === shiftFilter;
      const gTower = g.towerAssigned || 'All Towers';
      const matchTower =
        towerFilter === 'ALL' ||
        gTower === towerFilter ||
        g.gateAssigned.toLowerCase().includes(towerFilter.toLowerCase());
      const matchPeriod = matchesSocietyPeriod(
        g.createdAt || society.createdAt || '2026-11-01T08:00:00Z',
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );
      return matchSearch && matchShift && matchTower && matchPeriod;
    });
  }, [guards, searchTerm, shiftFilter, towerFilter, periodMode, dayValue, monthValue, yearValue, society.createdAt]);

  const handleDownloadGuardsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Guard Name',
      'Badge No',
      'Assigned Gate',
      'Tower Coverage',
      'Shift',
      'Role',
      'Phone Number',
      'Status',
      'Deployed Date',
    ];
    const rows = filteredGuards.map((g) => ({
      'Guard Name': g.name,
      'Badge No': g.badgeNumber,
      'Assigned Gate': g.gateAssigned,
      'Tower Coverage': g.towerAssigned || 'All Towers',
      Shift: g.shift,
      Role: g.isSupervisor ? 'Shift Supervisor' : 'Gate Guard',
      'Phone Number': g.phoneNumber,
      Status: g.status,
      'Deployed Date': normalizeSocietyIsoDate(g.createdAt || society.createdAt || '2026-11-01') || '—',
    }));

    const filterSummary = `Society: ${society.societyName} (${society.societyCode}) | Period: ${period.label} | Tower: ${
      towerFilter === 'ALL' ? 'All Towers' : towerFilter
    } | Shift: ${shiftFilter === 'ALL' ? 'All Shifts' : shiftFilter} | Records: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Security Guard Sentinels Report',
      subtitle: 'Security & Access Gates • Deployed Guard Roster, Gates & Shift Coverage',
      filename: `${socSlug}_security_guards_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    await onAddGuard({
      societyId: society.id,
      name,
      phoneNumber: phone,
      badgeNumber: badgeNumber || `SEC-${Math.floor(100 + Math.random() * 900)}`,
      gateAssigned,
      towerAssigned,
      shift,
      status: 'ACTIVE',
      isSupervisor,
      createdAt: new Date().toISOString(),
    });
    setShowAddModal(false);
    setName('');
    setPhone('');
    setBadgeNumber('');
    setTowerAssigned('All Towers');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Security Guard Roster</h2>
          <p className="text-sm text-gray-500">
            Deploy guards across entry gates, assign shifts and verify duty statuses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Security Guard
        </button>
      </div>

      {/* Search & Shift Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search guard name, badge, gate, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Shifts</option>
            <option value="DAY">Day Shift</option>
            <option value="NIGHT">Night Shift</option>
            <option value="ROTATIONAL">Rotational</option>
          </select>
        </div>
      </div>

      {/* PDF Export Toolbar (Date, Month, Year, Tower-wise) */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        towerOptions={towerOptions}
        towerValue={towerFilter}
        onTowerValueChange={setTowerFilter}
        matchedCount={filteredGuards.length}
        onExportPdf={handleDownloadGuardsPdf}
        pdfButtonLabel="Download Guards PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setTowerFilter('ALL');
        }}
      />

      {filteredGuards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          No security guards match the selected period or tower filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuards.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      {g.name}
                      {g.isSupervisor && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                          Supervisor
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">Badge: {g.badgeNumber}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    g.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {g.status}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <DoorClosed className="w-3.5 h-3.5 text-gray-400" /> Assigned Gate
                  </span>
                  <span className="font-semibold text-gray-900">{g.gateAssigned}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Shift
                  </span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {g.shift}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Contact
                  </span>
                  <span className="font-mono text-gray-900">{g.phoneNumber}</span>
                </div>
                {g.towerAssigned && (
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tower Coverage</span>
                    <span className="font-semibold text-teal-700">{g.towerAssigned}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end">
                <button
                  onClick={() => onToggleGuardStatus(g.id, g.status)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    g.status === 'ACTIVE'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {g.status === 'ACTIVE' ? 'Suspend Guard' : 'Activate Guard'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Add Security Guard</h3>
            <p className="text-xs text-gray-500 mb-4">
              Register security staff for gate access and OTP verification
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Shinde"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Badge Number
                  </label>
                  <input
                    type="text"
                    placeholder="SEC-104"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="DAY">Day (07:00 - 19:00)</option>
                    <option value="NIGHT">Night (19:00 - 07:00)</option>
                    <option value="ROTATIONAL">Rotational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Assigned Gate
                  </label>
                  <select
                    value={gateAssigned}
                    onChange={(e) => setGateAssigned(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    {gates.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tower Coverage
                  </label>
                  <select
                    value={towerAssigned}
                    onChange={(e) => setTowerAssigned(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="All Towers">All Towers</option>
                    {towerOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="supervisorCheck"
                  checked={isSupervisor}
                  onChange={(e) => setIsSupervisor(e.target.checked)}
                  className="rounded text-[#673AB7] focus:ring-[#673AB7]"
                />
                <label htmlFor="supervisorCheck" className="text-xs font-semibold text-gray-700">
                  Assign as Shift Supervisor
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition cursor-pointer"
                >
                  Save Guard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 8: GATE MANAGEMENT
// -------------------------------------------------------------
interface GatesViewProps {
  society: Society;
  gates: SocietyGate[];
  buildings?: SocietyBuilding[];
  flats?: SocietyFlat[];
  onAddGate: (g: any) => Promise<void>;
  onUpdateGate: (id: string, data: Partial<SocietyGate>) => Promise<void>;
}

export const SocietyGatesView: React.FC<GatesViewProps> = ({
  society,
  gates,
  buildings = [],
  flats = [],
  onAddGate,
  onUpdateGate,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [servingTower, setServingTower] = useState('All Towers');
  const [operatingStatus, setOperatingStatus] = useState<SocietyGate['operatingStatus']>('OPEN');
  const [hasBoomBarrier, setHasBoomBarrier] = useState(true);
  const [hasLicensePlateCamera, setHasLicensePlateCamera] = useState(true);

  // Filter & PDF Period state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const towerOptions = useMemo(
    () =>
      collectTowerOptions(
        buildings,
        flats,
        gates.map((g) => g.servingTower)
      ),
    [buildings, flats, gates]
  );

  const filteredGates = useMemo(() => {
    return gates.filter((g) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.locationDescription.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || g.operatingStatus === statusFilter;
      const gTower = g.servingTower || 'All Towers';
      const matchTower =
        towerFilter === 'ALL' ||
        gTower === towerFilter ||
        g.name.toLowerCase().includes(towerFilter.toLowerCase()) ||
        g.locationDescription.toLowerCase().includes(towerFilter.toLowerCase());
      const matchPeriod = matchesSocietyPeriod(
        g.createdAt || society.createdAt || '2026-11-01T08:00:00Z',
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );
      return matchSearch && matchStatus && matchTower && matchPeriod;
    });
  }, [gates, searchTerm, statusFilter, towerFilter, periodMode, dayValue, monthValue, yearValue, society.createdAt]);

  const handleDownloadGatesPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Gate Name',
      'Location / Post',
      'Gate Type',
      'Tower / Zone',
      'Boom Barrier',
      'ANPR Camera',
      'Guards On Duty',
      'Status',
      'Installed Date',
    ];
    const rows = filteredGates.map((g) => ({
      'Gate Name': g.name,
      'Location / Post': g.locationDescription,
      'Gate Type': g.gateType || 'VEHICULAR',
      'Tower / Zone': g.servingTower || 'All Towers',
      'Boom Barrier': g.hasBoomBarrier ? 'Active' : 'No',
      'ANPR Camera': g.hasLicensePlateCamera ? 'Connected' : 'No',
      'Guards On Duty': g.assignedGuardsCount,
      Status: g.operatingStatus,
      'Installed Date': normalizeSocietyIsoDate(g.createdAt || society.createdAt || '2026-11-01') || '—',
    }));

    const filterSummary = `Society: ${society.societyName} (${society.societyCode}) | Period: ${period.label} | Tower/Zone: ${
      towerFilter === 'ALL' ? 'All Towers' : towerFilter
    } | Status: ${statusFilter === 'ALL' ? 'All' : statusFilter} | Checkpoints: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Gate Checkpoints & Access Report',
      subtitle: 'Security & Access Gates • Entry Posts, Barriers, ANPR & Guard Deployment',
      filename: `${socSlug}_gate_checkpoints_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await onAddGate({
      societyId: society.id,
      name,
      locationDescription: locationDescription || 'Ground perimeter entry',
      operatingStatus,
      assignedGuardsCount: 1,
      hasBoomBarrier,
      hasLicensePlateCamera,
      servingTower,
      createdAt: new Date().toISOString(),
    });
    setShowAddModal(false);
    setName('');
    setLocationDescription('');
    setServingTower('All Towers');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gate Checkpoints & Access Control</h2>
          <p className="text-sm text-gray-500">
            Manage entry gates, ANPR cameras, boom barriers and lock statuses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Gate Checkpoint
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gate name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="RESTRICTED">Restricted</option>
            <option value="EMERGENCY_LOCKED">Emergency Locked</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
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
        towerOptions={towerOptions}
        towerValue={towerFilter}
        onTowerValueChange={setTowerFilter}
        matchedCount={filteredGates.length}
        onExportPdf={handleDownloadGatesPdf}
        pdfButtonLabel="Download Gates PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setTowerFilter('ALL');
        }}
      />

      {filteredGates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          No gate checkpoints match the selected period or tower filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGates.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F1F9FC] text-[#673AB7] flex items-center justify-center font-bold">
                    <DoorClosed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{g.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                      {g.locationDescription}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    g.operatingStatus === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-700'
                      : g.operatingStatus === 'RESTRICTED'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {g.operatingStatus}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Boom Barrier Installed</span>
                  <span
                    className={`font-semibold ${
                      g.hasBoomBarrier ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {g.hasBoomBarrier ? 'Active' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> License Plate Camera (ANPR)
                  </span>
                  <span
                    className={`font-semibold ${
                      g.hasLicensePlateCamera ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {g.hasLicensePlateCamera ? 'Connected' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Security Personnel</span>
                  <span className="font-bold text-[#673AB7]">{g.assignedGuardsCount} on duty</span>
                </div>
                {g.servingTower && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tower / Zone</span>
                    <span className="font-semibold text-teal-700">{g.servingTower}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">Lock Checkpoint</span>
                <div className="flex gap-1.5">
                  {(['OPEN', 'RESTRICTED', 'EMERGENCY_LOCKED', 'MAINTENANCE'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => onUpdateGate(g.id, { operatingStatus: status })}
                        className={`text-[10px] px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                          g.operatingStatus === status
                            ? 'bg-[#673AB7] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'EMERGENCY_LOCKED' ? 'LOCKED' : status}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Add Gate Checkpoint</h3>
            <p className="text-xs text-gray-500 mb-4">Register an entry or exit security post</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gate Name</label>
                <input
                  type="text"
                  placeholder="e.g. North Service Gate #3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Location Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. West Corner near Clubhouse"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Primary Tower / Zone Served
                </label>
                <select
                  value={servingTower}
                  onChange={(e) => setServingTower(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="All Towers">All Towers (Perimeter)</option>
                  {towerOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="barrierCheck"
                    checked={hasBoomBarrier}
                    onChange={(e) => setHasBoomBarrier(e.target.checked)}
                    className="rounded text-[#673AB7] focus:ring-[#673AB7]"
                  />
                  <label htmlFor="barrierCheck" className="text-xs font-semibold text-gray-700">
                    Automated Boom Barrier Hardware
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anprCheck"
                    checked={hasLicensePlateCamera}
                    onChange={(e) => setHasLicensePlateCamera(e.target.checked)}
                    className="rounded text-[#673AB7] focus:ring-[#673AB7]"
                  />
                  <label htmlFor="anprCheck" className="text-xs font-semibold text-gray-700">
                    ANPR License Plate Recognition Camera
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition cursor-pointer"
                >
                  Create Gate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 9 & 10: VISITOR & PRE-APPROVAL MANAGEMENT
// -------------------------------------------------------------
interface VisitorsViewProps {
  society: Society;
  visitors: GatePass[];
  buildings?: SocietyBuilding[];
  flats?: SocietyFlat[];
  onCheckOutVisitor: (id: string) => Promise<void>;
}

export const SocietyVisitorsView: React.FC<VisitorsViewProps> = ({
  society,
  visitors,
  buildings = [],
  flats = [],
  onCheckOutVisitor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [flatFilter, setFlatFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const towerOptions = useMemo(
    () =>
      collectTowerOptions(
        buildings,
        flats,
        visitors.map((v) => v.hostFlat)
      ),
    [buildings, flats, visitors]
  );

  const flatOptions = useMemo(
    () =>
      collectFlatOptions(
        towerFilter,
        flats,
        buildings,
        visitors.map((v) => v.hostFlat)
      ),
    [towerFilter, flats, buildings, visitors]
  );

  const handleTowerChange = (nextTower: string) => {
    setTowerFilter(nextTower);
    setFlatFilter('ALL');
  };

  const filtered = useMemo(() => {
    return visitors.filter((v) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        v.visitorName.toLowerCase().includes(q) ||
        v.visitorPhone.toLowerCase().includes(q) ||
        v.hostFlat.toLowerCase().includes(q) ||
        v.passCode.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'ALL' || v.visitorType === categoryFilter;
      const vTower = resolveTowerForLocation(v.hostFlat, flats, buildings);
      const matchTower = towerFilter === 'ALL' || vTower === towerFilter;
      const matchFlat =
        flatFilter === 'ALL' || v.hostFlat.trim().toLowerCase() === flatFilter.toLowerCase();
      const matchPeriod = matchesSocietyPeriod(
        v.createdAt || v.checkInTime,
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );
      return matchSearch && matchCat && matchTower && matchFlat && matchPeriod;
    });
  }, [
    visitors,
    searchTerm,
    categoryFilter,
    towerFilter,
    flatFilter,
    periodMode,
    dayValue,
    monthValue,
    yearValue,
    flats,
    buildings,
  ]);

  const handleDownloadVisitorsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Visitor Name',
      'Phone',
      'Category',
      'Tower / Block',
      'Host Flat',
      'Host Resident',
      'Entry Gate',
      'Pass Code',
      'Check-In',
      'Check-Out',
      'Status',
      'Entry Date',
    ];
    const rows = filtered.map((v) => ({
      'Visitor Name': v.visitorName,
      Phone: v.visitorPhone,
      Category: v.visitorType,
      'Tower / Block': resolveTowerForLocation(v.hostFlat, flats, buildings),
      'Host Flat': v.hostFlat,
      'Host Resident': v.hostResidentName || '—',
      'Entry Gate': v.entryGate || '—',
      'Pass Code': v.passCode,
      'Check-In': formatDisplayTime(v.checkInTime),
      'Check-Out': formatDisplayTime(v.checkOutTime),
      Status: v.status,
      'Entry Date': normalizeSocietyIsoDate(v.createdAt) || '—',
    }));

    const filterSummary = `Society: ${society.societyName} (${society.societyCode}) | Period: ${period.label} | Tower: ${
      towerFilter === 'ALL' ? 'All Towers' : towerFilter
    } | Flat: ${flatFilter === 'ALL' ? 'All Flats' : flatFilter} | Category: ${
      categoryFilter === 'ALL' ? 'All' : categoryFilter
    } | Records: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Live Visitor Ingress Report',
      subtitle: 'Security & Access Gates • Visitor Check-Ins, Gates, Vehicles & Pass Logs',
      filename: `${socSlug}_visitor_ingress_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Visitor Ingress & Log</h2>
          <p className="text-sm text-gray-500">
            Monitor guests, delivery agents, cabs and services entering premises
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-[#F1F9FC] text-gray-700 font-semibold rounded-xl border border-gray-200">
            Total Logged: {visitors.length}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitor, phone, flat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Guest">Guest</option>
            <option value="Delivery">Delivery</option>
            <option value="Cab">Cab</option>
            <option value="Service">Service</option>
          </select>
        </div>
      </div>

      {/* PDF Export Toolbar (Date, Month, Year, Tower-wise, Flat-wise) */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        towerOptions={towerOptions}
        towerValue={towerFilter}
        onTowerValueChange={handleTowerChange}
        flatOptions={flatOptions}
        flatValue={flatFilter}
        onFlatValueChange={setFlatFilter}
        matchedCount={filtered.length}
        onExportPdf={handleDownloadVisitorsPdf}
        pdfButtonLabel="Download Visitor Log PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setTowerFilter('ALL');
          setFlatFilter('ALL');
        }}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Visitor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Host Flat</th>
                <th className="py-3 px-4">Pass Code</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No visitor records found.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{v.visitorName}</div>
                      <div className="text-xs text-gray-400 font-mono">{v.visitorPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                        {v.visitorType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{v.hostFlat}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#673AB7] text-xs">
                      {v.passCode}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600 tabular-nums">
                      {formatDisplayTime(v.checkInTime)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          v.status === 'CheckedIn'
                            ? 'bg-purple-50 text-purple-700'
                            : v.status === 'CheckedOut'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {v.status === 'CheckedIn' ? (
                        <button
                          onClick={() => onCheckOutVisitor(v.id)}
                          className="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition cursor-pointer"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SocietyPreApprovalsView: React.FC<{
  society: Society;
  passes: GatePass[];
  buildings?: SocietyBuilding[];
  flats?: SocietyFlat[];
  onRevokePass?: (passId: string, reason: string) => Promise<void>;
}> = ({ society, passes, buildings = [], flats = [], onRevokePass }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [flatFilter, setFlatFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));
  const [revokingPass, setRevokingPass] = useState<GatePass | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const towerOptions = useMemo(
    () =>
      collectTowerOptions(
        buildings,
        flats,
        passes.map((p) => p.hostFlat)
      ),
    [buildings, flats, passes]
  );

  const flatOptions = useMemo(
    () =>
      collectFlatOptions(
        towerFilter,
        flats,
        buildings,
        passes.map((p) => p.hostFlat)
      ),
    [towerFilter, flats, buildings, passes]
  );

  const handleTowerChange = (nextTower: string) => {
    setTowerFilter(nextTower);
    setFlatFilter('ALL');
  };

  const filtered = useMemo(() => {
    return passes.filter((p) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.visitorName.toLowerCase().includes(q) ||
        p.hostFlat.toLowerCase().includes(q) ||
        p.passCode.toLowerCase().includes(q);
      const isRevoked = p.status === 'Expired' || Boolean((p as any).revocationReason);
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'REVOKED' ? isRevoked : p.status === statusFilter && !isRevoked);
      const pTower = resolveTowerForLocation(p.hostFlat, flats, buildings);
      const matchTower = towerFilter === 'ALL' || pTower === towerFilter;
      const matchFlat =
        flatFilter === 'ALL' || p.hostFlat.trim().toLowerCase() === flatFilter.toLowerCase();
      const matchPeriod = matchesSocietyPeriod(
        p.createdAt || p.checkInTime,
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );
      return matchSearch && matchStatus && matchTower && matchFlat && matchPeriod;
    });
  }, [
    passes,
    searchTerm,
    statusFilter,
    towerFilter,
    flatFilter,
    periodMode,
    dayValue,
    monthValue,
    yearValue,
    flats,
    buildings,
  ]);

  const handleDownloadPreApprovalsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Pass ID',
      'Visitor Name',
      'Category',
      'Tower / Block',
      'Destination Flat',
      'Host Resident',
      'Pass Code / OTP',
      'Entry Gate',
      'Created Date',
      'Status',
      'Audit / Revocation Reason',
    ];
    const rows = filtered.map((p) => {
      const isRevoked = p.status === 'Expired' || Boolean((p as any).revocationReason);
      return {
        'Pass ID': p.id,
        'Visitor Name': p.visitorName,
        Category: p.visitorType,
        'Tower / Block': resolveTowerForLocation(p.hostFlat, flats, buildings),
        'Destination Flat': p.hostFlat,
        'Host Resident': p.hostResidentName || '—',
        'Pass Code / OTP': p.passCode,
        'Entry Gate': p.entryGate || '—',
        'Created Date': normalizeSocietyIsoDate(p.createdAt) || '—',
        Status: isRevoked ? 'REVOKED' : p.status,
        'Audit / Revocation Reason': (p as any).revocationReason || p.purpose || '—',
      };
    });

    const filterSummary = `Society: ${society.societyName} (${society.societyCode}) | Period: ${period.label} | Tower: ${
      towerFilter === 'ALL' ? 'All Towers' : towerFilter
    } | Flat: ${flatFilter === 'ALL' ? 'All Flats' : flatFilter} | Status: ${
      statusFilter === 'ALL' ? 'All' : statusFilter
    } | Passes: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Visitor Pre-Approvals & Digital GatePasses Report',
      subtitle: 'Security & Access Gates • Resident Invite OTPs, GatePasses & Revocations',
      filename: `${socSlug}_visitor_preapprovals_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  const handleConfirmRevoke = async () => {
    if (!revokingPass || !revokeReason.trim() || !onRevokePass) return;
    setRevoking(true);
    try {
      await onRevokePass(revokingPass.id, revokeReason.trim());
      setRevokingPass(null);
      setRevokeReason('');
    } catch (err) {
      console.error('Error revoking pass:', err);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Resident Pre-Approvals & Digital GatePasses
          </h2>
          <p className="text-sm text-gray-500">
            Monitor digital invite codes, OTPs, and expected visitor passes with administrative revocation controls
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitor, flat, pass code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Pass Statuses</option>
            <option value="Approved">Approved</option>
            <option value="CheckedIn">Checked In</option>
            <option value="CheckedOut">Checked Out</option>
            <option value="REVOKED">Revoked / Expired</option>
          </select>
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
        towerOptions={towerOptions}
        towerValue={towerFilter}
        onTowerValueChange={handleTowerChange}
        flatOptions={flatOptions}
        flatValue={flatFilter}
        onFlatValueChange={setFlatFilter}
        matchedCount={filtered.length}
        onExportPdf={handleDownloadPreApprovalsPdf}
        pdfButtonLabel="Download Pre-Approvals PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setTowerFilter('ALL');
          setFlatFilter('ALL');
        }}
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          No pre-approval passes match the selected period, tower or flat filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const isRevoked = p.status === 'Expired' || (p as any).revocationReason;
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{p.visitorName}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#F1F9FC] text-gray-700 font-semibold">
                          {p.visitorType}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isRevoked
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : p.status === 'CheckedIn'
                          ? 'bg-purple-50 text-purple-700'
                          : p.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isRevoked ? 'REVOKED' : p.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Destination Flat</span>
                      <span className="font-bold text-gray-900">{p.hostFlat}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Pass Code / OTP</span>
                      <span className="font-mono font-bold text-[#673AB7] bg-purple-50 px-2 py-0.5 rounded-md">
                        {p.passCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Host Resident</span>
                      <span className="text-gray-700 font-medium">{p.hostResidentName}</span>
                    </div>
                    {(p as any).revocationReason && (
                      <div className="p-2 bg-red-50 rounded-lg border border-red-100 text-[11px] text-red-700 mt-2">
                        <span className="font-bold block">Audit Reason:</span>
                        {(p as any).revocationReason}
                      </div>
                    )}
                  </div>
                </div>

                {!isRevoked && onRevokePass && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRevokingPass(p);
                        setRevokeReason('');
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
                    >
                      Revoke Pass
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Revocation Modal */}
      {revokingPass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Revoke Digital GatePass</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter mandatory audit reason for revoking access for{' '}
              <strong className="text-gray-800">{revokingPass.visitorName}</strong> (
              {revokingPass.hostFlat}).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Revocation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Unscheduled delivery, visitor identity discrepancy, resident cancellation..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setRevokingPass(null);
                    setRevokeReason('');
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={!revokeReason.trim() || revoking}
                  className="px-4 py-2 bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition cursor-pointer"
                >
                  {revoking ? 'Revoking...' : 'Confirm Revocation'}
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
// MODULE 15: EMERGENCY & SECURITY ALERT MONITORING
// -------------------------------------------------------------
interface EmergencyViewProps {
  society: Society;
  alerts: SocietyEmergencyAlert[];
  buildings?: SocietyBuilding[];
  flats?: SocietyFlat[];
  onResolveAlert: (id: string, notes: string) => Promise<void>;
}

export const SocietyEmergencyView: React.FC<EmergencyViewProps> = ({
  society,
  alerts,
  buildings = [],
  flats = [],
  onResolveAlert,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<SocietyEmergencyAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter & PDF Period state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [towerFilter, setTowerFilter] = useState<string>('ALL');
  const [flatFilter, setFlatFilter] = useState<string>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const towerOptions = useMemo(
    () =>
      collectTowerOptions(
        buildings,
        flats,
        alerts.map((a) => a.flatNumber)
      ),
    [buildings, flats, alerts]
  );

  const flatOptions = useMemo(
    () =>
      collectFlatOptions(
        towerFilter,
        flats,
        buildings,
        alerts.map((a) => a.flatNumber)
      ),
    [towerFilter, flats, buildings, alerts]
  );

  const handleTowerChange = (nextTower: string) => {
    setTowerFilter(nextTower);
    setFlatFilter('ALL');
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const aTower = resolveTowerForLocation(a.flatNumber, flats, buildings);
      const matchTower = towerFilter === 'ALL' || aTower === towerFilter;
      const matchFlat =
        flatFilter === 'ALL' || a.flatNumber.trim().toLowerCase() === flatFilter.toLowerCase();
      const matchPeriod = matchesSocietyPeriod(
        a.timestamp,
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );
      return matchStatus && matchTower && matchFlat && matchPeriod;
    });
  }, [alerts, statusFilter, towerFilter, flatFilter, periodMode, dayValue, monthValue, yearValue, flats, buildings]);

  const activeAlerts = filteredAlerts.filter((a) => a.status === 'ACTIVE');
  const resolvedAlerts = filteredAlerts.filter((a) => a.status === 'RESOLVED');

  const handleDownloadEmergencyPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    const columns = [
      'Incident ID',
      'Alert Type',
      'Tower / Zone',
      'Location / Flat',
      'Triggered By',
      'Contact Phone',
      'Reported At',
      'Status',
      'Resolved At',
      'Resolved By',
      'Response Notes',
    ];
    const rows = filteredAlerts.map((a) => ({
      'Incident ID': a.id,
      'Alert Type': a.alertType,
      'Tower / Zone': resolveTowerForLocation(a.flatNumber, flats, buildings),
      'Location / Flat': a.flatNumber,
      'Triggered By': a.reportedByName,
      'Contact Phone': a.reportedByPhone || '—',
      'Reported At': a.timestamp ? new Date(a.timestamp).toLocaleString() : '—',
      Status: a.status,
      'Resolved At': a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : '—',
      'Resolved By': a.resolvedByName || '—',
      'Response Notes': a.responseNotes || '—',
    }));

    const filterSummary = `Society: ${society.societyName} (${society.societyCode}) | Period: ${period.label} | Tower: ${
      towerFilter === 'ALL' ? 'All Towers' : towerFilter
    } | Flat: ${flatFilter === 'ALL' ? 'All Flats' : flatFilter} | Status: ${
      statusFilter === 'ALL' ? 'Active & Resolved' : statusFilter
    } | Incidents: ${rows.length}`;

    exportSocietyPdf({
      society,
      title: 'Emergency & SOS Incidents Report',
      subtitle: 'Security & Access Gates • Panic Alerts, Incident Response & Resolution Audit',
      filename: `${socSlug}_emergency_sos_${period.slug}`,
      columns,
      rows,
      filterSummary,
    });
  };

  const handleOpenResolve = (a: SocietyEmergencyAlert) => {
    setSelectedAlert(a);
    setResolutionNotes('');
  };

  const handleConfirmResolve = async () => {
    if (!selectedAlert || !resolutionNotes) return;
    setSubmitting(true);
    try {
      await onResolveAlert(selectedAlert.id, resolutionNotes);
      setSelectedAlert(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Emergency & Panic SOS Center</h2>
          <p className="text-sm text-gray-500">
            Real-time alerts triggered by residents, security guards or automated sensors
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Alerts ({alerts.length})</option>
            <option value="ACTIVE">Active Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          {activeAlerts.length > 0 && (
            <div className="animate-pulse flex items-center gap-2 px-3.5 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-300">
              <Flame className="w-4 h-4" /> {activeAlerts.length} Active Emergency Incident(s)
            </div>
          )}
        </div>
      </div>

      {/* PDF Export Toolbar (Date, Month, Year, Tower-wise, Flat-wise) */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        towerOptions={towerOptions}
        towerValue={towerFilter}
        onTowerValueChange={handleTowerChange}
        flatOptions={flatOptions}
        flatValue={flatFilter}
        onFlatValueChange={setFlatFilter}
        matchedCount={filteredAlerts.length}
        onExportPdf={handleDownloadEmergencyPdf}
        pdfButtonLabel="Download Emergency SOS PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setTowerFilter('ALL');
          setFlatFilter('ALL');
          setStatusFilter('ALL');
        }}
      />

      {/* Active Incidents */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Live Emergency Incidents
        </h3>
        {activeAlerts.length === 0 ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800 text-sm font-medium">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            All premises secure. No active SOS panic or emergency alerts reported for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border-2 border-red-500 shadow-md p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      {a.alertType === 'Fire' ? (
                        <Flame className="w-5 h-5" />
                      ) : a.alertType === 'Medical Emergency' ? (
                        <HeartPulse className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {a.alertType.toUpperCase()} ALERT
                      </h4>
                      <p className="text-xs text-red-600 font-semibold">Flat {a.flatNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-600 text-white animate-pulse">
                    {a.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-900">Triggered By:</span>{' '}
                    {a.reportedByName} ({a.reportedByPhone})
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Time:</span>{' '}
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                  {a.responseNotes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-gray-700 italic">
                      Notes: {a.responseNotes}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    onClick={() => handleOpenResolve(a)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Investigate & Resolve Incident
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved incidents history */}
      <div className="pt-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
          Incident Archive & Resolution Log
        </h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Incident Type</th>
                  <th className="py-3 px-4">Location & Flat</th>
                  <th className="py-3 px-4">Reported At</th>
                  <th className="py-3 px-4">Resolution Notes</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {resolvedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400 text-xs">
                      No resolved alerts history for the selected filters.
                    </td>
                  </tr>
                ) : (
                  resolvedAlerts.map((a) => (
                    <tr key={a.id} className="hover:bg-purple-50/20 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{a.alertType}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">Flat {a.flatNumber}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 tabular-nums">
                        {new Date(a.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700 italic">
                        {a.responseNotes || 'Resolved by security team.'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          RESOLVED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resolve Incident Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">
              Resolve Incident: {selectedAlert.alertType}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Flat {selectedAlert.flatNumber}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Resolution Summary & Response Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Guard team dispatched immediately. Resident confirmed accidental trigger while testing the intercom. No damages or fire."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !resolutionNotes}
                  onClick={handleConfirmResolve}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition cursor-pointer"
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
