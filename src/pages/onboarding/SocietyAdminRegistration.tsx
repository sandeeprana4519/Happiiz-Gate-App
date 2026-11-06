/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Shield,
  Upload,
} from 'lucide-react';

export const SocietyAdminRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [societyName, setSocietyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [address, setAddress] = useState('');
  const [totalTowers, setTotalTowers] = useState('4');
  const [totalFlats, setTotalFlats] = useState('320');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || '');
  const [designation, setDesignation] = useState('President');
  const [registrationCertNo, setRegistrationCertNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!societyName.trim() || !city.trim() || !address.trim() || !pinCode.trim()) {
      setError('Please fill in all required society address and location details.');
      return;
    }

    if (!user?.uid) return;

    setLoading(true);
    try {
      const societyId = `soc_${Date.now()}`;
      const societyCode =
        societyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'SOC') +
        '-' +
        Math.floor(10 + Math.random() * 90);
      const requestId = `REQ-SOC-${Date.now()}`;

      // 1. Create society record with status: PENDING_VERIFICATION
      await createSociety({
        id: societyId,
        societyName: societyName.trim(),
        societyCode,
        city: city.trim(),
        state: state.trim() || 'State',
        country: 'India',
        address: `${address.trim()}, PIN: ${pinCode.trim()}`,
        contactEmail: contactEmail.trim() || undefined,
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
          additionalNotes: `Designation: ${designation}. Towers: ${totalTowers}. Flats: ${totalFlats}. Reg Cert: ${registrationCertNo || 'Not provided'}.`,
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 4. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'SOCIETY_ADMIN',
        role: 'SOCIETY_ADMIN',
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
        className="inline-flex items-center gap-1.5 text-xs text-[#673AB7] font-semibold hover:underline"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Role Selection
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#111111] flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#673AB7]" />
          <span>Society Onboarding Registration</span>
        </h1>
        <p className="text-xs text-[#A9B0B8]">
          Onboard a residential society or gated community for Platform Super Admin approval.
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
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Admin Officer</span>
            <span className="font-bold text-[#111111] text-sm">{user?.fullName || 'Society Representative'}</span>
          </div>
          <div className="text-right">
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Verified Mobile</span>
            <span className="font-mono font-bold text-[#673AB7]">{user?.phoneNumber || '+91'}</span>
          </div>
        </div>

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
              placeholder="e.g. Bengaluru, Pune, Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="State"
              placeholder="e.g. Karnataka, Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="PIN Code"
              placeholder="e.g. 560103"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
                Committee Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full min-h-[44px] h-11 rounded-xl px-3.5 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
              >
                <option value="President">Society President</option>
                <option value="Secretary">General Secretary</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Estate Manager">Estate Manager / Facility Head</option>
              </select>
            </div>
          </div>

          <Input
            label="Full Physical Address"
            placeholder="Survey No, Main Road, Landmark"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Number of Towers / Wings"
              type="number"
              placeholder="4"
              value={totalTowers}
              onChange={(e) => setTotalTowers(e.target.value)}
            />
            <Input
              label="Total Flats / Villas Count"
              type="number"
              placeholder="320"
              value={totalFlats}
              onChange={(e) => setTotalFlats(e.target.value)}
              required
            />
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
              label="Registration Certificate No."
              placeholder="e.g. REG/SOC/2022/411"
              value={registrationCertNo}
              onChange={(e) => setRegistrationCertNo(e.target.value)}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5FAFC] border border-[#E6F1F5] text-xs text-[#A9B0B8] space-y-1">
            <div className="font-semibold text-[#111111] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#673AB7]" />
              <span>Platform Super Admin Review</span>
            </div>
            <p className="leading-relaxed">
              New society onboarding requires verification of society registration and
              authorized committee credentials by the Happiiz Gate Super Admin team before tenant activation.
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
            Submit Society Application
          </Button>
        </form>
      </div>
    </div>
  );
};
