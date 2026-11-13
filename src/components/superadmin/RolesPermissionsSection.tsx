/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Check,
  X,
  Building2,
  Shield,
  Home,
  UserCheck,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getRolePermissionMatrix,
  saveRolePermissionMatrix,
  resetRolePermissionMatrix,
  ManagedRoleKey,
  RolePermissionPolicy,
  RoleServicePermission,
} from '../../services/firebase/superadmin.service';

interface RolesPermissionsSectionProps {
  isSuperAdmin?: boolean;
  actorEmail?: string;
}

type RoleFilter = 'ALL' | ManagedRoleKey;
type ItemFilter = 'ALL' | 'SERVICE' | 'PERMISSION' | 'OPEN' | 'HIDDEN';

const ROLE_ICON_MAP: Record<ManagedRoleKey, React.ComponentType<{ className?: string }>> = {
  SUPER_ADMIN: KeyRound,
  SOCIETY_ADMIN: Building2,
  SECURITY_GUARD: Shield,
  RESIDENT_OWNER: Home,
  RESIDENT_TENANT: UserCheck,
  SERVICE_PARTNER: Wrench,
};

const ROLE_COLOR_MAP: Record<ManagedRoleKey, string> = {
  SUPER_ADMIN: 'bg-[#673AB7]',
  SOCIETY_ADMIN: 'bg-indigo-600',
  SECURITY_GUARD: 'bg-emerald-600',
  RESIDENT_OWNER: 'bg-sky-600',
  RESIDENT_TENANT: 'bg-amber-600',
  SERVICE_PARTNER: 'bg-rose-600',
};

const ROLE_SHORT_LABEL: Record<ManagedRoleKey, string> = {
  SUPER_ADMIN: 'Super Admin',
  SOCIETY_ADMIN: 'Society Admin',
  SECURITY_GUARD: 'Gatekeeper',
  RESIDENT_OWNER: 'Resident Owner',
  RESIDENT_TENANT: 'Tenant',
  SERVICE_PARTNER: 'Service Partner',
};

