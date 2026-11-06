/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Society } from '../../types/society';
import { updateSocietyStatus, updateSocietyDetails, createNewSociety } from '../../services/firebase/superadmin.service';
import {
  Building2,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  MapPin,
  CreditCard,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';

interface SocietiesSectionProps {
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const SocietiesSection: React.FC<SocietiesSectionProps> = ({ societies, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'>('ALL');
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [targetSocietyForAction, setTargetSocietyForAction] = useState<Society | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'ACTIVATE'>('SUSPEND');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSoc, setNewSoc] = useState({
    societyName: '',
    city: '',
    state: '',
    address: '',
    totalFlats: 200,
    totalGates: 2,
    subscriptionPlan: 'Enterprise' as const,
  });
  const [loading, setLoading] = useState(false);

  // Filtered societies
  const filtered = societies.filter((s) => {
    const matchesSearch =
      s.societyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.state && s.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.societyCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSocietyForAction) return;
    setLoading(true);

    try {
      const newStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
      await updateSocietyStatus(targetSocietyForAction.id, newStatus, suspendReason || 'Super Admin intervention');
      setShowSuspendModal(false);
      setSuspendReason('');
      setTargetSocietyForAction(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoc.societyName || !newSoc.city) return;
    setLoading(true);

    try {
      await createNewSociety(newSoc);
      setShowCreateModal(false);
      setNewSoc({
        societyName: '',
        city: '',
        state: '',
        address: '',
        totalFlats: 200,
        totalGates: 2,
        subscriptionPlan: 'Enterprise',
      });
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Society Management Directory</h2>
          <p className="text-xs text-[#A9B0B8]">
            Manage all tenant societies, gate infrastructures, and operational status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Society</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, city, state, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-[#673AB7] text-white shadow-xs'
                  : 'bg-[#F1F9FC] text-[#111111] hover:bg-[#E6F1F5]'
              }`}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'ACTIVE'
                ? 'Active'
                : st === 'PENDING_VERIFICATION'
                ? 'Pending Review'
                : 'Suspended'}
            </button>
          ))}
        </div>
      </div>

      {/* Societies Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Society Name & Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Flats / Units</th>
                <th className="py-3 px-4">Gates & Guards</th>
                <th className="py-3 px-4">SaaS Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.map((soc) => (
                <tr key={soc.id} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111111]">{soc.societyName}</div>
                    <div className="text-[11px] text-[#A9B0B8] font-mono">
                      Code: {soc.societyCode} • ID: {soc.id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#111111]">{soc.city}</div>
                    <div className="text-[11px] text-[#A9B0B8] truncate max-w-xs">{soc.address}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                    {soc.occupiedFlats} <span className="text-[#A9B0B8] font-normal">/ {soc.totalFlats}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#111111]">
                    {soc.totalGates} Gates • {soc.activeGuards} Guards
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                      {soc.subscriptionPlan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        soc.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : soc.status === 'SUSPENDED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          soc.status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : soc.status === 'SUSPENDED'
                            ? 'bg-red-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      {soc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSociety(soc);
                          setShowProfileDrawer(true);
                        }}
                        className="p-1.5 rounded-lg border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[#673AB7] cursor-pointer"
                        title="View Complete Society Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {soc.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSocietyForAction(soc);
                            setActionType('SUSPEND');
                            setShowSuspendModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                          title="Suspend Society"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetSocietyForAction(soc);
                            setActionType('ACTIVATE');
                            setShowSuspendModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                          title="Reactivate Society"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Society Profile Modal / Drawer */}
      {showProfileDrawer && selectedSociety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">
                    {selectedSociety.societyName}
                  </h3>
                  <p className="text-xs text-[#A9B0B8]">
                    Code: {selectedSociety.societyCode} • Status: {selectedSociety.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileDrawer(false)}
                className="p-2 rounded-xl border border-[#E6F1F5] hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4 text-[#A9B0B8]" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">
                    City & State
                  </span>
                  <span className="text-xs font-bold text-[#111111]">
                    {selectedSociety.city}, {selectedSociety.state || 'India'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">
                    SaaS Subscription
                  </span>
                  <span className="text-xs font-bold text-[#673AB7]">
                    {selectedSociety.subscriptionPlan} Plan
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">
                    Residences (Flats)
                  </span>
                  <span className="text-xs font-bold text-[#111111]">
                    {selectedSociety.occupiedFlats} Occupied / {selectedSociety.totalFlats} Total
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">
                    Gates & Sentinels
                  </span>
                  <span className="text-xs font-bold text-[#111111]">
                    {selectedSociety.totalGates} Checkpoints / {selectedSociety.activeGuards} Active Guards
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-2">
                <h4 className="text-xs font-extrabold text-[#111111]">Official Address</h4>
                <p className="text-xs text-[#A9B0B8] leading-relaxed">{selectedSociety.address}</p>
                <div className="flex gap-4 pt-1 text-[11px] text-[#A9B0B8]">
                  <span>Email: {selectedSociety.contactEmail || 'admin@society.org'}</span>
                  <span>Phone: {selectedSociety.contactPhone || '+91 98000 11223'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-2">
                <h4 className="text-xs font-extrabold text-[#111111]">Towers & Infrastructure</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Tower A', 'Tower B', 'Tower C', 'Clubhouse & Amenities'].map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-[#F1F9FC] border border-[#E6F1F5] font-semibold text-[#111111]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E6F1F5] bg-[#F1F9FC]/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfileDrawer(false)}
                className="px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      {showSuspendModal && targetSocietyForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleStatusChange}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-extrabold text-[#111111]">
              {actionType === 'SUSPEND' ? (
                <ShieldAlert className="w-5 h-5 text-red-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              )}
              <span>
                {actionType === 'SUSPEND' ? 'Suspend Society' : 'Reactivate Society'}
              </span>
            </div>

            <p className="text-xs text-[#A9B0B8] leading-relaxed">
              You are modifying the operational status of{' '}
              <strong className="text-[#111111]">{targetSocietyForAction.societyName}</strong>. All actions
              are securely recorded in the platform audit trail.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111111]">Administrative Reason</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter regulatory, security, or payment reason..."
                required
                rows={3}
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSuspendModal(false)}
                className="w-1/2 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-1/2 py-2 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors ${
                  actionType === 'SUSPEND'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? 'Processing...' : actionType === 'SUSPEND' ? 'Confirm Suspend' : 'Confirm Activate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Provision New Society Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleCreateSociety}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-3">
              <h3 className="text-sm font-extrabold text-[#111111]">Provision New Society</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Society Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Palms Residency"
                  value={newSoc.societyName}
                  onChange={(e) => setNewSoc({ ...newSoc, societyName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={newSoc.city}
                    onChange={(e) => setNewSoc({ ...newSoc, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={newSoc.state}
                    onChange={(e) => setNewSoc({ ...newSoc, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Full physical address or street corridor"
                  value={newSoc.address}
                  onChange={(e) => setNewSoc({ ...newSoc, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Total Flats / Units</label>
                  <input
                    type="number"
                    value={newSoc.totalFlats}
                    onChange={(e) => setNewSoc({ ...newSoc, totalFlats: parseInt(e.target.value) || 100 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Gates</label>
                  <input
                    type="number"
                    value={newSoc.totalGates}
                    onChange={(e) => setNewSoc({ ...newSoc, totalGates: parseInt(e.target.value) || 2 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-1/2 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer"
              >
                {loading ? 'Provisioning...' : 'Provision Society'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
