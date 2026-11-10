/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ServicePartnerProfile, PartnerKycDocuments } from '../../types/auth';
import { Society } from '../../types/society';
import { createServicePartner, getAllSocieties } from '../../services/firebase/superadmin.service';
import { marketplaceService } from '../../services/firebase/marketplace.service';
import { MarketplaceService, PartnerCustomServiceRate } from '../../types/marketplace';
import {
  Wrench,
  X,
  Upload,
  FileText,
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
  Eye,
  FileCheck2,
  ChevronRight,
  Sparkles,
  IndianRupee,
  Layers,
  Calculator,
  Percent,
} from 'lucide-react';

export const PARTNER_DOMAINS = [
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
  'Elevator Maintenance',
  'Gardening & Landscaping',
  'Water Tank Cleaning',
  'General Maintenance',
];

interface PartnerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onboardedBy: 'super_admin' | 'society_admin' | 'self';
  currentSocietyId?: string;
  societies?: Society[];
}

export const PartnerOnboardingModal: React.FC<PartnerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onboardedBy,
  currentSocietyId,
  societies: propSocieties,
}) => {
  const [societiesList, setSocietiesList] = useState<Society[]>(propSocieties || []);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Section 1: Basic & Login Credentials
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Partner@2026');
  const [address, setAddress] = useState('');

  // Section 2: Service Area & Mapping
  const [selectedSocietyId, setSelectedSocietyId] = useState(currentSocietyId || '');
  const [serviceArea, setServiceArea] = useState('Central & Residential Perimeter');

  // Section 3: Dynamic Service Catalog & Rate Card Matrix (Single Source of Truth)
  const [catalogServices, setCatalogServices] = useState<MarketplaceService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [customRates, setCustomRates] = useState<Record<string, number>>({});

  // Section 4: KYC & Verification Documents
  const [nationalIdType, setNationalIdType] = useState('Aadhaar Card');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [nationalIdDoc, setNationalIdDoc] = useState<{ name: string; url: string } | null>({
    name: 'aadhaar_front_back.pdf',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
  });

  const [panNumber, setPanNumber] = useState('');
  const [panDoc, setPanDoc] = useState<{ name: string; url: string } | null>({
    name: 'pan_card_copy.jpg',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
  });

  const [dlNumber, setDlNumber] = useState('');
  const [dlDoc, setDlDoc] = useState<{ name: string; url: string } | null>(null);

  // Bank Details
  const [bankAccNo, setBankAccNo] = useState('');
  const [bankAccHolder, setBankAccHolder] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [passbookDoc, setPassbookDoc] = useState<{ name: string; url: string } | null>({
    name: 'cancelled_cheque.pdf',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
  });

  // Police Verification
  const [isPoliceVerified, setIsPoliceVerified] = useState(true);
  const [policeVerificationDate, setPoliceVerificationDate] = useState('2026-10-15');
  const [policeDoc, setPoliceDoc] = useState<{ name: string; url: string } | null>({
    name: 'police_verification_clearance.pdf',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
  });

  // Additional Agreement Documents
  const [agreementDocs, setAgreementDocs] = useState<Array<{ title: string; fileName: string; url: string }>>([
    {
      title: 'Commercial Master Service Agreement',
      fileName: 'msa_signed_agreement.pdf',
      url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
    },
  ]);

  // Super Admin Option: Initial Status
  const [initialStatus, setInitialStatus] = useState<'ACTIVE' | 'PENDING'>(
    onboardedBy === 'super_admin' ? 'ACTIVE' : 'PENDING'
  );

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Load active services dynamically from Marketplace Catalog (Single Source of Truth)
  useEffect(() => {
    if (isOpen) {
      marketplaceService.getServices().then((list) => {
        // Exclude deleted or inactive services strictly
        const activeOnly = list.filter((s) => s.status === 'ACTIVE');
        setCatalogServices(activeOnly);

        // Pre-select first 2-3 active services if fresh form
        if (activeOnly.length > 0 && selectedServiceIds.length === 0) {
          const defaultSelected = activeOnly.slice(0, 3).map((s) => s.id);
          setSelectedServiceIds(defaultSelected);
          const initialRates: Record<string, number> = {};
          activeOnly.forEach((s) => {
            initialRates[s.id] = s.basePrice;
          });
          setCustomRates(initialRates);
        }
      });
    }
  }, [isOpen]);

  // Load societies if not passed
  useEffect(() => {
    if ((!propSocieties || propSocieties.length === 0) && isOpen) {
      getAllSocieties().then((list) => {
        setSocietiesList(list);
        if (!selectedSocietyId && list.length > 0) {
          setSelectedSocietyId(currentSocietyId || list[0].id);
        }
      });
    } else if (propSocieties && propSocieties.length > 0 && !selectedSocietyId) {
      setSelectedSocietyId(currentSocietyId || propSocieties[0].id);
    }
  }, [isOpen, propSocieties, currentSocietyId]);

  if (!isOpen) return null;

  const currentSociety = societiesList.find((s) => s.id === selectedSocietyId);

  // Toggle Service Selection
  const toggleService = (svc: MarketplaceService) => {
    setSelectedServiceIds((prev) => {
      const exists = prev.includes(svc.id);
      if (exists) {
        if (prev.length <= 1) return prev; // retain at least 1 service
        return prev.filter((id) => id !== svc.id);
      } else {
        if (customRates[svc.id] === undefined) {
          setCustomRates((rates) => ({ ...rates, [svc.id]: svc.basePrice }));
        }
        return [...prev, svc.id];
      }
    });
  };

  const handleCustomRateChange = (serviceId: string, value: number) => {
    setCustomRates((prev) => ({
      ...prev,
      [serviceId]: Math.max(0, value),
    }));
  };

  // Add more agreement document
  const handleAddAgreementDoc = () => {
    setAgreementDocs((prev) => [
      ...prev,
      {
        title: `Service Certification #${prev.length + 1}`,
        fileName: `doc_cert_${Date.now().toString().slice(-4)}.pdf`,
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop',
      },
    ]);
  };

  // Remove agreement doc
  const handleRemoveAgreementDoc = (index: number) => {
    setAgreementDocs((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!name.trim()) {
      setFormError('Partner / Technician Full Name is required.');
      setActiveStep(1);
      return;
    }
    if (!phone.trim()) {
      setFormError('Contact Mobile Number is required.');
      setActiveStep(1);
      return;
    }
    if (!email.trim()) {
      setFormError('Valid login email address is required.');
      setActiveStep(1);
      return;
    }
    if (!selectedSocietyId) {
      setFormError('Please select an assigned society for mapping.');
      setActiveStep(2);
      return;
    }
    if (selectedServiceIds.length === 0) {
      setFormError('Please select at least one active service from the catalog.');
      setActiveStep(3);
      return;
    }

    setLoading(true);
    try {
      const selectedServicesList = catalogServices.filter((s) => selectedServiceIds.includes(s.id));
      const categories = Array.from(new Set(selectedServicesList.map((s) => s.category)));

      // Construct rate card matrix data
      const rateCard: PartnerCustomServiceRate[] = selectedServicesList.map((s) => {
        const quoted = Number(customRates[s.id] !== undefined ? customRates[s.id] : s.basePrice);
        return {
          serviceId: s.id,
          serviceName: s.name,
          category: s.category,
          customPrice: quoted,
          basePrice: s.basePrice,
          isOptedIn: true,
          customDuration: s.estimatedDuration,
        };
      });

      const documents: PartnerKycDocuments = {
        nationalIdType,
        nationalIdNumber: nationalIdNumber || 'XXXX-XXXX-1234',
        nationalIdUrl: nationalIdDoc?.url,
        panNumber: panNumber || 'ABCDE1234F',
        panUrl: panDoc?.url,
        dlNumber: dlNumber || undefined,
        dlUrl: dlDoc?.url,
        isPoliceVerified,
        policeVerificationDate: isPoliceVerified ? policeVerificationDate : undefined,
        policeVerificationUrl: policeDoc?.url,
        bankDetails: {
          accNo: bankAccNo || '918802991002',
          accountHolderName: bankAccHolder || name,
          ifsc: bankIfsc || 'HDFC0001234',
          bankName: bankName || 'HDFC Bank',
          passbookUrl: passbookDoc?.url,
        },
        agreementUrls: agreementDocs.map((d) => d.url),
      };

      // Society Admins ALWAYS route to PENDING verification
      const resolvedStatus = onboardedBy === 'super_admin' ? initialStatus : 'PENDING';

      await createServicePartner({
        name: name.trim(),
        businessName: businessName.trim() || name.trim(),
        contactNumber: phone.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password || 'Partner@2026',
        businessAddress: address.trim() || currentSociety?.address || 'Locality Hub',
        address: address.trim(),
        serviceCategories: categories.length > 0 ? categories : ['General Maintenance'],
        serviceDomain: categories.length > 0 ? categories : ['General Maintenance'],
        serviceAreas: [serviceArea.trim() || currentSociety?.city || 'Zone A'],
        serviceArea: serviceArea.trim() || currentSociety?.city || 'Zone A',
        assignedSocietyId: selectedSocietyId,
        assignedSocietyName: currentSociety?.societyName || currentSociety?.name || 'Assigned Society',
        verificationStatus: resolvedStatus,
        status: (resolvedStatus.toLowerCase() as any),
        onboardedBy,
        societyAdminId: onboardedBy === 'society_admin' ? currentSocietyId : undefined,
        documents,
        rateCard,
        servicesOffered: rateCard,
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to onboard service partner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl my-6 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900">
                  {onboardedBy === 'society_admin' ? 'Add Society Service Partner' : 'Onboard Service Partner'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#673AB7]">
                  {onboardedBy === 'super_admin' ? 'Super Admin Portal' : 'Society Admin Mapped'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {onboardedBy === 'society_admin'
                  ? 'Register local vendors for your community. Submissions are routed to Super Admin for verification.'
                  : 'Register commercial technicians, contractors, trade licenses, and KYC compliance'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/70 text-xs">
          {[
            { step: 1, label: '1. Credentials' },
            { step: 2, label: '2. Society Mapping' },
            { step: 3, label: '3. Services & Rate Card' },
            { step: 4, label: '4. KYC & Verification' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step as any)}
              className={`py-2.5 px-2 font-bold text-center border-b-2 transition cursor-pointer truncate ${
                activeStep === s.step
                  ? 'border-[#673AB7] text-[#673AB7] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: Basic & Login Credentials */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <User className="w-4 h-4 text-[#673AB7]" />
                <span>Basic Profile & App Login Setup</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Contact Person / Technician Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra Verma"
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
                    placeholder="e.g. Verma Electrical Solutions"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Mobile Phone Number *
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
                    Email Address (Login ID) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="technician@servicehub.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Default Mobile/Web Login Password *
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
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    The partner will use this password to access the Service Partner App once verified.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Permanent / Workshop Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter street, workshop location, pincode..."
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
                <span>Assigned Gated Community & Service Area</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Assigned Society / Campus *
                  </label>
                  <select
                    value={selectedSocietyId}
                    onChange={(e) => setSelectedSocietyId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 focus:border-[#673AB7] focus:outline-none cursor-pointer"
                    required
                  >
                    {societiesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.societyName || s.name} ({s.city}) — Code: {s.societyCode || 'SOC'}
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
                      {currentSociety.address}, {currentSociety.city}, {currentSociety.state || 'India'}
                    </div>
                    <div className="text-[11px] text-[#673AB7] font-semibold pl-5">
                      Flats: {currentSociety.totalFlats || 100} • Gates: {currentSociety.totalGates || 2} Security Portals
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Service Locality / Zone Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bellandur, Sarjapur Road & ORR Tech Belt"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                {onboardedBy === 'society_admin' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Routing Notice for Society Admin:</strong>
                      This service partner will be submitted with status <strong>Pending Verification</strong>. Super Admin will review the KYC documents and activate their account.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Dynamic Service Catalog & Interactive Rate Card Matrix */}
          {activeStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-[#673AB7]" />
                    <span>Dynamic Service Catalog Selection ({selectedServiceIds.length} Selected)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Live synced with active Marketplace Services. Newly added services appear instantly; inactive ones are excluded.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = catalogServices.map((s) => s.id);
                      setSelectedServiceIds(allIds);
                      const initialRates: Record<string, number> = {};
                      catalogServices.forEach((s) => {
                        initialRates[s.id] = customRates[s.id] !== undefined ? customRates[s.id] : s.basePrice;
                      });
                      setCustomRates(initialRates);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#673AB7] hover:bg-purple-50 rounded-lg border border-purple-200 transition cursor-pointer"
                  >
                    Select All ({catalogServices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (catalogServices.length > 0) {
                        setSelectedServiceIds([catalogServices[0].id]);
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200 transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Service Selection Cards Grid */}
              {catalogServices.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-gray-50 border border-gray-200 text-gray-500 text-xs">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-gray-700">No Active Marketplace Services Found</p>
                  <p className="text-[11px] mt-1">Please ensure active services exist in Super Admin &gt; Marketplace &gt; Service Catalog.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {catalogServices.map((svc) => {
                    const isSelected = selectedServiceIds.includes(svc.id);
                    return (
                      <div
                        key={svc.id}
                        onClick={() => toggleService(svc)}
                        className={`p-3 rounded-xl border text-xs transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#673AB7] bg-purple-50/70 shadow-2xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {svc.imageUrl ? (
                            <img
                              src={svc.imageUrl}
                              alt={svc.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple-100 text-[#673AB7] flex items-center justify-center font-bold shrink-0">
                              <Wrench className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 block truncate" title={svc.name}>
                              {svc.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-100 text-[#673AB7]">
                                {svc.category}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                Base: ₹{svc.basePrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-[#673AB7]" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* INTERACTIVE RATE CARD MATRIX */}
              {selectedServiceIds.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 border border-purple-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#673AB7] text-white flex items-center justify-center shrink-0">
                        <Calculator className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900">
                          Interactive Rate Card Matrix
                        </h4>
                        <p className="text-[10px] text-gray-500">
                          Configure custom quoted rates. Commission cut and net partner payouts auto-calculate in real time.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Auto-Calculated
                    </span>
                  </div>

                  {/* Matrix Table */}
                  <div className="overflow-x-auto rounded-xl border border-purple-200/60 bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-purple-100/60 text-purple-950 font-bold border-b border-purple-200/60 uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Selected Service</th>
                          <th className="py-2.5 px-2.5 text-center">Platform Base</th>
                          <th className="py-2.5 px-2.5">Partner Quoted Rate (₹)</th>
                          <th className="py-2.5 px-2.5 text-center">Comm. (%)</th>
                          <th className="py-2.5 px-2.5 text-right">Admin Cut (₹)</th>
                          <th className="py-2.5 px-3 text-right">Net Payout (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100/70">
                        {catalogServices
                          .filter((svc) => selectedServiceIds.includes(svc.id))
                          .map((svc) => {
                            const quotedRate = Number(
                              customRates[svc.id] !== undefined ? customRates[svc.id] : svc.basePrice
                            );
                            const commRate = svc.commissionRate || 15;
                            const adminCommissionCut = Math.round((quotedRate * commRate) / 100);
                            const netPartnerPayout = quotedRate - adminCommissionCut;

                            return (
                              <tr key={svc.id} className="hover:bg-purple-50/40 transition">
                                {/* Selected Service Details (Read-only) */}
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-gray-900 text-xs leading-tight">
                                    {svc.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {svc.category} • {svc.estimatedDuration}
                                    </span>
                                  </div>
                                </td>

                                {/* Platform Base Price (Read-only reference) */}
                                <td className="py-2.5 px-2.5 text-center font-mono text-gray-500 font-semibold text-xs">
                                  ₹{svc.basePrice}
                                </td>

                                {/* Partner Quoted Rate (₹) [Editable Input] */}
                                <td className="py-2.5 px-2.5">
                                  <div className="relative inline-flex items-center">
                                    <span className="text-gray-400 font-bold text-xs absolute left-2 pointer-events-none">
                                      ₹
                                    </span>
                                    <input
                                      type="number"
                                      min={1}
                                      step={10}
                                      value={quotedRate}
                                      onChange={(e) => handleCustomRateChange(svc.id, Number(e.target.value))}
                                      className="w-24 pl-5 pr-2 py-1 rounded-lg border border-purple-300 bg-white font-mono font-bold text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#673AB7] shadow-2xs"
                                    />
                                  </div>
                                </td>

                                {/* Commission Rate (%) [Read-only] */}
                                <td className="py-2.5 px-2.5 text-center">
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-100 text-[#673AB7] text-[10px] font-bold">
                                    {commRate}%
                                  </span>
                                </td>

                                {/* Admin Commission Cut (₹) [Auto-calculated] */}
                                <td className="py-2.5 px-2.5 text-right font-mono text-gray-700 font-semibold text-xs">
                                  ₹{adminCommissionCut}
                                </td>

                                {/* Net Partner Payout (₹) [Auto-calculated] */}
                                <td className="py-2.5 px-3 text-right">
                                  <span className="font-mono font-black text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    ₹{netPartnerPayout}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Metric Strip */}
                  {(() => {
                    const activeSelectedList = catalogServices.filter((s) => selectedServiceIds.includes(s.id));
                    const totalQuoted = activeSelectedList.reduce((acc, s) => {
                      const q = Number(customRates[s.id] !== undefined ? customRates[s.id] : s.basePrice);
                      return acc + q;
                    }, 0);
                    const totalAdminCut = activeSelectedList.reduce((acc, s) => {
                      const q = Number(customRates[s.id] !== undefined ? customRates[s.id] : s.basePrice);
                      const comm = s.commissionRate || 15;
                      return acc + Math.round((q * comm) / 100);
                    }, 0);
                    const totalNetPayout = totalQuoted - totalAdminCut;

                    return (
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="p-2 rounded-xl bg-purple-100/50 border border-purple-200">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">
                            Quoted Portfolio Sum
                          </span>
                          <span className="font-mono font-extrabold text-[#673AB7] text-xs">
                            ₹{totalQuoted.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-100/50 border border-purple-200">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">
                            Platform Cut
                          </span>
                          <span className="font-mono font-extrabold text-purple-900 text-xs">
                            ₹{totalAdminCut.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                            Net Partner Disbursement
                          </span>
                          <span className="font-mono font-extrabold text-emerald-700 text-xs">
                            ₹{totalNetPayout.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#673AB7] shrink-0" />
                <span>
                  This customized rate card matrix persists in the partner profile schema and is referenced during booking dispatch across <strong>{currentSociety?.societyName || 'the assigned community'}</strong>.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: KYC & Verification Documents */}
          {activeStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              {/* 1. National ID & PAN */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  1. Identity Verification (ID Proof & PAN)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">ID Proof Type</label>
                    <select
                      value={nationalIdType}
                      onChange={(e) => setNationalIdType(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-semibold text-gray-900"
                    >
                      <option>Aadhaar Card</option>
                      <option>Voter ID Card</option>
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
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white text-xs font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white text-xs font-mono font-semibold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Driving License (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-0420110091"
                      value={dlNumber}
                      onChange={(e) => setDlNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 flex items-center gap-1.5 text-gray-700 font-medium">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{nationalIdDoc?.name || 'national_id.pdf'}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 flex items-center gap-1.5 text-gray-700 font-medium">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{panDoc?.name || 'pan_card.jpg'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Bank Details */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                  2. Settlement Bank Account Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Name as per Bank Passbook"
                      value={bankAccHolder}
                      onChange={(e) => setBankAccHolder(e.target.value)}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank / ICICI Bank"
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
                      placeholder="e.g. HDFC0001234"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      className="w-full p-2 rounded-lg border border-gray-300 bg-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 inline-flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-[#673AB7]" />
                  <span>Passbook / Cheque: {passbookDoc?.name || 'passbook.pdf'}</span>
                </div>
              </div>

              {/* 3. Police Verification */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                    3. Police Background Clearance
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPoliceVerified}
                      onChange={(e) => setIsPoliceVerified(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-xs font-bold text-emerald-900">Certificate Verified</span>
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
                      <span className="truncate">{policeDoc?.name || 'police_clearance.pdf'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Other Documents / Agreements */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    4. Service Agreements & Certifications ({agreementDocs.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAgreementDoc}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Documents</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {agreementDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#673AB7]" />
                        <span className="font-semibold text-gray-900">{doc.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({doc.fileName})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAgreementDoc(idx)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Super Admin Status Toggle */}
              {onboardedBy === 'super_admin' && (
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Initial Verification Status</span>
                    <span className="text-[11px] text-gray-500">Super Admin can directly approve or set to pending</span>
                  </div>
                  <select
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value as any)}
                    className="p-1.5 rounded-lg border border-purple-300 bg-white text-xs font-bold text-[#673AB7]"
                  >
                    <option value="ACTIVE">Directly Active / Approved</option>
                    <option value="PENDING">Pending Verification</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
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
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
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
                <span>
                  {loading
                    ? 'Submitting Application...'
                    : onboardedBy === 'super_admin'
                    ? 'Complete Partner Onboarding'
                    : 'Submit for Super Admin Verification'}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
