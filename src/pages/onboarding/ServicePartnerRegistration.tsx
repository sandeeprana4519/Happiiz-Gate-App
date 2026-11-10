/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Society } from '../../types/society';
import { PartnerKycDocuments } from '../../types/auth';
import { PARTNER_DOMAINS } from '../../components/partner/PartnerOnboardingModal';
import {
  createServicePartner,
  getAllSocieties,
} from '../../services/firebase/superadmin.service';
import {
  Wrench,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  CreditCard,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  Plus,
  Trash2,
  FileCheck2,
  ChevronRight,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const ServicePartnerRegistration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [societiesList, setSocietiesList] = useState<Society[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Section 1: Basic & Login Credentials
  const [name, setName] = useState(user?.fullName || '');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('Partner@2026');
  const [address, setAddress] = useState('');

  // Section 2: Service Area & Mapping
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [serviceArea, setServiceArea] = useState('Bengaluru South & Central');

  // Section 3: Service Domain & Specialization
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['Electrician', 'Plumber']);

  // Section 4: KYC & Verification Documents
  const [nationalIdType, setNationalIdType] = useState('Aadhaar Card');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dlNumber, setDlNumber] = useState('');

  // Bank Details
  const [bankAccNo, setBankAccNo] = useState('');
  const [bankAccHolder, setBankAccHolder] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  // Police Verification
  const [isPoliceVerified, setIsPoliceVerified] = useState(true);
  const [policeVerificationDate, setPoliceVerificationDate] = useState('2026-10-20');

  // Additional Agreement Documents
  const [agreementDocs, setAgreementDocs] = useState<Array<{ title: string; fileName: string; url: string }>>([
    {
      title: 'Commercial Master Service Agreement',
      fileName: 'msa_signed_agreement.pdf',
      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load registered societies
  useEffect(() => {
    getAllSocieties().then((list) => {
      setSocietiesList(list);
      if (list.length > 0 && !selectedSocietyId) {
        setSelectedSocietyId(list[0].id);
      }
    });
  }, []);

  const currentSociety = societiesList.find((s) => s.id === selectedSocietyId);

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? (prev.length > 1 ? prev.filter((d) => d !== domain) : prev) : [...prev, domain]
    );
  };

  const handleAddAgreementDoc = () => {
    setAgreementDocs((prev) => [
      ...prev,
      {
        title: `Trade Certification #${prev.length + 1}`,
        fileName: `cert_${Date.now().toString().slice(-4)}.pdf`,
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
      },
    ]);
  };

  const handleRemoveAgreementDoc = (index: number) => {
    setAgreementDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full legal name.');
      setActiveStep(1);
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your active contact number.');
      setActiveStep(1);
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid login email address.');
      setActiveStep(1);
      return;
    }
    if (!selectedSocietyId) {
      setError('Please select an assigned gated community.');
      setActiveStep(2);
      return;
    }
    if (selectedDomains.length === 0) {
      setError('Please select at least one trade specialization.');
      setActiveStep(3);
      return;
    }

    setLoading(true);
    try {
      const documents: PartnerKycDocuments = {
        nationalIdType,
        nationalIdNumber: nationalIdNumber || 'XXXX-XXXX-9812',
        nationalIdUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
        panNumber: panNumber || 'ABCDE1234F',
        panUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
        dlNumber: dlNumber || undefined,
        isPoliceVerified,
        policeVerificationDate: isPoliceVerified ? policeVerificationDate : undefined,
        policeVerificationUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
        bankDetails: {
          accNo: bankAccNo || '918802991002',
          accountHolderName: bankAccHolder || name,
          ifsc: bankIfsc || 'HDFC0001234',
          bankName: bankName || 'HDFC Bank',
          passbookUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
        },
        agreementUrls: agreementDocs.map((d) => d.url),
      };

      // Always submit self-registration as PENDING for Super Admin verification
      await createServicePartner({
        uid: user?.uid,
        name: name.trim(),
        businessName: businessName.trim() || name.trim(),
        contactNumber: phone.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password || 'Partner@2026',
        businessAddress: address.trim() || currentSociety?.address || 'Community Hub',
        address: address.trim(),
        serviceCategories: selectedDomains,
        serviceDomain: selectedDomains,
        serviceAreas: [serviceArea.trim() || currentSociety?.city || 'Zone A'],
        serviceArea: serviceArea.trim() || currentSociety?.city || 'Zone A',
        assignedSocietyId: selectedSocietyId,
        assignedSocietyName: currentSociety?.societyName || currentSociety?.name || 'Assigned Society',
        verificationStatus: 'PENDING',
        status: 'pending',
        onboardedBy: 'self',
        documents,
      });

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 1C. CONFIRMATION STATUS SCREEN UPON SUBMISSION
  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto py-10 px-4 animate-fade-in">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Application Under Review
            </span>
            <h2 className="text-xl font-extrabold text-gray-900">
              Application Submitted Successfully
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              Your profile and KYC documents are <strong>pending verification by Super Admin</strong>. You will receive login access once approved.
            </p>
          </div>

          {/* Submission Details Card */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Applicant:</span>
              <strong className="text-gray-900">{name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registered Email:</span>
              <strong className="text-gray-900 font-mono">{email}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mapped Community:</span>
              <strong className="text-gray-900">{currentSociety?.societyName || 'Selected Society'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Specialization:</span>
              <span className="text-[#673AB7] font-bold">{selectedDomains.join(', ')}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-500">Police Background Check:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Submitted
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/login"
              className="flex-1 py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6 px-3 animate-fade-in">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[#673AB7] font-bold hover:underline"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Login
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
          <Wrench className="w-6 h-6 text-[#673AB7]" />
          <span>Service Partner / Vendor Registration</span>
        </h1>
        <p className="text-xs text-gray-500">
          Apply to become a verified technician or service contractor for gated residential societies.
        </p>
      </div>

      <div className="w-full rounded-2xl bg-white border border-gray-200 shadow-md overflow-hidden">
        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/70 text-xs">
          {[
            { step: 1, label: '1. Credentials' },
            { step: 2, label: '2. Mapping' },
            { step: 3, label: '3. Trades' },
            { step: 4, label: '4. KYC Docs' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step as any)}
              className={`py-3 px-2 font-bold text-center border-b-2 transition cursor-pointer truncate ${
                activeStep === s.step
                  ? 'border-[#673AB7] text-[#673AB7] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic & Login Credentials */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <User className="w-4 h-4 text-[#673AB7]" />
                <span>Basic Profile & Login Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Agency / Business Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kumar Facility Maintenance"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Contact Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Email Address (Login Username) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="rajesh@servicepro.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Create Login Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold text-gray-900 focus:border-[#673AB7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Workshop or Permanent Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter street, workshop location, city, pincode..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Service Area & Society Mapping */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-[#673AB7]" />
                <span>Target Community & Operational Coverage</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Select Society to Service *
                  </label>
                  <select
                    value={selectedSocietyId}
                    onChange={(e) => setSelectedSocietyId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 focus:border-[#673AB7] focus:outline-none"
                    required
                  >
                    {societiesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.societyName || s.name} ({s.city}) — Code: {s.societyCode}
                      </option>
                    ))}
                  </select>
                </div>

                {currentSociety && (
                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-gray-700 space-y-1">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#673AB7]" />
                      <span>{currentSociety.societyName || currentSociety.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 pl-5">
                      {currentSociety.address}, {currentSociety.city}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Operational Locality / Radius
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5km radius around Bellandur and Outer Ring Road"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Service Domain & Specialization */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-[#673AB7]" />
                  <span>Trade Categories & Specialization</span>
                </div>
                <span className="text-[11px] text-[#673AB7] font-bold">
                  {selectedDomains.length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {PARTNER_DOMAINS.map((domain) => {
                  const isSelected = selectedDomains.includes(domain);
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleDomain(domain)}
                      className={`p-3 rounded-xl border text-xs font-bold transition text-left flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#673AB7] bg-purple-50 text-[#673AB7] shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{domain}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#673AB7] shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: KYC & Verification Documents */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              {/* Identity & Tax */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Identity Proof & Tax ID
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">ID Proof Type</label>
                    <select
                      value={nationalIdType}
                      onChange={(e) => setNationalIdType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-semibold"
                    >
                      <option>Aadhaar Card</option>
                      <option>Voter ID</option>
                      <option>Passport</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">ID Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9812-4411-8902"
                      value={nationalIdNumber}
                      onChange={(e) => setNationalIdNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Driving License (Optional)</label>
                    <input
                      type="text"
                      placeholder="DL-0420110091"
                      value={dlNumber}
                      onChange={(e) => setDlNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Settlement Bank Details */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  Bank Account for Service Payouts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Name on bank account"
                      value={bankAccHolder}
                      onChange={(e) => setBankAccHolder(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 5010029910291"
                      value={bankAccNo}
                      onChange={(e) => setBankAccNo(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Police Background Verification */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                    Police Verification Certificate
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPoliceVerified}
                      onChange={(e) => setIsPoliceVerified(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs font-bold text-emerald-900">Certificate Attached</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-emerald-900 block mb-1">Certificate Issue Date</label>
                    <input
                      type="date"
                      value={policeVerificationDate}
                      onChange={(e) => setPoliceVerificationDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-emerald-200 bg-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="px-3 py-2 rounded-lg bg-white border border-emerald-200 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold w-full">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>police_clearance_cert.pdf</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Agreements */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    Trade Agreements & Certifications ({agreementDocs.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAgreementDoc}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Document
                  </button>
                </div>

                <div className="space-y-1.5">
                  {agreementDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#673AB7]" />
                        <span className="font-semibold text-gray-900">{doc.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAgreementDoc(idx)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Previous Step
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            )}

            {activeStep < 4 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Continue to Step {activeStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Submitting Application...' : 'Submit for Super Admin Verification'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
