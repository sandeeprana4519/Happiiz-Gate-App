/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ShieldCheck } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'terms' ? 'Terms of Service' : 'Privacy & Security Policy'}
      description="Happiiz Gate App — Gated Society Access & Security Governance"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span className="font-semibold">
            Enterprise Zero-Trust Society Security Standards
          </span>
        </div>

        {type === 'terms' ? (
          <>
            <p>
              By accessing or using Happiiz Gate App, you agree to be bound by these
              Terms. The platform provides Society Management, Resident Authentication,
              Guard Sentinel Verification, and Facility Operations.
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white pt-2">
              1. Identity & Account Permissions
            </h4>
            <p>
              All accounts must be verified through two-factor authentication (Phone OTP
              or verified Google OAuth). Access to society records, visitor gate passes,
              and resident information is governed by Role-Based Access Control (RBAC).
              Unauthorized privilege escalation or fraudulent gate clearance is strictly
              prohibited.
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white pt-2">
              2. Gate Pass & Visitor Verification
            </h4>
            <p>
              Security guards are authorized only to inspect permitted visitor credentials
              and log arrival/departure timestamps. Residents are solely responsible for
              pre-approving guests, domestic workers, and deliveries to their flat units.
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white pt-2">
              3. Service Availability
            </h4>
            <p>
              Happiiz Gate operates offline-first through Progressive Web App (PWA)
              caching, synchronizing security gate logs once network connectivity is
              restored.
            </p>
          </>
        ) : (
          <>
            <p>
              Your privacy is critical to us. Happiiz Gate App complies with
              applicable data protection principles and enforces strict isolation of
              Personally Identifiable Information (PII).
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white pt-2">
              1. Information We Collect
            </h4>
            <p>
              We collect your verified phone number, name, society membership
              assignment (Wing and Flat number), and gate entry logs. We never store
              passwords or unencrypted OTP tokens in Firestore databases.
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white pt-2">
              2. Data Isolation & Privacy
            </h4>
            <p>
              Residents can only view visitor history and records belonging to their
              own flat. Security guards cannot access financial ledgers or unrelated
              resident contact details.
            </p>
            <h4 className="font-bold text-slate-900 dark:text-white pt-2">
              3. Account Deletion Rights
            </h4>
            <p>
              Users may request profile deletion or removal of society membership at
              any time through the Profile Settings screen.
            </p>
          </>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
        <Button variant="primary" size="md" className="w-full" onClick={onClose}>
          I Understand & Agree
        </Button>
      </div>
    </Modal>
  );
};
