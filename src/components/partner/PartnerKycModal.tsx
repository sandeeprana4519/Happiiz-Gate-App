/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building 
} from 'lucide-react';
import { ServicePartnerProfile } from '../../types/servicePartner';

interface PartnerKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ServicePartnerProfile;
}

export const PartnerKycModal: React.FC<PartnerKycModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  if (!isOpen) return null;

  const documents = [
    { name: 'Business PAN Card', number: profile.panNumber || 'ABCDE1234F', status: 'VERIFIED' },
    { name: 'GSTIN Registration', number: profile.gstNumber || '29ABCDE1234F1Z5', status: 'VERIFIED' },
    { name: 'Trade License & Address Proof', number: 'DOC-BLR-2026-4401', status: 'VERIFIED' },
    { name: 'Owner Identity Verification', number: 'Aadhaar (Masked)', status: 'VERIFIED' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-black text-[#111111]">KYC & Verification</h2>
              <p className="text-xs text-[#A9B0B8]">Super Admin Compliance Clearance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="p-5 text-center space-y-2 bg-emerald-600 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-base font-black">Official Verified Vendor</h3>
          <p className="text-xs text-emerald-100">
            {profile.businessName} has been vetted and cleared for society access by Platform Administrators.
          </p>
        </div>

        {/* Documents Ledger */}
        <div className="p-5 space-y-3 text-xs">
          <span className="text-[10px] font-bold text-[#A9B0B8] uppercase tracking-wider">
            Verified Credentials
          </span>

          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-[#111111]">{doc.name}</h4>
                  <p className="font-mono text-[10px] text-[#64748B] mt-0.5">{doc.number}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
