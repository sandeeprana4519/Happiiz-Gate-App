/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ServicePartnerProfile } from '../../types/auth';
import { reviewPartnerKyc } from '../../services/firebase/superadmin.service';
import {
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Eye,
  Lock,
  Unlock,
  Building,
  Phone,
  MapPin,
  X,
  FileText,
} from 'lucide-react';

interface ServicePartnersSectionProps {
  partners: ServicePartnerProfile[];
  onRefresh: () => Promise<void>;
}

export const ServicePartnersSection: React.FC<ServicePartnersSectionProps> = ({
  partners,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<ServicePartnerProfile | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
  ];

  const filtered = partners.filter((p) => {
    const matchesSearch =
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactNumber.includes(searchTerm) ||
      p.businessAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat =
      !selectedCategoryFilter ||
      selectedCategoryFilter === 'All Categories' ||
      p.serviceCategories.includes(selectedCategoryFilter);

    return matchesSearch && matchesCat;
  });

  const handleKycDecision = async (status: 'ACTIVE' | 'REJECTED', reason: string) => {
    if (!selectedPartner) return;
    setLoading(true);
    try {
      await reviewPartnerKyc(selectedPartner.uid, status, reason);
      setShowKycModal(false);
      setSelectedPartner(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Service Partner & Daily Help Directory</h2>
          <p className="text-xs text-[#A9B0B8]">
            Multi-society commercial contractor compliance, trade licenses, and KYC approval
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#673AB7] bg-[#F1F9FC] px-3 py-1 rounded-xl border border-[#E6F1F5] self-start sm:self-auto">
          {filtered.length} Registered Agencies
        </span>
      </div>

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor name, mobile, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="w-full md:w-64 p-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.uid}
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#673AB7]/30 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-[#111111] truncate">{p.businessName}</h3>
                  <div className="text-[11px] text-[#A9B0B8] font-mono mt-0.5">UID: {p.uid}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    p.verificationStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : p.verificationStatus === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {p.verificationStatus === 'ACTIVE' ? 'KYC Verified' : p.verificationStatus}
                </span>
              </div>

              {/* Categories Chips */}
              <div className="flex flex-wrap gap-1.5">
                {p.serviceCategories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-md bg-[#F1F9FC] text-[10px] font-bold text-[#673AB7] border border-[#E6F1F5]"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Details Box */}
              <div className="p-3 rounded-xl bg-[#F1F9FC]/60 border border-[#E6F1F5] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="text-[#A9B0B8]">Phone:</span>
                  <span className="font-mono font-bold">{p.contactNumber}</span>
                </div>
                <div className="flex items-start justify-between gap-2 text-[#A9B0B8] text-[11px]">
                  <span>Areas:</span>
                  <span className="text-[#111111] font-mono truncate">{p.serviceAreas.join(', ')}</span>
                </div>
                <div className="text-[11px] text-[#A9B0B8] truncate pt-1 border-t border-[#E6F1F5]">
                  {p.businessAddress}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#E6F1F5] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPartner(p);
                  setShowKycModal(true);
                }}
                className="flex-1 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review KYC Dossier</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* KYC Review Modal */}
      {showKycModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#673AB7]" />
                <h3 className="text-sm font-extrabold text-[#111111]">
                  KYC Verification: {selectedPartner.businessName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKycModal(false)}
                className="p-1 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#A9B0B8]">Verified Contact:</span>
                  <span className="font-bold font-mono text-[#111111]">{selectedPartner.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9B0B8]">Service Domains:</span>
                  <span className="font-bold text-[#673AB7]">{selectedPartner.serviceCategories.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A9B0B8]">Operational Pincodes:</span>
                  <span className="font-mono text-[#111111]">{selectedPartner.serviceAreas.join(', ')}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E6F1F5] space-y-2">
                <span className="font-bold text-[#111111] block">KYC Supporting Documentation:</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-[#111111]">1. Commercial Trade License / GSTIN Record</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Uploaded & Checked</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-[#111111]">2. Police Verification Certificates for Technicians</span>
                    <span className="text-[10px] text-emerald-600 font-bold">On File</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#E6F1F5]">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleKycDecision('REJECTED', 'Missing updated police verification certificates')}
                className="w-1/2 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer"
              >
                Reject KYC
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleKycDecision('ACTIVE', 'Verified trade certificate and clean contractor background')}
                className="w-1/2 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Approve & Activate KYC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
