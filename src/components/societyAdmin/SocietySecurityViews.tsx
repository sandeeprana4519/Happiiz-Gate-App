import React, { useState } from 'react';
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
  Search 
} from 'lucide-react';
import { 
  SocietyGate, 
  SocietyEmergencyAlert 
} from '../../types/societyAdmin';
import { Society, GatePass } from '../../types/society';

export interface GuardItem {
  id: string;
  societyId: string;
  name: string;
  phoneNumber: string;
  badgeNumber: string;
  gateAssigned: string;
  shift: 'DAY' | 'NIGHT' | 'ROTATIONAL';
  status: 'ACTIVE' | 'INACTIVE';
  isSupervisor?: boolean;
}

// -------------------------------------------------------------
// MODULE 7: SECURITY GUARD MANAGEMENT
// -------------------------------------------------------------
interface GuardsViewProps {
  society: Society;
  guards: GuardItem[];
  gates: SocietyGate[];
  onAddGuard: (g: any) => Promise<void>;
  onToggleGuardStatus: (id: string, currentStatus: GuardItem['status']) => Promise<void>;
}

export const SocietyGuardsView: React.FC<GuardsViewProps> = ({
  society,
  guards,
  gates,
  onAddGuard,
  onToggleGuardStatus
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [gateAssigned, setGateAssigned] = useState(gates[0]?.name || 'Main Gate #1');
  const [shift, setShift] = useState<'DAY' | 'NIGHT' | 'ROTATIONAL'>('DAY');
  const [isSupervisor, setIsSupervisor] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    await onAddGuard({
      societyId: society.id,
      name,
      phoneNumber: phone,
      badgeNumber: badgeNumber || `SEC-${Math.floor(100 + Math.random() * 900)}`,
      gateAssigned,
      shift,
      status: 'ACTIVE',
      isSupervisor
    });
    setShowAddModal(false);
    setName('');
    setPhone('');
    setBadgeNumber('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Security Guard Roster</h2>
          <p className="text-sm text-gray-500">Deploy guards across entry gates, assign shifts and verify duty statuses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Security Guard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {guards.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition">
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
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                g.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {g.status}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5"><DoorClosed className="w-3.5 h-3.5 text-gray-400" /> Assigned Gate</span>
                <span className="font-semibold text-gray-900">{g.gateAssigned}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> Shift</span>
                <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">{g.shift}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> Contact</span>
                <span className="font-mono text-gray-900">{g.phoneNumber}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end">
              <button
                onClick={() => onToggleGuardStatus(g.id, g.status)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                  g.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {g.status === 'ACTIVE' ? 'Suspend Guard' : 'Activate Guard'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Add Security Guard</h3>
            <p className="text-xs text-gray-500 mb-4">Register security staff for gate access and OTP verification</p>

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
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Badge Number</label>
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Gate</label>
                <select
                  value={gateAssigned}
                  onChange={(e) => setGateAssigned(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  {gates.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
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
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
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
  onAddGate: (g: any) => Promise<void>;
  onUpdateGate: (id: string, data: Partial<SocietyGate>) => Promise<void>;
}

export const SocietyGatesView: React.FC<GatesViewProps> = ({
  society,
  gates,
  onAddGate,
  onUpdateGate
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [operatingStatus, setOperatingStatus] = useState<SocietyGate['operatingStatus']>('OPEN');
  const [hasBoomBarrier, setHasBoomBarrier] = useState(true);
  const [hasLicensePlateCamera, setHasLicensePlateCamera] = useState(true);

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
      hasLicensePlateCamera
    });
    setShowAddModal(false);
    setName('');
    setLocationDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gate Checkpoints & Access Control</h2>
          <p className="text-sm text-gray-500">Manage entry gates, ANPR cameras, boom barriers and lock statuses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Gate Checkpoint
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {gates.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition">
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
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                g.operatingStatus === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700'
                  : g.operatingStatus === 'RESTRICTED'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {g.operatingStatus}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Boom Barrier Installed</span>
                <span className={`font-semibold ${g.hasBoomBarrier ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {g.hasBoomBarrier ? 'Active' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> License Plate Camera (ANPR)</span>
                <span className={`font-semibold ${g.hasLicensePlateCamera ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {g.hasLicensePlateCamera ? 'Connected' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Security Personnel</span>
                <span className="font-bold text-[#673AB7]">{g.assignedGuardsCount} on duty</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">Lock Checkpoint</span>
              <div className="flex gap-1.5">
                {(['OPEN', 'RESTRICTED', 'EMERGENCY_LOCKED', 'MAINTENANCE'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => onUpdateGate(g.id, { operatingStatus: status })}
                    className={`text-[10px] px-2 py-1 rounded-lg font-medium transition ${
                      g.operatingStatus === status
                        ? 'bg-[#673AB7] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'EMERGENCY_LOCKED' ? 'LOCKED' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

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
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location Description</label>
                <input
                  type="text"
                  placeholder="e.g. West Corner near Clubhouse"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
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
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
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
  onCheckOutVisitor: (id: string) => Promise<void>;
}

export const SocietyVisitorsView: React.FC<VisitorsViewProps> = ({
  society,
  visitors,
  onCheckOutVisitor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = visitors.filter((v) => {
    const matchSearch = searchTerm === '' ||
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visitorPhone.includes(searchTerm) ||
      v.hostFlat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || v.visitorType === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Visitor Ingress & Log</h2>
          <p className="text-sm text-gray-500">Monitor guests, delivery agents, cabs and services entering premises</p>
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
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {v.hostFlat}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#673AB7] text-xs">
                      {v.passCode}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        v.status === 'CheckedIn'
                          ? 'bg-purple-50 text-purple-700'
                          : v.status === 'CheckedOut'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {v.status === 'CheckedIn' ? (
                        <button
                          onClick={() => onCheckOutVisitor(v.id)}
                          className="text-xs px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition"
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
  onRevokePass?: (passId: string, reason: string) => Promise<void>;
}> = ({
  society,
  passes,
  onRevokePass
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [revokingPass, setRevokingPass] = useState<GatePass | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const filtered = passes.filter(p => 
    p.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.hostFlat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.passCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-xl font-bold text-gray-900">Resident Pre-Approvals & Digital GatePasses</h2>
          <p className="text-sm text-gray-500">Monitor digital invite codes, OTPs, and expected visitor passes with administrative revocation controls</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const isRevoked = p.status === 'Expired' || (p as any).revocationReason;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition flex flex-col justify-between">
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
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    isRevoked
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : p.status === 'CheckedIn'
                      ? 'bg-purple-50 text-purple-700'
                      : p.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
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

      {/* Revocation Modal */}
      {revokingPass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Revoke Digital GatePass</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter mandatory audit reason for revoking access for <strong className="text-gray-800">{revokingPass.visitorName}</strong> ({revokingPass.hostFlat}).
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
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevoke}
                  disabled={!revokeReason.trim() || revoking}
                  className="px-4 py-2 bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition"
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
  onResolveAlert: (id: string, notes: string) => Promise<void>;
}

export const SocietyEmergencyView: React.FC<EmergencyViewProps> = ({
  society,
  alerts,
  onResolveAlert
}) => {
  const [selectedAlert, setSelectedAlert] = useState<SocietyEmergencyAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');

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
          <p className="text-sm text-gray-500">Real-time alerts triggered by residents, security guards or automated sensors</p>
        </div>
        {activeAlerts.length > 0 && (
          <div className="animate-pulse flex items-center gap-2 px-3.5 py-1.5 bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-300">
            <Flame className="w-4 h-4" /> {activeAlerts.length} Active Emergency Incident(s)
          </div>
        )}
      </div>

      {/* Active Incidents */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Live Emergency Incidents</h3>
        {activeAlerts.length === 0 ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800 text-sm font-medium">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            All premises secure. No active SOS panic or emergency alerts reported.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border-2 border-red-500 shadow-md p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      {a.alertType === 'Fire' ? <Flame className="w-5 h-5" /> :
                       a.alertType === 'Medical Emergency' ? <HeartPulse className="w-5 h-5" /> :
                       <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{a.alertType.toUpperCase()} ALERT</h4>
                      <p className="text-xs text-red-600 font-semibold">Flat {a.flatNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-600 text-white animate-pulse">
                    {a.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div><span className="font-semibold text-gray-900">Triggered By:</span> {a.reportedByName} ({a.reportedByPhone})</div>
                  <div><span className="font-semibold text-gray-900">Time:</span> {new Date(a.timestamp).toLocaleString()}</div>
                  {a.responseNotes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-gray-700 italic">
                      Notes: {a.responseNotes}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                  <button
                    onClick={() => handleOpenResolve(a)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
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
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Incident Archive & Resolution Log</h3>
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
                      No resolved alerts history.
                    </td>
                  </tr>
                ) : (
                  resolvedAlerts.map(a => (
                    <tr key={a.id} className="hover:bg-purple-50/20 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{a.alertType}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">Flat {a.flatNumber}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">{new Date(a.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-700 italic">{a.responseNotes || 'Resolved by security team.'}</td>
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
            <h3 className="font-bold text-gray-900 mb-1">Resolve Incident: {selectedAlert.alertType}</h3>
            <p className="text-xs text-gray-500 mb-4">Flat {selectedAlert.flatNumber}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Resolution Summary & Response Notes</label>
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
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !resolutionNotes}
                  onClick={handleConfirmResolve}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
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
