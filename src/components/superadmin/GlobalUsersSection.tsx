import React, { useState } from 'react';
import { GlobalUserRecord } from '../../types/admin';
import {
  Users,
  Search,
  Shield,
  Filter,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  updateGlobalUserStatus,
  triggerPasswordReset,
} from '../../services/firebase/superadmin.service';

interface GlobalUsersSectionProps {
  users: GlobalUserRecord[];
  onRefresh: () => void;
}

export const GlobalUsersSection: React.FC<GlobalUsersSectionProps> = ({
  users,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !searchTerm ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.includes(searchTerm) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.societyName && u.societyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleToggleStatus = async (user: GlobalUserRecord) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateGlobalUserStatus(user.uid, nextStatus, `Platform administrative status toggle to ${nextStatus}`);
    showToast(`Account for ${user.fullName} is now ${nextStatus}`);
    onRefresh();
  };

  const handlePasswordReset = async (user: GlobalUserRecord) => {
    if (!user.email) {
      showToast(`User has no registered email. Phone OTP verification required.`);
      return;
    }
    await triggerPasswordReset(user.email);
    showToast(`Password reset link dispatched securely to ${user.email}`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Global User Management & Security Directory
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Centralized registry across all tenant societies, guards, service partners and platform administrators
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 bg-white border border-[#E6F1F5] px-3 py-1.5 rounded-xl shadow-xs">
          <span>Total Platform Directory: {users.length} Users</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, email, society..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F1F9FC] border border-[#E6F1F5] rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="SOCIETY_ADMIN">SOCIETY_ADMIN</option>
            <option value="RESIDENT">RESIDENT</option>
            <option value="SECURITY_GUARD">SECURITY_GUARD</option>
            <option value="SERVICE_PARTNER">SERVICE_PARTNER</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F1F9FC] border border-[#E6F1F5] rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* User Records Table */}
      <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC] text-[11px] font-extrabold text-[#A9B0B8] uppercase tracking-wider">
                <th className="py-3 px-4">User / Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Society / Campus</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5] text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No global user records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isRoot = u.role === 'SUPER_ADMIN';
                  return (
                    <tr key={u.uid} className="hover:bg-purple-50/20 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#111111]">{u.fullName}</div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
                          <span>{u.phoneNumber}</span>
                          {u.email && (
                            <>
                              <span>•</span>
                              <span className="text-gray-600 truncate max-w-xs">{u.email}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-[#673AB7] border border-purple-200'
                              : u.role === 'SOCIETY_ADMIN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : u.role === 'SECURITY_GUARD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : u.role === 'SERVICE_PARTNER'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {u.societyName || 'Global Platform Root'}
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(u.registeredAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.status === 'SUSPENDED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isRoot ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.email && (
                              <button
                                type="button"
                                onClick={() => handlePasswordReset(u)}
                                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                                title="Dispatch Password Reset"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Root Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
