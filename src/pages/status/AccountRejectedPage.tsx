/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { XCircle, LogOut, ArrowRight, HelpCircle } from 'lucide-react';

export const AccountRejectedPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-lg mx-auto w-full px-2">
      <GlassCard elevated className="w-full border-rose-500/30 p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Registration Request Declined
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your membership request for this society could not be approved by the
            management committee.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-left space-y-2">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Declination Reason / Notes:
          </div>
          <p className="text-slate-500 dark:text-slate-400 italic">
            "{user?.rejectionReason || 'Flat details could not be matched with official registry records. Please contact society office.'}"
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <Link to="/onboarding" className="block">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Re-Apply with Updated Details
            </Button>
          </Link>

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
