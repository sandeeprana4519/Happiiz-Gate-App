/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  createAccessRequest,
  createSociety,
  addSocietyMembership,
  updateFirestoreUserProfile,
} from '../../services/firebase/firestore.service';
import {
  Building2,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const SocietyAdminRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [societyName, setSocietyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [totalFlats, setTotalFlats] = useState('300');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || '');
  const [designation, setDesignation] = useState('President');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyName.trim() || !city.trim() || !address.trim()) {
      setError('Please fill in all required society details.');
      return;
    }

    if (!user?.uid) return;

    setLoading(true);
    try {
      const societyId = `soc_${Date.now()}`;
      const societyCode = societyName.substring(0, 3).toUpperCase() + '-' + Math.floor(10 + Math.random() * 90);
      const requestId = `REQ-SOC-${Date.now()}`;

      // 1. Create society record with status: PENDING_VERIFICATION
      await createSociety({
        id: societyId,
        societyName: societyName.trim(),
        societyCode,
        city: city.trim(),
        state: state.trim() || 'State',
        country: 'India',
        address: address.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        totalFlats: parseInt(totalFlats) || 100,
        occupiedFlats: 0,
        totalGates: 2,
        activeGuards: 0,
        subscriptionPlan: 'Enterprise',
        status: 'PENDING_VERIFICATION',
      });

      // 2. Create admin membership record with status: PENDING
      await addSocietyMembership({
        uid: user.uid,
        societyId,
        societyName: societyName.trim(),
        societyCode,
        role: 'SOCIETY_ADMIN',
        membershipStatus: 'PENDING',
        joinedAt: new Date().toISOString(),
      });

      // 3. Create access request document for Super Admin review
      await createAccessRequest({
        id: requestId,
        uid: user.uid,
        applicantName: user.fullName || 'Society Representative',
        phoneNumber: user.phoneNumber || contactPhone,
        email: contactEmail,
        requestedRole: 'SOCIETY_ADMIN',
        societyId,
        societyName: societyName.trim(),
        requestData: {
          societyName: societyName.trim(),
          societyCity: city.trim(),
          societyAddress: address.trim(),
          contactPhone,
          additionalNotes: `Designation: ${designation}. Proposed total flats: ${totalFlats}.`,
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 4. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'SOCIETY_ADMIN',
        accountStatus: 'PENDING',
        onboardingCompleted: true,
      });

      await refreshUserProfile();
      navigate('/status/pending', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to submit society onboarding request.');
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
          <Building2 className="w-6 h-6 text-blue-500" />
          <span>Society Onboarding Registration</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Register a new residential complex for verification by Platform Super Admin.
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
          <Input
            label="Full Society / Apartment Name"
            placeholder="e.g. Prestige Lakeview Residences"
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="e.g. Bengaluru, Mumbai, Pune"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="State / Province"
              placeholder="e.g. Karnataka"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <Input
            label="Full Society Physical Address"
            placeholder="Survey No, Main Road, Landmark, Postal Code"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Flats / Villas Count"
              type="number"
              placeholder="250"
              value={totalFlats}
              onChange={(e) => setTotalFlats(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
                Committee Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full min-h-[44px] h-11 rounded-xl px-3.5 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-sky-500"
              >
                <option value="President">Society President</option>
                <option value="Secretary">General Secretary</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Estate Manager">Estate Manager / Facility Head</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Official Society Email"
              type="email"
              placeholder="committee@example.org"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Official Contact Phone"
              type="tel"
              placeholder="+91 98450 12345"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-500" />
              <span>Platform Super Admin Review</span>
            </div>
            <p>
              New society onboarding requires verification of society registration and
              authorized committee credentials by the Happiiz Gate Super Admin team.
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
            Submit Society Registration
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
