/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ShieldAlert, LogOut, Phone, CheckCircle2 } from 'lucide-react';

export const AccountSuspendedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showContactDetails, setShowContactDetails] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const statusLabel =
    user?.accountStatus === 'INACTIVE'
      ? 'Account Inactive'
      : user?.accountStatus === 'DEACTIVATED'
      ? 'Account Deactivated'
      : 'Account Access Suspended';

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-lg mx-auto w-full px-2">
      <GlassCard elevated className="w-full border-rose-500/30 p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {statusLabel}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your Happiiz Gate profile is currently restricted by society or platform
            security governance.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-2">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Access Notice:
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {user?.suspendedReason ||
              'Access restricted due to administrative status, security review, or account deactivation. Please contact your Society Office or Platform Support.'}
          </p>
        </div>

        {showContactDetails && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 text-left flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Support Contact Details</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Email: support@happiizgate.com · Helpline: +91 1800-HAPPIIZ (Mon–Sat, 9 AM–8 PM IST)
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Button
            variant="outline"
            size="md"
            className="w-full"
            leftIcon={<Phone className="w-4 h-4" />}
            onClick={() => setShowContactDetails((v) => !v)}
          >
            {showContactDetails ? 'Hide Support Details' : 'Contact Society Office'}
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-white"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
