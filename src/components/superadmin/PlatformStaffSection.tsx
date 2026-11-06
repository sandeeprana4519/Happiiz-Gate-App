import React, { useState } from 'react';
import { PlatformStaffMember, PlatformRole } from '../../types/admin';
import {
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  UserCheck,
  ShieldAlert,
  KeyRound,
  Trash2,
} from 'lucide-react';
import {
  addPlatformStaff,
  updatePlatformStaffStatus,
} from '../../services/firebase/superadmin.service';

interface PlatformStaffSectionProps {
  staff: PlatformStaffMember[];
  onRefresh: () => void;
}

export const PlatformStaffSection: React.FC<PlatformStaffSectionProps> = ({
  staff,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<PlatformRole>('PLATFORM_OPERATIONS');
  const [department, setDepartment] = useState<PlatformStaffMember['department']>('Operations');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'society.read',
    'support.manage',
  ]);

  const availablePermissions = [
    { key: 'society.read', label: 'Read Societies & Buildings' },
    { key: 'society.create', label: 'Create & Provision Societies' },
    { key: 'society.approve', label: 'Approve Onboarding KYC' },
    { key: 'society.suspend', label: 'Suspend / Reactivate Societies' },
    { key: 'subscription.manage', label: 'Manage SaaS Subscription Tiers' },
    { key: 'billing.read', label: 'Read Financial Transactions & Ledger' },
    { key: 'billing.refund', label: 'Authorize Gateway Refunds' },
    { key: 'partner.verify', label: 'Verify Service Partner KYC' },
    { key: 'user.suspend', label: 'Administrative User Suspension' },
    { key: 'support.manage', label: 'Manage Helpdesk & Tickets' },
    { key: 'system.configure', label: 'Platform Global Configuration' },
  ];

  const filtered = staff.filter((s) => {
    return (
      !searchTerm ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addPlatformStaff({
        fullName,
        email,
        phoneNumber: phone,
        role,
        department,
        permissions: selectedPermissions,
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: PlatformStaffMember) => {
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updatePlatformStaffStatus(member.id, nextStatus);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Platform Staff & Internal Administration Team
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Manage Happiiz Gate corporate staff, departmental access roles, and granular platform authorizations
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Platform Staff</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff name, email, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
          {staff.length} Authorized Staff Members
        </span>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((member) => {
          const isOwner = member.role === 'SUPER_ADMIN';
          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-[#E6F1F5] p-5 shadow-xs space-y-4 hover:border-[#673AB7]/30 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#673AB7]/10 text-[#673AB7] flex items-center justify-center font-bold text-sm">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#111111]">{member.fullName}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#A9B0B8]">
                      <span className="font-semibold text-purple-700">{member.department} Team</span>
                      <span>•</span>
                      <span>{member.email}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="bg-[#F1F9FC] p-3 rounded-xl border border-[#E6F1F5] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#A9B0B8] text-[10px] uppercase font-bold">Platform Role</span>
                  <span className="font-mono font-bold text-[#673AB7] bg-white px-2 py-0.5 rounded-md border border-[#E6F1F5]">
                    {member.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span className="text-gray-500">Contact Number:</span>
                  <span className="font-mono font-semibold">{member.phoneNumber || '+91 98000 00000'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Assigned Permissions:</span>
                  <div className="flex flex-wrap gap-1">
                    {member.permissions.map((p, pIdx) => (
                      <span key={pIdx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-gray-700 border border-gray-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[10px] text-gray-400 font-mono">
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </span>

                {!isOwner ? (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(member)}
                    className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                      member.status === 'ACTIVE'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-[#673AB7] uppercase bg-purple-50 px-2 py-0.5 rounded">
                    Platform Owner
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-1">Add Platform Staff Executive</h3>
            <p className="text-xs text-gray-500 mb-4">
              Provision internal team members for operations, support, finance, and engineering
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Iyer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@happiiz.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Platform Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as PlatformRole)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                    <option value="PLATFORM_OPERATIONS">PLATFORM_OPERATIONS</option>
                    <option value="PLATFORM_FINANCE">PLATFORM_FINANCE</option>
                    <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT</option>
                    <option value="PLATFORM_READ_ONLY">PLATFORM_READ_ONLY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Support">Support</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Granular Permissions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-40 overflow-y-auto">
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => handleTogglePermission(perm.key)}
                        className="rounded text-[#673AB7] focus:ring-[#673AB7]"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-xs font-bold hover:bg-[#5E35B1] transition cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
