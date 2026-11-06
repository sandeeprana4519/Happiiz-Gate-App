/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../../types/auth';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
} from 'lucide-react';

export const RolesPermissionsSection: React.FC = () => {
  const rolesMatrix: {
    role: UserRole;
    name: string;
    description: string;
    tier: 'PLATFORM_ROOT' | 'TENANT_ADMIN' | 'SENTINEL' | 'END_USER' | 'VENDOR';
    permissions: string[];
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }[] = [
    {
      role: 'SUPER_ADMIN',
      name: 'Super Admin (Root Operator)',
      description: 'Platform owner with unrestricted tenant management, billing configuration, and security oversight',
      tier: 'PLATFORM_ROOT',
      permissions: [
        'Provision and suspend tenant societies',
        'Approve management committee applications',
        'Direct Cloud Firestore security rule audits',
        'Assign and extend SaaS subscription tiers',
        'Trigger network-wide emergency sirens and broadcasts',
        'Access immutable administrative audit logs',
      ],
      riskLevel: 'CRITICAL',
    },
    {
      role: 'SOCIETY_ADMIN',
      name: 'Society Admin (Management Committee)',
      description: 'Authorized representative for a specific gated community enclave',
      tier: 'TENANT_ADMIN',
      permissions: [
        'Approve and reject resident flat registrations',
        'Approve security guard employment and gate posts',
        'Manage community notice boards and helpdesk issues',
        'Publish society dues and facility booking slots',
      ],
      riskLevel: 'HIGH',
    },
    {
      role: 'SECURITY_GUARD',
      name: 'Security Sentinel (Gatekeeper)',
      description: 'Gate checkpoint operator managing physical visitor ingress and egress',
      tier: 'SENTINEL',
      permissions: [
        '6-digit digital keypad passcode verification',
        'Vehicle registration plate and delivery capture',
        'Trigger local gate SOS emergency broadcast',
        'Log visitor entry and departure timestamps',
      ],
      riskLevel: 'MEDIUM',
    },
    {
      role: 'RESIDENT',
      name: 'Resident (Owner / Tenant)',
      description: 'Apartment resident managing visitor approvals and household access',
      tier: 'END_USER',
      permissions: [
        'Pre-approve guest, cab, and delivery gate passes',
        'Receive instant real-time gate entry prompts',
        'Raise complaints and book society amenities',
        'Pay society maintenance dues',
      ],
      riskLevel: 'LOW',
    },
    {
      role: 'SERVICE_PARTNER',
      name: 'Service Partner (Contractor / Daily Help)',
      description: 'Authorized daily help, technician, or commercial vendor',
      tier: 'VENDOR',
      permissions: [
        'Multi-society authorized digital badge entry',
        'Receive society work orders and technician bookings',
        'View platform commission and settlement ledger',
      ],
      riskLevel: 'LOW',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-[#111111]">Multi-Tenant Roles & RBAC Matrix</h2>
        <p className="text-xs text-[#A9B0B8]">
          Granular role-based security boundaries, capability templates, and platform elevation barriers
        </p>
      </div>

      {/* Security Hardening Advisory */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-extrabold text-[#673AB7]">
          <ShieldAlert className="w-4 h-4" />
          <span>Zero-Trust Role Elevation Architecture</span>
        </div>
        <p className="text-[#111111] leading-relaxed">
          Public client-side role modification is strictly prohibited by Firestore Security Rules.
          Super Admin and Society Admin privileges are enforced via server-validated document signatures.
          Any unauthorized attempt to overwrite <code className="font-mono font-bold">role</code> or{' '}
          <code className="font-mono font-bold">isSuperAdmin</code> is rejected by database rules.
        </p>
      </div>

      {/* Roles Cards */}
      <div className="space-y-4">
        {rolesMatrix.map((r) => (
          <div
            key={r.role}
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6F1F5] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                    r.role === 'SUPER_ADMIN'
                      ? 'bg-[#673AB7]'
                      : r.role === 'SOCIETY_ADMIN'
                      ? 'bg-purple-600'
                      : r.role === 'SECURITY_GUARD'
                      ? 'bg-emerald-600'
                      : 'bg-slate-700'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#111111]">{r.name}</h3>
                  <p className="text-xs text-[#A9B0B8]">{r.description}</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${
                  r.riskLevel === 'CRITICAL'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : r.riskLevel === 'HIGH'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {r.riskLevel} PRIVILEGE LEVEL
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-[#A9B0B8] font-bold uppercase tracking-wider block">
                Enforced Capabilities & Security Boundaries:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {r.permissions.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-xs text-[#111111]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
