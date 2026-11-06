/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  ShieldAlert,
  Lock,
  ArrowRight,
  User,
  Mail,
  Globe,
  AlertCircle,
  CheckCircle2,
  Image,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'av_1', label: 'Resident Male', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'av_2', label: 'Resident Female', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'av_3', label: 'Security Sentinel', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'av_4', label: 'Service Contractor', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

export const OnboardingHub: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  // Basic Info Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || PRESET_AVATARS[0].url);
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

    if (selectedRole === 'SUPER_ADMIN') {
      setError('Super Admin role cannot be self-requested. Platform administrators are provisioned exclusively by authorized platform owners.');
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
          photoURL: photoURL.trim() || undefined,
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

  const roleOptions = [
    {
      role: 'RESIDENT' as UserRole,
      letter: 'A',
      title: 'Resident',
      desc: 'Flat Owner or Tenant requesting verified access to pre-approve visitors, receive delivery alerts, and book amenities.',
      icon: Home,
      disabled: false,
    },
    {
      role: 'SECURITY_GUARD' as UserRole,
      letter: 'B',
      title: 'Security Guard',
      desc: 'Gate security sentinel terminal credentials to process visitor passes, vehicle numbers & security emergencies.',
      icon: ShieldCheck,
      disabled: false,
    },
    {
      role: 'SOCIETY_ADMIN' as UserRole,
      letter: 'C',
      title: 'Society Admin',
      desc: 'Managing Committee officer (President, Secretary, Estate Manager) onboarding a residential society complex.',
      icon: Building2,
      disabled: false,
    },
    {
      role: 'SERVICE_PARTNER' as UserRole,
      letter: 'D',
      title: 'Service Partner',
      desc: 'Facility maintenance agency, technician contractor, or service vendor offering verified home & facility repairs.',
      icon: Wrench,
      disabled: false,
    },
    {
      role: 'SUPER_ADMIN' as UserRole,
      letter: 'E',
      title: 'Super Admin',
      desc: 'Platform Master Console access. Privileged administration role provisioned exclusively through secure platform backend operations.',
      icon: ShieldAlert,
      disabled: true,
      securityNotice: 'Restricted — Self-registration prohibited per platform security rules.',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6 px-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
          Complete Your Profile & Role
        </h1>
        <p className="text-xs sm:text-sm text-[#A9B0B8] max-w-md mx-auto">
          Set up your verified identity and select your role to request access to Happiiz Gate.
        </p>
      </div>

      <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E53945] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-6">
          {/* STEP 1: PERSONAL DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#673AB7]">
                Step 1 · Verified Profile Details
              </h3>
              <span className="text-[11px] text-[#A9B0B8]">Required</span>
            </div>

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
                <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
                  Preferred App Language
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-[#A9B0B8]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full min-h-[44px] h-11 rounded-xl pl-10 pr-3.5 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
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

            {/* Profile Avatar Selection */}
            <div>
              <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-2">
                Choose Profile Photo / Avatar
              </label>
              <div className="flex items-center gap-3">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setPhotoURL(av.url)}
                    className={`relative rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                      photoURL === av.url
                        ? 'border-[#673AB7] scale-105 shadow-sm'
                        : 'border-transparent hover:border-[#E6F1F5]'
                    }`}
                  >
                    <img
                      src={av.url}
                      alt={av.label}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {photoURL === av.url && (
                      <span className="absolute -bottom-1 -right-1 bg-[#673AB7] text-white rounded-full p-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Phone Status Badge */}
            <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-xs">
              <span className="text-[#A9B0B8] font-medium">Verified Mobile Number:</span>
              <span className="font-mono font-bold text-[#111111] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {user?.phoneNumber || 'Authenticated Mobile Number'}
              </span>
            </div>
          </div>

          {/* STEP 2: ROLE SELECTION */}
          <div className="space-y-4 pt-3 border-t border-[#E6F1F5]">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#673AB7]">
                Step 2 · Select Access Role
              </h3>
              <p className="text-xs text-[#A9B0B8]">
                Select the role that matches your relationship with the gated complex.
              </p>
            </div>

            <div className="space-y-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.role;
                const isDisabled = opt.disabled;

                return (
                  <div
                    key={opt.role}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedRole(opt.role);
                        setError(null);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all text-left flex items-start justify-between gap-3 ${
                      isDisabled
                        ? 'bg-[#F9FBFC] border-[#E6F1F5] opacity-75 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#F1F9FC] border-[#673AB7] ring-1 ring-[#673AB7]/30 shadow-xs cursor-pointer'
                        : 'bg-white border-[#E6F1F5] hover:border-[#673AB7]/40 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isDisabled
                            ? 'bg-slate-100 text-slate-400'
                            : isSelected
                            ? 'bg-[#673AB7] text-white shadow-xs'
                            : 'bg-[#F1F9FC] text-[#673AB7]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#F1F9FC] text-[#673AB7] font-mono font-bold text-xs flex items-center justify-center">
                            {opt.letter}
                          </span>
                          <h4 className="font-bold text-sm text-[#111111]">
                            {opt.title}
                          </h4>
                          {isDisabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              PROVISIONED ONLY
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#A9B0B8] leading-relaxed">
                          {opt.desc}
                        </p>

                        {isDisabled && (
                          <p className="text-[11px] text-amber-700/80 italic pt-1 font-medium">
                            {opt.securityNotice}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      {isDisabled ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                      ) : (
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#673AB7] bg-[#673AB7]'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            loading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to {USER_ROLES[selectedRole]?.label || 'Role'} Registration
          </Button>
        </form>
      </div>
    </div>
  );
};
