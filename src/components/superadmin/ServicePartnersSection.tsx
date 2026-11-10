/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ServicePartnerProfile } from '../../types/auth';
import { Society } from '../../types/society';
import {
  approvePartnerApplication,
  rejectPartnerApplication,
  reviewPartnerKyc,
  getAllSocieties,
} from '../../services/firebase/superadmin.service';
import { marketplaceService } from '../../services/firebase/marketplace.service';
import { PartnerOnboardingModal } from '../partner/PartnerOnboardingModal';
import {
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Eye,
  Lock,
  Unlock,
  Building2,
  Phone,
  Mail,
  MapPin,
  X,
  FileText,
  Plus,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  AlertTriangle,
  UserCheck,
  Check,
  Download,
  Filter,
} from 'lucide-react';

interface ServicePartnersSectionProps {
  partners: ServicePartnerProfile[];
  onRefresh: () => Promise<void>;
  societies?: Society[];
}

export const ServicePartnersSection: React.FC<ServicePartnersSectionProps> = ({
  partners,
  onRefresh,
  societies: propSocieties,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('ALL');

  // Modals
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [reviewPartner, setReviewPartner] = useState<ServicePartnerProfile | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Missing or incomplete KYC documents');
  const [loading, setLoading] = useState(false);

  // Societies for mapping dropdown
  const [societies, setSocieties] = useState<Society[]>(propSocieties || []);

  useEffect(() => {
    if (!propSocieties || propSocieties.length === 0) {
      getAllSocieties().then(setSocieties);
    }
  }, [propSocieties]);

  // Categories
  const categories = [
    'All Categories',
    'Electrician',
    'Plumber',
    'Carpenter',
    'AC Repair & HVAC',
    'Housekeeping',
    'Pest Control',
    'Appliance Repair',
    'Painting',
    'Deep Cleaning',
    'Security Services',
    'Elevator Maintenance',
    'General Maintenance',
  ];

  // Tab counts
  const pendingCount = partners.filter(
    (p) => p.verificationStatus === 'PENDING' || p.status === 'pending'
  ).length;
  const activeCount = partners.filter(
    (p) => p.verificationStatus === 'ACTIVE' || p.status === 'active'
  ).length;
  const rejectedCount = partners.filter(
    (p) =>
      p.verificationStatus === 'REJECTED' ||
      p.verificationStatus === 'SUSPENDED' ||
      p.status === 'rejected' ||
      p.status === 'suspended'
  ).length;

  // Filtered Partners
  const filtered = partners.filter((p) => {
    const matchesSearch =
      (p.businessName || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contactNumber || p.phone || '').includes(searchTerm) ||
      (p.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.assignedSocietyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.businessAddress || p.address || '').toLowerCase().includes(searchTerm.toLowerCase());

    const domains = p.serviceDomain || p.serviceCategories || [];
    const matchesCat =
      !selectedCategoryFilter ||
      selectedCategoryFilter === 'All Categories' ||
      domains.includes(selectedCategoryFilter);

    const isPending = p.verificationStatus === 'PENDING' || p.status === 'pending';
    const isActive = p.verificationStatus === 'ACTIVE' || p.status === 'active';
    const isRejectedOrSuspended =
      p.verificationStatus === 'REJECTED' ||
      p.verificationStatus === 'SUSPENDED' ||
      p.status === 'rejected' ||
      p.status === 'suspended';

    const matchesStatus =
      statusTab === 'ALL' ||
      (statusTab === 'PENDING' && isPending) ||
      (statusTab === 'ACTIVE' && isActive) ||
      (statusTab === 'REJECTED' && isRejectedOrSuspended);

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Handle Approve
  const handleApprove = async (partnerUid: string) => {
    setLoading(true);
    try {
      await approvePartnerApplication(partnerUid);
      setReviewPartner(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async () => {
    if (!reviewPartner) return;
    setLoading(true);
    try {
      await rejectPartnerApplication(reviewPartner.uid, rejectionReason);
      setShowRejectModal(false);
      setReviewPartner(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Suspend / Active
  const handleToggleStatus = async (partner: ServicePartnerProfile) => {
    const current = partner.verificationStatus;
    const targetStatus = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setLoading(true);
    try {
      await reviewPartnerKyc(
        partner.uid,
        targetStatus,
        targetStatus === 'SUSPENDED' ? 'Suspended by Super Admin' : 'Re-activated by Super Admin'
      );
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Service Partner & Vendor Verification Center
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Commercial contractor compliance, trade licenses, police verification, and multi-society KYC approval
          </p>
        </div>

        {/* 1A. ADD SERVICE PARTNER BUTTON */}
        <button
          type="button"
          onClick={() => setShowAddPartnerModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Partner</span>
        </button>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F1F9FC] p-1 rounded-xl border border-[#E6F1F5] w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusTab === 'ALL'
                ? 'bg-white text-[#673AB7] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Partners ({partners.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'PENDING'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Pending Verification</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusTab === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>Approved / Active</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusTab === 'REJECTED'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Suspended / Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search partner, phone, society..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-900 focus:bg-white focus:border-[#673AB7] focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. PARTNERS DIRECTORY TABLE */}
      <div className="rounded-2xl bg-white border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC] text-[#555555] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-[25%]">Partner Name & Contact</th>
                <th className="py-3 px-3 w-[20%]">Service Domain</th>
                <th className="py-3 px-3 w-[22%]">Assigned Society / Area</th>
                <th className="py-3 px-3 w-[13%]">Registration Source</th>
                <th className="py-3 px-3 w-[10%] text-center">Status</th>
                <th className="py-3 px-3 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No service partners found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((partner) => {
                  const domains = partner.serviceDomain || partner.serviceCategories || ['General Services'];
                  const source =
                    partner.onboardedBy === 'society_admin'
                      ? 'Added by Society Admin'
                      : partner.onboardedBy === 'self'
                      ? 'Self-Registered'
                      : 'Super Admin';

                  const isPending =
                    partner.verificationStatus === 'PENDING' || partner.status === 'pending';
                  const isActive =
                    partner.verificationStatus === 'ACTIVE' || partner.status === 'active';
                  const isSuspended =
                    partner.verificationStatus === 'SUSPENDED' || partner.status === 'suspended';

                  return (
                    <tr key={partner.uid} className="hover:bg-[#F9FCFD] transition-colors">
                      {/* 1. Partner Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-xs truncate">
                              {partner.name || partner.businessName}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                              {partner.contactNumber || partner.phone} • {partner.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Service Domain */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {domains.slice(0, 2).map((dom) => (
                            <span
                              key={dom}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#673AB7] border border-purple-100"
                            >
                              {dom}
                            </span>
                          ))}
                          {domains.length > 2 && (
                            <span className="text-[10px] text-gray-400 font-semibold self-center">
                              +{domains.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Assigned Society / Area */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-gray-800 text-xs flex items-center gap-1 truncate">
                          <Building2 className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
                          <span className="truncate">
                            {partner.assignedSocietyName || 'All Registered Societies'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 truncate pl-4.5">
                          Zone: {partner.serviceArea || (partner.serviceAreas && partner.serviceAreas[0]) || 'Locality'}
                        </div>
                      </td>

                      {/* 4. Registration Source */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            partner.onboardedBy === 'society_admin'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : partner.onboardedBy === 'self'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          {source}
                        </span>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-500'
                                : isPending
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                          <span>
                            {isActive
                              ? 'ACTIVE'
                              : isPending
                              ? 'PENDING'
                              : isSuspended
                              ? 'SUSPENDED'
                              : 'REJECTED'}
                          </span>
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {/* Review Application Modal Button */}
                          <button
                            type="button"
                            onClick={() => setReviewPartner(partner)}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#673AB7] transition cursor-pointer shadow-2xs"
                            title="Review Application & KYC Docs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Approve (if Pending) */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleApprove(partner.uid)}
                              disabled={loading}
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer shadow-2xs"
                              title="Approve & Activate"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Suspend / Unsuspend */}
                          {!isPending && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(partner)}
                              disabled={loading}
                              className={`p-1.5 rounded-lg border transition cursor-pointer shadow-2xs ${
                                isActive
                                  ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'
                                  : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'Suspend Partner' : 'Reactivate Partner'}
                            >
                              {isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* 3B. "REVIEW APPLICATION" ACTION MODAL */}
      {/* ========================================================================= */}
      {reviewPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl my-6 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Review Service Partner Application
                  </h3>
                  <p className="text-xs text-gray-500">
                    {reviewPartner.name || reviewPartner.businessName} • UID: {reviewPartner.uid}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => marketplaceService.exportPartnerDossierPdf(reviewPartner)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#673AB7] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Partner Application (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewPartner(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Application Detail Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Partner Overview Banner */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-sm text-gray-900">
                    {reviewPartner.name || reviewPartner.businessName}
                  </div>
                  <div className="text-gray-600 mt-0.5">
                    Phone: <strong className="text-gray-900 font-mono">{reviewPartner.contactNumber || reviewPartner.phone}</strong> • Email: <strong className="text-gray-900">{reviewPartner.email}</strong>
                  </div>
                  <div className="text-gray-500 mt-0.5">
                    Address: {reviewPartner.businessAddress || reviewPartner.address || 'Locality'}
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      reviewPartner.verificationStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : reviewPartner.verificationStatus === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Status: {reviewPartner.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Society & Domain Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Assigned Community & Area
                  </span>
                  <div className="font-bold text-gray-900 text-xs">
                    {reviewPartner.assignedSocietyName || 'All Registered Societies'}
                  </div>
                  <div className="text-gray-500">
                    Locality: {reviewPartner.serviceArea || (reviewPartner.serviceAreas && reviewPartner.serviceAreas[0]) || 'General Zone'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Trade Domains & Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(reviewPartner.serviceDomain || reviewPartner.serviceCategories || ['General Services']).map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#673AB7]">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* KYC & Identity Proof Verification */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Identity Proof & Tax Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block">
                      {reviewPartner.documents?.nationalIdType || 'National ID'}
                    </span>
                    <strong className="text-gray-900 font-mono">
                      {reviewPartner.documents?.nationalIdNumber || 'XXXX-XXXX-9812'}
                    </strong>
                    <div className="pt-1">
                      <a
                        href={reviewPartner.documents?.nationalIdUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        <FileText className="w-3 h-3" /> Preview ID Document
                      </a>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block">PAN Card</span>
                    <strong className="text-gray-900 font-mono uppercase">
                      {reviewPartner.documents?.panNumber || 'ABCDE1234F'}
                    </strong>
                    <div className="pt-1">
                      <a
                        href={reviewPartner.documents?.panUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        <FileText className="w-3 h-3" /> Preview PAN Card
                      </a>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold block">Driving License</span>
                    <strong className="text-gray-900 font-mono">
                      {reviewPartner.documents?.dlNumber || 'Verified on file'}
                    </strong>
                    <div className="pt-1">
                      <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> DL Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details & Police Clearance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Details */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    Settlement Bank Account
                  </span>
                  <div className="text-gray-700 space-y-1">
                    <div>Bank: <strong className="text-gray-900">{reviewPartner.documents?.bankDetails?.bankName || 'HDFC Bank'}</strong></div>
                    <div>A/C Holder: <strong className="text-gray-900">{reviewPartner.documents?.bankDetails?.accountHolderName || reviewPartner.name}</strong></div>
                    <div>A/C Number: <strong className="text-gray-900 font-mono">{reviewPartner.documents?.bankDetails?.accNo || '918802991002'}</strong></div>
                    <div>IFSC: <strong className="text-gray-900 font-mono uppercase">{reviewPartner.documents?.bankDetails?.ifsc || 'HDFC0001234'}</strong></div>
                  </div>
                  <div className="pt-1">
                    <a
                      href={reviewPartner.documents?.bankDetails?.passbookUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <CreditCard className="w-3 h-3" /> View Passbook / Cancelled Cheque
                    </a>
                  </div>
                </div>

                {/* Police Clearance */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                      Police Background Clearance
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                      CLEARED
                    </span>
                  </div>
                  <div className="text-emerald-900 space-y-1">
                    <div>Certificate Date: <strong>{reviewPartner.documents?.policeVerificationDate || '2026-10-15'}</strong></div>
                    <div>Police Status: <strong className="text-emerald-700">Verified & Approved</strong></div>
                  </div>
                  <div className="pt-1">
                    <a
                      href={reviewPartner.documents?.policeVerificationUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> View Police Clearance Certificate
                    </a>
                  </div>
                </div>
              </div>

              {/* Service Agreements */}
              {reviewPartner.documents?.agreementUrls && reviewPartner.documents.agreementUrls.length > 0 && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    Signed Master Service Agreements ({reviewPartner.documents.agreementUrls.length})
                  </span>
                  <div className="space-y-1">
                    {reviewPartner.documents.agreementUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                        <span>Commercial Master Service Agreement #{idx + 1}</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#673AB7] hover:underline inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Download Document
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewPartner(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => marketplaceService.exportPartnerDossierPdf(reviewPartner)}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#673AB7] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Application (PDF)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Reject / Request Resubmission */}
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Reject / Request Resubmission</span>
                </button>

                {/* Approve Partner */}
                <button
                  type="button"
                  onClick={() => handleApprove(reviewPartner.uid)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Activate Partner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3C. REJECTION REASON MODAL */}
      {/* ========================================================================= */}
      {showRejectModal && reviewPartner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">
                Reject Partner Application
              </h3>
              <p className="text-xs text-gray-500">
                Specify the verification rejection or resubmission reason for <strong className="text-gray-900">{reviewPartner.name || reviewPartner.businessName}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 block">Rejection Reason</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-red-500 focus:outline-none"
              >
                <option value="Blurry or unreadable National ID proof">Blurry or unreadable National ID proof</option>
                <option value="Police verification expired or invalid">Police verification expired or invalid</option>
                <option value="Bank account details mismatch with applicant name">Bank account details mismatch with applicant name</option>
                <option value="PAN Card document missing or illegible">PAN Card document missing or illegible</option>
                <option value="Trade license or certification not provided">Trade license or certification not provided</option>
                <option value="Outside approved society operational coverage">Outside approved society operational coverage</option>
              </select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-1/2 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={loading}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1A. PARTNER ONBOARDING MODAL (SUPER ADMIN) */}
      {/* ========================================================================= */}
      <PartnerOnboardingModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onSuccess={onRefresh}
        onboardedBy="super_admin"
        societies={societies}
      />
    </div>
  );
};
