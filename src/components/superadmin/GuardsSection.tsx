/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GuardRecord, updateGuardStatus } from '../../services/firebase/superadmin.service';
import { Society } from '../../types/society';
import {
  ShieldCheck,
  Search,
  Lock,
  Unlock,
  Clock,
  Briefcase,
  Layers,
} from 'lucide-react';

interface GuardsSectionProps {
  guards: GuardRecord[];
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const GuardsSection: React.FC<GuardsSectionProps> = ({
  guards,
  societies,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSocietyFilter, setSelectedSocietyFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'DAY' | 'NIGHT' | 'ROTATIONAL'>('ALL');
  const [loading, setLoading] = useState(false);

  const filtered = guards.filter((g) => {
    const matchesSearch =
      g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phoneNumber.includes(searchTerm) ||
      g.employmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.assignedGate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.agencyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSoc = !selectedSocietyFilter || g.societyId === selectedSocietyFilter;
    const matchesShift = shiftFilter === 'ALL' || g.shift === shiftFilter;

    return matchesSearch && matchesSoc && matchesShift;
  });

  const handleToggleStatus = async (guard: GuardRecord) => {
    const nextStatus = guard.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const reason = window.prompt(
      `Enter reason for setting security sentinel ${guard.fullName} to ${nextStatus}:`,
      'Security agency shift rotation'
    );
    if (!reason) return;

    setLoading(true);
    try {
      await updateGuardStatus(guard.uid, nextStatus, reason);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Security Guard Sentinel Roster</h2>
          <p className="text-xs text-[#A9B0B8]">
            Gate checkpoint access, agency deputations, and shift assignments across societies
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto">
          {filtered.length} Active Gatekeepers
        </span>
      </div>

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by guard name, badge, gate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSocietyFilter}
            onChange={(e) => setSelectedSocietyFilter(e.target.value)}
            className="p-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:outline-none"
          >
            <option value="">All Societies</option>
            {societies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.societyName}
              </option>
            ))}
          </select>

          <div className="flex gap-1 bg-[#F1F9FC] p-1 rounded-xl border border-[#E6F1F5]">
            {(['ALL', 'DAY', 'NIGHT', 'ROTATIONAL'] as const).map((shift) => (
              <button
                key={shift}
                type="button"
                onClick={() => setShiftFilter(shift)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  shiftFilter === shift ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#111111] hover:text-[#673AB7]'
                }`}
              >
                {shift}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guards Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Guard Sentinel & Badge</th>
                <th className="py-3 px-4">Assigned Society</th>
                <th className="py-3 px-4">Checkpoint Gate</th>
                <th className="py-3 px-4">Security Agency</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.map((g) => (
                <tr key={g.uid} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111111]">{g.fullName}</div>
                    <div className="text-[11px] text-[#A9B0B8] font-mono">
                      Badge: {g.employmentId} • {g.phoneNumber}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    {g.societyName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#673AB7]">{g.assignedGate}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#111111]">
                    {g.agencyName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F9FC] text-[#111111] border border-[#E6F1F5]">
                      {g.shift} SHIFT
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        g.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          g.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {g.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleToggleStatus(g)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        g.status === 'ACTIVE'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={g.status === 'ACTIVE' ? 'Suspend Guard' : 'Reactivate Guard'}
                    >
                      {g.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
