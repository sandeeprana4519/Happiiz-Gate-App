/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformStaffMember, PlatformRole } from '../../types/admin';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  addPlatformStaff,
  updatePlatformStaff,
  updatePlatformStaffStatus,
  deletePlatformStaff,
} from '../../services/firebase/superadmin.service';
import {
  PLATFORM_STAFF_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './platformStaffPermissions';

interface PlatformStaffSectionProps {
  staff: PlatformStaffMember[];
  onRefresh: () => void;
}

const generateStaffPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = 'Staff@';
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getPermissionLabel = (key: string): string => {
  if (key === '*') return 'Unrestricted Root Access';
  return PLATFORM_STAFF_PERMISSIONS.find((p) => p.key === key)?.label || key;
};

export const PlatformStaffSection: React.FC<PlatformStaffSectionProps> = ({
  staff,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<PlatformStaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add / Edit Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<PlatformRole>('PLATFORM_OPERATIONS');
  const [department, setDepartment] = useState<PlatformStaffMember['department']>('Operations');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    DEFAULT_ROLE_PERMISSIONS.PLATFORM_OPERATIONS
  );

  // Newly created credentials banner
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
    role: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = staff.filter((s) => {
    return (
      !searchTerm ||
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const openAddModal = () => {
    setFormError(null);
    setEditingMember(null);
    setFullName('');
    setEmail('');
    setPassword(generateStaffPassword());
    setShowPassword(true);
    setPhone('');
    setRole('PLATFORM_OPERATIONS');
    setDepartment('Operations');
    setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS.PLATFORM_OPERATIONS);
    setShowAddModal(true);
  };

  const openEditModal = (member: PlatformStaffMember) => {
    setFormError(null);
    setEditingMember(member);
    setFullName(member.fullName);
    setEmail(member.email);
    setPassword(member.password || '');
    setShowPassword(false);
    setPhone(member.phoneNumber || '');
    setRole(member.role);
    setDepartment(member.department);
    setSelectedPermissions(member.permissions || []);
    setShowAddModal(true);
  };

  const handleRoleChange = (nextRole: PlatformRole) => {
    setRole(nextRole);
    if (!editingMember && DEFAULT_ROLE_PERMISSIONS[nextRole]) {
      setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[nextRole]);
    }
  };

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSelectAllPermissions = () => {
    setSelectedPermissions(PLATFORM_STAFF_PERMISSIONS.map((p) => p.key));
  };

  const handleClearPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleCopy = (label: string, value: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedField(label);
    window.setTimeout(() => {
      setCopiedField((prev) => (prev === label ? null : prev));
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingMember && password.trim().length < 6) {
      setFormError('Login password must be at least 6 characters.');
      return;
    }

    if (editingMember && password.trim().length > 0 && password.trim().length < 6) {
      setFormError('Updated password must be at least 6 characters.');
      return;
    }

    if (selectedPermissions.length === 0) {
      setFormError('Please select at least one permission for this staff member.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMember) {
        await updatePlatformStaff(editingMember.id, {
          fullName,
          email,
          phoneNumber: phone,
          role,
          department,
          permissions: selectedPermissions,
          ...(password.trim().length >= 6 ? { password: password.trim() } : {}),
        });
        setShowAddModal(false);
        setEditingMember(null);
      } else {
        const created = await addPlatformStaff({
          fullName,
          email,
          password: password.trim(),
          phoneNumber: phone,
          role,
          department,
          permissions: selectedPermissions,
        });
        setCreatedCredentials({
          fullName: created.fullName,
          email: created.email,
          password: password.trim(),
          role: created.role,
        });
        setShowAddModal(false);
      }
      onRefresh();
    } catch (err: any) {
      setFormError(err?.message || 'Unable to save platform staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: PlatformStaffMember) => {
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updatePlatformStaffStatus(member.id, nextStatus);
    onRefresh();
  };

  const handleDelete = async (staffId: string) => {
    await deletePlatformStaff(staffId);
    setConfirmDeleteId(null);
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
          <p className="text-xs text-[#64748B] font-medium">
            Create individual Email + Password credentials for staff members and assign exact portal permissions
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Platform Staff</span>
        </button>
      </div>

      {/* Newly Provisioned Credentials Card */}
      {createdCredentials && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-extrabold text-emerald-900">
                  Staff Portal Account Created for {createdCredentials.fullName}
                </h3>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Share these credentials with the staff member. They can log in on the main Login page
                  and will open their own dedicated Staff Portal showing only their granted permissions.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Login Email</span>
                <span className="font-mono font-bold text-[#111111] truncate block">
                  {createdCredentials.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('email', createdCredentials.email)}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shrink-0"
                title="Copy Email"
              >
                {copiedField === 'email' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Login Password</span>
                <span className="font-mono font-bold text-[#111111] truncate block">
                  {createdCredentials.password}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('password', createdCredentials.password)}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shrink-0"
                title="Copy Password"
              >
                {copiedField === 'password' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Portal</span>
                <span className="font-bold text-[#673AB7] truncate block">
                  /login → Staff Portal
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('url', `${window.location.origin}/login`)}
                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shrink-0"
                title="Copy Login Link"
              >
                {copiedField === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

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
              className="bg-white rounded-2xl border border-[#E6F1F5] p-5 shadow-xs space-y-4 hover:border-[#673AB7]/30 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#673AB7]/10 text-[#673AB7] flex items-center justify-center font-bold text-sm shrink-0">
                      {member.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-[#111111] truncate">{member.fullName}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className="font-semibold text-purple-700">{member.department} Team</span>
                        <span>•</span>
                        <span className="truncate font-mono">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="bg-[#F1F9FC] p-3.5 rounded-xl border border-[#E6F1F5] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold">Platform Role</span>
                    <span className="font-mono font-bold text-[#673AB7] bg-white px-2 py-0.5 rounded-md border border-[#E6F1F5]">
                      {member.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="text-gray-500">Contact Number:</span>
                    <span className="font-mono font-semibold">{member.phoneNumber || '+91 98000 00000'}</span>
                  </div>
                  {!isOwner && (
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="text-gray-500 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-[#673AB7]" />
                        Portal Login Access:
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        Dedicated Staff Portal
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1.5">
                      Assigned Permissions ({member.permissions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.permissions.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          title={p}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200"
                        >
                          {getPermissionLabel(p)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                <span className="text-[10px] text-gray-400 font-mono">
                  Joined {new Date(member.createdAt).toLocaleDateString()}
                </span>

                {!isOwner ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#673AB7]/10 text-[#673AB7] hover:bg-[#673AB7]/15 border border-[#673AB7]/25 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Access & Password
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(member)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        member.status === 'ACTIVE'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>

                    {confirmDeleteId === member.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(member.id)}
                          className="text-[11px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 text-gray-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(member.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Remove staff member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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

      {/* Add / Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  {editingMember
                    ? `Edit Staff Access & Credentials — ${editingMember.fullName}`
                    : 'Add New Platform Staff & Login Credentials'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Staff members log in using their own Email & Password to access only the modules and permissions granted here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Iyer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
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

              {/* Dedicated Login ID & Password Section */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E6F1F5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#673AB7] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Dedicated Staff Portal Login Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword(generateStaffPassword());
                      setShowPassword(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Generate Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Login Email ID *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="ramesh@happiiz.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {editingMember ? 'New Password (optional to keep existing)' : 'Login Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingMember}
                        minLength={6}
                        placeholder={editingMember ? 'Leave unchanged or enter new' : 'Min 6 characters'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 bg-white text-xs font-mono focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Platform Role</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as PlatformRole)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
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
                    onChange={(e) => setDepartment(e.target.value as PlatformStaffMember['department'])}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Assigned Portal Permissions ({selectedPermissions.length} selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="font-bold text-[#673AB7] hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearPermissions}
                      className="font-semibold text-gray-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-56 overflow-y-auto">
                  {PLATFORM_STAFF_PERMISSIONS.map((perm) => {
                    const checked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] cursor-pointer transition ${
                          checked
                            ? 'bg-purple-50/70 border-purple-200 text-[#111111]'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleTogglePermission(perm.key)}
                          className="mt-0.5 rounded text-[#673AB7] focus:ring-[#673AB7]"
                        />
                        <div className="min-w-0">
                          <span className="font-bold block">{perm.label}</span>
                          <span className="text-[10px] text-gray-500 block leading-snug">
                            {perm.moduleGroup} • {perm.description}
                          </span>
                        </div>
                      </label>
                    );
                  })}
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
                  className="px-5 py-2 bg-[#673AB7] text-white rounded-xl text-xs font-bold hover:bg-[#5E35B1] transition cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingMember
                    ? 'Save Permissions & Password'
                    : 'Create Staff & Issue Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