export const RolesPermissionsSection: React.FC<RolesPermissionsSectionProps> = ({
  isSuperAdmin: isSuperAdminProp,
  actorEmail: actorEmailProp,
}) => {
  const { user } = useAuth();

  const isAuthSuperAdmin = Boolean(
    user?.isSuperAdmin ||
      user?.primaryRole === 'SUPER_ADMIN' ||
      user?.role === 'SUPER_ADMIN'
  );
  const canEdit = typeof isSuperAdminProp === 'boolean' ? isSuperAdminProp : isAuthSuperAdmin;
  const actorEmail = actorEmailProp || user?.email || 'Super Admin';

  const [policies, setPolicies] = useState<RolePermissionPolicy[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
  const [itemFilter, setItemFilter] = useState<ItemFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingRoles, setEditingRoles] = useState<Record<string, boolean>>({});
  const [addingForRole, setAddingForRole] = useState<ManagedRoleKey | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'SERVICE' | 'PERMISSION'>('SERVICE');
  const [newItemEnabled, setNewItemEnabled] = useState(true);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemLabelDraft, setEditItemLabelDraft] = useState('');
  const [editItemDescDraft, setEditItemDescDraft] = useState('');

  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    const loadMatrix = async () => {
      setLoading(true);
      try {
        const data = await getRolePermissionMatrix();
        if (!active) return;
        setPolicies(data);
        setSavedSnapshot(JSON.stringify(data));
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMatrix();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!canEdit) {
      setEditingRoles({});
      setAddingForRole(null);
      setEditingItemId(null);
    }
  }, [canEdit]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(policies) !== savedSnapshot;
  }, [policies, savedSnapshot]);

  const metrics = useMemo(() => {
    let totalItems = 0;
    let openItems = 0;
    let hiddenItems = 0;
    let servicesCount = 0;
    policies.forEach((policy) => {
      policy.items.forEach((item) => {
        totalItems += 1;
        if (item.enabled) openItems += 1;
        else hiddenItems += 1;
        if (item.category === 'SERVICE') servicesCount += 1;
      });
    });
    return {
      rolesCount: policies.length,
      totalItems,
      openItems,
      hiddenItems,
      servicesCount,
    };
  }, [policies]);

  const toggleRoleEditMode = (roleKey: ManagedRoleKey) => {
    if (!canEdit) return;
    setEditingRoles((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  const handleToggleItemVisibility = (roleKey: ManagedRoleKey, itemId: string) => {
    if (!canEdit) return;
    setPolicies((prev) =>
      prev.map((policy) => {
        if (policy.roleKey !== roleKey || policy.locked) return policy;
        return {
          ...policy,
          updatedAt: new Date().toISOString(),
          updatedBy: actorEmail,
          items: policy.items.map((item) =>
            item.id === itemId ? { ...item, enabled: !item.enabled } : item
          ),
        };
      })
    );
  };

  const handleBulkToggleRole = (roleKey: ManagedRoleKey, enabled: boolean) => {
    if (!canEdit) return;
    setPolicies((prev) =>
      prev.map((policy) => {
        if (policy.roleKey !== roleKey || policy.locked) return policy;
        return {
          ...policy,
          updatedAt: new Date().toISOString(),
          updatedBy: actorEmail,
          items: policy.items.map((item) => ({ ...item, enabled })),
        };
      })
    );
  };

  const startEditingItem = (item: RoleServicePermission) => {
    if (!canEdit) return;
    setEditingItemId(item.id);
    setEditItemLabelDraft(item.label);
    setEditItemDescDraft(item.description);
  };

  const saveEditedItem = (roleKey: ManagedRoleKey, itemId: string) => {
    if (!canEdit || !editItemLabelDraft.trim()) return;
    setPolicies((prev) =>
      prev.map((policy) => {
        if (policy.roleKey !== roleKey || policy.locked) return policy;
        return {
          ...policy,
          updatedAt: new Date().toISOString(),
          updatedBy: actorEmail,
          items: policy.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  label: editItemLabelDraft.trim(),
                  description: editItemDescDraft.trim() || item.description,
                }
              : item
          ),
        };
      })
    );
    setEditingItemId(null);
  };

  const handleDeleteCustomItem = (roleKey: ManagedRoleKey, itemId: string) => {
    if (!canEdit) return;
    setPolicies((prev) =>
      prev.map((policy) => {
        if (policy.roleKey !== roleKey || policy.locked) return policy;
        return {
          ...policy,
          updatedAt: new Date().toISOString(),
          updatedBy: actorEmail,
          items: policy.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const handleAddNewItem = (roleKey: ManagedRoleKey) => {
    if (!canEdit) return;
    const cleanLabel = newItemLabel.trim();
    if (!cleanLabel) {
      showFeedback('error', 'Please enter a service or permission title.');
      return;
    }

    const newRule: RoleServicePermission = {
      id: `${roleKey.toLowerCase()}_custom_${Date.now()}`,
      label: cleanLabel,
      category: newItemCategory,
      description:
        newItemDesc.trim() ||
        `Super Admin configured ${newItemCategory.toLowerCase()} rule for ${ROLE_SHORT_LABEL[roleKey]}`,
      enabled: newItemEnabled,
      isCustom: true,
    };

    setPolicies((prev) =>
      prev.map((policy) => {
        if (policy.roleKey !== roleKey || policy.locked) return policy;
        return {
          ...policy,
          updatedAt: new Date().toISOString(),
          updatedBy: actorEmail,
          items: [...policy.items, newRule],
        };
      })
    );

    setAddingForRole(null);
    setNewItemLabel('');
    setNewItemDesc('');
    setNewItemCategory('SERVICE');
    setNewItemEnabled(true);
    setEditingRoles((prev) => ({ ...prev, [roleKey]: true }));
  };

  const handleSaveAndPublish = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const updated = await saveRolePermissionMatrix(policies, actorEmail);
      setPolicies(updated);
      setSavedSnapshot(JSON.stringify(updated));
      setEditingRoles({});
      setEditingItemId(null);
      setAddingForRole(null);
      showFeedback('success', 'Role permissions and service visibility rules published across platform.');
    } catch {
      showFeedback('error', 'Failed to publish role permission updates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const resetData = await resetRolePermissionMatrix();
      setPolicies(resetData);
      setSavedSnapshot(JSON.stringify(resetData));
      setEditingRoles({});
      setAddingForRole(null);
      setEditingItemId(null);
      setConfirmReset(false);
      showFeedback('success', 'All role permissions & service visibility rules reset to defaults.');
    } catch {
      showFeedback('error', 'Unable to reset role permission matrix.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPolicies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return policies
      .filter((policy) => selectedRole === 'ALL' || policy.roleKey === selectedRole)
      .map((policy) => {
        const filteredItems = policy.items.filter((item) => {
          if (itemFilter === 'SERVICE' && item.category !== 'SERVICE') return false;
          if (itemFilter === 'PERMISSION' && item.category !== 'PERMISSION') return false;
          if (itemFilter === 'OPEN' && !item.enabled) return false;
          if (itemFilter === 'HIDDEN' && item.enabled) return false;
          if (q) {
            const hay = `${item.label} ${item.description} ${policy.name}`.toLowerCase();
            return hay.includes(q);
          }
          return true;
        });
        return { ...policy, filteredItems };
      })
      .filter((policy) => !q || policy.filteredItems.length > 0 || policy.name.toLowerCase().includes(q));
  }, [policies, selectedRole, itemFilter, searchQuery]);

  if (loading) {
    return (
      <div className="p-8 rounded-2xl border border-[#E6F1F5] bg-white text-center text-xs font-semibold text-[#64748B]">
        Loading Role Permissions & Service Visibility Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#111111]">
              Security Rules, Permissions & Service Visibility Control
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#673AB7]/10 text-[#673AB7] border border-[#673AB7]/20">
              <Lock className="w-3 h-3" />
              SUPER ADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Edit role capabilities and dynamically Open (show) or Hide services for Society Admin,
            Gatekeeper, Resident Owner, Tenant, and Service Partner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {confirmReset ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs">
              <span className="font-bold text-red-700">Reset all rules?</span>
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={!canEdit || saving}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={!canEdit || saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6F1F5] bg-white text-xs font-bold text-slate-700 hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={!canEdit || saving || !hasUnsavedChanges}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasUnsavedChanges && canEdit
                ? 'bg-[#673AB7] text-white shadow-sm hover:bg-[#5E35B1]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Publishing...' : hasUnsavedChanges ? 'Save & Publish Rules' : 'All Rules Published'}
          </button>
        </div>
      </div>

      {/* Super Admin Authority Banner */}
      {!canEdit ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-amber-900">
              Read-Only Mode — Super Admin Authority Required
            </p>
            <p className="text-amber-800 mt-0.5">
              Only an authenticated Super Admin can edit permissions, add custom rules, or toggle
              services between Open and Hidden across roles. Switch active view back to{' '}
              <span className="font-bold">SUPER_ADMIN</span> to unlock editing.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#673AB7] shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-[#673AB7]">
                Super Admin Master RBAC & Module Visibility Authority Active
              </p>
              <p className="text-[#111111] mt-0.5">
                Click <span className="font-bold">Edit Role</span> on any role card below to modify
                permissions, add services, or flip any service between{' '}
                <span className="font-bold text-emerald-700">Open (Visible)</span> and{' '}
                <span className="font-bold text-slate-600">Hidden (Restricted)</span>.
              </p>
            </div>
          </div>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px] shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              Unsaved changes pending publish
            </span>
          )}
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5]">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Managed Roles
          </span>
          <p className="text-xl font-extrabold text-[#111111] mt-1">{metrics.rolesCount}</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Admin, Guard, Owner, Tenant, Partner
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5]">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Open (Visible)
          </span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{metrics.openItems}</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Active services & allowed permissions
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5]">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Hidden (Restricted)
          </span>
          <p className="text-xl font-extrabold text-slate-600 mt-1">{metrics.hiddenItems}</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Disabled or hidden for selected roles
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5]">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Controlled Services
          </span>
          <p className="text-xl font-extrabold text-[#673AB7] mt-1">{metrics.servicesCount}</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Total {metrics.totalItems} configurable rules
          </p>
        </div>
      </div>

      {/* Role Filter Tabs + Search + Type Filter */}
      <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              selectedRole === 'ALL'
                ? 'bg-[#673AB7] text-white'
                : 'bg-[#F8FAFC] text-slate-700 hover:bg-slate-100 border border-[#E6F1F5]'
            }`}
          >
            All Roles ({policies.length})
          </button>
          {policies.map((policy) => (
            <button
              key={policy.roleKey}
              type="button"
              onClick={() => setSelectedRole(policy.roleKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedRole === policy.roleKey
                  ? 'bg-[#673AB7] text-white'
                  : 'bg-[#F8FAFC] text-slate-700 hover:bg-slate-100 border border-[#E6F1F5]'
              }`}
            >
              {ROLE_SHORT_LABEL[policy.roleKey]}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service or permission rule..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6F1F5] bg-[#F8FAFC] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'All Items' },
                { id: 'SERVICE', label: 'Services Only' },
                { id: 'PERMISSION', label: 'Permissions Only' },
                { id: 'OPEN', label: 'Open Only' },
                { id: 'HIDDEN', label: 'Hidden Only' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setItemFilter(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                  itemFilter === opt.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 border border-[#E6F1F5]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Role Cards */}
      <div className="space-y-4">
        {filteredPolicies.map((policy) => {
          const IconComponent = ROLE_ICON_MAP[policy.roleKey] || KeyRound;
          const iconBg = ROLE_COLOR_MAP[policy.roleKey] || 'bg-slate-700';
          const isEditingThisRole = Boolean(editingRoles[policy.roleKey]) && canEdit && !policy.locked;
          const openCount = policy.items.filter((i) => i.enabled).length;
          const hiddenCount = policy.items.length - openCount;

          return (
            <div
              key={policy.roleKey}
              className={`p-5 rounded-2xl bg-white border transition-all space-y-4 ${
                isEditingThisRole
                  ? 'border-[#673AB7] ring-2 ring-[#673AB7]/10 shadow-sm'
                  : 'border-[#E6F1F5] shadow-xs'
              }`}
            >
              {/* Role Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E6F1F5] pb-3.5">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${iconBg}`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm text-[#111111]">{policy.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          policy.riskLevel === 'CRITICAL'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : policy.riskLevel === 'HIGH'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {policy.riskLevel} PRIVILEGE
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {openCount} Open
                      </span>
                      {hiddenCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {hiddenCount} Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">{policy.subtitle}</p>
                  </div>
                </div>

                {/* Role Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {policy.locked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-[#673AB7] text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Root Authority (Locked)
                    </span>
                  ) : (
                    <>
                      {isEditingThisRole && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleBulkToggleRole(policy.roleKey, true)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                          >
                            Open All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkToggleRole(policy.roleKey, false)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            Hide All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingForRole(
                                addingForRole === policy.roleKey ? null : policy.roleKey
                              );
                              setNewItemLabel('');
                              setNewItemDesc('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#673AB7]/10 text-[#673AB7] border border-[#673AB7]/25 text-[11px] font-bold hover:bg-[#673AB7]/15 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Rule / Service
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleRoleEditMode(policy.roleKey)}
                        disabled={!canEdit}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                          isEditingThisRole
                            ? 'bg-[#673AB7] text-white border-[#673AB7]'
                            : 'bg-white text-[#111111] border-[#E6F1F5] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {isEditingThisRole ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Done Editing
                          </>
                        ) : (
                          <>
                            <Pencil className="w-3.5 h-3.5" />
                            Edit Role
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Add Custom Service / Permission Form */}
              {isEditingThisRole && addingForRole === policy.roleKey && (
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#673AB7]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#673AB7]">
                      Add New Service or Permission for {ROLE_SHORT_LABEL[policy.roleKey]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddingForRole(null)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      placeholder="Rule or service name (e.g. EV Charging Slot)"
                      className="px-3 py-2 rounded-xl border border-[#E6F1F5] bg-white text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                    />
                    <input
                      type="text"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="Short description of visibility / capability"
                      className="px-3 py-2 rounded-xl border border-[#E6F1F5] bg-white text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newItemCategory}
                        onChange={(e) =>
                          setNewItemCategory(e.target.value as 'SERVICE' | 'PERMISSION')
                        }
                        className="px-3 py-2 rounded-xl border border-[#E6F1F5] bg-white text-xs font-bold focus:outline-none focus:border-[#673AB7]"
                      >
                        <option value="SERVICE">Service Module</option>
                        <option value="PERMISSION">Permission Rule</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setNewItemEnabled((v) => !v)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          newItemEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {newItemEnabled ? 'Open' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddNewItem(policy.roleKey)}
                        className="px-3 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Services & Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {policy.filteredItems.map((item) => {
                  const isItemBeingEdited = editingItemId === item.id && isEditingThisRole;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                        item.enabled
                          ? 'bg-white border-[#E6F1F5]'
                          : 'bg-slate-50/80 border-slate-200 opacity-85'
                      }`}
                    >
                      {isItemBeingEdited ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editItemLabelDraft}
                            onChange={(e) => setEditItemLabelDraft(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#673AB7] text-xs font-bold focus:outline-none"
                          />
                          <input
                            type="text"
                            value={editItemDescDraft}
                            onChange={(e) => setEditItemDescDraft(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditedItem(policy.roleKey, item.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#673AB7] text-white hover:bg-[#5E35B1] cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                  item.category === 'SERVICE'
                                    ? 'bg-purple-50 text-[#673AB7] border border-purple-200'
                                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}
                              >
                                {item.category}
                              </span>
                              {item.isCustom && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs font-extrabold ${
                                item.enabled ? 'text-[#111111]' : 'text-slate-500 line-through'
                              }`}
                            >
                              {item.label}
                            </p>
                            <p className="text-[11px] text-[#64748B] leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {/* Open / Hidden Toggle */}
                            {policy.locked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Eye className="w-3.5 h-3.5" />
                                Open
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!canEdit || !isEditingThisRole}
                                onClick={() => handleToggleItemVisibility(policy.roleKey, item.id)}
                                title={
                                  !canEdit
                                    ? 'Only Super Admin can change visibility'
                                    : !isEditingThisRole
                                    ? 'Click "Edit Role" to open or hide this item'
                                    : item.enabled
                                    ? 'Click to Hide for this role'
                                    : 'Click to Open for this role'
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  item.enabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-200/80 text-slate-700 border-slate-300'
                                } ${
                                  isEditingThisRole && canEdit
                                    ? 'cursor-pointer hover:opacity-90 ring-1 ring-offset-1 ring-transparent hover:ring-[#673AB7]/40'
                                    : 'cursor-default opacity-90'
                                }`}
                              >
                                {item.enabled ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    Open
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    Hidden
                                  </>
                                )}
                              </button>
                            )}

                            {/* Inline Edit / Delete controls while editing */}
                            {isEditingThisRole && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditingItem(item)}
                                  className="p-1 rounded-md text-slate-500 hover:text-[#673AB7] hover:bg-purple-50 cursor-pointer"
                                  title="Edit rule text"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {item.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomItem(policy.roleKey, item.id)}
                                    className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                    title="Remove custom rule"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {policy.updatedAt && (
                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span>
                    Last modified by <strong className="text-[#64748B]">{policy.updatedBy || 'Super Admin'}</strong>
                  </span>
                  <span>{new Date(policy.updatedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredPolicies.length === 0 && (
          <div className="p-8 rounded-2xl border border-[#E6F1F5] bg-white text-center text-xs text-[#64748B]">
            No roles or service rules match your current search/filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
