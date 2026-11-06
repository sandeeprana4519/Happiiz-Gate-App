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
  saveServicePartnerProfile,
  updateFirestoreUserProfile,
} from '../../services/firebase/firestore.service';
import {
  Wrench,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Briefcase,
  Check,
  ShieldAlert,
} from 'lucide-react';

const SERVICE_PARTNER_CATEGORIES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'AC Repair & HVAC',
  'Housekeeping',
  'Pest Control',
  'Appliance Repair',
  'Painting',
  'Deep Cleaning',
  'Security Services',
  'Elevator & Lifts Maintenance',
  'Other Services',
];

export const ServicePartnerRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<'INDIVIDUAL' | 'COMPANY'>('COMPANY');
  const [contactNumber, setContactNumber] = useState(user?.phoneNumber || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [businessAddress, setBusinessAddress] = useState('');
  const [serviceAreas, setServiceAreas] = useState('Bengaluru South & Central');
  const [description, setDescription] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Electrician',
    'AC Repair & HVAC',
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !contactNumber.trim() || !businessAddress.trim()) {
      setError('Please fill in your company/contractor details and address.');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one service category provided.');
      return;
    }

    if (!user?.uid) return;

    setLoading(true);
    try {
      const requestId = `REQ-PARTNER-${Date.now()}`;

      // 1. Save service partner record with status: PENDING
      await saveServicePartnerProfile({
        uid: user.uid,
        businessName: businessName.trim(),
        contactNumber: contactNumber.trim(),
        businessAddress: businessAddress.trim(),
        serviceCategories: selectedCategories,
        serviceAreas: serviceAreas.split(',').map((s) => s.trim()),
        verificationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      });

      // 2. Create access request document for Super Admin review
      await createAccessRequest({
        id: requestId,
        uid: user.uid,
        applicantName: businessName.trim(),
        phoneNumber: contactNumber.trim(),
        email: contactEmail || user.email,
        requestedRole: 'SERVICE_PARTNER',
        requestData: {
          businessName: businessName.trim(),
          businessAddress: businessAddress.trim(),
          serviceCategories: selectedCategories,
          serviceAreas: serviceAreas.split(',').map((s) => s.trim()),
          contactPhone: contactNumber.trim(),
          additionalNotes: `Type: ${businessType}. GST: ${gstNumber || 'N/A'}. PAN: ${panNumber || 'N/A'}. Desc: ${description || 'N/A'}.`,
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 3. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'SERVICE_PARTNER',
        role: 'SERVICE_PARTNER',
        accountStatus: 'PENDING',
        onboardingCompleted: true,
      });

      await refreshUserProfile();
      navigate('/status/pending', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to submit service partner registration.');
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
          <Wrench className="w-6 h-6 text-[#673AB7]" />
          <span>Service Partner Onboarding</span>
        </h1>
        <p className="text-xs text-[#A9B0B8]">
          Register your maintenance agency or technician service firm to receive bookings in gated societies.
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
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Authorized Contact</span>
            <span className="font-bold text-[#111111] text-sm">{user?.fullName || 'Business Owner'}</span>
          </div>
          <div className="text-right">
            <span className="text-[#A9B0B8] block text-[10px] font-semibold uppercase">Verified Mobile</span>
            <span className="font-mono font-bold text-[#673AB7]">{user?.phoneNumber || '+91'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Business or Contractor Legal Name"
            placeholder="e.g. Apex Elevators & Facility Services Pvt Ltd"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Business Legal Structure
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'COMPANY', label: 'Registered Company / LLP' },
                { id: 'INDIVIDUAL', label: 'Sole Proprietor / Individual' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBusinessType(b.id as any)}
                  className={`py-2 px-3 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    businessType === b.id
                      ? 'bg-[#F1F9FC] border-[#673AB7] text-[#673AB7] ring-1 ring-[#673AB7]/30'
                      : 'bg-white border-[#E6F1F5] text-[#111111] hover:border-[#673AB7]/30'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              placeholder="support@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <Input
              label="Operational Cities / Areas"
              placeholder="e.g. Bengaluru, Navi Mumbai"
              value={serviceAreas}
              onChange={(e) => setServiceAreas(e.target.value)}
              required
            />
          </div>

          <Input
            label="Registered Office / Workshop Address"
            placeholder="Office, Street, Landmark, PIN Code"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
          />

          {/* Service Categories Multi-select */}
          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Service Categories Provided (Select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {SERVICE_PARTNER_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`p-2.5 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F1F9FC] border-[#673AB7] text-[#673AB7] font-semibold'
                        : 'bg-white border-[#E6F1F5] text-[#111111] hover:border-[#673AB7]/40'
                    }`}
                  >
                    <span className="truncate pr-1">{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#673AB7]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GSTIN (Optional)"
              placeholder="e.g. 29AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
            <Input
              label="PAN Number (Optional)"
              placeholder="e.g. ABCDE1234F"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-[#111111] mb-1.5">
              Service Specialization & Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of experience, certified staff, and equipment capabilities"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl p-3 text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] outline-none focus:border-[#673AB7]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5FAFC] border border-[#E6F1F5] text-xs text-[#A9B0B8] space-y-1">
            <div className="font-semibold text-[#111111] flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#673AB7]" />
              <span>Super Admin KYC Verification</span>
            </div>
            <p className="leading-relaxed">
              Upon approval by the Platform Super Admin, your company profile will be verified
              and your technicians can be dispatched with digital Gate Passes to verified societies.
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
            Submit Partner Application
          </Button>
        </form>
      </div>
    </div>
  );
};
