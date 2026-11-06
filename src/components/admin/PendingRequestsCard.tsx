/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { AccessRequest, UserRole } from '../../types/auth';
import { USER_ROLES } from '../../config/constants';
import {
  getAccessRequestsForSociety,
  getAllAccessRequests,
  reviewAccessRequest,
  updateMembershipStatus,
  updateFirestoreUserProfile,
  approveSocietyOnboarding,
  rejectSocietyOnboarding,
  approveServicePartner,
  rejectServicePartner,
} from '../../services/firebase/firestore.service';
import { MOCK_ACCESS_REQUESTS } from '../../services/mock/mockData';
import {
  UserCheck,
  Check,
  X,
  Clock,
  Shield,
  Building,
  User,
  Inbox,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface PendingRequestsCardProps {
  societyId?: string; // If provided, filter for society admin
  isSuperAdmin?: boolean; // If true, show all requests
}

export const PendingRequestsCard: React.FC<PendingRequestsCardProps> = ({
  societyId,
  isSuperAdmin = false,
}) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [rejectModalReq, setRejectModalReq] = useState<AccessRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        let list: AccessRequest[] = [];
        if (isSuperAdmin) {
          list = await getAllAccessRequests();
        } else if (societyId) {
          list = await getAccessRequestsForSociety(societyId);
        }

        if (list.length === 0) {
          list = isSuperAdmin
            ? MOCK_ACCESS_REQUESTS
            : MOCK_ACCESS_REQUESTS.filter((r) => r.societyId === societyId || !societyId);
        }

        setRequests(list);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [societyId, isSuperAdmin]);

  const handleApprove = async (request: AccessRequest) => {
    setProcessingId(request.id);
    try {
      if (request.requestedRole === 'SOCIETY_ADMIN') {
        // Super Admin Society Approval
        await approveSocietyOnboarding(request.id, request.societyId || `soc_${Date.now()}`, request.uid);
      } else if (request.requestedRole === 'SERVICE_PARTNER') {
        // Super Admin Partner Approval
        await approveServicePartner(request.id, request.uid);
      } else {
        // Society Admin Resident or Guard Approval
        await reviewAccessRequest(
          request.id,
          'APPROVED',
          isSuperAdmin ? 'SUPER_ADMIN' : 'SOCIETY_ADMIN',
          'Approved by Committee'
        );

        if (request.societyId && request.uid) {
          await updateMembershipStatus(
            request.societyId,
            request.uid,
            'ACTIVE',
            isSuperAdmin ? 'SUPER_ADMIN' : 'SOCIETY_ADMIN'
          );
        }

        await updateFirestoreUserProfile(request.uid, {
          accountStatus: 'ACTIVE',
        });
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: 'APPROVED' as const } : r))
      );
    } catch (e) {
      console.error('Error approving request:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    const req = rejectModalReq;
    const reason = rejectReason.trim() || 'Declined during committee verification';
    setProcessingId(req.id);

    try {
      if (req.requestedRole === 'SOCIETY_ADMIN') {
        await rejectSocietyOnboarding(req.id, req.societyId || '', req.uid, reason);
      } else if (req.requestedRole === 'SERVICE_PARTNER') {
        await rejectServicePartner(req.id, req.uid, reason);
      } else {
        await reviewAccessRequest(
          req.id,
          'REJECTED',
          isSuperAdmin ? 'SUPER_ADMIN' : 'SOCIETY_ADMIN',
          reason
        );

        if (req.societyId && req.uid) {
          await updateMembershipStatus(
            req.societyId,
            req.uid,
            'REJECTED',
            isSuperAdmin ? 'SUPER_ADMIN' : 'SOCIETY_ADMIN',
            reason
          );
        }

        await updateFirestoreUserProfile(req.uid, {
          accountStatus: 'REJECTED',
          rejectionReason: reason,
        });
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'REJECTED' as const } : r))
      );
      setRejectModalReq(null);
      setRejectReason('');
    } catch (e) {
      console.error('Error rejecting request:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingList = requests.filter(
    (r) =>
      r.status === 'PENDING' &&
      (roleFilter === 'ALL' || r.requestedRole === roleFilter)
  );

  const historyList = requests.filter(
    (r) =>
      r.status !== 'PENDING' &&
      (roleFilter === 'ALL' || r.requestedRole === roleFilter)
  );

  return (
    <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6F1F5] pb-4">
        <div>
          <h3 className="font-bold text-base text-[#111111] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#673AB7]" />
            <span>Registration & Access Requests</span>
          </h3>
          <p className="text-xs text-[#A9B0B8] mt-0.5">
            {isSuperAdmin
              ? 'Review platform society onboarding & vendor partner KYC applications'
              : 'Review resident and security guard registration requests for your society'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-white text-[#673AB7] shadow-xs'
                  : 'text-[#A9B0B8] hover:text-[#111111]'
              }`}
            >
              Pending ({pendingList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-white text-[#673AB7] shadow-xs'
                  : 'text-[#A9B0B8] hover:text-[#111111]'
              }`}
            >
              History ({historyList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Role Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-[#A9B0B8] font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {['ALL', 'RESIDENT', 'SECURITY_GUARD', 'SOCIETY_ADMIN', 'SERVICE_PARTNER'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoleFilter(r)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
              roleFilter === r
                ? 'bg-[#673AB7] text-white font-semibold'
                : 'bg-[#F1F9FC] text-[#111111] hover:bg-[#E6F1F5]'
            }`}
          >
            {r === 'ALL' ? 'All Roles' : USER_ROLES[r as UserRole]?.label || r}
          </button>
        ))}
      </div>

      {/* Content Display */}
      {activeTab === 'PENDING' ? (
        pendingList.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#F1F9FC] text-[#673AB7] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#A9B0B8]">
              No pending registrations awaiting review in this view.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((req) => {
              const roleConfig = USER_ROLES[req.requestedRole];
              const isProcessing = processingId === req.id;

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#111111] text-sm">
                        {req.applicantName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#673AB7] border border-[#E6F1F5]">
                        {roleConfig?.label || req.requestedRole}
                      </span>
                      <span className="text-[10px] text-[#A9B0B8]">
                        ID: {req.id}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#A9B0B8] flex items-center gap-3 flex-wrap">
                      <span>📱 {req.phoneNumber}</span>
                      {req.societyName && <span>🏢 {req.societyName}</span>}
                      {req.requestData?.flatId && (
                        <span className="font-semibold text-[#111111]">
                          Unit: {req.requestData.wingId} · {req.requestData.flatId} ({req.requestData.occupantType || 'Resident'})
                        </span>
                      )}
                      {req.requestData?.employmentId && (
                        <span className="font-semibold text-[#111111]">
                          Badge: {req.requestData.employmentId} · {req.requestData.gateAssigned}
                        </span>
                      )}
                      {req.requestData?.businessName && (
                        <span className="font-semibold text-[#111111]">
                          Vendor: {req.requestData.businessName}
                        </span>
                      )}
                    </div>

                    {req.requestData?.additionalNotes && (
                      <p className="text-[11px] text-[#111111] italic pt-1">
                        "{req.requestData.additionalNotes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#E53945] border-red-200 hover:bg-red-50"
                      disabled={isProcessing}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                      onClick={() => setRejectModalReq(req)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      loading={isProcessing}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleApprove(req)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* HISTORY TAB */
        historyList.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A9B0B8]">
            No reviewed access requests recorded.
          </div>
        ) : (
          <div className="space-y-2.5">
            {historyList.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-white border border-[#E6F1F5] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111]">{req.applicantName}</span>
                    <span className="text-[10px] text-[#A9B0B8]">({USER_ROLES[req.requestedRole]?.label})</span>
                  </div>
                  <span className="text-[11px] text-[#A9B0B8] block">{req.phoneNumber} · {req.societyName || 'Platform'}</span>
                  {req.reviewNotes && (
                    <span className="text-[10px] text-[#A9B0B8] italic block">Notes: {req.reviewNotes}</span>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reject Reason Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-[#E6F1F5] shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#E53945]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm text-[#111111]">
                Decline Access Request
              </h4>
            </div>

            <p className="text-xs text-[#A9B0B8]">
              Decline registration for <strong className="text-[#111111]">{rejectModalReq.applicantName}</strong>.
              Enter a clear reason so the user knows how to resolve the issue.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Unit registry record mismatch; please present copy of possession certificate to estate office."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-xl p-2.5 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRejectModalReq(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-[#E53945] hover:bg-red-700 text-white"
                loading={processingId === rejectModalReq.id}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
