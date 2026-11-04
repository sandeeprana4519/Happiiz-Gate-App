/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gate3DIllustration } from '../../components/visuals/Gate3DIllustration';
import { SecurityShield3D } from '../../components/visuals/SecurityShield3D';
import { Button } from '../../components/common/Button';
import { Card, GlassCard } from '../../components/common/Card';
import { USER_ROLES } from '../../config/constants';
import { UserRole } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Smartphone,
  Zap,
  Lock,
  ArrowRight,
  Download,
  Building,
  KeyRound,
  Users,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const WelcomePage: React.FC = () => {
  const { loginWithDemoRole } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, install } = usePWAInstall();

  const handleRoleQuickStart = (role: UserRole) => {
    loginWithDemoRole(role);
    navigate(USER_ROLES[role].defaultPath);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-2 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] text-[#673AB7] text-xs font-bold">
              <SparkleIcon className="w-3.5 h-3.5" />
              <span>Next-Gen Society & Gate Security Management</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] leading-[1.15]">
              Seamless Access.{' '}
              <span className="text-[#673AB7]">
                Fortified Gates.
              </span>{' '}
              Elevated Living.
            </h1>

            <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Happiiz Gate App is a mobile-first Progressive Web Application unifying
              Gate Security, Resident Management, Visitor Passes, and Facility Operations
              into a single high-performance platform.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link to="/login">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Access Terminal / Login
                </Button>
              </Link>

              {isInstallable ? (
                <Button
                  size="lg"
                  variant="glass"
                  leftIcon={<Download className="w-4 h-4 text-sky-500" />}
                  onClick={install}
                >
                  Install PWA
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="glass"
                  onClick={() => handleRoleQuickStart('RESIDENT')}
                >
                  Instant Resident Preview
                </Button>
              )}
            </div>

            {/* Quick Trust Pillars */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-800/80 text-left">
              <div>
                <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  &lt; 3.2s
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Gate Check-In Speed
                </p>
              </div>
              <div>
                <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  100%
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  PWA Offline Cache
                </p>
              </div>
              <div>
                <p className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  5 Roles
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  RBAC Architecture
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Isometric Gate Vector Visual */}
          <div className="lg:col-span-6 flex justify-center">
            <Gate3DIllustration className="w-full max-w-md sm:max-w-lg" />
          </div>
        </div>
      </section>

      {/* Role Switcher & Live Previews */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Architected for Every Stakeholder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Select any role to test the dedicated dashboard experience and permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(USER_ROLES) as UserRole[]).map((roleKey) => {
            const role = USER_ROLES[roleKey];
            return (
              <GlassCard
                key={roleKey}
                elevated
                className="flex flex-col justify-between hover:border-sky-500/50 transition-all duration-200 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${role.badgeColor}`}
                    >
                      {role.label}
                    </span>
                    <KeyRound className="w-4 h-4 text-slate-400 group-hover:text-sky-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {role.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {role.description}
                    </p>
                  </div>
                  <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {role.capabilities.map((cap, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        <span className="truncate">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="glass"
                    size="sm"
                    className="w-full text-xs font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    onClick={() => handleRoleQuickStart(roleKey)}
                  >
                    Open {role.label} Dashboard →
                  </Button>
                </div>
              </GlassCard>
            );
          })}

          {/* SaaS Multi-Society Highlight */}
          <Card className="flex flex-col justify-between bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border-sky-500/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Enterprise
                </span>
                <Building className="w-4 h-4 text-sky-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                Multi-Tenant Cloud
              </h3>
              <p className="text-xs text-slate-300">
                Deployable across gated residential complexes, commercial IT parks,
                and high-density townships with unified management.
              </p>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-sky-400/20 text-[11px] text-sky-300 space-y-1">
                <div>✓ Centralized Guard Terminals</div>
                <div>✓ Instant WhatsApp & Push Notifications</div>
                <div>✓ Hostinger Single Page App Certified</div>
              </div>
            </div>
            <div className="pt-4 mt-4">
              <Link to="/login" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  Login with Mobile OTP
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Mobile-First PWA
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Installable on Android, iOS, tablets, and desktops directly through the
            browser. Zero app store friction with offline support.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Fortified Gate Security
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            High-speed visitor OTP confirmation, delivery vehicle logging, and
            one-touch SOS dispatch for gate guards and residents.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Firebase & Cloud Ready
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Cloud Firestore, Firebase Authentication, Cloud Storage, and FCM
            push notifications with strict role-based access rules.
          </p>
        </Card>
      </section>
    </div>
  );
};

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
  );
}
