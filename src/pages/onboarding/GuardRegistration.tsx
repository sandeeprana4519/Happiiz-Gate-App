/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Search,
  Check,
  Lock,
} from 'lucide-react';

export const GuardRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [agencyName, setAgencyName] = useState('SIS Security Services');
  const [gateAssigned, setGateAssigned] = useState('Gate #1 (North Main)');
  const [shift, setShift] = useState<'DAY' | 'NIGHT' | 'ROTATIONAL'>('DAY');
  const [invitationCode, setInvitationCode] = useState('');

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

  const filteredSocieties = societies.filter(
    (s) =>
      s.societyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.societyCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          additionalNotes: `Agency: ${agencyName}. Shift: ${shift}. Invitation Code: ${invitationCode || 'None'}.`,
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 3. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'SECURITY_GUARD',
        role: 'SECURITY_GUARD',
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

  const selectedSociety = societies.find((s) => s.id === selectedSocietyId);

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6 px-2">
      <Link
        to="/onboarding"
        className="inline-flex items-center gap-1.5 text-xs text-[#673AB7] font-semibold hover:underline"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Role Selection
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#111111] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#673AB7]" />
          <span>Security Guard Onboarding</span>
        </h1>
        <p className="text-xs text-[#A9B0B8]">
          Request gate terminal authorization for visitor logging, badge issuance, and parcel scanning.
        </p>
      </div>

      <div className="w-full rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E53945] font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Applicant Verification Summary */}
        <div className="p-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Guard Name</span>
            <span className="font-bold text-[#111111] text-sm">{user?.fullName || 'Guard Officer'}</span>
          </div>
          <div className="text-right">
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Verified Mobile</span>
            <span className="font-mono font-bold text-[#673AB7]">{user?.phoneNumber || '+91'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Society Selection with Search */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Assigned Residential Society
            </label>
            <div className="space-y-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#A9B0B8]" />
                <input
                  type="text"
                  placeholder="Search society..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl pl-9 pr-3 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {filteredSocieties.map((s) => {
                  const isSelected = selectedSocietyId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSocietyId(s.id)}
                      className={`w-full p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#F1F9FC] border-[#673AB7] text-[#111111] font-semibold'
                          : 'bg-white border-[#E6F1F5] text-[#111111] hover:border-[#673AB7]/40'
                      }`}
                    >
                      <span className="truncate pr-2">{s.societyName} ({s.city})</span>
                      {isSelected && <Check className="w-4 h-4 text-[#673AB7] shrink-0" />}
                    </button>
                  );
                })}
              </div>
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
              placeholder="e.g. SIS, G4S, Tops Security"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Assigned Gate Checkpoint
            </label>
            <select
              value={gateAssigned}
              onChange={(e) => setGateAssigned(e.target.value)}
              className="w-full min-h-[44px] h-11 rounded-xl px-3.5 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
            >
              <option value="Gate #1 (North Main)">Gate #1 (North Main — Visitor & Resident)</option>
              <option value="Gate #2 (Service & Trucks)">Gate #2 (Service, Contractors & Commercial Trucks)</option>
              <option value="Gate #3 (South Pedestrian)">Gate #3 (South Pedestrian Checkpoint)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Duty Shift Schedule
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'DAY', label: 'Day (07:00 - 15:00)' },
                { id: 'NIGHT', label: 'Night (23:00 - 07:00)' },
                { id: 'ROTATIONAL', label: 'Rotational' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShift(s.id as any)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    shift === s.id
                      ? 'bg-[#F1F9FC] border-[#673AB7] text-[#673AB7] ring-1 ring-[#673AB7]/30'
                      : 'bg-white border-[#E6F1F5] text-[#111111] hover:border-[#673AB7]/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Society Guard Invitation Code (Optional)"
            placeholder="e.g. EMR-SEC-2026"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            helperText="Provided by Chief Security Officer or Estate Manager for fast-track verification."
          />

          <div className="p-3.5 rounded-xl bg-[#F5FAFC] border border-[#E6F1F5] text-xs text-[#A9B0B8] space-y-1">
            <div className="font-semibold text-[#111111] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#673AB7]" />
              <span>Gate Terminal Security Lock</span>
            </div>
            <p className="leading-relaxed">
              Upon approval by{' '}
              <strong className="text-[#111111]">{selectedSociety?.societyName || 'the society'}</strong>{' '}
              Security Officer or Admin, your Security Guard Sentinel terminal will unlock.
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
      </div>
    </div>
  );
};
