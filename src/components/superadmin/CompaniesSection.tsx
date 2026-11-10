/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ManagedCompany, EntityDocument } from '../../types/admin';
import {
  createManagedCompany,
  updateManagedCompany,
  deleteManagedCompany,
  updateCompanyStatus,
} from '../../services/firebase/superadmin.service';
import {
  Briefcase,
  Building2,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  MapPin,
  CreditCard,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  Phone,
  Mail,
  ExternalLink,
  Key,
  Filter,
} from 'lucide-react';

interface CompaniesSectionProps {
  companies: ManagedCompany[];
  onRefresh: () => void | Promise<void>;
}

interface DocUploadItem {
  id: string;
  title: string;
  file?: File;
  fileUrl: string;
  fileType: string;
  name: string;
  size?: number;
}

export const CompaniesSection: React.FC<CompaniesSectionProps> = ({
  companies,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Selected for View Drawer
  const [selectedCompany, setSelectedCompany] = useState<ManagedCompany | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDrawerPassword, setShowDrawerPassword] = useState(false);
  const [copiedDrawerPass, setCopiedDrawerPass] = useState(false);

  // Status Action Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetCompanyForAction, setTargetCompanyForAction] = useState<ManagedCompany | null>(null);
  const [targetNextStatus, setTargetNextStatus] = useState<ManagedCompany['status']>('INACTIVE');
  const [statusReason, setStatusReason] = useState('');

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<ManagedCompany | null>(null);

  // Document Lightbox Preview Modal
  const [previewDoc, setPreviewDoc] = useState<EntityDocument | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ManagedCompany | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editDocs, setEditDocs] = useState<DocUploadItem[]>([]);

  // Create Company Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [copiedCreatePass, setCopiedCreatePass] = useState(false);

  // Generate unique code helper
  const generateUniqueCompanyCode = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `CMP-${randomNum}`;
  };

  const [newCmp, setNewCmp] = useState({
    companyName: '',
    companyCode: generateUniqueCompanyCode(),
    companyType: 'Corporate Campus' as ManagedCompany['companyType'],
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '',
    pincode: '560103',
    totalBuildings: 2,
    totalOffices: 24,
    totalGates: 2,
    subscriptionType: 'Enterprise Plan',
    subscriptionDuration: '1 Year',
    contactPhone: '',
    contactEmail: '',
    adminName: '',
    adminLoginEmail: '',
    adminPassword: '',
  });

  const [createDocs, setCreateDocs] = useState<DocUploadItem[]>([
    { id: 'doc_init', title: 'Company Incorporation / CIN Certificate', fileUrl: '', fileType: '', name: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtered list
  const filtered = companies.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.state && c.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.companyCode && c.companyCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contactEmail && c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.adminLoginEmail && c.adminLoginEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'INACTIVE' && (c.status === 'INACTIVE' || c.status === 'SUSPENDED')) ||
      c.status === statusFilter;

    const matchesType = typeFilter === 'ALL' || c.companyType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle Document File Input Conversion to Base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docId: string,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      alert('Only PDF and JPG/JPEG/PNG documents are supported.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updatedItem: Partial<DocUploadItem> = {
        name: file.name,
        fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        fileUrl: result,
        size: file.size,
      };

      if (isEdit) {
        setEditDocs((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...updatedItem } : d))
        );
      } else {
        setCreateDocs((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, ...updatedItem } : d))
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Add more documents to create form
  const handleAddCreateDoc = () => {
    setCreateDocs((prev) => [
      ...prev,
      {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: '',
        fileUrl: '',
        fileType: '',
        name: '',
      },
    ]);
  };

  // Remove document from create form
  const handleRemoveCreateDoc = (id: string) => {
    setCreateDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Add document to edit form
  const handleAddEditDoc = () => {
    setEditDocs((prev) => [
      ...prev,
      {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: '',
        fileUrl: '',
        fileType: '',
        name: '',
      },
    ]);
  };

  // Remove document from edit form
  const handleRemoveEditDoc = (id: string) => {
    setEditDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Open Edit Modal
  const openEditModal = (cmp: ManagedCompany) => {
    setEditingCompany({ ...cmp });
    setShowEditPassword(false);
    const existingDocs: DocUploadItem[] = (cmp.documents || []).map((d) => ({
      id: d.id,
      title: d.title || d.name,
      name: d.name,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      size: d.size,
    }));
    setEditDocs(existingDocs);
    setShowEditModal(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setLoading(true);
    setFormError('');

    try {
      const formattedDocs: EntityDocument[] = editDocs
        .filter((d) => d.title.trim() && (d.fileUrl || d.name))
        .map((d) => ({
          id: d.id,
          title: d.title,
          name: d.name || d.title,
          fileUrl: d.fileUrl || '',
          fileType: d.fileType || 'application/pdf',
          uploadedAt: new Date().toISOString(),
          size: d.size,
        }));

      await updateManagedCompany(editingCompany.id, {
        ...editingCompany,
        documents: formattedDocs,
      });

      setShowEditModal(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Company
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    if (!newCmp.companyName.trim()) {
      setFormError('Company name is required');
      setLoading(false);
      return;
    }
    if (!newCmp.adminLoginEmail.trim()) {
      setFormError('Admin login email is required');
      setLoading(false);
      return;
    }
    if (!newCmp.adminPassword || newCmp.adminPassword.length < 6) {
      setFormError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const formattedDocs: EntityDocument[] = createDocs
        .filter((d) => d.title.trim() && d.fileUrl)
        .map((d) => ({
          id: d.id,
          title: d.title,
          name: d.name || d.title,
          fileUrl: d.fileUrl,
          fileType: d.fileType || 'application/pdf',
          uploadedAt: new Date().toISOString(),
          size: d.size,
        }));

      await createManagedCompany({
        companyName: newCmp.companyName,
        companyCode: newCmp.companyCode,
        companyType: newCmp.companyType,
        city: newCmp.city,
        state: newCmp.state,
        address: newCmp.address,
        pincode: newCmp.pincode,
        totalBuildings: Number(newCmp.totalBuildings),
        totalOffices: Number(newCmp.totalOffices),
        totalGates: Number(newCmp.totalGates),
        subscriptionPlan: newCmp.subscriptionType,
        subscriptionType: newCmp.subscriptionType,
        subscriptionDuration: newCmp.subscriptionDuration,
        contactPhone: newCmp.contactPhone,
        contactEmail: newCmp.contactEmail,
        adminName: newCmp.adminName || 'Admin Assigned',
        adminLoginEmail: newCmp.adminLoginEmail,
        adminPassword: newCmp.adminPassword,
        documents: formattedDocs,
        status: 'ACTIVE',
      });

      setShowCreateModal(false);
      setNewCmp({
        companyName: '',
        companyCode: generateUniqueCompanyCode(),
        companyType: 'Corporate Campus',
        city: 'Bengaluru',
        state: 'Karnataka',
        address: '',
        pincode: '560103',
        totalBuildings: 2,
        totalOffices: 24,
        totalGates: 2,
        subscriptionType: 'Enterprise Plan',
        subscriptionDuration: '1 Year',
        contactPhone: '',
        contactEmail: '',
        adminName: '',
        adminLoginEmail: '',
        adminPassword: '',
      });
      setCreateDocs([
        { id: 'doc_init', title: 'Company Incorporation / CIN Certificate', fileUrl: '', fileType: '', name: '' },
      ]);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Status Execution
  const handleExecuteStatusToggle = async () => {
    if (!targetCompanyForAction) return;
    setLoading(true);
    try {
      await updateCompanyStatus(
        targetCompanyForAction.id,
        targetNextStatus,
        statusReason || `Super Admin status update to ${targetNextStatus}`
      );
      setShowStatusModal(false);
      setTargetCompanyForAction(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Execution
  const handleExecuteDelete = async () => {
    if (!companyToDelete) return;
    setLoading(true);
    try {
      await deleteManagedCompany(companyToDelete.id);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Commercial & Corporate Campus Management
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Centralized directory for corporate campuses, tech parks, factories and commercial enterprises
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewCmp((prev) => ({ ...prev, companyCode: generateUniqueCompanyCode() }));
            setFormError('');
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, code, city, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#F1F9FC] p-1 rounded-xl border border-[#E6F1F5]">
            {(['ALL', 'ACTIVE', 'INACTIVE', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#673AB7] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-[#F1F9FC] px-2.5 py-1 rounded-xl border border-[#E6F1F5]">
            <Filter className="w-3.5 h-3.5 text-[#A9B0B8]" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Commercial Building">Commercial Building</option>
              <option value="Corporate Campus">Corporate Campus</option>
              <option value="Factory">Factory</option>
              <option value="Tech Park">Tech Park</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Companies */}
      <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F1F9FC] text-[#555555] font-bold border-b border-[#E6F1F5] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-[30%]">Company & Code</th>
                <th className="py-3 px-3 w-[26%]">Location & Scale</th>
                <th className="py-3 px-3 w-[26%]">Admin Credentials</th>
                <th className="py-3 px-3 w-[6%] text-center">Status</th>
                <th className="py-3 px-3 w-[12%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No companies found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((cmp) => {
                  const isSuspendedOrInactive = cmp.status === 'INACTIVE' || cmp.status === 'SUSPENDED';

                  return (
                    <tr key={cmp.id} className="hover:bg-[#F9FCFD] transition">
                      {/* 1. Company Name & Code (2 Clean Lines) */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[#111111] text-xs leading-snug truncate" title={cmp.companyName}>
                              {cmp.companyName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-[#673AB7]">
                                {cmp.companyCode || 'CMP-PENDING'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium truncate">
                                • {cmp.companyType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Location & Scale (2 Clean Lines) */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-800 text-xs flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#673AB7] shrink-0" />
                          <span className="truncate">{cmp.city}, {cmp.state}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                          {cmp.totalBuildings || 1} Buildings • {cmp.totalOffices || 10} Units ({cmp.totalGates || 2} Gates)
                        </div>
                      </td>

                      {/* 3. Admin Credentials (2 Clean Lines) */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-gray-800 font-semibold select-all truncate" title={cmp.adminLoginEmail || cmp.contactEmail}>
                          {cmp.adminLoginEmail || cmp.contactEmail}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                          Admin: <strong className="text-gray-700">{cmp.adminName || 'Assigned'}</strong> • {cmp.contactPhone}
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cmp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : cmp.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {cmp.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{cmp.status}</span>
                        </span>
                      </td>

                      {/* 6. Actions (All 4 Buttons Cleanly Visible with Tooltips) */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompany(cmp);
                              setShowDrawer(true);
                            }}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#673AB7] transition cursor-pointer shadow-2xs"
                            title="View Details & Documents"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(cmp)}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer shadow-2xs"
                            title="Edit Details & Credentials"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Status Toggle Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetCompanyForAction(cmp);
                              setTargetNextStatus(isSuspendedOrInactive ? 'ACTIVE' : 'INACTIVE');
                              setStatusReason('');
                              setShowStatusModal(true);
                            }}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isSuspendedOrInactive
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                            title={isSuspendedOrInactive ? 'Activate Company' : 'Suspend / Deactivate Company'}
                          >
                            {isSuspendedOrInactive ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyToDelete(cmp);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer shadow-2xs"
                            title="Delete Company Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. REGISTER COMPANY MODAL                                      */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Company Registration Form</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Super Admin corporate campus registration, credential generation & document verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Row 1: Company Name & Auto-generated Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company / Campus Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prestige Cloud Tech Campus"
                    value={newCmp.companyName}
                    onChange={(e) => setNewCmp({ ...newCmp, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company Code <span className="text-xs text-purple-600 font-semibold">(Auto)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={newCmp.companyCode}
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono font-bold text-[#673AB7] focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 2: Company Type & Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Company Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newCmp.companyType}
                    onChange={(e) => setNewCmp({ ...newCmp, companyType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-[#673AB7] focus:outline-none cursor-pointer"
                  >
                    <option value="Commercial Building">Commercial Building</option>
                    <option value="Corporate Campus">Corporate Campus</option>
                    <option value="Factory">Factory</option>
                    <option value="Tech Park">Tech Park</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCmp.city}
                    onChange={(e) => setNewCmp({ ...newCmp, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newCmp.state}
                    onChange={(e) => setNewCmp({ ...newCmp, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Full Address & Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Physical Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Campus address, street, landmark"
                    value={newCmp.address}
                    onChange={(e) => setNewCmp({ ...newCmp, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={newCmp.pincode}
                    onChange={(e) => setNewCmp({ ...newCmp, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Buildings, Offices, Gates */}
              <div className="grid grid-cols-3 gap-3 bg-[#F1F9FC] p-3 rounded-2xl border border-[#E6F1F5]">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Buildings</label>
                  <input
                    type="number"
                    min="1"
                    value={newCmp.totalBuildings}
                    onChange={(e) => setNewCmp({ ...newCmp, totalBuildings: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Offices / Units</label>
                  <input
                    type="number"
                    min="1"
                    value={newCmp.totalOffices}
                    onChange={(e) => setNewCmp({ ...newCmp, totalOffices: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Security Gates</label>
                  <input
                    type="number"
                    min="1"
                    value={newCmp.totalGates}
                    onChange={(e) => setNewCmp({ ...newCmp, totalGates: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Subscription Type & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subscription Type</label>
                  <select
                    value={newCmp.subscriptionType}
                    onChange={(e) => setNewCmp({ ...newCmp, subscriptionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Enterprise Plan">Enterprise Plan</option>
                    <option value="Professional Plan">Professional Plan</option>
                    <option value="Starter Gate Plan">Starter Gate Plan</option>
                    <option value="Custom High-Volume Plan">Custom High-Volume Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subscription Duration</label>
                  <select
                    value={newCmp.subscriptionDuration}
                    onChange={(e) => setNewCmp({ ...newCmp, subscriptionDuration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Contact Phone, Email & Admin Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    value={newCmp.contactPhone}
                    onChange={(e) => setNewCmp({ ...newCmp, contactPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="facilities@campus.com"
                    value={newCmp.contactEmail}
                    onChange={(e) => setNewCmp({ ...newCmp, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Admin Name</label>
                  <input
                    type="text"
                    placeholder="Rajesh Nair"
                    value={newCmp.adminName}
                    onChange={(e) => setNewCmp({ ...newCmp, adminName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Company Admin Login Credentials Box */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#673AB7]">
                  <Key className="w-4 h-4" />
                  <span>Company Admin Login Credentials (Immediate Sign-In Setup)</span>
                </div>
                <p className="text-[11px] text-gray-600">
                  These credentials will be registered to the authentication service. The Company Admin can immediately sign into the portal using this Email & Password.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Login Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@campus.com"
                      value={newCmp.adminLoginEmail}
                      onChange={(e) => setNewCmp({ ...newCmp, adminLoginEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700">
                        Login Password <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = `Gate@${Math.floor(1000 + Math.random() * 9000)}`;
                          setNewCmp({ ...newCmp, adminPassword: generated });
                        }}
                        className="text-[10px] text-[#673AB7] hover:underline font-bold cursor-pointer"
                      >
                        Auto-generate
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 characters"
                        value={newCmp.adminPassword}
                        onChange={(e) => setNewCmp({ ...newCmp, adminPassword: e.target.value })}
                        className="w-full pl-3 pr-16 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                          className="p-1 text-gray-400 hover:text-gray-700"
                          title={showCreatePassword ? 'Hide password' : 'Show password'}
                        >
                          {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {newCmp.adminPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(newCmp.adminPassword);
                              setCopiedCreatePass(true);
                              setTimeout(() => setCopiedCreatePass(false), 2000);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700"
                            title="Copy password"
                          >
                            {copiedCreatePass ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 8: Dynamic Document Upload Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#673AB7]" />
                      <span>Company Regulatory & Verification Documents</span>
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Upload PDF or JPG documents (Incorporation Certificate, NOC, Lease Deed, Tax ID, etc.)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCreateDoc}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-[#673AB7] hover:bg-purple-100 font-bold text-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Documents</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {createDocs.map((docItem, index) => (
                    <div
                      key={docItem.id}
                      className="p-3 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#673AB7]/10 text-[#673AB7] font-bold text-[11px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Document Title (e.g. CIN Certificate, Fire NOC)"
                          value={docItem.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateDocs((prev) =>
                              prev.map((d) => (d.id === docItem.id ? { ...d, title: val } : d))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#673AB7]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-gray-500" />
                          <span className="truncate max-w-[150px]">
                            {docItem.name ? docItem.name : 'Choose PDF/JPG'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf, .jpg, .jpeg, .png, application/pdf, image/jpeg, image/png"
                            onChange={(e) => handleFileUpload(e, docItem.id, false)}
                            className="hidden"
                          />
                        </label>

                        {createDocs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCreateDoc(docItem.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Remove document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#673AB7] hover:bg-[#5E35B1] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Registering Company...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. VIEW FULL DETAILS DRAWER                                    */}
      {/* ============================================================== */}
      {showDrawer && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#673AB7]">
                  Company Entity Audit Profile
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">
                  {selectedCompany.companyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-xl hover:bg-white text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status and Code Pill */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Company Code</span>
                  <span className="font-mono font-bold text-sm text-[#673AB7]">
                    {selectedCompany.companyCode || 'CMP-PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">CIN / Reg</span>
                  <span className="font-mono text-xs text-gray-700">
                    {selectedCompany.registrationNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Status</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedCompany.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedCompany.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {selectedCompany.status}
                  </span>
                </div>
              </div>

              {/* Admin Login Credentials Box */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#673AB7]">
                    <Key className="w-4 h-4" />
                    <span>Company Admin Login Credentials</span>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                    Super Admin Revealed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-purple-100">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Login Email</span>
                    <span className="font-mono font-semibold text-gray-800">
                      {selectedCompany.adminLoginEmail || selectedCompany.contactEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Assigned Admin</span>
                    <span className="font-semibold text-gray-800">
                      {selectedCompany.adminName || 'Admin Assigned'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-purple-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Master Password</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {showDrawerPassword
                          ? selectedCompany.adminPassword || 'Company@2026'
                          : '••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowDrawerPassword(!showDrawerPassword)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#673AB7] hover:bg-purple-50 cursor-pointer"
                        title={showDrawerPassword ? 'Hide password' : 'Show password'}
                      >
                        {showDrawerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedCompany.adminPassword || 'Company@2026');
                          setCopiedDrawerPass(true);
                          setTimeout(() => setCopiedDrawerPass(false), 2000);
                        }}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-[#673AB7] hover:bg-purple-50 cursor-pointer"
                        title="Copy password"
                      >
                        {copiedDrawerPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Address & Scale */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6F1F5] shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-gray-900">Campus Specifications & Location</h4>
                <div className="grid grid-cols-3 gap-3 text-xs bg-[#F1F9FC] p-3 rounded-xl border border-[#E6F1F5]">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Buildings</span>
                    <span className="font-extrabold text-gray-800">{selectedCompany.totalBuildings || 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Offices / Units</span>
                    <span className="font-extrabold text-gray-800">{selectedCompany.totalOffices || 10}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Security Gates</span>
                    <span className="font-extrabold text-gray-800">{selectedCompany.totalGates || 2}</span>
                  </div>
                  <div className="col-span-3 pt-2 border-t border-[#E6F1F5]">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Full Address</span>
                    <span className="text-gray-700">
                      {selectedCompany.address}, {selectedCompany.city}, {selectedCompany.state} - {selectedCompany.pincode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6F1F5] shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-gray-900">SaaS Subscription Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Subscription Plan</span>
                    <span className="font-bold text-[#673AB7]">
                      {selectedCompany.subscriptionPlan || selectedCompany.subscriptionType || 'Enterprise'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Duration</span>
                    <span className="font-bold text-gray-800">
                      {selectedCompany.subscriptionDuration || '1 Year'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="bg-white p-4 rounded-2xl border border-[#E6F1F5] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#673AB7]" />
                    <span>Uploaded Regulatory Documents (PDF / JPG)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    {selectedCompany.documents?.length || 0} File(s)
                  </span>
                </div>

                {!selectedCompany.documents || selectedCompany.documents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    No documents uploaded for this company during registration.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedCompany.documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="p-3 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-7 h-7 rounded-lg bg-purple-100 text-[#673AB7] flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-gray-900 truncate">{doc.title}</div>
                            <div className="text-[10px] text-gray-500 font-mono truncate">{doc.name}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#673AB7] hover:bg-purple-50 font-bold text-[11px] cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              download={doc.name || 'document'}
                              className="p-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E6F1F5] bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  openEditModal(selectedCompany);
                }}
                className="px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition cursor-pointer"
              >
                Edit Company & Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. EDIT COMPANY DETAILS MODAL                                  */}
      {/* ============================================================== */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Edit Company Details & Credentials</h3>
                <p className="text-xs text-gray-500 font-medium">
                  Super Admin management of commercial properties, reset passwords and verify documents
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company / Campus Name</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.companyName}
                    onChange={(e) => setEditingCompany({ ...editingCompany, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Company Code</label>
                  <input
                    type="text"
                    value={editingCompany.companyCode || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, companyCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 font-mono text-xs font-bold text-[#673AB7] focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Type, City, State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                  <select
                    value={editingCompany.companyType}
                    onChange={(e) => setEditingCompany({ ...editingCompany, companyType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Commercial Building">Commercial Building</option>
                    <option value="Corporate Campus">Corporate Campus</option>
                    <option value="Factory">Factory</option>
                    <option value="Tech Park">Tech Park</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.city}
                    onChange={(e) => setEditingCompany({ ...editingCompany, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.state}
                    onChange={(e) => setEditingCompany({ ...editingCompany, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Address & Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.address}
                    onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={editingCompany.pincode}
                    onChange={(e) => setEditingCompany({ ...editingCompany, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Scale */}
              <div className="grid grid-cols-3 gap-3 bg-[#F1F9FC] p-3 rounded-2xl border border-[#E6F1F5]">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Buildings</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCompany.totalBuildings || 1}
                    onChange={(e) => setEditingCompany({ ...editingCompany, totalBuildings: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Offices / Units</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCompany.totalOffices || 10}
                    onChange={(e) => setEditingCompany({ ...editingCompany, totalOffices: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Security Gates</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCompany.totalGates || 2}
                    onChange={(e) => setEditingCompany({ ...editingCompany, totalGates: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Subscription */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subscription Plan</label>
                  <select
                    value={editingCompany.subscriptionPlan || editingCompany.subscriptionType || 'Enterprise Plan'}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        subscriptionPlan: e.target.value,
                        subscriptionType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value="Enterprise Plan">Enterprise Plan</option>
                    <option value="Professional Plan">Professional Plan</option>
                    <option value="Starter Gate Plan">Starter Gate Plan</option>
                    <option value="Custom High-Volume Plan">Custom High-Volume Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Duration</label>
                  <select
                    value={editingCompany.subscriptionDuration || '1 Year'}
                    onChange={(e) => setEditingCompany({ ...editingCompany, subscriptionDuration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="3 Years">3 Years</option>
                  </select>
                </div>
              </div>

              {/* Admin Credentials Edit Box */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-[#673AB7]">
                    <Key className="w-4 h-4" />
                    <span>Company Admin Authentication & Password Reset</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">Direct live sync</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Admin Login Email</label>
                    <input
                      type="email"
                      required
                      value={editingCompany.adminLoginEmail || editingCompany.contactEmail}
                      onChange={(e) =>
                        setEditingCompany({ ...editingCompany, adminLoginEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700">Admin Password (Reset / Reveal)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = `Gate@${Math.floor(1000 + Math.random() * 9000)}`;
                          setEditingCompany({ ...editingCompany, adminPassword: generated });
                        }}
                        className="text-[10px] text-[#673AB7] hover:underline font-bold cursor-pointer"
                      >
                        Reset / Generate New
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editingCompany.adminPassword || ''}
                        onChange={(e) =>
                          setEditingCompany({ ...editingCompany, adminPassword: e.target.value })
                        }
                        placeholder="Keep empty or set new password"
                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-purple-200 bg-white text-xs font-mono text-gray-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      >
                        {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Documents Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#673AB7]" />
                    <span>Manage Uploaded Documents</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddEditDoc}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-[#673AB7] hover:bg-purple-100 font-bold text-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Document</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editDocs.map((docItem, index) => (
                    <div
                      key={docItem.id}
                      className="p-3 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#673AB7]/10 text-[#673AB7] font-bold text-[11px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Document Title"
                          value={docItem.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditDocs((prev) =>
                              prev.map((d) => (d.id === docItem.id ? { ...d, title: val } : d))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-800 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-gray-500" />
                          <span className="truncate max-w-[130px]">
                            {docItem.name ? docItem.name : 'Replace File'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf, .jpg, .jpeg, .png, application/pdf, image/jpeg, image/png"
                            onChange={(e) => handleFileUpload(e, docItem.id, true)}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveEditDoc(docItem.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#673AB7] hover:bg-[#5E35B1] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Saving Changes...' : 'Save & Sync Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. STATUS TOGGLE MODAL                                         */}
      {/* ============================================================== */}
      {showStatusModal && targetCompanyForAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  targetNextStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {targetNextStatus === 'ACTIVE' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  {targetNextStatus === 'ACTIVE' ? 'Activate Company' : 'Suspend / Deactivate Company'}
                </h3>
                <p className="text-xs text-gray-500">{targetCompanyForAction.companyName}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              {targetNextStatus === 'ACTIVE'
                ? 'Activating this company will restore full gate and dashboard access for all staff and employees.'
                : 'Deactivating or suspending will restrict active security gate operations and staff access.'}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Administrative Reason</label>
              <input
                type="text"
                placeholder="Reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#673AB7]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusToggle}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition cursor-pointer ${
                  targetNextStatus === 'ACTIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading ? 'Updating...' : `Confirm ${targetNextStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. DELETE CONFIRMATION MODAL                                   */}
      {/* ============================================================== */}
      {showDeleteModal && companyToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 mb-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Delete Company Permanently</h3>
                <p className="text-xs text-red-500 font-semibold">{companyToDelete.companyName}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Are you sure you want to delete this company entity? This action is permanent and will remove the company records, buildings, and admin authentication bindings.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DOCUMENT LIGHTBOX PREVIEW MODAL                             */}
      {/* ============================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{previewDoc.title}</h4>
                <p className="text-xs text-gray-500 font-mono">{previewDoc.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-gray-100 overflow-auto flex items-center justify-center min-h-[400px]">
              {previewDoc.fileUrl ? (
                previewDoc.fileType?.includes('pdf') || previewDoc.fileUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.title}
                    className="w-full h-[550px] rounded-xl border border-gray-300 bg-white"
                  />
                ) : (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[550px] max-w-full rounded-xl object-contain shadow-md"
                  />
                )
              ) : (
                <div className="text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No file content available for preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
