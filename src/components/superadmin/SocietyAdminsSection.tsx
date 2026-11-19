/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SocietyAdminRecord, updateAdminStatus, reassignSocietyAdmin } from '../../services/firebase/superadmin.service';
import { Society } from '../../types/society';
import {
  UserCog,
  Search,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCw,
  X,
} from 'lucide-react';

interface SocietyAdminsSectionProps {
  admins: SocietyAdminRecord[];
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const SocietyAdminsSection: React.FC<SocietyAdminsSectionProps> = ({
  admins,
  societies,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSocietyFilter, setSelectedSocietyFilter] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetSocietyId, setTargetSocietyId] = useState('');
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', email: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const filtered = admins.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phoneNumber.includes(searchTerm) ||
      a.societyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSoc = !selectedSocietyFilter || a.societyId === selectedSocietyFilter;
    return matchesSearch && matchesSoc;
  });

  const handleToggleStatus = async (admin: SocietyAdminRecord) => {
    const nextStatus = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const reason = window.prompt(
      `Enter reason for setting ${admin.fullName} to ${nextStatus}:`,
      'Administrative policy compliance'
    );
    if (!reason) return;

    setLoading(true);
    try {
      await updateAdminStatus(admin.uid, nextStatus, reason);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSocietyId || !newAdmin.name || !newAdmin.phone) return;
    setLoading(true);
    try {
      await reassignSocietyAdmin(
        targetSocietyId,
        newAdmin.name,
        newAdmin.phone,
        newAdmin.email,
        newAdmin.reason || 'Management committee election hand-over'
      );
      setShowReassignModal(false);
      setNewAdmin({ name: '', phone: '', email: '', reason: '' });
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Society Administrator Roster</h2>
          <p className="text-xs text-[#A9B0B8]">
            Manage authorized Management Committee leaders and estate managers per society
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (societies.length > 0) setTargetSocietyId(societies[0].id);
            setShowReassignModal(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reassign Committee Admin</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, society..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <select
          value={selectedSocietyFilter}
          onChange={(e) => setSelectedSocietyFilter(e.target.value)}
          className="w-full sm:w-64 p-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:outline-none"
        >
          <option value="">All Societies</option>
          {societies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.societyName}
            </option>
          ))}
        </select>
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Administrator Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Assigned Society</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.map((adm) => (
                <tr key={adm.uid} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111111]">{adm.fullName}</div>
                    <div className="text-[11px] text-[#A9B0B8] font-mono">UID: {adm.uid}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#673AB7]">
                    {adm.designation}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    {adm.societyName}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-[#111111]">{adm.phoneNumber}</div>
                    {adm.email && <div className="text-[11px] text-[#A9B0B8]">{adm.email}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          adm.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {adm.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleToggleStatus(adm)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        adm.status === 'ACTIVE'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={adm.status === 'ACTIVE' ? 'Suspend Admin Access' : 'Reactivate Admin'}
                    >
                      {adm.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Admin Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleReassign}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-3">
              <h3 className="text-sm font-extrabold text-[#111111]">Reassign Society Administrator</h3>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="p-1 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Target Society *</label>
                <select
                  value={targetSocietyId}
                  onChange={(e) => setTargetSocietyId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
                >
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.societyName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">New Administrator Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Iyer"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="admin@society.org"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Authorization Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AGM 2026 Committee Election Handover"
                  value={newAdmin.reason}
                  onChange={(e) => setNewAdmin({ ...newAdmin, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="w-1/2 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer"
              >
                {loading ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
