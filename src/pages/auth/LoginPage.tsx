/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { GlassCard } from '../../components/common/Card';
import { OtpInput } from '../../components/common/OtpInput';
import { LegalModal } from '../../components/common/LegalModal';
import { SecurityShield3D } from '../../components/visuals/SecurityShield3D';
import { USER_ROLES } from '../../config/constants';
import {
  setupRecaptchaVerifier,
  sendFirebaseOtp,
  confirmFirebaseOtp,
  signInWithGoogleProvider,
} from '../../services/firebase/auth.service';
import {
  getFirestoreUserProfile,
  getUserSocietyMemberships,
  getServicePartnerProfile,
  saveFirestoreUserProfile,
} from '../../services/firebase/firestore.service';
import {
  Phone,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { type ConfirmationResult, type RecaptchaVerifier } from 'firebase/auth';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', label: 'India (+91)' },
  { code: '+1', flag: '🇺🇸', label: 'USA / Canada (+1)' },
  { code: '+44', flag: '🇬🇧', label: 'UK (+44)' },
  { code: '+971', flag: '🇦🇪', label: 'UAE (+971)' },
  { code: '+65', flag: '🇸🇬', label: 'Singapore (+65)' },
  { code: '+61', flag: '🇦🇺', label: 'Australia (+61)' },
];

const RESEND_COOLDOWN_SECONDS = 45;

export const LoginPage: React.FC = () => {
  const { user, isFirebaseConfigured, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Login Flow Step
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  // Input States
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Firebase Confirmation & Verifier Ref
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  // Initialize invisible RecaptchaVerifier
  useEffect(() => {
    if (isFirebaseConfigured && !recaptchaVerifierRef.current) {
      try {
        const verifier = setupRecaptchaVerifier('recaptcha-container');
        recaptchaVerifierRef.current = verifier;
      } catch (e) {
        console.warn('Recaptcha initialization notice:', e);
      }
    }
  }, [isFirebaseConfigured]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle redirect after authenticated
  const routeUserAfterLogin = async (uid: string) => {
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
      // Pending approvals
      navigate('/status/pending', { replace: true });
      return;
    }

    if (activeMemberships.length > 1) {
      // Belongs to multiple societies
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

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 8 || cleanDigits.length > 15) {
      setError('Please enter a valid mobile number (between 8 and 15 digits).');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanDigits}`;
    setLoading(true);

    try {
      if (isFirebaseConfigured) {
        // Ensure recaptcha verifier exists
        let verifier = recaptchaVerifierRef.current;
        if (!verifier) {
          verifier = setupRecaptchaVerifier('recaptcha-container');
          recaptchaVerifierRef.current = verifier;
        }

        if (!verifier) {
          throw new Error('reCAPTCHA security check could not be initialized.');
        }

        const result = await sendFirebaseOtp(fullPhoneNumber, verifier);
        setConfirmationResult(result);
      } else {
        // Development mode when Firebase environment variables are not yet configured
        console.info('[Dev Auth] Simulating OTP send for:', fullPhoneNumber);
      }

      setStep('OTP');
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your connection and number.');
      // Reset reCAPTCHA on failure
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.render().then((widgetId: any) => {
            (window as any).grecaptcha?.reset(widgetId);
          });
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    try {
      if (isFirebaseConfigured && confirmationResult) {
        const credential = await confirmFirebaseOtp(confirmationResult, otpCode);
        const fbUser = credential.user;
        await routeUserAfterLogin(fbUser.uid);
      } else {
        // Dev fallback simulation
        if (otpCode === '123456' || otpCode.length === 6) {
          const mockUid = `dev_user_${cleanPhoneNumber(phoneNumber)}`;
          // Save a demo session
          const demoProfile = {
            uid: mockUid,
            fullName: 'Verified Resident User',
            phoneNumber: `${countryCode}${cleanPhoneNumber(phoneNumber)}`,
            preferredLanguage: 'en',
            accountStatus: 'ACTIVE' as const,
            onboardingCompleted: true,
            primaryRole: 'RESIDENT' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(demoProfile));
          await routeUserAfterLogin(mockUid);
        } else {
          throw new Error('Invalid OTP. Use test code 123456 or real Firebase credentials.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError(null);
    setLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${cleanPhoneNumber(phoneNumber)}`;
      if (isFirebaseConfigured && recaptchaVerifierRef.current) {
        const result = await sendFirebaseOtp(fullPhoneNumber, recaptchaVerifierRef.current);
        setConfirmationResult(result);
      }
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        localStorage.setItem('happiiz_gate_demo_session', JSON.stringify(demoProfile));
        await routeUserAfterLogin(mockUid);
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const cleanPhoneNumber = (val: string) => val.replace(/\D/g, '');

  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center py-6 sm:py-10 max-w-md mx-auto w-full px-2">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container" />

      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <Link to="/" className="inline-block relative group focus-visible:outline-none">
          <SecurityShield3D size={60} />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Happiiz Gate App
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Gated Society Security, Resident & Visitor Management
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8">
        {/* Firebase Status Kicker */}
        <div className="mb-5 p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-xs">
          <span className="text-[#A9B0B8] font-medium">
            Authentication Engine
          </span>
          <span
            className={`font-semibold inline-flex items-center gap-1.5 ${
              isFirebaseConfigured ? 'text-emerald-600' : 'text-[#673AB7]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isFirebaseConfigured ? 'bg-emerald-500' : 'bg-[#673AB7]'
              }`}
            />
            {isFirebaseConfigured ? 'Firebase Live Auth' : 'Dev Simulation Mode'}
          </span>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E53945] font-medium flex items-start gap-2 animate-fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
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
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>

                <Input
                  type="tel"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  autoFocus
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 pl-1">
                We will send an instant 6-digit SMS verification code to this number.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send SMS OTP
            </Button>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
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
            <div className="pt-4 text-center text-[11px] text-[#A9B0B8] leading-relaxed">
              By proceeding, you agree to the Happiiz Gate{' '}
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="text-[#673AB7] hover:underline font-semibold"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="text-[#673AB7] hover:underline font-semibold"
              >
                Privacy Policy
              </button>
              .
            </div>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP VERIFICATION */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setError(null);
                }}
                className="text-xs text-sky-500 hover:text-sky-400 inline-flex items-center gap-1 font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Change Number
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {countryCode} {phoneNumber}
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Enter 6-Digit SMS Code
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Code sent to {countryCode} {cleanPhoneNumber(phoneNumber)}
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
                <p className="text-[11px] text-center text-sky-400 font-mono">
                  (Dev simulation code: <strong>123456</strong>)
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

            {/* Resend OTP with 45s Countdown Guard */}
            <div className="text-center pt-2">
              {countdown > 0 ? (
                <p className="text-xs text-slate-400 font-mono">
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
