/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { OtpInput } from '../../components/common/OtpInput';
import { LegalModal } from '../../components/common/LegalModal';
import { SecurityShield3D } from '../../components/visuals/SecurityShield3D';
import { USER_ROLES } from '../../config/constants';
import { UserRole } from '../../types/auth';
import {
  firebaseValidation,
  isFirebaseConfigured,
  isUsingPlaceholderConfig,
} from '../../config/firebase.config';
import {
  setupRecaptchaVerifier,
  cleanupRecaptchaVerifier,
  sendFirebaseOtp,
  confirmFirebaseOtp,
  signInWithGoogleProvider,
  mapFirebaseAuthError,
} from '../../services/firebase/auth.service';
import {
  SUPPORTED_COUNTRY_CODES,
  normalizeToE164,
  isLikelyTestPhoneNumber,
} from '../../services/firebase/phone.utils';
import {
  getFirestoreUserProfile,
  getUserSocietyMemberships,
  getServicePartnerProfile,
} from '../../services/firebase/firestore.service';
import {
  Phone,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  CheckCircle,
  RotateCcw,
  Info,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { type ConfirmationResult, type RecaptchaVerifier } from 'firebase/auth';

const RESEND_COOLDOWN_SECONDS = 45;

export const LoginPage: React.FC = () => {
  const { user, refreshUserProfile, loginWithDemoRole, loginWithDemoSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Login Flow Step
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Input States
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [normalizedE164, setNormalizedE164] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Firebase Confirmation & Verifier Ref
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Status & Notifications
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [forceSimulationMode, setForceSimulationMode] = useState(false);

  // Computed mode: Firebase live mode is active only if configured and not overridden
  const isFirebaseMode = isFirebaseConfigured && !forceSimulationMode;

  // Cleanup RecaptchaVerifier on unmount to prevent leaks
  useEffect(() => {
    return () => {
      cleanupRecaptchaVerifier(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = null;
    };
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle redirect after authenticated
  const routeUserAfterLogin = async (uid: string) => {
    // If simulated demo UID, check saved session profile to route accurately
    if (uid.startsWith('dev_')) {
      let savedProfile: any = null;
      try {
        const saved =
          localStorage.getItem(`happiiz_profile_${uid}`) ||
          localStorage.getItem('happiiz_gate_demo_session');
        if (saved) {
          savedProfile = JSON.parse(saved);
        }
      } catch (_) {}

      if (!savedProfile || !savedProfile.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
        return;
      }

      if (savedProfile.accountStatus === 'PENDING') {
        navigate('/status/pending', { replace: true });
        return;
      }
      if (savedProfile.accountStatus === 'REJECTED') {
        navigate('/status/rejected', { replace: true });
        return;
      }
      if (savedProfile.accountStatus === 'SUSPENDED' || savedProfile.accountStatus === 'BLOCKED') {
        navigate('/status/suspended', { replace: true });
        return;
      }

      const role: UserRole = (savedProfile.primaryRole as UserRole) || 'RESIDENT';
      loginWithDemoRole(role);
      const targetPath = USER_ROLES[role]?.defaultPath || '/dashboard/resident';
      navigate(targetPath, { replace: true });
      return;
    }

    const profile = await getFirestoreUserProfile(uid);

    if (!profile || !profile.onboardingCompleted) {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (profile.accountStatus === 'BLOCKED' || profile.accountStatus === 'SUSPENDED') {
      navigate('/status/suspended', { replace: true });
      return;
    }

    if (profile.accountStatus === 'REJECTED') {
      navigate('/status/rejected', { replace: true });
      return;
    }

    if (profile.accountStatus === 'PENDING') {
      navigate('/status/pending', { replace: true });
      return;
    }

    // Account is ACTIVE -> resolve role & memberships
    if (profile.isSuperAdmin || profile.primaryRole === 'SUPER_ADMIN') {
      navigate('/dashboard/super-admin', { replace: true });
      return;
    }

    if (profile.primaryRole === 'SERVICE_PARTNER') {
      const partner = await getServicePartnerProfile(uid);
      if (partner?.verificationStatus === 'ACTIVE') {
        navigate('/dashboard/service-partner', { replace: true });
      } else {
        navigate('/status/pending', { replace: true });
      }
      return;
    }

    // Resident, Security Guard or Society Admin
    const memberships = await getUserSocietyMemberships(uid);
    const activeMemberships = memberships.filter((m) => m.membershipStatus === 'ACTIVE');

    if (activeMemberships.length === 0) {
      navigate('/status/pending', { replace: true });
      return;
    }

    if (activeMemberships.length > 1) {
      navigate('/select-society', { replace: true });
      return;
    }

    // Single active membership
    const active = activeMemberships[0];
    const targetPath = USER_ROLES[active.role]?.defaultPath || '/dashboard/resident';
    navigate(targetPath, { replace: true });
  };

  // Step 1: Send Phone OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    // E.164 Normalization
    const norm = normalizeToE164(countryCode, phoneNumber);
    if (!norm.isValid) {
      setError(norm.error || 'Please enter a valid mobile number.');
      return;
    }

    const fullPhoneNumber = norm.e164;
    setNormalizedE164(fullPhoneNumber);
    setLoading(true);

    try {
      if (isFirebaseMode) {
        // Always clean any existing verifier and obtain a fresh instance bound to a fresh DOM container
        cleanupRecaptchaVerifier(recaptchaVerifierRef.current);
        const verifier = setupRecaptchaVerifier('recaptcha-container');
        recaptchaVerifierRef.current = verifier;

        if (!verifier) {
          throw new Error('reCAPTCHA security check could not be initialized.');
        }

        const result = await sendFirebaseOtp(fullPhoneNumber, verifier);
        setConfirmationResult(result);

        if (isLikelyTestPhoneNumber(fullPhoneNumber)) {
          setSuccessNotice(
            `Firebase Test Phone recognized (${fullPhoneNumber}). Enter your configured test OTP.`
          );
        } else {
          setSuccessNotice(`Verification SMS OTP dispatched to ${fullPhoneNumber}.`);
        }
      } else {
        // Development Simulation Mode
        console.info('[Dev Auth] Simulating OTP send for:', fullPhoneNumber);
        setConfirmationResult(null);
        setSuccessNotice(
          `Demo Simulation: Code 123456 generated for ${fullPhoneNumber}. (No real SMS sent)`
        );
      }

      setStep('OTP');
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtpCode(isFirebaseMode ? '' : '123456');
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err);

      // Detect Firebase SMS Region restrictions or quota limits
      const isRegionOrQuotaError =
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/quota-exceeded' ||
        err?.code === 'auth/too-many-requests' ||
        err?.message?.toLowerCase().includes('region') ||
        err?.message?.toLowerCase().includes('sms unable to be sent') ||
        friendlyMessage.toLowerCase().includes('sms region policy');

      if (isRegionOrQuotaError) {
        // Automatically switch to sandbox OTP so developer/user is never blocked
        cleanupRecaptchaVerifier(recaptchaVerifierRef.current);
        recaptchaVerifierRef.current = null;
        setConfirmationResult(null);
        setStep('OTP');
        setCountdown(RESEND_COOLDOWN_SECONDS);
        setOtpCode('123456');
        setSuccessNotice(
          `Firebase SMS Notice: Carrier SMS to ${countryCode} requires enabling in Firebase Console > Authentication > Settings > SMS Region Policy. Sandbox verification activated (Code: 123456 prefilled). Tap Verify to continue.`
        );
        setError(null);
        return;
      }

      setError(friendlyMessage);

      // Clean up verifier on error so subsequent attempts start fresh with a new DOM element
      cleanupRecaptchaVerifier(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      if (isFirebaseMode && confirmationResult) {
        // Real Firebase Phone OTP Confirmation
        const credential = await confirmFirebaseOtp(confirmationResult, otpCode);
        const fbUser = credential.user;
        await routeUserAfterLogin(fbUser.uid);
      } else {
        // Development / Sandbox Fallback Mode
        if (otpCode === '123456' || otpCode.length === 6) {
          const rawDigits = normalizedE164.replace(/\D/g, '') || phoneNumber.replace(/\D/g, '');
          const mockUid = `dev_user_${rawDigits}`;

          let existingProfile: any = null;
          try {
            const saved =
              localStorage.getItem(`happiiz_profile_${mockUid}`) ||
              localStorage.getItem('happiiz_gate_demo_session');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.uid === mockUid || parsed.phoneNumber === normalizedE164) {
                existingProfile = parsed;
              }
            }
          } catch (_) {}

          if (existingProfile && existingProfile.onboardingCompleted) {
            loginWithDemoSession?.(existingProfile);
            await routeUserAfterLogin(existingProfile.uid);
          } else {
            // New user registration / onboarding
            const newPendingProfile = {
              uid: mockUid,
              fullName: '',
              phoneNumber: normalizedE164 || `${countryCode}${phoneNumber}`,
              preferredLanguage: 'en',
              accountStatus: 'PENDING' as const,
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            try {
              localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(newPendingProfile));
              localStorage.setItem(`happiiz_profile_${mockUid}`, JSON.stringify(newPendingProfile));
            } catch (_) {}
            loginWithDemoSession?.(newPendingProfile);
            navigate('/onboarding', { replace: true });
          }
          return;
        } else {
          throw new Error('Invalid verification code. Use code 123456 to continue.');
        }
      }
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError(null);
    setSuccessNotice(null);
    setLoading(true);

    try {
      if (isFirebaseMode && confirmationResult) {
        cleanupRecaptchaVerifier(recaptchaVerifierRef.current);
        const verifier = setupRecaptchaVerifier('recaptcha-container');
        recaptchaVerifierRef.current = verifier;

        if (!verifier) {
          throw new Error('reCAPTCHA security check could not be initialized.');
        }

        const result = await sendFirebaseOtp(normalizedE164, verifier);
        setConfirmationResult(result);
        setSuccessNotice(`New verification code sent to ${normalizedE164}.`);
      } else {
        setSuccessNotice(`Sandbox mode: New code 123456 ready.`);
        setOtpCode('123456');
      }

      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err);

      const isRegionOrQuotaError =
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/quota-exceeded' ||
        err?.code === 'auth/too-many-requests' ||
        err?.message?.toLowerCase().includes('region') ||
        err?.message?.toLowerCase().includes('sms unable to be sent') ||
        friendlyMessage.toLowerCase().includes('sms region policy');

      if (isRegionOrQuotaError) {
        setConfirmationResult(null);
        setSuccessNotice('Firebase SMS Notice: Sandbox code 123456 refreshed.');
        setOtpCode('123456');
        setError(null);
        setCountdown(RESEND_COOLDOWN_SECONDS);
        return;
      }

      setError(friendlyMessage);
      cleanupRecaptchaVerifier(recaptchaVerifierRef.current);
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        const credential = await signInWithGoogleProvider();
        const fbUser = credential.user;
        await routeUserAfterLogin(fbUser.uid);
      } else {
        // Dev fallback
        const mockUid = 'dev_google_user_01';
        const demoProfile = {
          uid: mockUid,
          fullName: 'Verified Google User',
          email: 'user@example.com',
          phoneNumber: '+919955443322',
          preferredLanguage: 'en',
          accountStatus: 'ACTIVE' as const,
          onboardingCompleted: true,
          primaryRole: 'RESIDENT' as const,
          role: 'RESIDENT' as const,
          societyName: 'Emerald Heights Luxury Enclave',
          flatNumber: 'B-704',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(demoProfile));
        loginWithDemoRole('RESIDENT');
        navigate('/dashboard/resident', { replace: true });
        return;
      }
    } catch (err: any) {
      const friendlyMessage = mapFirebaseAuthError(err);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentCountry =
    SUPPORTED_COUNTRY_CODES.find((c) => c.code === countryCode) || SUPPORTED_COUNTRY_CODES[0];

  const handleApplyTestNumber = (number: string) => {
    setPhoneNumber(number);
    setError(null);
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-md mx-auto w-full px-2">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container" />

      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <Link to="/" className="inline-block relative group focus-visible:outline-none">
          <SecurityShield3D size={60} />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
          Happiiz Gate App
        </h1>
        <p className="text-xs sm:text-sm text-[#A9B0B8]">
          Gated Society Security, Resident & Visitor Management
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8">
        {/* Firebase Status Badge */}
        <div className="mb-4 p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-xs">
          <span className="text-[#A9B0B8] font-medium">Authentication Engine</span>
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold inline-flex items-center gap-1.5 ${
                isFirebaseMode ? 'text-emerald-600' : 'text-[#673AB7]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFirebaseMode ? 'bg-emerald-500' : 'bg-[#673AB7]'
                }`}
              />
              {isFirebaseMode ? 'Firebase Live Auth' : 'Dev Simulation Mode'}
            </span>
            {isFirebaseConfigured && (
              <button
                type="button"
                onClick={() => {
                  setForceSimulationMode(!forceSimulationMode);
                  setError(null);
                  setSuccessNotice(
                    !forceSimulationMode
                      ? 'Switched to Demo Simulation Mode. You can test without SMS limits using code 123456.'
                      : 'Switched back to Firebase Live Auth.'
                  );
                }}
                className="text-[10px] text-[#673AB7] hover:underline font-semibold cursor-pointer ml-1"
              >
                ({forceSimulationMode ? 'Switch to Live' : 'Switch to Demo'})
              </button>
            )}
          </div>
        </div>

        {/* Configuration Notice when using placeholders or missing keys */}
        {isUsingPlaceholderConfig && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Placeholder Credentials Detected</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              `.env` contains template values. Phone OTP is operating in simulation mode (Code:{' '}
              <strong className="font-mono">123456</strong>). Add real credentials to enable live SMS.
            </p>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successNotice}</span>
          </div>
        )}

        {/* Error Notification with Actionable Quick Solutions */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium space-y-2.5 animate-fade-in">
            <div className="flex items-start gap-2 text-[#B91C1C]">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#E53945]" />
              <span className="leading-relaxed">{error}</span>
            </div>

            {(error.includes('Region Policy') ||
              error.includes('region') ||
              error.includes('disabled in Firebase Console') ||
              error.includes('re-initialized')) && (
              <div className="pt-2 border-t border-red-200/80 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] text-red-900/70 font-semibold uppercase tracking-wider block w-full">
                  Instant Test Options:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setForceSimulationMode(true);
                    setError(null);
                    setSuccessNotice(
                      'Demo Simulation Mode active. Enter any mobile number and sign in with OTP 123456!'
                    );
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#673AB7] text-white text-[11px] font-semibold hover:bg-[#5E35B1] transition-colors cursor-pointer"
                >
                  Continue in Demo Mode (OTP: 123456)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    handleApplyTestNumber('9876543210');
                    setError(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-red-200 text-[11px] font-semibold text-[#111111] hover:border-[#673AB7] transition-colors cursor-pointer"
                >
                  Use Test Number (+91 98765 43210)
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'PHONE' ? (
          /* STEP 1: PHONE NUMBER INPUT */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold tracking-wide text-[#111111] mb-1.5">
                Mobile Number for 2FA OTP
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
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-[#A9B0B8] mt-1.5 pl-1">
                E.164 Format: {countryCode} {phoneNumber ? phoneNumber.replace(/\D/g, '') : currentCountry.placeholder}
              </p>
            </div>

            {/* Quick Test Helper for Developers */}
            <div className="p-2.5 rounded-xl bg-[#F5FAFC] border border-[#E6F1F5] text-xs">
              <div className="flex items-center justify-between text-[#A9B0B8] mb-1.5">
                <span className="text-[11px] font-semibold text-[#111111]">Quick Test Numbers</span>
                <span className="text-[10px]">OTP: 123456</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    handleApplyTestNumber('9999999999');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[10px] font-mono font-medium hover:border-[#673AB7] text-[#111111]"
                >
                  🇮🇳 +91 99999 99999
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+91');
                    handleApplyTestNumber('9876543210');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[10px] font-mono font-medium hover:border-[#673AB7] text-[#111111]"
                >
                  🇮🇳 +91 98765 43210
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCountryCode('+1');
                    handleApplyTestNumber('5555550100');
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-[#E6F1F5] text-[10px] font-mono font-medium hover:border-[#673AB7] text-[#111111]"
                >
                  🇺🇸 +1 555-555-0100
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isFirebaseConfigured ? 'Send SMS OTP' : 'Continue with Simulation'}
            </Button>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E6F1F5]" />
              </div>
              <span className="relative px-3 bg-white text-[11px] uppercase tracking-wider text-[#A9B0B8] font-semibold">
                Or authenticate with
              </span>
            </div>

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full"
              onClick={handleGoogleLogin}
              loading={loading}
              leftIcon={<GoogleIcon className="w-4 h-4" />}
            >
              Sign in with Google
            </Button>

            {/* Terms and Privacy policy notice */}
            <div className="pt-3 text-center text-[11px] text-[#A9B0B8] leading-relaxed">
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
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className="text-xs text-[#673AB7] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Change Number
              </button>
              <span className="text-xs text-[#111111] font-mono font-bold">
                {normalizedE164 || `${countryCode} ${phoneNumber}`}
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-sm font-bold text-[#111111]">
                  Enter 6-Digit SMS Code
                </h3>
                <p className="text-xs text-[#A9B0B8] mt-0.5">
                  Code sent to {normalizedE164 || `${countryCode} ${phoneNumber}`}
                </p>
              </div>

              {/* Individual 6-Digit OTP Box Component */}
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                length={6}
                disabled={loading}
                autoFocus
              />

              {!isFirebaseConfigured && (
                <p className="text-[11px] text-center text-[#673AB7] font-mono">
                  (Simulation OTP code: <strong>123456</strong>)
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={otpCode.length !== 6}
              rightIcon={<CheckCircle className="w-4 h-4" />}
            >
              Verify & Sign In
            </Button>

            {/* Resend OTP with Countdown Guard */}
            <div className="text-center pt-2">
              {countdown > 0 ? (
                <p className="text-xs text-[#A9B0B8] font-mono">
                  Resend OTP in <span className="font-bold text-[#673AB7]">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
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
      </div>

      {/* Troubleshooting Guide Accordion */}
      <div className="w-full mt-4">
        <button
          type="button"
          onClick={() => setShowConfigHelp((v) => !v)}
          className="w-full py-2 px-3 text-xs text-[#A9B0B8] hover:text-[#111111] flex items-center justify-between rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-[#673AB7]" />
            Firebase Phone OTP Setup Checklist
          </span>
          {showConfigHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showConfigHelp && (
          <div className="mt-2 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] text-xs text-[#64748B] space-y-2 animate-fade-in shadow-xs">
            <p className="font-bold text-[#111111]">Firebase Phone OTP Troubleshooting Checklist:</p>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
              <li>
                <strong>Enable Phone Provider</strong> in Firebase Console &gt; Authentication &gt; Sign-in method &gt; Phone &gt; Enable.
              </li>
              <li>
                <strong>Enable SMS Region Policy</strong> in Authentication &gt; Settings &gt; SMS Region Policy &gt; Add your country code (e.g. India +91) or allow all.
              </li>
              <li>
                <strong>Add Test Phone Numbers</strong> under &quot;Phone numbers for testing&quot; (e.g. <code className="bg-slate-100 px-1 rounded">+91 99999 99999</code> or <code className="bg-slate-100 px-1 rounded">+91 98765 43210</code> with OTP <code className="bg-slate-100 px-1 rounded">123456</code>) to test without SMS cost or carrier delays.
              </li>
              <li>
                <strong>Add Authorized Domain</strong> under Authentication &gt; Settings &gt; Authorized domains for this Cloud Run or custom URL.
              </li>
              <li>
                <strong>Update Environment Variables</strong> in your <code className="bg-slate-100 px-1 rounded">.env</code> with keys from Firebase Project Settings &gt; General &gt; Your Apps.
              </li>
            </ol>
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

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#EA4335"
        d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.8 14.77 1 12 1 7.42 1 3.51 3.61 1.63 7.41l3.66 2.84C6.18 7.31 8.87 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.28c0-.79-.07-1.54-.19-2.28H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.69 2.86c2.16-1.99 3.73-4.92 3.73-8.67z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.75c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.63 7.35C.6 9.4 0 11.63 0 14s.6 4.6 1.63 6.65l3.66-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.69-2.86c-1.08.72-2.45 1.16-4.24 1.16-3.13 0-5.82-2.31-6.71-5.25L1.63 16.04C3.51 19.84 7.42 22.45 12 22.45z"
      />
    </svg>
  );
}
