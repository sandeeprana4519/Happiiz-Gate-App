/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Lock, ArrowLeft, Home } from 'lucide-react';
import { USER_ROLES } from '../../config/constants';

export const UnauthorizedPage: React.FC = () => {
  const { user, currentRole } = useAuth();
  const navigate = useNavigate();

  const userHomePath = currentRole
    ? USER_ROLES[currentRole]?.defaultPath || '/'
    : '/';

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-md mx-auto w-full px-2">
      <GlassCard elevated className="w-full border-amber-500/30 p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            403 · Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            You do not possess the authorized security clearance or role permissions to
            enter this module.
          </p>
        </div>

        {currentRole && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Your Current Verified Role: </span>
            <strong className="text-sky-500">{USER_ROLES[currentRole]?.label || currentRole}</strong>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Link to={userHomePath} className="block">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return to Authorized Dashboard
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
