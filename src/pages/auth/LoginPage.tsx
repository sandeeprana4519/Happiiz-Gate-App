/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { OtpInput } from '../../components/common/OtpInput';
import { LegalModal } from '../../components/common/LegalModal';
import { SecurityShield3D } from '../../components/visuals/SecurityShield3D';
import { UserRole, UserProfile } from '../../types/auth';
import { USER_ROLES } from '../../config/constants';
import { isFirebaseConfigured } from '../../config/firebase.config';
import {
  signInWithEmail,
  googleLoginWithRegisteredEmailCheck,
  simulateGoogleSignIn,
  initiatePasswordResetOtp,
  verifyPasswordResetOtp,
  finalizePasswordReset,
  validatePasswordStrength,
  maskPhoneNumber,
} from '../../services/firebase/auth.service';
import { SUPPORTED_COUNTRY_CODES, normalizeToE164 } from '../../services/firebase/phone.utils';
import { MOCK_USERS } from '../../services/mock/mockData';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  RotateCcw,
  ChevronLeft,
  KeyRound,
  Sparkles,
  Phone,
  ShieldCheck,
  Building2,
  Wrench,
} from 'lucide-react';

type AuthView = 'LOGIN' | 'FORGOT_PHONE' | 'FORGOT_OTP' | 'FORGOT_RESET' | 'FORGOT_SUCCESS';

const REMEMBERED_EMAIL_KEY = 'happiiz_remembered_email';

