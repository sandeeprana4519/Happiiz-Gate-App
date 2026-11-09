/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { updateFirestoreUserProfile } from '../../services/firebase/firestore.service';
import { updateUserAccountPassword } from '../../services/firebase/auth.service';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Key, 
  ShieldCheck, 
  Building, 
  Globe, 
  LogOut 
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../config/constants';

interface ResidentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'password';
}

export const ResidentProfileModal: React.FC<ResidentProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'password',
}) => {
  const { user, refreshUserProfile, logout } = useAuth();

  // Active Tab: 'password' or 'profile'
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Profile fields
  const [fullName, setFullName] = useState(user?.fullName || user?.displayName || 'Dr. Priya Varma');
  const [email, setEmail] = useState(user?.email || 'priya.varma@medcenter.org');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const flatNumber = user?.flatNumber || 'B-704';
  const societyName = user?.societyName || 'Emerald Heights Luxury Enclave';
  const phoneNumber = user?.phoneNumber || '+91 98210 11223';
  const uid = user?.uid || 'usr_resident_04';

  // Save profile changes (Name, Email, Language)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setProfileError(null);
    setSavingProfile(true);

    try {
      await updateFirestoreUserProfile(uid, {
        fullName: fullName.trim(),
        email: email.trim(),
        preferredLanguage,
      });
      if (refreshUserProfile) await refreshUserProfile();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await updateUserAccountPassword(uid, newPassword, currentPassword);
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

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resident Profile & Security"
      description="Personal information, flat details & password security"
      maxWidth="md"
    >
      <div className="space-y-3.5 pb-2 text-xs">
        {/* Compact User Header Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#673AB7] text-white font-black text-base flex items-center justify-center shadow-xs shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                {fullName}
              </h3>
              <p className="text-[10px] text-gray-500 font-mono truncate">
                UID: {uid} · Flat {flatNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
              Active
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#673AB7] text-[9px] font-black uppercase">
              Resident
            </span>
          </div>
        </div>

        {/* Top Segmented Tabs: Update Password | Personal Info */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F1F9FC] rounded-2xl border border-[#E6F1F5] font-extrabold text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'password'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Update Password (पासवर्ड)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              activeTab === 'profile'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details (विवरण)</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: UPDATE PASSWORD (ऊपर लाया गया ताकि बिना स्क्रोल किए पूरा दिखे) */}
        {/* ========================================================= */}
        {activeTab === 'password' && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                <Key className="w-4 h-4 text-amber-700" />
                <span>Account Password (नया पासवर्ड सेट करें)</span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Security
              </span>
            </div>

            <p className="text-[11px] text-amber-900">
              Create a secure password to sign in seamlessly across mobile and web.
            </p>

            {passwordSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Password updated successfully! Next login will require your new password.</span>
              </div>
            )}

            {passwordError && (
              <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              {/* Current Password */}
              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">
                  Current Password (वर्तमान पासवर्ड)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#673AB7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">
                  New Password (नया पासवर्ड) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#673AB7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">
                  Confirm New Password (पासवर्ड की पुष्टि करें) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#673AB7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{updatingPassword ? 'Updating Password...' : 'Update Password (पासवर्ड बदलें)'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PERSONAL DETAILS (नाम, ईमेल, भाषा व आवास)          */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 border-b border-[#E6F1F5] pb-2">
                <User className="w-4 h-4 text-[#673AB7]" />
                <span>Personal Information (व्यक्तिगत विवरण)</span>
              </div>

              {profileSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Profile details updated successfully!</span>
                </div>
              )}

              {profileError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#673AB7]"
                      placeholder="e.g. Dr. Priya Varma"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#673AB7]"
                      placeholder="e.g. resident@domain.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Registered Phone (2FA)
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600" />
                      <input
                        type="text"
                        value={phoneNumber}
                        disabled
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 cursor-not-allowed font-mono"
                      />
                      <span title="Verified" className="absolute right-2.5 top-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Preferred Language
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <select
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#673AB7]"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </form>
            </div>

            {/* Residence Context */}
            <div className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 border-b border-[#E6F1F5] pb-2">
                <Building className="w-4 h-4 text-[#0EA5E9]" />
                <span>Residence Details (आवास विवरण)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded-xl bg-white border border-[#E6F1F5]">
                  <span className="text-gray-500 block text-[10px]">Flat / Unit</span>
                  <span className="font-extrabold text-gray-900">{flatNumber}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#E6F1F5]">
                  <span className="text-gray-500 block text-[10px]">Society</span>
                  <span className="font-extrabold text-gray-900 truncate block">{societyName}</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#E53945] font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Resident Portal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
