/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ResidentRecord, updateResidentStatus } from '../../services/firebase/superadmin.service';
import { Society } from '../../types/society';
import {
  Users,
  Search,
  Filter,
  Lock,
  Unlock,
  Building,
  Home,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ResidentsSectionProps {
  residents: ResidentRecord[];
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const ResidentsSection: React.FC<ResidentsSectionProps> = ({
  residents,
  societies,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSocietyFilter, setSelectedSocietyFilter] = useState('');
  const [occupantFilter, setOccupantFilter] = useState<'ALL' | 'OWNER' | 'TENANT'>('ALL');
  const [loading, setLoading] = useState(false);

  const filtered = residents.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber.includes(searchTerm) ||
      (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.flat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tower.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSoc = !selectedSocietyFilter || r.societyId === selectedSocietyFilter;
    const matchesOcc = occupantFilter === 'ALL' || r.occupantType === occupantFilter;

    return matchesSearch && matchesSoc && matchesOcc;
  });

  const handleToggleStatus = async (res: ResidentRecord) => {
    const nextStatus = res.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const reason = window.prompt(
      `Enter reason for setting resident ${res.fullName} to ${nextStatus}:`,
      'Society rule compliance audit'
    );
    if (!reason) return;

    setLoading(true);
    try {
      await updateResidentStatus(res.uid, nextStatus, reason);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Platform Residents Directory</h2>
          <p className="text-xs text-[#A9B0B8]">
            Multi-society unit roster, occupant classifications, and account authorizations
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#673AB7] bg-[#F1F9FC] px-3 py-1 rounded-xl border border-[#E6F1F5] self-start sm:self-auto">
          {filtered.length} Registered Units
        </span>
      </div>

      {/* Filters */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by resident name, flat, mobile..."
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
            {(['ALL', 'OWNER', 'TENANT'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOccupantFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  occupantFilter === type ? 'bg-[#673AB7] text-white shadow-xs' : 'text-[#111111] hover:text-[#673AB7]'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type === 'OWNER' ? 'Owners' : 'Tenants'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Residents Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Resident Name</th>
                <th className="py-3 px-4">Assigned Society</th>
                <th className="py-3 px-4">Tower & Flat</th>
                <th className="py-3 px-4">Occupant Type</th>
                <th className="py-3 px-4">Verified Mobile</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.map((res) => (
                <tr key={res.uid} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111111]">{res.fullName}</div>
                    <div className="text-[11px] text-[#A9B0B8] font-mono">UID: {res.uid}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    {res.societyName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#111111]">{res.flat}</span>
                    <span className="text-[#A9B0B8] text-[11px] block">{res.tower}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.occupantType === 'OWNER'
                          ? 'bg-purple-50 text-[#673AB7] border border-purple-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {res.occupantType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#111111]">
                    {res.phoneNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        res.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          res.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {res.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleToggleStatus(res)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        res.status === 'ACTIVE'
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={res.status === 'ACTIVE' ? 'Suspend Resident' : 'Reactivate Resident'}
                    >
                      {res.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
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
