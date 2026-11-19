/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SecurityShield3D } from '../visuals/SecurityShield3D';
import { LegalModal } from '../common/LegalModal';
import {
  ShieldCheck,
  Lock,
  Building2,
  ShieldAlert,
  UsersRound,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer className="w-full bg-[#07090E] border-t border-white/10 text-gray-300 pt-14 pb-8 mt-auto shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Column 1: Brand & Overview (3 cols on lg) */}
            <div className="lg:col-span-3 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <SecurityShield3D size={32} />
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-purple-400 transition-colors">
                  Happiiz Gate
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Next-generation smart-gate security, automated visitor authorization,
                and unified residential community operations platform.
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[11px] font-medium text-gray-400">
                <span>Bank-Grade Security</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>Offline-Ready PWA</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>Multi-Tenant RBAC</span>
              </div>
            </div>

            {/* Column 2: Mobile Apps & Portals (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Mobile &amp; Resident Apps
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link
                    to="/guard"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:underline underline-offset-4">Gate Guard App</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/supporter"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:underline underline-offset-4">Digital Supporter App</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/partner"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:underline underline-offset-4">Service Partner App</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/resident"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:underline underline-offset-4">Resident Portal</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 group"
                  >
                    <span className="group-hover:underline underline-offset-4">Unified Login</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Administrative Access (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Administrative Access
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Dedicated web portals for society administrators, security supervisors, assigned staff, and platform executives.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <Link
                  to="/login?role=SOCIETY_ADMIN"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#111726] border border-white/10 hover:border-purple-500/60 hover:bg-[#171F33] text-gray-100 group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-white truncate">
                        Society Admin
                      </span>
                      <span className="block text-[10px] text-gray-400 truncate">
                        Society Operations
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                <Link
                  to="/login?role=SECURITY_STAFF"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#111726] border border-white/10 hover:border-emerald-500/60 hover:bg-[#171F33] text-gray-100 group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-white truncate">
                        Security Staff
                      </span>
                      <span className="block text-[10px] text-gray-400 truncate">
                        Gate &amp; ANPR Control
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                <Link
                  to="/login?role=PLATFORM_STAFF"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#111726] border border-white/10 hover:border-indigo-400/60 hover:bg-[#171F33] text-gray-100 group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center shrink-0">
                      <UsersRound className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-white truncate">
                        Admin Platform Staff
                      </span>
                      <span className="block text-[10px] text-gray-400 truncate">
                        Platform Team Portal
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                <Link
                  to="/login?role=SUPER_ADMIN"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#111726] border border-white/10 hover:border-red-500/60 hover:bg-[#171F33] text-gray-100 group transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-white truncate">
                        Super Admin
                      </span>
                      <span className="block text-[10px] text-gray-400 truncate">
                        Master Control
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </div>
              <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px]">
                <Link
                  to="/login?role=SOCIETY_STAFF"
                  className="text-teal-400 hover:text-teal-300 font-semibold hover:underline underline-offset-4 transition-colors"
                >
                  Society Staff Login &rarr;
                </Link>
              </div>
            </div>

            {/* Column 4: Contact & Support (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Contact & Support
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2 text-gray-300">
                  <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">support@happiizgate.com</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>+91 1800-HAPPIIZ</span>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors text-xs"
                  >
                    Helpdesk Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Sub-Footer Divider & Legal Links */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p className="order-2 sm:order-1 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Happiiz Gate Inc. All rights reserved.
            </p>

            <div className="order-1 sm:order-2 flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-white/20 hidden sm:inline">|</span>
              <span className="text-[11px] text-gray-400 hidden sm:inline">
                Mobile Number + OTP Protected
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms & Privacy Modal */}
      {legalModal && (
        <LegalModal
          isOpen={true}
          onClose={() => setLegalModal(null)}
          type={legalModal}
        />
      )}
    </>
  );
};
