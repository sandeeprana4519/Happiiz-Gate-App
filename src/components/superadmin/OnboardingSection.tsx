import React, { useState } from 'react';
import { SocietyOnboardingCase, OnboardingStatus } from '../../types/admin';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Building,
  User,
  CreditCard,
  Check,
} from 'lucide-react';
import { updateOnboardingStatus } from '../../services/firebase/superadmin.service';

interface OnboardingSectionProps {
  cases: SocietyOnboardingCase[];
  onRefresh: () => void;
}

export const OnboardingSection: React.FC<OnboardingSectionProps> = ({
  cases,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<SocietyOnboardingCase | null>(null);
  const [rejectionModal, setRejectionModal] = useState<SocietyOnboardingCase | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const stepsList = [
    '1. Application',
    '2. Society Profile',
    '3. Buildings',
    '4. Flats Inventory',
    '5. Admin Assignment',
    '6. Plan Selection',
    '7. Billing Setup',
    '8. KYC & Docs',
    '9. Super Admin Review',
    '10. Activation',
  ];

  const filtered = cases.filter((c) => {
    const matchSearch =
      !searchTerm ||
      c.societyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.proposedAdminName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = async (caseItem: SocietyOnboardingCase) => {
    setActionLoading(true);
    try {
      await updateOnboardingStatus(caseItem.id, 'APPROVED', 'All statutory documents and committee credentials verified');
      onRefresh();
      if (selectedCase?.id === caseItem.id) {
        setSelectedCase(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionModal || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await updateOnboardingStatus(rejectionModal.id, 'REJECTED', rejectionReason.trim());
      setRejectionModal(null);
      setRejectionReason('');
      onRefresh();
      if (selectedCase?.id === rejectionModal.id) {
        setSelectedCase(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Society Onboarding & Verification Center
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            10-Step enterprise society review, legal document verification, and tenant provisioning workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#673AB7] bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
            {cases.filter((c) => c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTED').length} Pending Reviews
          </span>
        </div>
      </div>

      {/* 10-Step Workflow Infographic Banner */}
      <div className="bg-[#FFFFFF] border border-[#E6F1F5] rounded-2xl p-4 shadow-xs overflow-x-auto">
        <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
          Automated 10-Step Tenant Onboarding Pipeline
        </h4>
        <div className="flex items-center gap-1.5 min-w-[760px]">
          {stepsList.map((step, idx) => (
            <div key={step} className="flex-1 flex items-center gap-1.5">
              <div className="flex-1 text-center py-2 px-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[10px] font-bold text-gray-700 truncate">
                {step}
              </div>
              {idx < stepsList.length - 1 && <span className="text-gray-300 font-bold text-xs">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search society, city, admin name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F1F9FC] border border-[#E6F1F5] rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ACTIVE">Active</option>
          </select>
        </div>
      </div>

      {/* Onboarding Applications List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#E6F1F5] p-5 shadow-xs hover:border-[#673AB7]/30 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#111111]">{item.societyName}</h3>
                <p className="text-xs text-[#A9B0B8] font-medium">
                  {item.societyType} • {item.city}, {item.state}
                </p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  item.status === 'APPROVED' || item.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : item.status === 'UNDER_REVIEW'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : item.status === 'REJECTED'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {item.status.replace('_', ' ')}
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-gray-500 font-semibold">Onboarding Pipeline Stage</span>
                <span className="font-bold text-[#673AB7]">Step {item.currentStep} of 10</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#673AB7] rounded-full transition-all duration-500"
                  style={{ width: `${(item.currentStep / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-[#F1F9FC] p-3 rounded-xl border border-[#E6F1F5] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A9B0B8] block">Proposed Admin</span>
                <span className="font-bold text-gray-800 truncate block">{item.proposedAdminName}</span>
                <span className="font-mono text-gray-500 text-[11px]">{item.proposedAdminPhone}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A9B0B8] block">Selected Plan</span>
                <span className="font-bold text-[#673AB7] truncate block">{item.selectedPlanName}</span>
                <span className="text-gray-500 text-[11px]">{item.totalBuildings} Bldgs • {item.totalFlats} Flats</span>
              </div>
            </div>

            {/* Uploaded Documents Review Summary */}
            <div>
              <span className="text-[11px] font-bold text-gray-700 block mb-1.5">Submitted Verification Documents:</span>
              <div className="space-y-1">
                {item.documents.map((doc, dIdx) => (
                  <div
                    key={dIdx}
                    className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate text-gray-700 font-medium">{doc.name}</span>
                    </div>
                    {doc.verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold text-[10px]">Pending Check</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-mono">
                Submitted {new Date(item.submittedAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {item.status !== 'APPROVED' && item.status !== 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionModal(item);
                        setRejectionReason('');
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(item)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#673AB7] text-white hover:bg-[#5E35B1] transition shadow-xs cursor-pointer"
                    >
                      Approve & Provision
                    </button>
                  </>
                )}
                {(item.status === 'APPROVED' || item.status === 'ACTIVE') && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> Provisioned Live
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Reject Onboarding Application</h3>
            <p className="text-xs text-gray-500 mb-4">
              Specify reason for rejecting <strong className="text-gray-800">{rejectionModal.societyName}</strong>. The applicant will be notified to revise documentation.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete fire safety NOC, missing RWA committee registration certificate..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRejectionModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || actionLoading}
                  className="px-4 py-2 bg-red-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
