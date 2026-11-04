/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { StatusBadge, MetadataText } from '../common/Badge';
import { AccessRequest, UserRole } from '../../types/auth';
import { USER_ROLES } from '../../config/constants';
import {
  getAccessRequestsForSociety,
  getAllAccessRequests,
  reviewAccessRequest,
  updateMembershipStatus,
  updateFirestoreUserProfile,
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
          // Dev initial mock fallback
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

  const handleAction = async (request: AccessRequest, approve: boolean) => {
    setProcessingId(request.id);
    const newStatus = approve ? 'APPROVED' : 'REJECTED';

    try {
      // 1. Update accessRequest status
      await reviewAccessRequest(
        request.id,
        newStatus,
        isSuperAdmin ? 'SUPER_ADMIN' : 'SOCIETY_ADMIN',
        approve ? 'Approved by Committee' : 'Rejected after verification'
      );

      // 2. If society membership exists, update it to ACTIVE
      if (request.societyId && request.uid) {
        await updateMembershipStatus(
          request.societyId,
          request.uid,
          approve ? 'ACTIVE' : 'REJECTED',
          'SOCIETY_ADMIN'
        );
      }

      // 3. Update user accountStatus to ACTIVE if approved
      if (approve) {
        await updateFirestoreUserProfile(request.uid, {
          accountStatus: 'ACTIVE',
        });
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: newStatus } : r))
      );
    } catch (e) {
      console.error('Error reviewing request:', e);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingList = requests.filter((r) => r.status === 'PENDING');

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-500" />
            <span>Membership & Role Access Approvals</span>
          </h3>
          <p className="text-xs text-slate-400">
            Verify new resident, guard and vendor registration applications
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-sky-400">
          {pendingList.length} Pending
        </span>
      </div>

      {pendingList.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No pending access requests waiting for approval.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingList.map((req) => {
            const roleConfig = USER_ROLES[req.requestedRole];
            const isProcessing = processingId === req.id;

            return (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {req.applicantName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        roleConfig?.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {roleConfig?.label || req.requestedRole}
                    </span>
                  </div>

                  <MetadataText
                    items={[
                      `Phone: ${req.phoneNumber}`,
                      req.societyName || 'Multi-Society Platform',
                      req.requestData?.flatId
                        ? `Unit: ${req.requestData.wingId} ${req.requestData.flatId} (${req.requestData.occupantType || 'Resident'})`
                        : req.requestData?.employmentId
                        ? `Badge: ${req.requestData.employmentId}`
                        : req.requestData?.businessName || 'Access Request',
                    ]}
                  />

                  {req.requestData?.additionalNotes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                      Notes: "{req.requestData.additionalNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-500 hover:bg-rose-950/20"
                    loading={isProcessing}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                    onClick={() => handleAction(req, false)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    loading={isProcessing}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => handleAction(req, true)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