export const LoginPage: React.FC = () => {
  const { loginWithDemoSession, refreshUserProfile, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetRole = queryParams.get('role');

  // Portal Criteria Selector ('ALL' = Unified Auto-Role, 'SOCIETY_STAFF' = Society Staff Portal, 'PLATFORM_STAFF' = Platform Staff Portal)
  const [portalMode, setPortalMode] = useState<'ALL' | 'SOCIETY_STAFF' | 'PLATFORM_STAFF'>(
    targetRole === 'SOCIETY_STAFF'
      ? 'SOCIETY_STAFF'
      : targetRole === 'PLATFORM_STAFF'
      ? 'PLATFORM_STAFF'
      : 'ALL'
  );

  useEffect(() => {
    if (targetRole === 'SOCIETY_STAFF') setPortalMode('SOCIETY_STAFF');
    else if (targetRole === 'PLATFORM_STAFF') setPortalMode('PLATFORM_STAFF');
  }, [targetRole]);

  // Multi-step View State
  const [view, setView] = useState<AuthView>('LOGIN');

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password / Recovery State
  const [countryCode, setCountryCode] = useState('+91');
  const [resetPhone, setResetPhone] = useState('');
  const [normalizedResetE164, setNormalizedResetE164] = useState('');
  const [maskedPhoneDisplay, setMaskedPhoneDisplay] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [grantToken, setGrantToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [showSimulationTools, setShowSimulationTools] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (_) {}
  }, []);

  // OTP Cooldown Countdown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Compute password strength for reset screen
  const pwdStrength = validatePasswordStrength(newPassword);

  /**
   * AUTOMATIC ROLE REDIRECTION ENGINE
   * Directly routes user to their appropriate dashboard based on their verified account role.
   * Users NEVER have to select their role!
   */
  const handleRedirectByRole = (profile: UserProfile, resolvedRole?: UserRole) => {
    const role: UserRole =
      resolvedRole || profile.primaryRole || (profile.isSuperAdmin ? 'SUPER_ADMIN' : 'RESIDENT');

    // Strict Service Partner Verification Status Guard
    if (role === 'SERVICE_PARTNER') {
      const pStatus = String(profile.accountStatus || '').toUpperCase();
      if (pStatus === 'PENDING') {
        setError(
          'Application Under Review: Your profile and documents are pending verification by Super Admin. You will receive login access once approved.'
        );
        return;
      }
      if (pStatus === 'REJECTED') {
        setError(
          'Application Rejected: Your verification was declined. Please contact support or resubmit your documents.'
        );
        return;
      }
    }

    // Sync AuthContext state immediately
    loginWithDemoSession(profile);

    // Save remembered email if selected
    if (rememberMe && profile.email) {
      try {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, profile.email);
      } catch (_) {}
    } else if (!rememberMe) {
      try {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      } catch (_) {}
    }

    // Role-based target routes
    switch (role) {
      case 'SUPER_ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'PLATFORM_STAFF':
        navigate('/dashboard/platform-staff', { replace: true });
        break;
      case 'SOCIETY_ADMIN':
        navigate('/dashboard/society-admin', { replace: true });
        break;
      case 'SOCIETY_STAFF':
        navigate('/dashboard/society-staff', { replace: true });
        break;
      case 'SECURITY_GUARD':
        navigate('/dashboard/guard', { replace: true });
        break;
      case 'SERVICE_PARTNER':
        navigate('/dashboard/service-partner', { replace: true });
        break;
      case 'RESIDENT':
      default:
        navigate('/dashboard/resident', { replace: true });
        break;
    }
  };

  /**
   * PART 2 & PART 3: EMAIL + PASSWORD LOGIN SUBMIT
   */
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const { user, role } = await signInWithEmail(email, password);

      if (portalMode === 'SOCIETY_STAFF' && role !== 'SOCIETY_STAFF') {
        setError(
          'Portal Mismatch: This account is not a Society Staff account. Switch to "Unified Login" or "Platform Staff" above to access your portal.'
        );
        return;
      }
      if (portalMode === 'PLATFORM_STAFF' && role !== 'PLATFORM_STAFF') {
        setError(
          'Portal Mismatch: This account is not a Platform Staff account. Switch to "Unified Login" or "Society Staff" above to access your portal.'
        );
        return;
      }

      setSuccessNotice(`Authentication successful. Redirecting to your dashboard...`);
      setTimeout(() => {
        handleRedirectByRole(user, role);
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * PART 4: GOOGLE SIGN-IN WITH STRICT PRE-REGISTRATION POLICY
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        const { user, role } = await googleLoginWithRegisteredEmailCheck();
        setSuccessNotice(`Google authentication verified. Redirecting...`);
        setTimeout(() => {
          handleRedirectByRole(user, role);
        }, 500);
      } else {
        // In local development sandbox, trigger interactive simulation selector
        setShowSimulationTools(true);
        setError(
          'Live Firebase Auth not configured in .env. Select a registered or unregistered Google account below to test the pre-registration security rule.'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simulation helper to demonstrate Google Sign-In security policy
   */
  const handleSimulatedGoogleAccount = async (simulatedEmail: string) => {
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      const { user, role } = await simulateGoogleSignIn(simulatedEmail);
      setSuccessNotice(`Google account ${simulatedEmail} verified. Redirecting...`);
      setTimeout(() => {
        handleRedirectByRole(user, role);
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * PART 6: STEP 1 - INITIATE FORGOT PASSWORD VIA REGISTERED MOBILE NUMBER
   */
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const norm = normalizeToE164(countryCode, resetPhone);
    if (!norm.isValid) {
      setError(norm.error || 'Please enter a valid mobile number.');
      return;
    }

    const fullPhone = norm.e164;
    setNormalizedResetE164(fullPhone);
    setLoading(true);

    try {
      const res = await initiatePasswordResetOtp(fullPhone);
      setMaskedPhoneDisplay(res.maskedPhone);
      setOtpCooldown(res.cooldownSeconds);
      setResetOtp('123456'); // Pre-fill sandbox test OTP
      setSuccessNotice(`6-digit verification code sent to ${res.maskedPhone}. (Test OTP: 123456)`);
      setView('FORGOT_OTP');
    } catch (err: any) {
      setError(err?.message || 'Could not initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * PART 6: STEP 2 - VERIFY 6-DIGIT OTP
   */
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (resetOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPasswordResetOtp(normalizedResetE164, resetOtp);
      setGrantToken(res.grantToken);
      setSuccessNotice('Mobile number verified. Please enter your new password.');
      setView('FORGOT_RESET');
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP handler for Password Recovery
   */
  const handleResendResetOtp = async () => {
    if (otpCooldown > 0 || loading) return;
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      const res = await initiatePasswordResetOtp(normalizedResetE164);
      setOtpCooldown(res.cooldownSeconds);
      setResetOtp('123456');
      setSuccessNotice(`New verification code sent to ${res.maskedPhone}. (Code: 123456)`);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * PART 7 & PART 8: STEP 3 - SUBMIT NEW PASSWORD & INVALIDATE OLD PASSWORD
   */
  const handleFinalizePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match exactly.');
      return;
    }

    if (!pwdStrength.isValid) {
      setError(pwdStrength.errors[0] || 'Password does not meet the security requirements.');
      return;
    }

    setLoading(true);
    try {
      const res = await finalizePasswordReset(grantToken, newPassword);
      setSuccessNotice(res.message);
      setView('FORGOT_SUCCESS');
      // Invalidate existing sessions in local state
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Could not update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick fill test credentials helper for evaluators
   */
  const handleFillCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Happiiz@2026');
    setError(null);
    setSuccessNotice(null);
  };

  const currentCountry =
    SUPPORTED_COUNTRY_CODES.find((c) => c.code === countryCode) || SUPPORTED_COUNTRY_CODES[0];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 sm:py-12 max-w-lg mx-auto w-full px-4">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <Link to="/" className="inline-block relative group focus-visible:outline-none">
          <SecurityShield3D size={56} />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
          Happiiz Gate
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Unified Security, Resident & Facility Access Platform
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8">
        {/* Portal-Specific Target Role Header */}
        {(targetRole === 'SOCIETY_ADMIN' || portalMode === 'ALL') && targetRole === 'SOCIETY_ADMIN' && view === 'LOGIN' && (
          <div className="mb-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-[#673AB7] font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#673AB7] shrink-0" />
            <span>Society Admin Portal Authentication</span>
          </div>
        )}
        {targetRole === 'SUPER_ADMIN' && view === 'LOGIN' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>Platform Super Admin Master Control Authorization</span>
          </div>
        )}

        {/* Dedicated Staff Login Criteria Selector */}
        {view === 'LOGIN' && targetRole !== 'SUPER_ADMIN' && (
          <div className="mb-4 space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => {
                  setPortalMode('ALL');
                  setError(null);
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  portalMode === 'ALL'
                    ? 'bg-white text-[#111111] shadow-xs border border-[#E6F1F5]'
                    : 'text-[#64748B] hover:text-[#111111]'
                }`}
              >
                Unified Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalMode('SOCIETY_STAFF');
                  setError(null);
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  portalMode === 'SOCIETY_STAFF'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-teal-700'
                }`}
              >
                Society Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalMode('PLATFORM_STAFF');
                  setError(null);
                }}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  portalMode === 'PLATFORM_STAFF'
                    ? 'bg-[#673AB7] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#673AB7]'
                }`}
              >
                Platform Staff
              </button>
            </div>

            {portalMode === 'SOCIETY_STAFF' && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-medium flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Society Staff Portal Login</span>
                  <span className="text-[11px] text-teal-700">
                    Sign in with the Email ID & Password issued by your Society Admin. Only your assigned society and authorized modules will open.
                  </span>
                </div>
              </div>
            )}

            {portalMode === 'PLATFORM_STAFF' && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#673AB7] shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block">Platform Staff Portal Login</span>
                  <span className="text-[11px] text-[#673AB7]">
                    Sign in with Super Admin issued credentials to open your department workspace.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium space-y-2 animate-fade-in text-[#B91C1C]">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#E53945]" />
              <span className="leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {successNotice && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successNotice}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: UNIFIED LOGIN SCREEN (EMAIL + PASSWORD / GOOGLE)    */}
        {/* ============================================================ */}
        {view === 'LOGIN' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                Login to Happiiz Gate
              </h2>
              <p className="text-xs text-[#64748B]">
                Enter your registered email and password to access your portal.
              </p>
            </div>

            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              {/* Email Address Input */}
              <div>
                <label className="block text-xs font-bold tracking-wide text-[#111111] mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@happiizgate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
                  required
                  autoFocus
                />
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold tracking-wide text-[#111111]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('FORGOT_PHONE');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className="text-xs font-semibold text-[#673AB7] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111111] p-1 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E6F1F5] text-[#673AB7] focus:ring-[#673AB7] cursor-pointer"
                  />
                  <span className="text-xs text-[#64748B] font-medium">Remember Me</span>
                </label>
              </div>

              {/* Purple Primary Login Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                loading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Login
              </Button>
            </form>

            {/* Prominent Service Partner Self-Registration Callout */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-blue-50/80 border border-blue-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      Service Partner / Technician?
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        Join Us
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-600">
                      Deliver services to 50,000+ residents across verified societies
                    </p>
                  </div>
                </div>
              </div>
              <Link
                to="/onboarding/service-partner"
                className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Register as Service Partner / Apply for Jobs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* OR AUTHENTICATE WITH Divider (Matching Reference Screenshot) */}
            <div className="relative flex items-center justify-center my-6">
              <div className="w-full border-t border-[#E6F1F5]" />
              <span className="absolute bg-[#FFFFFF] px-3 text-[11px] font-bold tracking-wider uppercase text-[#94A3B8]">
                OR AUTHENTICATE WITH
              </span>
            </div>

            {/* Sign in with Google Button (Matching Reference Screenshot) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 rounded-xl border border-[#E6F1F5] bg-[#FFFFFF] hover:bg-[#F1F9FC] hover:border-[#673AB7]/30 text-xs font-semibold text-[#111111] transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <p className="text-[11px] text-[#94A3B8] text-center">
                Security Policy: Google accounts must be pre-registered with Happiiz Gate.
              </p>
            </div>

            {/* Quick Test Helper for Evaluators (Fills Email & Password for Any Role) */}
            <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs space-y-2">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-[11px] font-bold text-[#111111] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#673AB7]" />
                  Quick Test Credentials (Auto-Role Redirection)
                </span>
                <span className="text-[10px] text-[#673AB7] font-semibold">Password: Happiiz@2026</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFillCredentials('guard@happiizgate.com')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                >
                  🛡️ Gate Guard
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('priya.varma@medcenter.org')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-purple-700 hover:border-purple-500 hover:bg-purple-50/50 transition-colors"
                >
                  🏡 Resident
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('partner@happiizgate.com')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-blue-700 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                >
                  🔧 Service Partner
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('president@emeraldheights.org')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
                >
                  🏢 Society Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('manager@emeraldheights.org')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-teal-700 hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
                >
                  🧑‍💼 Society Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('priya.iyer@happiiz.com')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-[#673AB7] hover:border-[#673AB7] hover:bg-purple-50/50 transition-colors"
                >
                  💼 Platform Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleFillCredentials('admin@happiizgate.com')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[11px] font-semibold text-red-700 hover:border-red-500 hover:bg-red-50/50 transition-colors"
                >
                  👑 Super Admin
                </button>
              </div>
            </div>

            {/* Google Pre-Registration Security Tester (Demonstrates Allowed vs Rejected) */}
            <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E6F1F5] text-xs space-y-2">
              <span className="text-[11px] font-bold text-[#111111] block">
                Google Pre-Registration Policy Test Controls:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulatedGoogleAccount('admin@happiizgate.com')}
                  className="px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 text-center transition-colors"
                >
                  ✓ Registered Google (admin@happiizgate.com)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedGoogleAccount('unregistered.visitor@gmail.com')}
                  className="px-2 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 text-[11px] font-semibold hover:bg-red-100 text-center transition-colors"
                >
                  ✗ Unregistered Google (Rejection Test)
                </button>
              </div>
            </div>

            {/* Legal Links Footer (Matching Reference Screenshot) */}
            <div className="pt-2 text-center text-xs text-[#94A3B8] leading-relaxed">
              By proceeding, you agree to the Happiiz Gate{' '}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="text-[#673AB7] hover:underline font-semibold cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="text-[#673AB7] hover:underline font-semibold cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: FORGOT PASSWORD - STEP 1 (REGISTERED MOBILE INPUT)   */}
        {/* ============================================================ */}
        {view === 'FORGOT_PHONE' && (
          <form onSubmit={handleSendResetOtp} className="space-y-5">
            <button
              type="button"
              onClick={() => {
                setView('LOGIN');
                setError(null);
                setSuccessNotice(null);
              }}
              className="text-xs text-[#673AB7] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Login
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                Forgot Password
              </h2>
              <p className="text-xs text-[#64748B]">
                Enter your registered mobile phone number to receive a 6-digit verification code.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wide text-[#111111] mb-1.5">
                Registered Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-32 min-h-[44px] h-11 rounded-xl px-2.5 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none shrink-0 focus:border-[#673AB7]"
                >
                  {SUPPORTED_COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>

                <Input
                  type="tel"
                  placeholder={currentCountry.placeholder}
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4 text-[#64748B]" />}
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1.5 pl-1">
                Selected: {countryCode} {resetPhone ? resetPhone.replace(/\D/g, '') : currentCountry.placeholder}
              </p>
            </div>

            {/* Quick Helper with Registered Numbers for Easy Testing */}
            <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs space-y-1.5">
              <span className="text-[11px] font-bold text-[#111111] block">
                Quick Test Registered Numbers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setResetPhone('9812345678');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[10px] font-mono hover:border-[#673AB7]"
                >
                  🇮🇳 +91 9812345678 (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setResetPhone('9955443322');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[10px] font-mono hover:border-[#673AB7]"
                >
                  🇮🇳 +91 9955443322 (Resident)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setResetPhone('9700011223');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[10px] font-mono hover:border-[#673AB7]"
                >
                  🇮🇳 +91 9700011223 (Guard)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    setResetPhone('1234567890');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-red-200 text-[10px] font-mono text-red-700 hover:border-red-400"
                >
                  ✗ Unregistered Test
                </button>
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
              Send 6-Digit OTP
            </Button>
          </form>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: FORGOT PASSWORD - STEP 2 (6-DIGIT OTP VERIFICATION) */}
        {/* ============================================================ */}
        {view === 'FORGOT_OTP' && (
          <form onSubmit={handleVerifyResetOtp} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => {
                  setView('FORGOT_PHONE');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="text-xs text-[#673AB7] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Change Number
              </button>
              <span className="text-xs text-[#111111] font-mono font-bold">
                {maskedPhoneDisplay || normalizedResetE164}
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-[#111111]">
                  Enter 6-Digit Verification Code
                </h3>
                <p className="text-xs text-[#64748B]">
                  A 6-digit OTP has been sent to your registered mobile number {maskedPhoneDisplay}.
                </p>
                <p className="text-[11px] text-[#673AB7] font-semibold">
                  (Test OTP: <strong>123456</strong>)
                </p>
              </div>

              {/* 6-Digit OtpInput Box Component */}
              <OtpInput
                value={resetOtp}
                onChange={setResetOtp}
                length={6}
                disabled={loading}
                autoFocus
              />

              <p className="text-[11px] text-center text-[#94A3B8]">
                Code valid for 5 minutes • Maximum 5 attempts allowed
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={resetOtp.length !== 6}
              rightIcon={<CheckCircle className="w-4 h-4" />}
            >
              Verify OTP
            </Button>

            <div className="text-center pt-1">
              {otpCooldown > 0 ? (
                <p className="text-xs text-[#94A3B8] font-mono">
                  Resend code in <span className="font-bold text-[#673AB7]">{otpCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendResetOtp}
                  disabled={loading}
                  className="text-xs text-[#673AB7] hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend Verification Code</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* VIEW 4: FORGOT PASSWORD - STEP 3 (SET NEW PASSWORD)          */}
        {/* ============================================================ */}
        {view === 'FORGOT_RESET' && (
          <form onSubmit={handleFinalizePasswordReset} className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                Reset Your Password
              </h2>
              <p className="text-xs text-[#64748B]">
                Create a strong new password. Old passwords will be permanently invalidated.
              </p>
            </div>

            {/* New Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold tracking-wide text-[#111111]">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111111] p-1 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold tracking-wide text-[#111111]">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<KeyRound className="w-4 h-4 text-[#64748B]" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111111] p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-600 font-medium pt-1">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* Real-time Password Strength Meter */}
            <div className="p-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#111111]">Password Strength</span>
                <span
                  className={`font-semibold ${
                    pwdStrength.score === 4
                      ? 'text-emerald-600'
                      : pwdStrength.score >= 2
                      ? 'text-amber-600'
                      : 'text-red-500'
                  }`}
                >
                  {pwdStrength.score === 4
                    ? 'Strong'
                    : pwdStrength.score >= 2
                    ? 'Moderate'
                    : 'Weak'}
                </span>
              </div>

              {/* Strength Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-[#E6F1F5] overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((stepIndex) => (
                  <div
                    key={stepIndex}
                    className={`h-full flex-1 transition-all ${
                      pwdStrength.score >= stepIndex
                        ? pwdStrength.score === 4
                          ? 'bg-emerald-500'
                          : pwdStrength.score >= 2
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Requirement Checklist */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#64748B] pt-1">
                <div
                  className={`flex items-center gap-1.5 ${
                    newPassword.length >= 8 ? 'text-emerald-700 font-semibold' : ''
                  }`}
                >
                  <span>{newPassword.length >= 8 ? '✓' : '•'}</span>
                  <span>Min 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    /[A-Z]/.test(newPassword) ? 'text-emerald-700 font-semibold' : ''
                  }`}
                >
                  <span>{/[A-Z]/.test(newPassword) ? '✓' : '•'}</span>
                  <span>1 Uppercase (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    /[a-z]/.test(newPassword) ? 'text-emerald-700 font-semibold' : ''
                  }`}
                >
                  <span>{/[a-z]/.test(newPassword) ? '✓' : '•'}</span>
                  <span>1 Lowercase (a-z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    /[0-9]/.test(newPassword) ? 'text-emerald-700 font-semibold' : ''
                  }`}
                >
                  <span>{/[0-9]/.test(newPassword) ? '✓' : '•'}</span>
                  <span>1 Number (0-9)</span>
                </div>
                <div
                  className={`col-span-2 flex items-center gap-1.5 ${
                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
                      ? 'text-emerald-700 font-semibold'
                      : ''
                  }`}
                >
                  <span>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '•'}
                  </span>
                  <span>1 Special character (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={!pwdStrength.isValid || newPassword !== confirmPassword}
            >
              Reset Password
            </Button>
          </form>
        )}

        {/* ============================================================ */}
        {/* VIEW 5: FORGOT PASSWORD - STEP 4 (SUCCESS CONFIRMATION)       */}
        {/* ============================================================ */}
        {view === 'FORGOT_SUCCESS' && (
          <div className="space-y-6 text-center py-2 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-[#111111]">
                Password Reset Successfully
              </h2>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Your password has been successfully reset. Please log in using your new password.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Security Notice: All previous sessions have been revoked. Old passwords are now invalid.
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setView('LOGIN');
                setError(null);
                setSuccessNotice('Please enter your new password to sign in.');
              }}
            >
              Return to Login
            </Button>
          </div>
        )}
      </div>

      {/* Legal Information Modal */}
      {legalModal && (
        <LegalModal
          isOpen={true}
          onClose={() => setLegalModal(null)}
          type={legalModal}
        />
      )}
    </div>
  );
};
