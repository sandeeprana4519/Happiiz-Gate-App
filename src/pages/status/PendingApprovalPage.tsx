/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { USER_ROLES } from '../../config/constants';
import {
  getUserActiveAccessRequest,
  simulateInstantApproval,
  getFirestoreUserProfile,
} from '../../services/firebase/firestore.service';
import { AccessRequest } from '../../types/auth';
import {
  Clock,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Building,
  User,
  Phone,
  CheckCircle,
  Zap,
} from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  const { user, memberships, refreshUserProfile, logout, loginWithDemoRole } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [activeRequest, setActiveRequest] = useState<AccessRequest | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    async function loadRequest() {
      if (user?.uid) {
        const req = await getUserActiveAccessRequest(user.uid);
        setActiveRequest(req);
      }
    }
    loadRequest();
  }, [user?.uid]);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshUserProfile();
      if (user?.uid) {
        const req = await getUserActiveAccessRequest(user.uid);
        setActiveRequest(req);

        // Check if user or request was approved
        const profile = await getFirestoreUserProfile(user.uid);
        if (profile?.accountStatus === 'ACTIVE' || req?.status === 'APPROVED') {
          const role = profile?.primaryRole || activeRequest?.requestedRole || 'RESIDENT';
          navigate(USER_ROLES[role]?.defaultPath || '/dashboard/resident', { replace: true });
          return;
        }
      }
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  const handleSimulateApproval = async () => {
    if (!user?.uid) return;
    setSimulating(true);
    try {
      await simulateInstantApproval(user.uid);
      await refreshUserProfile();
      const role = user.primaryRole || activeRequest?.requestedRole || 'RESIDENT';
      loginWithDemoRole(role);
      navigate(USER_ROLES[role]?.defaultPath || '/dashboard/resident', { replace: true });
    } finally {
      setSimulating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const pendingMembership = memberships.find((m) => m.membershipStatus === 'PENDING') || memberships[0];

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-lg mx-auto w-full px-2">
      <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6 text-center">
        {/* Animated Status Icon */}
        <div className="relative inline-block mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#673AB7] flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            Registration Under Review
          </h1>
          <p className="text-xs sm:text-sm text-[#A9B0B8] max-w-sm mx-auto">
            Your access application has been submitted and is waiting for committee approval.
          </p>
        </div>

        {/* Application Summary Box */}
        <div className="p-4 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-left space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
            <span className="text-[#A9B0B8] font-medium">Applicant Name</span>
            <span className="font-bold text-[#111111]">
              {user?.fullName || activeRequest?.applicantName || 'Registered User'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
            <span className="text-[#A9B0B8] font-medium">Verified Phone</span>
            <span className="font-mono text-[#111111]">
              {user?.phoneNumber || activeRequest?.phoneNumber || '+91'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
            <span className="text-[#A9B0B8] font-medium">Requested Role</span>
            <span className="font-bold text-[#673AB7]">
              {USER_ROLES[user?.primaryRole || activeRequest?.requestedRole || 'RESIDENT']?.label || 'Resident'}
            </span>
          </div>

          {(activeRequest?.societyName || pendingMembership?.societyName) && (
            <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
              <span className="text-[#A9B0B8] font-medium">Target Society</span>
              <span className="font-bold text-[#111111] text-right truncate max-w-[200px]">
                {activeRequest?.societyName || pendingMembership?.societyName}
              </span>
            </div>
          )}

          {activeRequest?.requestData?.flatId && (
            <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
              <span className="text-[#A9B0B8] font-medium">Flat / Unit</span>
              <span className="font-mono font-bold text-[#111111]">
                {activeRequest.requestData.wingId} · {activeRequest.requestData.flatId}
              </span>
            </div>
          )}

          {activeRequest?.requestData?.employmentId && (
            <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
              <span className="text-[#A9B0B8] font-medium">Guard Badge ID</span>
              <span className="font-mono font-bold text-[#111111]">
                {activeRequest.requestData.employmentId}
              </span>
            </div>
          )}

          <div className="pt-2 text-[11px] text-[#A9B0B8] leading-relaxed">
            Status:{' '}
            <span className="text-amber-600 font-semibold uppercase tracking-wider">
              Pending Admin Verification
            </span>
            . Modules will activate immediately upon committee or super admin approval.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            loading={checking}
            onClick={handleRefresh}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Check / Refresh Approval Status
          </Button>

          {/* Quick Simulation Fast-Track Button */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#673AB7] font-semibold">
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Testing & Evaluation Mode
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Fast-Track</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateApproval}
              disabled={simulating}
              className="w-full py-2 px-3 rounded-lg bg-[#673AB7] text-white font-semibold text-xs hover:bg-[#5E35B1] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Simulate Admin Approval & Enter Dashboard</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="md"
            className="w-full text-[#A9B0B8] hover:text-[#111111]"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out of Account
          </Button>
        </div>
      </div>
    </div>
  );
};
