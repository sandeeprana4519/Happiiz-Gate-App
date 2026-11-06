import React, { useState } from 'react';
import { 
  Building2, 
  DoorOpen, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Edit3, 
  Check, 
  X, 
  Key
} from 'lucide-react';
import { SocietyBuilding, SocietyFlat, FlatType, FlatOccupancyStatus } from '../../types/societyAdmin';
import { Society } from '../../types/society';

interface SocietyStructureProps {
  society: Society;
  buildings: SocietyBuilding[];
  flats: SocietyFlat[];
  onUpdateSociety: (data: Partial<Society>) => Promise<void>;
  onCreateBuilding: (building: any) => Promise<void>;
  onUpdateBuilding: (id: string, data: Partial<SocietyBuilding>) => Promise<void>;
  onCreateFlat: (flat: any) => Promise<void>;
  onUpdateFlat: (id: string, data: Partial<SocietyFlat>) => Promise<void>;
}

// -------------------------------------------------------------
// MODULE 2: SOCIETY PROFILE MANAGEMENT
// -------------------------------------------------------------
export const SocietyProfileView: React.FC<SocietyStructureProps> = ({
  society,
  onUpdateSociety
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    societyName: society.societyName || society.name || '',
    address: society.address,
    city: society.city,
    state: society.state || 'Maharashtra',
    contactPhone: society.contactPhone || '+91 98765 00001',
    contactEmail: society.contactEmail || 'admin@emeraldheights.in'
  });
  const [rules, setRules] = useState(
    '1. Visitors must verify pass code at security gates.\n2. Quiet hours observed after 10:30 PM.\n3. Clubhouse & gym require prior booking through Happiiz app.'
  );
  const [emergencyContacts, setEmergencyContacts] = useState(
    'Gate 1 Security: +91 98765 00001\nFacility Manager: +91 98765 00002\nLocal Police: 100\nFire Brigade: 101'
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateSociety({
        societyName: formData.societyName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Profile</h2>
          <p className="text-sm text-gray-500">Manage community identity, rules, contact information, and bylaws</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition"
          >
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm">
          <Check className="w-4 h-4" /> Society profile details updated successfully.
        </div>
      )}

      {/* Super Admin locked banner */}
      <div className="p-4 bg-[#F1F9FC] border border-[#BEE3F8] rounded-xl flex items-start gap-3">
        <Key className="w-5 h-5 text-[#673AB7] shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-gray-900">Platform Protected Entity: </span>
          <span className="text-gray-600">
            Society Code (<span className="font-mono font-bold text-[#673AB7]">{society.societyCode}</span>), Plan Tier ({society.subscriptionPlan}), and Maximum Units are provisioned and audited by Super Admin.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Society Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.societyName}
                  onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#673AB7] text-sm"
                  required
                />
              ) : (
                <p className="text-base font-semibold text-gray-900">{society.societyName || society.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Society Code</label>
              <p className="text-base font-mono font-bold text-[#673AB7] bg-[#F1F9FC] px-3 py-1.5 rounded-lg inline-block">
                {society.societyCode}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#673AB7] text-sm"
                  required
                />
              ) : (
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  {society.address}, {society.city}, {society.state}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#673AB7] text-sm"
                  required
                />
              ) : (
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  {society.contactPhone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Admin Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#673AB7] text-sm"
                  required
                />
              ) : (
                <p className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  {society.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Society By-laws & Rules</label>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#673AB7] text-sm"
                />
              ) : (
                <div className="bg-[#F1F9FC] p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                  {rules}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Emergency Contacts</label>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={emergencyContacts}
                  onChange={(e) => setEmergencyContacts(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#673AB7] text-sm"
                />
              ) : (
                <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-100 text-xs text-gray-800 whitespace-pre-line leading-relaxed">
                  {emergencyContacts}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] text-sm font-medium transition"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 3: TOWER / BLOCK / WING MANAGEMENT
// -------------------------------------------------------------
export const SocietyBuildingsView: React.FC<SocietyStructureProps> = ({
  society,
  buildings,
  onCreateBuilding,
  onUpdateBuilding
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<SocietyBuilding | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'Tower' | 'Block' | 'Wing' | 'Villa Row'>('Tower');
  const [floorsCount, setFloorsCount] = useState(12);
  const [totalFlats, setTotalFlats] = useState(48);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingBuilding(null);
    setName('');
    setType('Tower');
    setFloorsCount(10);
    setTotalFlats(40);
    setShowAddModal(true);
  };

  const handleOpenEdit = (b: SocietyBuilding) => {
    setEditingBuilding(b);
    setName(b.name);
    setType(b.type);
    setFloorsCount(b.floorsCount);
    setTotalFlats(b.totalFlats);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBuilding) {
        await onUpdateBuilding(editingBuilding.id, {
          name,
          type,
          floorsCount,
          totalFlats
        });
      } else {
        await onCreateBuilding({
          societyId: society.id,
          name,
          type,
          floorsCount,
          totalFlats,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (b: SocietyBuilding) => {
    const newStatus = b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await onUpdateBuilding(b.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Towers, Wings & Blocks</h2>
          <p className="text-sm text-gray-500">Manage high-rise towers, residential blocks, and floor configurations</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Tower / Block
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {buildings.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F1F9FC] text-[#673AB7] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{b.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                    {b.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(b)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  b.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {b.status}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
              <div className="bg-[#F1F9FC] p-3 rounded-xl">
                <span className="text-xs text-gray-500 block">Floors</span>
                <span className="text-lg font-bold text-gray-900">{b.floorsCount}</span>
              </div>
              <div className="bg-[#F1F9FC] p-3 rounded-xl">
                <span className="text-xs text-gray-500 block">Total Flats</span>
                <span className="text-lg font-bold text-[#673AB7]">{b.totalFlats}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => handleOpenEdit(b)}
                className="text-xs text-[#673AB7] hover:underline font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Configuration
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editingBuilding ? 'Edit Building Structure' : 'Add New Tower / Block'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Building / Tower Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tower A (Sunflower)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Structure Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="Tower">Tower</option>
                  <option value="Wing">Wing</option>
                  <option value="Block">Block</option>
                  <option value="Villa Row">Villa Row</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={floorsCount}
                    onChange={(e) => setFloorsCount(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Flats</label>
                  <input
                    type="number"
                    min="1"
                    value={totalFlats}
                    onChange={(e) => setTotalFlats(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  {submitting ? 'Saving...' : editingBuilding ? 'Update Tower' : 'Create Tower'}
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
// MODULE 4: FLAT MANAGEMENT
// -------------------------------------------------------------
export const SocietyFlatsView: React.FC<SocietyStructureProps> = ({
  society,
  buildings,
  flats,
  onCreateFlat,
  onUpdateFlat
}) => {
  const [filterBuilding, setFilterBuilding] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState<SocietyFlat | null>(null);

  // Form State
  const [flatNumber, setFlatNumber] = useState('');
  const [buildingName, setBuildingName] = useState(buildings[0]?.name || 'Tower A');
  const [floor, setFloor] = useState(1);
  const [flatType, setFlatType] = useState<FlatType>('2BHK');
  const [occupancyStatus, setOccupancyStatus] = useState<FlatOccupancyStatus>('OCCUPIED');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredFlats = flats.filter((f) => {
    const matchBuilding = filterBuilding === 'ALL' || f.buildingName === filterBuilding;
    const matchStatus = filterStatus === 'ALL' || f.occupancyStatus === filterStatus;
    const matchSearch = searchTerm === '' || 
      f.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.ownerName && f.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.tenantName && f.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchBuilding && matchStatus && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingFlat(null);
    setFlatNumber('');
    setBuildingName(buildings[0]?.name || 'Tower A');
    setFloor(1);
    setFlatType('2BHK');
    setOccupancyStatus('VACANT');
    setOwnerName('');
    setOwnerPhone('');
    setTenantName('');
    setTenantPhone('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (f: SocietyFlat) => {
    setEditingFlat(f);
    setFlatNumber(f.flatNumber);
    setBuildingName(f.buildingName);
    setFloor(f.floor);
    setFlatType(f.flatType);
    setOccupancyStatus(f.occupancyStatus);
    setOwnerName(f.ownerName || '');
    setOwnerPhone(f.ownerPhone || '');
    setTenantName(f.tenantName || '');
    setTenantPhone(f.tenantPhone || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedBuilding = buildings.find(b => b.name === buildingName);
      if (editingFlat) {
        await onUpdateFlat(editingFlat.id, {
          flatNumber,
          buildingName,
          buildingId: selectedBuilding?.id || editingFlat.buildingId,
          floor,
          flatType,
          occupancyStatus,
          ownerName: ownerName || undefined,
          ownerPhone: ownerPhone || undefined,
          tenantName: tenantName || undefined,
          tenantPhone: tenantPhone || undefined
        });
      } else {
        await onCreateFlat({
          societyId: society.id,
          buildingId: selectedBuilding?.id || 'bld_1',
          buildingName,
          flatNumber,
          floor,
          flatType,
          occupancyStatus,
          ownerName: ownerName || undefined,
          ownerPhone: ownerPhone || undefined,
          tenantName: tenantName || undefined,
          tenantPhone: tenantPhone || undefined
        });
      }
      setShowAddModal(false);
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
          <h2 className="text-xl font-bold text-gray-900">Flat Management</h2>
          <p className="text-sm text-gray-500">Configure residential flats, owner & tenant allocations, and occupancy status</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Flat Unit
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search flat, owner or tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Towers</option>
            {buildings.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Occupancy</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>

          <span className="text-xs text-gray-500 ml-auto md:ml-0 font-medium">
            Showing {filteredFlats.length} of {flats.length}
          </span>
        </div>
      </div>

      {/* Flats Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Flat No</th>
                <th className="py-3 px-4">Tower & Floor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No flats match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr key={flat.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {flat.flatNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div>{flat.buildingName}</div>
                      <span className="text-xs text-gray-400">Floor {flat.floor}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                        {flat.flatType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        flat.occupancyStatus === 'OCCUPIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : flat.occupancyStatus === 'VACANT'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {flat.occupancyStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {flat.ownerName ? (
                        <div>
                          <div className="font-semibold text-gray-800">{flat.ownerName}</div>
                          <div className="text-gray-400">{flat.ownerPhone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {flat.tenantName ? (
                        <div>
                          <div className="font-semibold text-gray-800">{flat.tenantName}</div>
                          <div className="text-gray-400">{flat.tenantPhone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(flat)}
                        className="text-xs text-[#673AB7] hover:bg-purple-50 px-2.5 py-1.5 rounded-lg font-semibold transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editingFlat ? `Edit Unit ${editingFlat.flatNumber}` : 'Add New Residential Flat'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Flat / Unit Number</label>
                  <input
                    type="text"
                    placeholder="e.g. A-402"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tower / Block</label>
                  <select
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="0"
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Apartment Type</label>
                  <select
                    value={flatType}
                    onChange={(e) => setFlatType(e.target.value as FlatType)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK">4 BHK</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Villa">Villa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Occupancy Status</label>
                <select
                  value={occupancyStatus}
                  onChange={(e) => setOccupancyStatus(e.target.value as FlatOccupancyStatus)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="OCCUPIED">Occupied</option>
                  <option value="VACANT">Vacant</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Owner Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Owner Full Name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Owner Phone (+91)"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Tenant Details (If Rented)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Tenant Full Name"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Tenant Phone (+91)"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  {submitting ? 'Saving...' : editingFlat ? 'Save Flat' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
