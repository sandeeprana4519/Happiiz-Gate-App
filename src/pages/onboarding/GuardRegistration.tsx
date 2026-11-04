/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Society } from '../../types/society';
import {
  getAllSocieties,
  addSocietyMembership,
  createAccessRequest,
  updateFirestoreUserProfile,
} from '../../services/firebase/firestore.service';
import {
  ShieldCheck,
  Building,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  BadgeAlert,
  IdCard,
} from 'lucide-react';

export const GuardRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [gateAssigned, setGateAssigned] = useState('Gate #1 (North Main)');
  const [agencyName, setAgencyName] = useState('SIS Security Services');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const list = await getAllSocieties();
      setSocieties(list);
      if (list.length > 0) {
        setSelectedSocietyId(list[0].id);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please enter your Security Guard Employee / Badge ID.');
      return;
    }

    const society = societies.find((s) => s.id === selectedSocietyId);
    if (!society || !user?.uid) {
      setError('Please select a valid residential society.');
      return;
    }

    setLoading(true);
    try {
      const requestId = `REQ-SEC-${Date.now()}`;

      // 1. Create membership record with status: PENDING
      await addSocietyMembership({
        uid: user.uid,
        societyId: society.id,
        societyName: society.societyName,
        societyCode: society.societyCode,
        role: 'SECURITY_GUARD',
        membershipStatus: 'PENDING',
        employmentId: employeeId.trim(),
        gateAssigned,
        joinedAt: new Date().toISOString(),
      });

      // 2. Create access request document for Society Admin review
      await createAccessRequest({
        id: requestId,
        uid: user.uid,
        applicantName: user.fullName || 'Security Sentinel Applicant',
        phoneNumber: user.phoneNumber || '',
        email: user.email,
        requestedRole: 'SECURITY_GUARD',
        societyId: society.id,
        societyName: society.societyName,
        requestData: {
          employmentId: employeeId.trim(),
          gateAssigned,
          additionalNotes: `Agency: ${agencyName}. Invitation code provided: ${invitationCode || 'None'}.`,
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 3. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'SECURITY_GUARD',
        accountStatus: 'PENDING',
        onboardingCompleted: true,
      });

      await refreshUserProfile();
      navigate('/status/pending', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to submit security guard registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6 px-2">
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-1.5 text-xs text-sky-500 font-semibold hover:text-sky-400"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Role Selection
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          <span>Security Guard Onboarding</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Request authorization for gate sentinel terminal credentials.
        </p>
      </div>

      <GlassCard elevated className="border-sky-500/20 p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Assigned Residential Society
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <select
                value={selectedSocietyId}
                onChange={(e) => setSelectedSocietyId(e.target.value)}
                className="w-full min-h-[44px] h-11 rounded-xl pl-10 pr-3.5 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                required
              >
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.societyName} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Guard Employee / Badge ID"
              placeholder="e.g. SEC-G-401"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
            <Input
              label="Security Agency / Vendor"
              placeholder="e.g. SIS, G4S, Apex"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Preferred Gate Checkpoint
            </label>
            <select
              value={gateAssigned}
              onChange={(e) => setGateAssigned(e.target.value)}
              className="w-full min-h-[44px] h-11 rounded-xl px-3.5 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-500"
            >
              <option value="Gate #1 (North Main)">Gate #1 (North Main)</option>
              <option value="Gate #2 (Service & Commercial Trucks)">Gate #2 (Service & Commercial Trucks)</option>
              <option value="Gate #3 (South Pedestrian Gate)">Gate #3 (South Pedestrian Gate)</option>
            </select>
          </div>

          <Input
            label="Society Guard Invitation Code (Optional)"
            placeholder="e.g. EMR-GUARD-2026"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            helperText="Provided by Chief Security Officer or Society Estate Manager."
          />

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BadgeAlert className="w-4 h-4 text-emerald-500" />
              <span>Supervisor Approval Verification</span>
            </div>
            <p>
              Guard credentials are mathematically locked to the designated gate.
              Upon Chief Security Officer approval, your terminal will unlock.
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
            Submit Guard Registration
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
