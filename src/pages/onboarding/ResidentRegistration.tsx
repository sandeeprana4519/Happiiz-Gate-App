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
} from 'lucide-react';

export const ResidentRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [societies, setSocieties] = useState<Society[]>([]);
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
      const requestId = `REQ-${Date.now()}`;

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
          <Home className="w-6 h-6 text-sky-500" />
          <span>Resident Flat Registration</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Request authorized membership for your residential society and flat.
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
          {/* Society Dropdown */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Select Residential Society / Enclave
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
                    {s.societyName} ({s.city}) — Code: {s.societyCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
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
                      ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {type === 'OWNER' ? 'Property Owner' : 'Tenant / Rentee'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Possession date, lease duration, or lease agreement reference"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl p-3 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>Committee Verification Required</span>
            </div>
            <p>
              Your request will be routed to the verified Managing Committee of{' '}
              {societies.find((s) => s.id === selectedSocietyId)?.societyName || 'the society'}.
              Once verified, your Resident Portal privileges will activate automatically.
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
            Submit Resident Request
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
