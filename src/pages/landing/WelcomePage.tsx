/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gate3DIllustration } from '../../components/visuals/Gate3DIllustration';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Home,
  Wrench,
  Smartphone,
  Lock,
} from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLaunchPortal = (path: string, demoRole?: 'SECURITY_GUARD' | 'RESIDENT' | 'SERVICE_PARTNER') => {
    if (user) {
      navigate(path);
    } else if (demoRole) {
      // Direct navigation to portal (will route to login if unauthenticated or demo session)
      navigate(`/login?returnTo=${encodeURIComponent(path)}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
      {/* ======================================================== */}
      {/* 2. MAIN HERO SECTION */}
      {/* ======================================================== */}
      <section className="relative pt-2 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & Primary Entry */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] text-[#673AB7] text-xs font-bold">
              <SparkleIcon className="w-3.5 h-3.5 text-[#673AB7]" />
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
              Happiiz Gate is a mobile-first Progressive Web Application unifying
              Gate Operations, Resident Authorizations, and Verified Service Providers
              into a single high-performance platform.
            </p>

            {/* Hero CTAs removed per specification: Keep one Login button in top-right navigation */}
          </div>

          {/* Right Column: 3D Gate Vector Visual */}
          <div className="lg:col-span-6 flex justify-center">
            <Gate3DIllustration className="w-full max-w-md sm:max-w-lg" />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MAIN APPLICATION ENTRY OPTIONS */}
      {/* ======================================================== */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#673AB7] bg-[#F1F9FC] border border-[#E6F1F5] px-3 py-1 rounded-full">
            Main Application Entry Points
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
            Choose Your Access Portal
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Select your dedicated terminal for gate security, household management, or vendor services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Gate Guard */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] p-6 shadow-xs hover:shadow-md hover:border-[#673AB7]/40 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Gate Operations
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#673AB7] transition-colors">
                  Gate Guard
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Real-time barrier control, visitor pass validation, cab & delivery clearance, and emergency alarm trigger.
                </p>
              </div>

              <div className="pt-3 border-t border-[#E6F1F5] space-y-1.5 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>6-Digit Pass Code Entry & Fast Keypad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Instant QR Code Camera Scanner</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Walk-in Doorbell Request to Residents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>One-Touch Siren & Security Directory</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#E6F1F5]">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => handleLaunchPortal('/dashboard/guard', 'SECURITY_GUARD')}
              >
                Launch Gate Guard →
              </Button>
            </div>
          </div>

          {/* Card 2: Resident Portal */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] p-6 shadow-xs hover:shadow-md hover:border-[#673AB7]/40 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Resident Hub
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#673AB7] transition-colors">
                  Resident Portal
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Pre-approve visitors, receive instant gate doorbell notifications, manage vehicles, book amenities, and pay society dues.
                </p>
              </div>

              <div className="pt-3 border-t border-[#E6F1F5] space-y-1.5 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#673AB7] shrink-0" />
                  <span>Digital Gate Pass with QR Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#673AB7] shrink-0" />
                  <span>Live Doorbell Authorization Modal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#673AB7] shrink-0" />
                  <span>Household Members & Domestic Staff Pass</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#673AB7] shrink-0" />
                  <span>Emergency Panic SOS Alarm System</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#E6F1F5]">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => handleLaunchPortal('/dashboard/resident', 'RESIDENT')}
              >
                Open Resident Portal →
              </Button>
            </div>
          </div>

          {/* Card 3: Service Partner */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] p-6 shadow-xs hover:shadow-md hover:border-[#673AB7]/40 transition-all duration-200 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Vendor & Service
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0EA5E9] flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#673AB7] transition-colors">
                  Service Partner
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Accept verified service bookings, view assigned gate clearance passes, track job progress, and issue verified invoices.
                </p>
              </div>

              <div className="pt-3 border-t border-[#E6F1F5] space-y-1.5 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <span>Work Order Acceptance & Scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <span>Gate Clearance Code for Technicians</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <span>Job Progress Lifecycle Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <span>Automated Resident Invoice Generation</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[#E6F1F5]">
              <Button
                variant="primary"
                size="md"
                className="w-full text-xs font-bold"
                onClick={() => handleLaunchPortal('/dashboard/service-partner', 'SERVICE_PARTNER')}
              >
                Enter Partner Hub →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. RELEVANT EXISTING HOMEPAGE CONTENT */}
      {/* ======================================================== */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
            Engineered for Modern Security
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Enterprise-grade infrastructure delivering reliability, speed, and peace of mind.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 bg-[#FFFFFF] border-[#E6F1F5]">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0EA5E9] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#111111]">
              Mobile-First PWA
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Installable on Android, iOS, tablets, and desktop directly via the browser. Zero app store friction with offline operational resilience.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-[#FFFFFF] border-[#E6F1F5]">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#111111]">
              Fortified Gate Security
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              High-speed visitor OTP confirmation, delivery vehicle logging, cab verification, and one-touch SOS dispatch for guards and residents.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-[#FFFFFF] border-[#E6F1F5]">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#111111]">
              Cloud & Firebase Ready
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Cloud Firestore, Firebase Authentication, Cloud Storage, and multi-tenant security rules with zero cross-society data leakage.
            </p>
          </Card>
        </div>
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
