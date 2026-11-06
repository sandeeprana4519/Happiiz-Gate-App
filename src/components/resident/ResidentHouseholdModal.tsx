/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Briefcase, 
  Car, 
  Plus, 
  Trash2, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  Clock,
  Sparkles
} from 'lucide-react';
import { HouseholdMember, DailyHelpStaff, ResidentVehicle } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentUid: string;
  flatNumber: string;
}

export const ResidentHouseholdModal: React.FC<ResidentHouseholdModalProps> = ({
  isOpen,
  onClose,
  residentUid,
  flatNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'FAMILY' | 'DAILY_HELP' | 'VEHICLES'>('FAMILY');
  const [family, setFamily] = useState<HouseholdMember[]>([]);
  const [dailyHelps, setDailyHelps] = useState<DailyHelpStaff[]>([]);
  const [vehicles, setVehicles] = useState<ResidentVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // New item form toggles
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [showAddHelp, setShowAddHelp] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState<'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other'>('Spouse');

  const [newHelpName, setNewHelpName] = useState('');
  const [newHelpPhone, setNewHelpPhone] = useState('');
  const [newHelpCategory, setNewHelpCategory] = useState<'Maid' | 'Driver' | 'Cook' | 'Laundry' | 'Cleaning'>('Maid');

  const [newVehNumber, setNewVehNumber] = useState('');
  const [newVehType, setNewVehType] = useState<'4_WHEELER' | '2_WHEELER' | 'EV'>('4_WHEELER');
  const [newVehBrand, setNewVehBrand] = useState('');
  const [newVehModel, setNewVehModel] = useState('');
  const [newVehSlot, setNewVehSlot] = useState('P-14');

  const loadData = async () => {
    setLoading(true);
    try {
      const [f, h, v] = await Promise.all([
        residentService.getHouseholdMembers(residentUid),
        residentService.getDailyHelps(residentUid),
        residentService.getVehicles(residentUid),
      ]);
      setFamily(f);
      setDailyHelps(h);
      setVehicles(v);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, residentUid]);

  if (!isOpen) return null;

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await residentService.addHouseholdMember(residentUid, {
      residentUid,
      fullName: newName,
      phoneNumber: newPhone || '+91 98000 00000',
      relationship: newRelation,
      accessAllowed: true,
      isEmergencyContact: true,
    });
    setNewName('');
    setNewPhone('');
    setShowAddFamily(false);
    await loadData();
  };

  const handleAddDailyHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHelpName.trim()) return;
    await residentService.addDailyHelp(residentUid, {
      residentUid,
      fullName: newHelpName,
      phoneNumber: newHelpPhone || '+91 98000 00000',
      category: newHelpCategory,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    });
    setNewHelpName('');
    setNewHelpPhone('');
    setShowAddHelp(false);
    await loadData();
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehNumber.trim()) return;
    await residentService.addVehicle(residentUid, {
      residentUid,
      vehicleNumber: newVehNumber.toUpperCase(),
      vehicleType: newVehType,
      brand: newVehBrand || 'Sedan',
      model: newVehModel || 'Car',
      color: 'White',
      parkingSlot: newVehSlot || 'P-14',
    });
    setNewVehNumber('');
    setNewVehBrand('');
    setNewVehModel('');
    setShowAddVehicle(false);
    await loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Household & Staff
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Authorized residents and daily helpers for Flat {flatNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-3 bg-white border-b border-[#E6F1F5] gap-2">
          <button
            onClick={() => setActiveTab('FAMILY')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FAMILY'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            My Family ({family.length})
          </button>
          <button
            onClick={() => setActiveTab('DAILY_HELP')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DAILY_HELP'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Daily Helps ({dailyHelps.length})
          </button>
          <button
            onClick={() => setActiveTab('VEHICLES')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VEHICLES'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Vehicles ({vehicles.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: FAMILY */}
          {activeTab === 'FAMILY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#111111]">Family Members</span>
                <button
                  onClick={() => setShowAddFamily(!showAddFamily)}
                  className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              {showAddFamily && (
                <form onSubmit={handleAddFamilyMember} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
                  <h4 className="font-bold text-xs text-[#111111]">Add New Family Member</h4>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  />
                  <select
                    value={newRelation}
                    onChange={(e: any) => setNewRelation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
                  >
                    Save Family Member
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {family.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111111]">{m.fullName}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {m.relationship}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{m.phoneNumber}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await residentService.deleteHouseholdMember(residentUid, m.id);
                        await loadData();
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DAILY HELPS */}
          {activeTab === 'DAILY_HELP' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#111111]">Domestic Staff & Helpers</span>
                <button
                  onClick={() => setShowAddHelp(!showAddHelp)}
                  className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Staff</span>
                </button>
              </div>

              {showAddHelp && (
                <form onSubmit={handleAddDailyHelp} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
                  <h4 className="font-bold text-xs text-[#111111]">Register New Daily Helper</h4>
                  <input
                    type="text"
                    required
                    placeholder="Helper Full Name (e.g. Laxmi Devi)"
                    value={newHelpName}
                    onChange={(e) => setNewHelpName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={newHelpPhone}
                    onChange={(e) => setNewHelpPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  />
                  <select
                    value={newHelpCategory}
                    onChange={(e: any) => setNewHelpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="Maid">Maid</option>
                    <option value="Driver">Driver</option>
                    <option value="Cook">Cook</option>
                    <option value="Laundry">Laundry Worker</option>
                    <option value="Cleaning">Cleaning Staff</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
                  >
                    Generate Pass Code & Save
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {dailyHelps.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111111]">{h.fullName}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {h.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          h.currentStatus === 'INSIDE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {h.currentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Pass Code: <strong className="font-mono text-[#673AB7]">#{h.passCode}</strong> · {h.phoneNumber}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await residentService.deleteDailyHelp(residentUid, h.id);
                        await loadData();
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VEHICLES */}
          {activeTab === 'VEHICLES' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#111111]">Registered Vehicles</span>
                <button
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {showAddVehicle && (
                <form onSubmit={handleAddVehicle} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
                  <h4 className="font-bold text-xs text-[#111111]">Add Authorized Vehicle</h4>
                  <input
                    type="text"
                    required
                    placeholder="Vehicle Number (e.g. MH 02 DQ 4410)"
                    value={newVehNumber}
                    onChange={(e) => setNewVehNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-mono font-bold focus:outline-none focus:border-[#673AB7]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Brand (e.g. Mercedes/Tata)"
                      value={newVehBrand}
                      onChange={(e) => setNewVehBrand(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                    />
                    <input
                      type="text"
                      placeholder="Parking Slot (e.g. P-14)"
                      value={newVehSlot}
                      onChange={(e) => setNewVehSlot(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
                  >
                    Register Vehicle
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div key={v.id} className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm font-mono text-[#111111]">{v.vehicleNumber}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {v.vehicleType}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {v.brand} {v.model} · Assigned Slot: <strong className="text-[#111111]">{v.parkingSlot}</strong>
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await residentService.deleteVehicle(residentUid, v.id);
                        await loadData();
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
