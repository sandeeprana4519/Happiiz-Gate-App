/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Society, EntityDocument } from '../../types/society';
import {
  updateSocietyStatus,
  updateSocietyDetails,
  createNewSociety,
  deleteSociety,
} from '../../services/firebase/superadmin.service';
import {
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
} from 'lucide-react';

interface SocietiesSectionProps {
  societies: Society[];
  onRefresh: () => Promise<void>;
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

export const SocietiesSection: React.FC<SocietiesSectionProps> = ({ societies, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'>('ALL');
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  
  // Status Action Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [targetSocietyForAction, setTargetSocietyForAction] = useState<Society | null>(null);
  const [targetNextStatus, setTargetNextStatus] = useState<Society['status']>('INACTIVE');
  
  // Delete Modal
  const [societyToDelete, setSocietyToDelete] = useState<Society | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Document Lightbox Preview Modal
  const [previewDoc, setPreviewDoc] = useState<EntityDocument | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSociety, setEditingSociety] = useState<Society | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editDocs, setEditDocs] = useState<DocUploadItem[]>([]);

  // Create Society Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Generate unique code helper
  const generateUniqueSocietyCode = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `SOC-${randomNum}`;
  };

  const [newSoc, setNewSoc] = useState({
    societyName: '',
    societyCode: generateUniqueSocietyCode(),
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '',
    totalTowers: 3,
    totalFlats: 150,
    totalGates: 2,
    subscriptionType: 'Enterprise',
    subscriptionDuration: '1 Year',
    contactPhone: '',
    contactEmail: '',
    adminLoginEmail: '',
    adminPassword: '',
  });

  const [createDocs, setCreateDocs] = useState<DocUploadItem[]>([
    { id: 'doc_init', title: 'Society Registration Deed', fileUrl: '', fileType: '', name: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtered societies
  const filtered = societies.filter((s) => {
    const matchesSearch =
      s.societyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.state && s.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.societyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.adminLoginEmail && s.adminLoginEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'INACTIVE' && (s.status === 'INACTIVE' || s.status === 'SUSPENDED')) ||
      s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle Document File Input Conversion to Base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docId: string,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
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
  const openEditModal = (soc: Society) => {
    setEditingSociety({ ...soc });
    setShowEditPassword(false);
    const existingDocs: DocUploadItem[] = (soc.documents || []).map((d) => ({
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
    if (!editingSociety) return;
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

      await updateSocietyDetails(editingSociety.id, {
        ...editingSociety,
        documents: formattedDocs,
      });

      setShowEditModal(false);
      setEditingSociety(null);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update society');
    } finally {
      setLoading(false);
    }
  };

  // Submit Create Society Form
  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newSoc.societyName.trim()) {
      setFormError('Please enter Society Name.');
      return;
    }
    if (!newSoc.adminLoginEmail.trim()) {
      setFormError('Please provide Admin Login Email.');
      return;
    }
    if (!newSoc.adminPassword || newSoc.adminPassword.length < 6) {
      setFormError('Admin Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const finalDocs: EntityDocument[] = createDocs
        .filter((d) => d.title.trim() && (d.fileUrl || d.name))
        .map((d) => ({
          id: d.id,
          title: d.title,
          name: d.name || `${d.title}.pdf`,
          fileUrl: d.fileUrl || '',
          fileType: d.fileType || 'application/pdf',
          uploadedAt: new Date().toISOString(),
          size: d.size,
        }));

      await createNewSociety({
        societyName: newSoc.societyName.trim(),
        societyCode: newSoc.societyCode,
        city: newSoc.city.trim(),
        state: newSoc.state.trim(),
        address: newSoc.address.trim(),
        totalTowers: Number(newSoc.totalTowers) || 1,
        totalFlats: Number(newSoc.totalFlats) || 100,
        totalGates: Number(newSoc.totalGates) || 2,
        subscriptionPlan: newSoc.subscriptionType,
        subscriptionType: newSoc.subscriptionType,
        subscriptionDuration: newSoc.subscriptionDuration,
        contactPhone: newSoc.contactPhone.trim(),
        contactEmail: newSoc.contactEmail.trim(),
        adminLoginEmail: newSoc.adminLoginEmail.trim().toLowerCase(),
        adminPassword: newSoc.adminPassword,
        documents: finalDocs,
        status: 'ACTIVE',
      });

      setShowCreateModal(false);
      // Reset form
      setNewSoc({
        societyName: '',
        societyCode: generateUniqueSocietyCode(),
        city: 'Bengaluru',
        state: 'Karnataka',
        address: '',
        totalTowers: 3,
        totalFlats: 150,
        totalGates: 2,
        subscriptionType: 'Enterprise',
        subscriptionDuration: '1 Year',
        contactPhone: '',
        contactEmail: '',
        adminLoginEmail: '',
        adminPassword: '',
      });
      setCreateDocs([
        { id: 'doc_init', title: 'Society Registration Deed', fileUrl: '', fileType: '', name: '' },
      ]);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to provision society');
    } finally {
      setLoading(false);
    }
  };

  // Status Change (Activate / Deactivate / Suspend)
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSocietyForAction) return;
    setLoading(true);

    try {
      await updateSocietyStatus(
        targetSocietyForAction.id,
        targetNextStatus,
        statusReason || `Status changed to ${targetNextStatus} by Super Admin`
      );
      setShowStatusModal(false);
      setStatusReason('');
      setTargetSocietyForAction(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  // Confirm Delete Society
  const handleConfirmDelete = async () => {
    if (!societyToDelete) return;
    setLoading(true);
    try {
      await deleteSociety(societyToDelete.id);
      setShowDeleteModal(false);
      setSocietyToDelete(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#111111] tracking-tight">Society Management Directory</h2>
          <p className="text-xs text-[#A9B0B8]">
            Full root-level administration, provisioning, credential management & document registry
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNewSoc((prev) => ({ ...prev, societyCode: generateUniqueSocietyCode() }));
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-all cursor-pointer shadow-md shadow-purple-900/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Society</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, city, code, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((st) => (
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
                : st === 'INACTIVE'
                ? 'Inactive'
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
                <th className="py-3 px-4">Towers & Flats</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Admin Login</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No societies found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((soc) => (
                  <tr key={soc.id} className="hover:bg-[#F1F9FC]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#111111]">{soc.societyName}</div>
                      <div className="text-[11px] text-[#A9B0B8] font-mono">
                        Code: <span className="text-[#673AB7] font-bold">{soc.societyCode}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#111111]">{soc.city}, {soc.state || 'India'}</div>
                      <div className="text-[11px] text-[#A9B0B8] truncate max-w-xs">{soc.address}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                      {soc.totalTowers || 1} Towers • {soc.totalFlats} Flats
                      <div className="text-[10px] text-[#A9B0B8] font-normal">{soc.totalGates} Gates</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                        {soc.subscriptionType || soc.subscriptionPlan}
                      </span>
                      {soc.subscriptionDuration && (
                        <div className="text-[10px] text-gray-500 mt-0.5">{soc.subscriptionDuration}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 truncate max-w-[150px]">
                        {soc.adminLoginEmail || soc.contactEmail || 'admin@society.org'}
                      </div>
                      <div className="text-[10px] text-gray-400">Society Admin</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          soc.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : soc.status === 'SUSPENDED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
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
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSociety(soc);
                            setShowProfileDrawer(true);
                          }}
                          className="p-1.5 rounded-lg border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[#673AB7] cursor-pointer"
                          title="View Full Details & Documents"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(soc)}
                          className="p-1.5 rounded-lg border border-[#E6F1F5] hover:bg-[#F1F9FC] text-blue-600 cursor-pointer"
                          title="Edit Society & Credentials"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Toggle Button */}
                        {soc.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSocietyForAction(soc);
                              setTargetNextStatus('INACTIVE');
                              setShowStatusModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-600 cursor-pointer"
                            title="Deactivate Society"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSocietyForAction(soc);
                              setTargetNextStatus('ACTIVE');
                              setShowStatusModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-600 cursor-pointer"
                            title="Activate Society"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSocietyToDelete(soc);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                          title="Delete Society"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW ALL DETAILS & DOCUMENTS DRAWER / MODAL                             */}
      {/* ========================================================================= */}
      {showProfileDrawer && selectedSociety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">
                    {selectedSociety.societyName}
                  </h3>
                  <p className="text-xs text-[#A9B0B8]">
                    Code: <span className="font-mono font-bold text-[#673AB7]">{selectedSociety.societyCode}</span> • Status: <span className="font-semibold text-gray-800">{selectedSociety.status}</span>
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
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">City & State</span>
                  <span className="text-xs font-bold text-[#111111]">{selectedSociety.city}, {selectedSociety.state || 'India'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">Subscription</span>
                  <span className="text-xs font-bold text-[#673AB7]">{selectedSociety.subscriptionType || selectedSociety.subscriptionPlan}</span>
                  <div className="text-[10px] text-gray-500">{selectedSociety.subscriptionDuration || '1 Year'}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">Towers & Units</span>
                  <span className="text-xs font-bold text-[#111111]">{selectedSociety.totalTowers || 1} Towers / {selectedSociety.totalFlats} Flats</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
                  <span className="text-[10px] text-[#A9B0B8] uppercase font-bold tracking-wider block">Gates</span>
                  <span className="text-xs font-bold text-[#111111]">{selectedSociety.totalGates} Checkpoints</span>
                </div>
              </div>

              {/* Physical Address & Contact */}
              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-2">
                <h4 className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#673AB7]" />
                  Full Physical Address
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedSociety.address || 'Address not registered'}</p>
                <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-gray-600 border-t border-gray-100">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#673AB7]" /> Email: {selectedSociety.contactEmail || 'N/A'}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#673AB7]" /> Phone: {selectedSociety.contactPhone || 'N/A'}</span>
                </div>
              </div>

              {/* Admin Login Credentials Card */}
              <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-purple-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#673AB7]" />
                    Society Admin Login Credentials
                  </h4>
                  <span className="text-[10px] font-bold text-[#673AB7] bg-white px-2 py-0.5 rounded border border-purple-200">
                    Direct Root Access
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Login Email</span>
                    <span className="text-xs font-mono font-bold text-gray-900">{selectedSociety.adminLoginEmail || selectedSociety.contactEmail || 'admin@society.org'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Password</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-900">
                        {showPassword ? selectedSociety.adminPassword || 'Happiiz@2026' : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-purple-700"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedSociety.adminPassword || 'Happiiz@2026')}
                        className="text-gray-500 hover:text-purple-700"
                        title="Copy password"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Section */}
              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#673AB7]" />
                    Uploaded Documents ({selectedSociety.documents?.length || 0})
                  </h4>
                  <span className="text-[10px] text-gray-400">PDF, JPG, JPEG</span>
                </div>

                {(!selectedSociety.documents || selectedSociety.documents.length === 0) ? (
                  <p className="text-xs text-gray-400 italic py-2">No documents uploaded for this society yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSociety.documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[#673AB7] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{doc.title || doc.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono truncate">{doc.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] hover:bg-[#673AB7] hover:text-white font-bold text-[11px] text-[#673AB7] transition-colors"
                          >
                            Preview
                          </button>
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              download={doc.name || 'document'}
                              className="p-1 rounded-lg hover:bg-white text-gray-500 hover:text-[#673AB7]"
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

            <div className="p-4 border-t border-[#E6F1F5] bg-[#F1F9FC]/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowProfileDrawer(false);
                  openEditModal(selectedSociety);
                }}
                className="px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>

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

      {/* ========================================================================= */}
      {/* 2. SOCIETY REGISTRATION FORM MODAL (TASK 2)                               */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleCreateSociety}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-2xl w-full max-w-2xl my-8 flex flex-col overflow-hidden animate-scale-up"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">Society Registration Form</h3>
                  <p className="text-xs text-[#A9B0B8]">
                    Provision a new society entity with administrator credentials and documents
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Society Name & Auto Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#111111] block mb-1">
                    Society Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Palms Residency"
                    value={newSoc.societyName}
                    onChange={(e) => setNewSoc({ ...newSoc, societyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">
                    Society Code <span className="text-gray-400 font-normal">(Auto-Generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={newSoc.societyCode}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] bg-gray-100 font-mono font-bold text-xs text-[#673AB7] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 2: City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
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
                  <label className="text-xs font-bold text-[#111111] block mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karnataka"
                    value={newSoc.state}
                    onChange={(e) => setNewSoc({ ...newSoc, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Full Address */}
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">
                  Full Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Complete physical street address, survey number, locality..."
                  value={newSoc.address}
                  onChange={(e) => setNewSoc({ ...newSoc, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              {/* Row 4: Total Towers, Total Flats / Units, Gates */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Total Towers</label>
                  <input
                    type="number"
                    min={1}
                    value={newSoc.totalTowers}
                    onChange={(e) => setNewSoc({ ...newSoc, totalTowers: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Flats / Units</label>
                  <input
                    type="number"
                    min={1}
                    value={newSoc.totalFlats}
                    onChange={(e) => setNewSoc({ ...newSoc, totalFlats: parseInt(e.target.value) || 100 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Total Gates</label>
                  <input
                    type="number"
                    min={1}
                    value={newSoc.totalGates}
                    onChange={(e) => setNewSoc({ ...newSoc, totalGates: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Subscription Type & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Subscription Type</label>
                  <select
                    value={newSoc.subscriptionType}
                    onChange={(e) => setNewSoc({ ...newSoc, subscriptionType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Basic">Basic Plan</option>
                    <option value="Standard">Standard Gate Plan</option>
                    <option value="Enterprise">Enterprise Full Suite</option>
                    <option value="Premium 3D">Premium 3D Security</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Subscription Duration</label>
                  <select
                    value={newSoc.subscriptionDuration}
                    onChange={(e) => setNewSoc({ ...newSoc, subscriptionDuration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="1 Month">1 Month Trial</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year (Annual)</option>
                    <option value="2 Years">2 Years Enterprise</option>
                    <option value="3 Years">3 Years Long-Term</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Contact Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={newSoc.contactPhone}
                    onChange={(e) => setNewSoc({ ...newSoc, contactPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="contact@society.org"
                    value={newSoc.contactEmail}
                    onChange={(e) => setNewSoc({ ...newSoc, contactEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 7: Admin Login Credentials */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-3">
                <div className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#673AB7]" />
                  <span className="text-xs font-extrabold text-[#673AB7]">
                    Society Admin Login Credentials (Used by Society Admin to Log In)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-800 block mb-1">
                      Login Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin.emerald@society.org"
                      value={newSoc.adminLoginEmail}
                      onChange={(e) => setNewSoc({ ...newSoc, adminLoginEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-800 block mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Set strong initial password"
                        value={newSoc.adminPassword}
                        onChange={(e) => setNewSoc({ ...newSoc, adminPassword: e.target.value })}
                        className="w-full p-2.5 pr-9 rounded-xl border border-purple-200 bg-white text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 8: Dynamic Document Upload Section */}
              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#111111]">Document Upload Section</h4>
                    <p className="text-[11px] text-[#A9B0B8]">
                      Upload society registration deed, bylaws, or RERA approval (PDF, JPG, JPEG)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCreateDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1F9FC] text-[#673AB7] hover:bg-purple-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Documents</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {createDocs.map((docItem, index) => (
                    <div
                      key={docItem.id}
                      className="p-3 rounded-xl bg-gray-50/70 border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      {/* Document Title */}
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Document Title (e.g. Society Bye-laws)"
                          value={docItem.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCreateDocs((prev) =>
                              prev.map((d) => (d.id === docItem.id ? { ...d, title: val } : d))
                            );
                          }}
                          className="w-full p-2 rounded-lg border border-gray-300 bg-white text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                        />
                      </div>

                      {/* File Upload Input */}
                      <div className="sm:col-span-6 flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg border border-dashed border-purple-300 bg-white hover:bg-purple-50/50 cursor-pointer text-xs text-gray-600 truncate">
                          <span className="truncate">
                            {docItem.name ? docItem.name : 'Choose File (.pdf, .jpg, .jpeg)'}
                          </span>
                          <Upload className="w-3.5 h-3.5 text-[#673AB7] shrink-0 ml-1.5" />
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={(e) => handleFileUpload(e, docItem.id, false)}
                            className="hidden"
                          />
                        </label>

                        {docItem.fileUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                id: docItem.id,
                                title: docItem.title || 'Document',
                                name: docItem.name || 'document',
                                fileUrl: docItem.fileUrl,
                                fileType: docItem.fileType,
                                uploadedAt: new Date().toISOString(),
                              })
                            }
                            className="px-2 py-1 bg-white border border-gray-300 hover:border-[#673AB7] text-[#673AB7] rounded text-[11px] font-bold"
                          >
                            View
                          </button>
                        )}
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 text-right">
                        {createDocs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCreateDoc(docItem.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Remove document field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-[#E6F1F5] bg-[#F1F9FC]/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer shadow-md shadow-purple-900/20 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Submitting & Provisioning...' : 'Submit & Register Society'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT SOCIETY & CREDENTIALS MODAL                                       */}
      {/* ========================================================================= */}
      {showEditModal && editingSociety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-2xl w-full max-w-2xl my-8 flex flex-col overflow-hidden animate-scale-up"
          >
            <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">Edit Society Details</h3>
                  <p className="text-xs text-[#A9B0B8]">
                    Modify configuration, units, documents, or reset administrator credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#111111] block mb-1">Society Name</label>
                  <input
                    type="text"
                    required
                    value={editingSociety.societyName}
                    onChange={(e) => setEditingSociety({ ...editingSociety, societyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Society Code</label>
                  <input
                    type="text"
                    value={editingSociety.societyCode}
                    onChange={(e) => setEditingSociety({ ...editingSociety, societyCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs font-mono font-bold text-[#673AB7] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editingSociety.city}
                    onChange={(e) => setEditingSociety({ ...editingSociety, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">State</label>
                  <input
                    type="text"
                    value={editingSociety.state || ''}
                    onChange={(e) => setEditingSociety({ ...editingSociety, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Full Address</label>
                <textarea
                  rows={2}
                  value={editingSociety.address}
                  onChange={(e) => setEditingSociety({ ...editingSociety, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Total Towers</label>
                  <input
                    type="number"
                    min={1}
                    value={editingSociety.totalTowers || 1}
                    onChange={(e) => setEditingSociety({ ...editingSociety, totalTowers: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Flats / Units</label>
                  <input
                    type="number"
                    min={1}
                    value={editingSociety.totalFlats}
                    onChange={(e) => setEditingSociety({ ...editingSociety, totalFlats: parseInt(e.target.value) || 100 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Gates</label>
                  <input
                    type="number"
                    min={1}
                    value={editingSociety.totalGates}
                    onChange={(e) => setEditingSociety({ ...editingSociety, totalGates: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Subscription Plan</label>
                  <input
                    type="text"
                    value={editingSociety.subscriptionPlan}
                    onChange={(e) => setEditingSociety({ ...editingSociety, subscriptionPlan: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#111111] block mb-1">Subscription Duration</label>
                  <input
                    type="text"
                    value={editingSociety.subscriptionDuration || '1 Year'}
                    onChange={(e) => setEditingSociety({ ...editingSociety, subscriptionDuration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin Login Credentials & Password Reveal / Reset */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                <h4 className="text-xs font-extrabold text-[#673AB7] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Admin Login & Password Management
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Admin Login Email</label>
                    <input
                      type="email"
                      required
                      value={editingSociety.adminLoginEmail || editingSociety.contactEmail || ''}
                      onChange={(e) => setEditingSociety({ ...editingSociety, adminLoginEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Reset / Update Password
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        placeholder="Leave blank to keep existing"
                        value={editingSociety.adminPassword || ''}
                        onChange={(e) => setEditingSociety({ ...editingSociety, adminPassword: e.target.value })}
                        className="w-full p-2.5 pr-9 rounded-xl border border-purple-200 bg-white text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-700 cursor-pointer"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Dynamic Documents */}
              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#111111]">Society Documents</h4>
                  <button
                    type="button"
                    onClick={handleAddEditDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1F9FC] text-[#673AB7] hover:bg-purple-100 font-bold text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Document</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editDocs.map((docItem) => (
                    <div
                      key={docItem.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Document Title"
                          value={docItem.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditDocs((prev) =>
                              prev.map((d) => (d.id === docItem.id ? { ...d, title: val } : d))
                            );
                          }}
                          className="w-full p-2 rounded-lg border border-gray-300 bg-white text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-6 flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg border border-dashed border-purple-300 bg-white hover:bg-purple-50/50 cursor-pointer text-xs text-gray-600 truncate">
                          <span className="truncate">
                            {docItem.name ? docItem.name : 'Choose File (.pdf, .jpg, .jpeg)'}
                          </span>
                          <Upload className="w-3.5 h-3.5 text-[#673AB7] shrink-0 ml-1.5" />
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={(e) => handleFileUpload(e, docItem.id, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveEditDoc(docItem.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-[#E6F1F5] bg-[#F1F9FC]/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{loading ? 'Saving Changes...' : 'Save Updates'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STATUS TOGGLE MODAL (ACTIVATE / DEACTIVATE / SUSPEND)                  */}
      {/* ========================================================================= */}
      {showStatusModal && targetSocietyForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleStatusChange}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-2xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center gap-2.5 text-base font-extrabold text-[#111111]">
              {targetNextStatus === 'ACTIVE' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              )}
              <span>{targetNextStatus === 'ACTIVE' ? 'Activate Society' : 'Deactivate / Hide Society'}</span>
            </div>

            <p className="text-xs text-[#A9B0B8] leading-relaxed">
              You are toggling the status of <strong className="text-gray-900">{targetSocietyForAction.societyName}</strong> to{' '}
              <strong className="text-[#673AB7]">{targetNextStatus}</strong>. This status control does not delete records and preserves all data intact.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111111]">Reason / Administrative Note</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Enter note for the system audit trail..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-1/2 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-1/2 py-2 rounded-xl text-white text-xs font-bold cursor-pointer transition-colors ${
                  targetNextStatus === 'ACTIVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading ? 'Updating...' : `Confirm ${targetNextStatus}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DELETE SOCIETY CONFIRMATION MODAL (TASK 4)                              */}
      {/* ========================================================================= */}
      {showDeleteModal && societyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-base font-extrabold text-red-600">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span>Permanently Delete Society?</span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-gray-900">{societyToDelete.societyName}</strong> (Code: <span className="font-mono font-bold text-red-600">{societyToDelete.societyCode}</span>)?
            </p>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[11px] text-red-800">
              ⚠️ Warning: This root administrative action will remove this society and its associated checkpoints from active rosters.
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                {loading ? 'Deleting...' : 'Yes, Delete Society'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DOCUMENT PREVIEW LIGHTBOX MODAL                                        */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#E6F1F5] flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#673AB7]" />
                <span className="font-bold text-sm text-gray-900">{previewDoc.title || previewDoc.name}</span>
                <span className="text-[10px] bg-purple-100 text-purple-700 font-mono px-2 py-0.5 rounded font-bold">
                  {previewDoc.fileType?.includes('pdf') ? 'PDF Document' : 'Image'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.name || 'document'}
                    className="p-1.5 text-gray-600 hover:text-purple-700 rounded-lg hover:bg-gray-200"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[300px]">
              {previewDoc.fileUrl ? (
                previewDoc.fileType?.includes('pdf') || previewDoc.fileUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.title}
                    className="w-full h-[65vh] rounded-lg border border-gray-300 bg-white"
                  />
                ) : (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-md"
                  />
                )
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Document registered in system records.</p>
                  <p className="text-xs text-gray-400">{previewDoc.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
