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
import { OccupantType } from '../../types/auth';
import {
  getAllSocieties,
  addSocietyMembership,
  createAccessRequest,
  updateFirestoreUserProfile,
} from '../../services/firebase/firestore.service';
import {
  Home,
  Building,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  ShieldCheck,
  Search,
  Check,
} from 'lucide-react';

export const ResidentRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [wingId, setWingId] = useState('Tower B');
  const [flatId, setFlatId] = useState('');
  const [occupantType, setOccupantType] = useState<OccupantType>('OWNER');
  const [notes, setNotes] = useState('');

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
    if (!flatId.trim()) {
      setError('Please enter your flat or villa number.');
      return;
    }

    const society = societies.find((s) => s.id === selectedSocietyId);
    if (!society || !user?.uid) {
      setError('Please select a valid residential society.');
      return;
    }

    setLoading(true);
    try {
      const requestId = `REQ-RES-${Date.now()}`;

      // 1. Create membership record with status: PENDING
      await addSocietyMembership({
        uid: user.uid,
        societyId: society.id,
        societyName: society.societyName,
        societyCode: society.societyCode,
        role: 'RESIDENT',
        membershipStatus: 'PENDING',
        wingId,
        flatId: flatId.trim(),
        occupantType,
        joinedAt: new Date().toISOString(),
      });

      // 2. Create access request document for Society Admin review
      await createAccessRequest({
        id: requestId,
        uid: user.uid,
        applicantName: user.fullName || 'Resident Applicant',
        phoneNumber: user.phoneNumber || '',
        email: user.email,
        requestedRole: 'RESIDENT',
        societyId: society.id,
        societyName: society.societyName,
        requestData: {
          wingId,
          flatId: flatId.trim(),
          occupantType,
          additionalNotes: notes.trim() || undefined,
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 3. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'RESIDENT',
        role: 'RESIDENT',
        accountStatus: 'PENDING',
        onboardingCompleted: true,
      });

      await refreshUserProfile();
      navigate('/status/pending', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to submit resident registration request.');
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
          <Home className="w-6 h-6 text-[#673AB7]" />
          <span>Resident Flat Registration</span>
        </h1>
        <p className="text-xs text-[#A9B0B8]">
          Apply for resident credentials in your gated community to pre-approve visitors and access amenities.
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
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Applicant</span>
            <span className="font-bold text-[#111111] text-sm">{user?.fullName || 'Resident User'}</span>
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
              Select Residential Society / Enclave
            </label>
            <div className="space-y-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#A9B0B8]" />
                <input
                  type="text"
                  placeholder="Search society by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl pl-9 pr-3 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
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
                      <div className="truncate pr-2">
                        <span>{s.societyName}</span>
                        <span className="text-[10px] text-[#A9B0B8] block">
                          {s.city} · Code: {s.societyCode}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#673AB7] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tower & Flat */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tower / Wing"
              placeholder="e.g. Tower B"
              value={wingId}
              onChange={(e) => setWingId(e.target.value)}
              required
            />
            <Input
              label="Flat / Villa Number"
              placeholder="e.g. B-704"
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              required
            />
          </div>

          {/* Occupancy Status */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Occupancy Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['OWNER', 'TENANT'] as OccupantType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOccupantType(type)}
                  className={`min-h-[44px] h-11 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    occupantType === type
                      ? 'bg-[#F1F9FC] border-[#673AB7] text-[#673AB7] ring-1 ring-[#673AB7]/30'
                      : 'bg-white border-[#E6F1F5] text-[#111111] hover:border-[#673AB7]/30'
                  }`}
                >
                  {type === 'OWNER' ? 'Property Owner' : 'Tenant / Rentee'}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Possession date, lease reference, or special gate instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl p-3 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
            />
          </div>

          {/* Governance Notice */}
          <div className="p-3.5 rounded-xl bg-[#F5FAFC] border border-[#E6F1F5] text-xs text-[#A9B0B8] space-y-1">
            <div className="font-semibold text-[#111111] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#673AB7]" />
              <span>Society Committee Approval Required</span>
            </div>
            <p className="leading-relaxed">
              Your request will be submitted to the Managing Committee of{' '}
              <strong className="text-[#111111]">{selectedSociety?.societyName || 'the society'}</strong>.
              Upon verification, your Resident Dashboard privileges and Gate Pass approvals will unlock.
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
            Submit Resident Registration
          </Button>
        </form>
      </div>
    </div>
  );
};
