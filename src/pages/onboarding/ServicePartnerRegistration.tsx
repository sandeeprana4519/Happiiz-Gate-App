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
import { SERVICE_CATEGORIES } from '../../config/constants';
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
} from 'lucide-react';

export const ServicePartnerRegistration: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.phoneNumber || '');
  const [businessAddress, setBusinessAddress] = useState('');
  const [serviceAreas, setServiceAreas] = useState('Bengaluru South & Central');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Elevator & Lifts Maintenance',
    'HVAC & Air Conditioning',
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
      setError('Please fill in your company and contact information.');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one service category.');
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
        email: user.email,
        requestedRole: 'SERVICE_PARTNER',
        requestData: {
          businessName: businessName.trim(),
          businessAddress: businessAddress.trim(),
          serviceCategories: selectedCategories,
          serviceAreas: serviceAreas.split(',').map((s) => s.trim()),
          contactPhone: contactNumber.trim(),
        },
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
      });

      // 3. Update user profile onboarding state
      await updateFirestoreUserProfile(user.uid, {
        primaryRole: 'SERVICE_PARTNER',
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
        className="inline-flex items-center gap-1.5 text-xs text-sky-500 font-semibold hover:text-sky-400"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Role Selection
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-amber-500" />
          <span>Service Partner Onboarding</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Register your maintenance contracting agency or technician service firm.
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
            label="Business or Contractor Name"
            placeholder="e.g. Apex Elevators & Facility Services Ltd."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Phone Number"
              type="tel"
              placeholder="+91 98888 77777"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
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
            label="Office / Workshop Address"
            placeholder="Registered business address or operational hub"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Service Categories Provided (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`p-2.5 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 dark:text-amber-300'
                        : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate pr-1">{cat}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <span>Partner Verification & Work Orders</span>
            </div>
            <p>
              Once approved by society administrators, your company can dispatch
              technicians with valid digital Gate Passes and receive maintenance work
              orders directly.
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
            Submit Partner Registration
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
