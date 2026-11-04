/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import { USER_ROLES } from '../../config/constants';
import { SocietyMembership } from '../../types/auth';
import { Building, ArrowRight, Shield, Check } from 'lucide-react';

export const MultiSocietySelectPage: React.FC = () => {
  const { user, memberships, activeMembership, setActiveMembership } = useAuth();
  const navigate = useNavigate();

  const activeMemberships = memberships.filter((m) => m.membershipStatus === 'ACTIVE');

  const handleSelect = (m: SocietyMembership) => {
    setActiveMembership(m);
    const targetPath = USER_ROLES[m.role]?.defaultPath || '/dashboard/resident';
    navigate(targetPath, { replace: true });
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6 px-2">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Select Active Society Context
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Your account holds verified memberships across multiple residential complexes.
          Select which society you wish to enter.
        </p>
      </div>

      <div className="space-y-3">
        {activeMemberships.map((m) => {
          const roleConfig = USER_ROLES[m.role];
          const isCurrentActive = activeMembership?.societyId === m.societyId && activeMembership?.flatId === m.flatId;

          return (
            <GlassCard
              key={`${m.societyId}_${m.flatId || m.role}`}
              elevated
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 border ${
                isCurrentActive
                  ? 'border-sky-500 ring-2 ring-sky-500/20'
                  : 'hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-sky-500 shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {m.societyName}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Code: {m.societyCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      roleConfig?.badgeColor || 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {roleConfig?.label || m.role}
                  </span>

                  {m.flatId && (
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Unit: {m.wingId} · {m.flatId} ({m.occupantType || 'Resident'})
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant={isCurrentActive ? 'primary' : 'outline'}
                size="md"
                className="shrink-0"
                onClick={() => handleSelect(m)}
                rightIcon={isCurrentActive ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {isCurrentActive ? 'Active · Open' : 'Switch & Open'}
              </Button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
