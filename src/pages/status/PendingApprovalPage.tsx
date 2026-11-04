/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SecurityShield3D } from '../../components/visuals/SecurityShield3D';
import { USER_ROLES } from '../../config/constants';
import {
  Clock,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Building,
  User,
  Phone,
} from 'lucide-react';

export const PendingApprovalPage: React.FC = () => {
  const { user, memberships, refreshUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshUserProfile();
      // If refreshed user has active membership or active status, check again
      const current = user;
      if (current?.accountStatus === 'ACTIVE') {
        const activeMem = memberships.find((m) => m.membershipStatus === 'ACTIVE');
        if (activeMem) {
          navigate(USER_ROLES[activeMem.role]?.defaultPath || '/dashboard/resident');
          return;
        }
      }
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const pendingMembership = memberships.find((m) => m.membershipStatus === 'PENDING') || memberships[0];

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-lg mx-auto w-full px-2">
      <GlassCard elevated className="w-full border-amber-500/30 p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        <div className="relative inline-block mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Access Request Pending Approval
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your registration is currently under review by the authorized society
            management committee.
          </p>
        </div>

        {/* Application Summary Box */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 font-medium">Applicant Name</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {user?.fullName || 'Registered User'}
            </span>
          </div>

          {user?.phoneNumber && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Verified Phone</span>
              <span className="font-mono text-slate-900 dark:text-white">
                {user.phoneNumber}
              </span>
            </div>
          )}

          {pendingMembership && (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Target Society</span>
                <span className="font-bold text-sky-500 text-right truncate max-w-[200px]">
                  {pendingMembership.societyName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Requested Role</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {USER_ROLES[pendingMembership.role]?.label || pendingMembership.role}
                </span>
              </div>

              {pendingMembership.flatId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Unit / Flat</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {pendingMembership.wingId} · {pendingMembership.flatId}
                  </span>
                </div>
              )}
            </>
          )}

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed">
            Status:{' '}
            <span className="text-amber-500 font-semibold uppercase tracking-wider">
              Pending Admin Verification
            </span>
            . Security gate access and portal modules will unlock as soon as the
            committee approves your membership.
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

          <Button
            variant="ghost"
            size="md"
            className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-white"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out of Account
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
