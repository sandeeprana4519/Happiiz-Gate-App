/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AccessRequest } from '../../types/auth';
import {
  approveSocietyApplication,
  rejectSocietyApplication,
} from '../../services/firebase/superadmin.service';
import {
  FileCheck2,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Eye,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';

interface ApprovalsSectionProps {
  applications: AccessRequest[];
  onRefresh: () => Promise<void>;
}

export const ApprovalsSection: React.FC<ApprovalsSectionProps> = ({
  applications,
  onRefresh,
}) => {
  const [selectedApp, setSelectedApp] = useState<AccessRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const historyApps = applications.filter((a) => a.status !== 'PENDING');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const handleApprove = async (app: AccessRequest) => {
    setLoading(true);
    setActionSuccess(null);
    try {
      await approveSocietyApplication(app.id, 'Verified registration certificate and designated committee bylaws.');
      setActionSuccess(`Society "${app.requestData?.societyName || app.societyName}" successfully approved and provisioned!`);
      setSelectedApp(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !rejectReason) return;
    setLoading(true);
    try {
      await rejectSocietyApplication(selectedApp.id, rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedApp(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">
            Society Registration Onboarding Queue
          </h2>
          <p className="text-xs text-[#A9B0B8]">
            Review new gated community onboarding applications and designate verified Society Admins
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'text-[#111111] hover:text-[#673AB7]'
            }`}
          >
            Pending Review ({pendingApps.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'text-[#111111] hover:text-[#673AB7]'
            }`}
          >
            Decision History ({historyApps.length})
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Applications Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(activeTab === 'PENDING' ? pendingApps : historyApps).map((app) => (
          <div
            key={app.id}
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#673AB7]/30 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-[#111111] line-clamp-1">
                    {app.requestData?.societyName || app.societyName || 'New Gated Community'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#A9B0B8] mt-0.5">
                    <MapPin className="w-3 h-3 text-[#673AB7]" />
                    <span>{app.requestData?.societyCity || 'Bengaluru'}, {app.requestData?.societyAddress || 'Metro'}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    app.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : app.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {app.status}
                </span>
              </div>

              {/* Applicant Info */}
              <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#111111] font-semibold">
                  <span>Applicant Admin:</span>
                  <span className="font-bold">{app.applicantName}</span>
                </div>
                <div className="flex items-center justify-between text-[#A9B0B8]">
                  <span>Mobile:</span>
                  <span className="font-mono text-[#111111]">{app.phoneNumber}</span>
                </div>
                {app.email && (
                  <div className="flex items-center justify-between text-[#A9B0B8]">
                    <span>Email:</span>
                    <span className="text-[#111111] truncate max-w-[150px]">{app.email}</span>
                  </div>
                )}
              </div>

              {/* Application Details */}
              {app.requestData?.additionalNotes && (
                <p className="text-xs text-[#A9B0B8] line-clamp-2 bg-slate-50 p-2 rounded-lg italic">
                  "{app.requestData.additionalNotes}"
                </p>
              )}

              <div className="text-[11px] text-[#A9B0B8] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            {app.status === 'PENDING' ? (
              <div className="pt-2 border-t border-[#E6F1F5] flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleApprove(app)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Provision</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApp(app);
                    setShowRejectModal(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#E6F1F5] text-[11px] text-[#A9B0B8]">
                <span>Reviewed: {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : 'Recorded'}</span>
                {app.reviewNotes && <p className="text-xs font-medium text-[#111111] mt-0.5">Note: {app.reviewNotes}</p>}
              </div>
            )}
          </div>
        ))}

        {(activeTab === 'PENDING' ? pendingApps : historyApps).length === 0 && (
          <div className="col-span-full p-8 rounded-2xl bg-white border border-[#E6F1F5] text-center space-y-2">
            <FileCheck2 className="w-10 h-10 text-[#A9B0B8] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[#111111]">
              {activeTab === 'PENDING' ? 'No pending society applications' : 'No decision history recorded yet'}
            </h4>
            <p className="text-xs text-[#A9B0B8]">All incoming gated community onboarding requests are up to date.</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <form
            onSubmit={handleReject}
            className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#111111]">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Reject Society Application</span>
            </div>

            <p className="text-xs text-[#A9B0B8] leading-relaxed">
              Please specify the regulatory, documentation, or committee verification deficiency for{' '}
              <strong className="text-[#111111]">
                {selectedApp.requestData?.societyName || selectedApp.societyName}
              </strong>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111111]">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Society registration certificate number could not be validated with Registrar of Societies."
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-1/2 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
