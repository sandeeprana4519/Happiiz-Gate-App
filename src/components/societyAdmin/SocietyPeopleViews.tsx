import React, { useState } from 'react';
import { 
  Users, 
  Car, 
  Briefcase, 
  Search, 
  Plus, 
  Check, 
  Home
} from 'lucide-react';
import { 
  SocietyResidentMember, 
  SocietyHouseholdMember, 
  SocietyVehicle, 
  SocietyDomesticHelper, 
  SocietyStaffMember,
  SocietyFlat
} from '../../types/societyAdmin';
import { Society } from '../../types/society';

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
  const [selectedResident, setSelectedResident] = useState<SocietyResidentMember | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetFlat, setTargetFlat] = useState('');
  const [targetType, setTargetType] = useState<'OWNER' | 'TENANT'>('OWNER');

  const filteredResidents = residents.filter((r) => {
    const matchSearch = searchTerm === '' ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber.includes(searchTerm) ||
      r.flatNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchOcc = occupancyFilter === 'ALL' || r.occupantType === occupancyFilter;
    const matchStatus = statusFilter === 'ALL' || r.membershipStatus === statusFilter;
    return matchSearch && matchOcc && matchStatus;
  });

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

          <span className="text-xs text-gray-500 ml-auto md:ml-0 font-medium">
            Showing {filteredResidents.length}
          </span>
        </div>
      </div>

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
  household: SocietyHouseholdMember[];
  vehicles: SocietyVehicle[];
  helpers: SocietyDomesticHelper[];
  onToggleHelperStatus: (id: string, currentStatus: 'ACTIVE' | 'REVOKED') => Promise<void>;
  onAddVehicle: (v: any) => Promise<void>;
}

export const SocietyHouseholdView: React.FC<HouseholdViewProps> = ({
  society,
  household,
  vehicles,
  helpers,
  onToggleHelperStatus,
  onAddVehicle
}) => {
  const [activeTab, setActiveTab] = useState<'HELPERS' | 'VEHICLES' | 'FAMILY'>('HELPERS');
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  // New vehicle form
  const [plateNumber, setPlateNumber] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [vehicleType, setVehicleType] = useState<'Car' | 'Motorcycle' | 'EV' | 'Bicycle'>('Car');
  const [flatNumber, setFlatNumber] = useState('A-402');
  const [parkingSlot, setParkingSlot] = useState('');
  const [rfidTagId, setRfidTagId] = useState('');

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !flatNumber) return;
    await onAddVehicle({
      societyId: society.id,
      flatId: 'flt_1',
      flatNumber,
      vehicleType,
      makeModel: makeModel || 'Sedan',
      plateNumber: plateNumber.toUpperCase(),
      parkingSlot: parkingSlot || 'P-OPEN',
      rfidTagId: rfidTagId || undefined
    });
    setShowAddVehicleModal(false);
    setPlateNumber('');
    setMakeModel('');
    setParkingSlot('');
    setRfidTagId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Family & Household Directory</h2>
          <p className="text-sm text-gray-500">Monitor domestic staff, household members, and registered vehicles with parking RFID</p>
        </div>
        {activeTab === 'VEHICLES' && (
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition"
          >
            <Plus className="w-4 h-4" /> Register Vehicle
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('HELPERS')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'HELPERS'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Domestic Helpers & Staff ({helpers.length})
        </button>
        <button
          onClick={() => setActiveTab('VEHICLES')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'VEHICLES'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Car className="w-4 h-4" />
          Society Vehicles & RFID ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('FAMILY')}
          className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'FAMILY'
              ? 'border-[#673AB7] text-[#673AB7]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Family Members ({household.length})
        </button>
      </div>

      {/* Helpers Subtab */}
      {activeTab === 'HELPERS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Helper Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Flat Number</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Gate Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {helpers.map((h) => (
                  <tr key={h.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{h.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                        {h.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">{h.phone}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                      {h.flatNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-[#673AB7]">
                      {h.passCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        h.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onToggleHelperStatus(h.id, h.status)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                          h.status === 'ACTIVE'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {h.status === 'ACTIVE' ? 'Revoke Pass' : 'Authorize Pass'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicles Subtab */}
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
                  <th className="py-3 px-4">RFID Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-purple-50/20 transition">
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
                    <td className="py-3.5 px-4 text-xs font-mono text-purple-700 font-bold">
                      {v.parkingSlot}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-500">
                      {v.rfidTagId || 'NO-RFID'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Family Members Subtab */}
      {activeTab === 'FAMILY' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Flat</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {household.map((m) => (
                  <tr key={m.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{m.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Register Vehicle</h3>
            <p className="text-xs text-gray-500 mb-4">Add vehicle number plate and assign parking slot</p>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Registration Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH 02 CD 9811"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Make / Model / Color</label>
                <input
                  type="text"
                  placeholder="e.g. Honda City (White)"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="Car">4-Wheeler Car / SUV</option>
                  <option value="Motorcycle">2-Wheeler Motorcycle / Scooter</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Flat</label>
                <input
                  type="text"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Parking Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. B1-24"
                    value={parkingSlot}
                    onChange={(e) => setParkingSlot(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">RFID Tag ID</label>
                  <input
                    type="text"
                    placeholder="e.g. RF-992"
                    value={rfidTagId}
                    onChange={(e) => setRfidTagId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  Save Vehicle
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
// MODULE 19: STAFF & ROLE MANAGEMENT
// -------------------------------------------------------------
interface StaffViewProps {
  society: Society;
  staff: SocietyStaffMember[];
  onAddStaff: (s: any) => Promise<void>;
  onToggleStaffStatus: (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => Promise<void>;
}

export const SocietyStaffView: React.FC<StaffViewProps> = ({
  society,
  staff,
  onAddStaff,
  onToggleStaffStatus
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<SocietyStaffMember['role']>('Society Manager');
  const [assignedArea, setAssignedArea] = useState('Estate Office');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    await onAddStaff({
      societyId: society.id,
      fullName,
      phone,
      email: email || undefined,
      role,
      assignedArea,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString()
    });
    setShowAddModal(false);
    setFullName('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Staff & Role Access</h2>
          <p className="text-sm text-gray-500">Configure administrative personnel, estate managers, accountants and supervisors</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department / Scope</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-purple-50/20 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#673AB7]/10 text-[#673AB7] font-bold flex items-center justify-center text-sm">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{s.fullName}</div>
                        <div className="text-xs text-gray-400">ID: {s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600">
                    <div>{s.phone}</div>
                    {s.email && <div className="text-gray-400">{s.email}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#673AB7] border border-purple-100">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                    {s.assignedArea || 'General Administration'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onToggleStaffStatus(s.id, s.status)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                        s.status === 'ACTIVE'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Add Staff Member</h3>
            <p className="text-xs text-gray-500 mb-4">Grant administrative credentials to society operational staff</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kulkarni"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="staff@emeraldheights.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Society Manager">Society Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Security Supervisor">Security Supervisor</option>
                    <option value="Maintenance Staff">Maintenance Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                  <input
                    type="text"
                    value={assignedArea}
                    onChange={(e) => setAssignedArea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
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
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
