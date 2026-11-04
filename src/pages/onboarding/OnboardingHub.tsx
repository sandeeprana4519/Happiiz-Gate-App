/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SUPPORTED_LANGUAGES, USER_ROLES } from '../../config/constants';
import { UserRole } from '../../types/auth';
import { saveFirestoreUserProfile } from '../../services/firebase/firestore.service';
import {
  Home,
  ShieldCheck,
  Building2,
  Wrench,
  ArrowRight,
  User,
  Mail,
  Phone,
  Globe,
  AlertCircle,
} from 'lucide-react';

export const OnboardingHub: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  // Basic Info Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [selectedRole, setSelectedRole] = useState<UserRole>('RESIDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }

    setLoading(true);
    try {
      if (user?.uid) {
        // Save initial profile details
        await saveFirestoreUserProfile({
          uid: user.uid,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phoneNumber: user.phoneNumber || '',
          preferredLanguage,
          accountStatus: 'PENDING',
          onboardingCompleted: false,
          primaryRole: selectedRole,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
        await refreshUserProfile();
      }

      // Route to role-specific onboarding form
      switch (selectedRole) {
        case 'RESIDENT':
          navigate('/onboarding/resident');
          break;
        case 'SECURITY_GUARD':
          navigate('/onboarding/guard');
          break;
        case 'SOCIETY_ADMIN':
          navigate('/onboarding/society-admin');
          break;
        case 'SERVICE_PARTNER':
          navigate('/onboarding/service-partner');
          break;
        default:
          navigate('/onboarding/resident');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile information.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; icon: any }[] = [
    {
      role: 'RESIDENT',
      title: 'Society Resident',
      desc: 'Flat Owner or Tenant requesting access to pre-approve visitors & manage flat.',
      icon: Home,
    },
    {
      role: 'SECURITY_GUARD',
      title: 'Security Guard / Sentinel',
      desc: 'Gate security personnel checking visitor passes, vehicles & emergency dispatches.',
      icon: ShieldCheck,
    },
    {
      role: 'SOCIETY_ADMIN',
      title: 'Society Committee / Admin',
      desc: 'Managing Committee representative onboarding a new residential society complex.',
      icon: Building2,
    },
    {
      role: 'SERVICE_PARTNER',
      title: 'Service Partner / Vendor',
      desc: 'Technician, facility contractor, or maintenance company servicing societies.',
      icon: Wrench,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-8 px-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome to Happiiz Gate
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Please complete your profile and select your requested access role to submit for
          authorization.
        </p>
      </div>

      <GlassCard elevated className="border-sky-500/20 p-6 sm:p-8 space-y-6 shadow-xl">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6">
          {/* Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-sky-500">
              Step 1 · Verified Profile Details
            </h3>

            <Input
              label="Full Legal Name"
              placeholder="e.g. Dr. Priya Varma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <div>
                <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred Language
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full min-h-[44px] h-11 rounded-xl pl-10 pr-3.5 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {user?.phoneNumber && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Verified Mobile Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {user.phoneNumber}
                </span>
              </div>
            )}
          </div>

          {/* Requested Role Selection */}
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-sky-500">
                Step 2 · Select Requested Role
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Note: Selecting a role is an access request. Privileged permissions are
                granted only upon verification by authorized society administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500'
                            : 'border-slate-400'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {opt.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to Role Registration
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
