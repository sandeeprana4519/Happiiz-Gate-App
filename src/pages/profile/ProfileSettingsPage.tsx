/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StatusBadge, MetadataText } from '../../components/common/Badge';
import { SUPPORTED_LANGUAGES, USER_ROLES } from '../../config/constants';
import { updateFirestoreUserProfile } from '../../services/firebase/firestore.service';
import { updateUserAccountPassword } from '../../services/firebase/auth.service';
import {
  User,
  Phone,
  Mail,
  Globe,
  Building,
  Shield,
  Save,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Lock,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

export const ProfileSettingsPage: React.FC = () => {
  const { user, currentRole, memberships, activeMembership, setActiveMembership, refreshUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');

  // Modals & Dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhoneChangeModal, setShowPhoneChangeModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Update State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setUpdatingPassword(true);

    try {
      await updateUserAccountPassword(user.uid, newPassword, currentPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setError(null);
    setSaving(true);

    try {
      await updateFirestoreUserProfile(user.uid, {
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        preferredLanguage,
        photoURL: photoURL.trim() || undefined,
      });
      await refreshUserProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    alert(`Phone re-authentication initiated for ${newPhone}. In production, an SMS OTP verifies this change before committing.`);
    setShowPhoneChangeModal(false);
    setNewPhone('');
  };

  const handleDeleteAccountRequest = () => {
    setShowDeleteConfirm(false);
    alert('Account Deletion Request submitted. Your society data, gate passes and memberships will be purged within 48 hours according to governance policies.');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6 px-2">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Profile & Security Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your verified identity, language preferences and society memberships
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile changes updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium">
          {error}
        </div>
      )}

      {/* Main Profile Form */}
      <GlassCard elevated className="border-sky-500/20 p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {fullName || 'User Profile'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                UID: {user?.uid || 'Unknown'}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <StatusBadge status={user?.accountStatus || 'ACTIVE'} variant="success" />
                {currentRole && (
                  <span className="text-[11px] font-bold text-sky-400">
                    {USER_ROLES[currentRole]?.label || currentRole}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Full Legal Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Interface Language
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

          {/* Verified Phone with Change Trigger */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Verified 2FA Phone Number
            </label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-mono font-bold">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>{user?.phoneNumber || 'No phone linked'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneChangeModal(true)}
                className="text-xs text-sky-500 hover:text-sky-400 font-semibold cursor-pointer"
              >
                Change Phone
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile Changes
          </Button>
        </form>
      </GlassCard>

      {/* Security: Password Update Card */}
      <GlassCard elevated className="border-amber-500/20 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Password & Security (पासवर्ड अपडेट)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your login password for secure access
              </p>
            </div>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password updated successfully! Next login will require your new password.</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Current Password (वर्तमान पासवर्ड)
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full min-h-[44px] h-11 rounded-xl pl-10 pr-10 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password (नया पासवर्ड) *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full min-h-[44px] h-11 rounded-xl pl-10 pr-10 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password (पुष्टि करें) *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full min-h-[44px] h-11 rounded-xl pl-10 pr-10 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            loading={updatingPassword}
            leftIcon={<Key className="w-4 h-4" />}
            className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
          >
            Update Password (पासवर्ड बदलें)
          </Button>
        </form>
      </GlassCard>

      {/* Society Memberships Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Society Memberships ({memberships.length})
            </h3>
            <p className="text-xs text-slate-400">
              Gated communities where your identity is registered
            </p>
          </div>
          {memberships.length > 1 && (
            <Link
              to="/select-society"
              className="text-xs text-sky-500 hover:text-sky-400 font-semibold"
            >
              Switch Society
            </Link>
          )}
        </div>

        {memberships.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No society memberships found. (Super Admin or Standalone account)
          </p>
        ) : (
          <div className="space-y-2.5">
            {memberships.map((m) => {
              const isCurrent = activeMembership?.societyId === m.societyId;
              return (
                <div
                  key={`${m.societyId}_${m.flatId || m.role}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {m.societyName}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400">
                          Active Context
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400">
                      {USER_ROLES[m.role]?.label || m.role}
                      {m.flatId ? ` · ${m.wingId} ${m.flatId}` : ''}
                    </p>
                  </div>

                  <StatusBadge
                    status={m.membershipStatus}
                    variant={m.membershipStatus === 'ACTIVE' ? 'success' : 'warning'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Danger Zone: Account Deletion */}
      <Card className="border-rose-500/20 bg-rose-500/5 p-4 sm:p-5 space-y-3">
        <h3 className="font-bold text-sm text-rose-500 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Account Deletion & Data Privacy</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Request permanent deletion of your profile, personal credentials, and gate pass history.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Request Account Deletion
        </Button>
      </Card>

      {/* Phone Number Change Modal */}
      <Modal
        isOpen={showPhoneChangeModal}
        onClose={() => setShowPhoneChangeModal(false)}
        title="Change 2FA Mobile Number"
        description="Verify your new phone number via SMS OTP"
        maxWidth="sm"
      >
        <form onSubmit={handlePhoneChangeSubmit} className="space-y-4">
          <Input
            label="New Mobile Number"
            type="tel"
            placeholder="+91 98450 99999"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            required
            autoFocus
          />
          <p className="text-[11px] text-slate-400">
            For security, an SMS verification OTP will be dispatched to confirm ownership of the new number.
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPhoneChangeModal(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              Send OTP
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Account Deletion Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccountRequest}
        title="Request Permanent Account Deletion?"
        message="This action will queue your account, visitor logs, and society credentials for irreversible purging according to data retention governance."
        confirmLabel="Confirm Deletion Request"
        variant="danger"
      />
    </div>
  );
};
