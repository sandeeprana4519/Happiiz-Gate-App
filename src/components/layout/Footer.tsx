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
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer className="w-full bg-[#FFFFFF] border-t border-[#E6F1F5] text-[#64748B] pt-12 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Column 1: Brand & Overview (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <SecurityShield3D size={32} />
                <span className="text-lg font-bold tracking-tight text-[#111111] group-hover:text-[#673AB7] transition-colors">
                  Happiiz Gate
                </span>
              </Link>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-sm">
                Next-generation smart-gate security, automated visitor authorization,
                and unified residential community operations platform.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-[#111111]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] text-[#673AB7]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#673AB7]" />
                  Bank-Grade Security
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] text-[#0EA5E9]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0EA5E9]" />
                  Offline-Ready PWA
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] text-[#10B981]">
                  Multi-Tenant RBAC
                </span>
              </div>
            </div>

            {/* Column 2: Public Portals (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Public Portals
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/dashboard/guard"
                    className="hover:text-[#673AB7] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Gate Guard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/resident"
                    className="hover:text-[#673AB7] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Resident Portal</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/service-partner"
                    className="hover:text-[#673AB7] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Service Partner</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Administration & Master Control (3 cols on lg) */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#673AB7]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Administrative Access
                </h4>
              </div>
              <p className="text-[11px] text-[#A9B0B8]">
                Restricted access for verified management committee and platform administrators.
              </p>
              <div className="space-y-2 pt-1">
                <Link
                  to="/login?role=SOCIETY_ADMIN"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] hover:border-[#673AB7]/50 hover:bg-white text-xs font-semibold text-[#111111] group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#673AB7]" />
                    <span>Society Admin Login</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#A9B0B8] group-hover:text-[#673AB7] group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/login?role=SUPER_ADMIN"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] hover:border-[#673AB7]/50 hover:bg-white text-xs font-semibold text-[#111111] group transition-all"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#E53945]" />
                    <span>Super Admin Login</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#A9B0B8] group-hover:text-[#673AB7] group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>

            {/* Column 4: Contact & Help (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Contact & Support
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2 text-[#64748B]">
                  <Mail className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
                  <span className="truncate">support@happiizgate.com</span>
                </li>
                <li className="flex items-center gap-2 text-[#64748B]">
                  <Phone className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
                  <span>+91 1800-HAPPIIZ</span>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-[#673AB7] transition-colors text-xs"
                  >
                    Helpdesk Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Sub-Footer Divider & Legal Links */}
          <div className="pt-6 border-t border-[#E6F1F5] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A9B0B8]">
            <p className="order-2 sm:order-1 text-center sm:text-left">
              &copy; {new Date().getFullYear()} Happiiz Gate Inc. All rights reserved.
            </p>

            <div className="order-1 sm:order-2 flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-[#673AB7] transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-[#673AB7] transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-[#E6F1F5] hidden sm:inline">|</span>
              <span className="text-[11px] text-[#A9B0B8] hidden sm:inline">
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
