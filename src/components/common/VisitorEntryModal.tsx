/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Camera, CheckCircle2, User, Phone, Building, Home, Truck, Wrench, Car } from 'lucide-react';

export type VisitorCategory = 'Guest' | 'Delivery' | 'Service' | 'Cab';

interface VisitorEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: VisitorCategory;
  onSubmit: (data: any) => void;
  isGuardView?: boolean;
}

export const VisitorEntryModal: React.FC<VisitorEntryModalProps> = ({
  isOpen,
  onClose,
  category,
  onSubmit,
  isGuardView = false,
}) => {
  // Shared Form Fields
  const [visitorName, setVisitorName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [society, setSociety] = useState('Emerald Heights');
  const [wing, setWing] = useState('B');
  const [flatNumber, setFlatNumber] = useState('704');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Delivery Specific
  const [companyName, setCompanyName] = useState('Swiggy');

  // Service Specific
  const [agencyName, setAgencyName] = useState('Urban Company');

  // Cab Specific
  const [cabCompany, setCabCompany] = useState('Uber');
  const [vehicleNumber, setVehicleNumber] = useState('MH 02 CZ 4821');
  const [lastFourDigits, setLastFourDigits] = useState('4821');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const handleSimulatePhoto = () => {
    // Simulated instant photo capture
    setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedCode = `${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessCode(generatedCode);

      onSubmit({
        category,
        visitorName,
        mobileNumber,
        wing,
        flatNumber,
        companyName,
        agencyName,
        cabCompany,
        vehicleNumber,
        lastFourDigits,
        photoUrl,
        passCode: generatedCode,
      });
    }, 400);
  };

  const handleDone = () => {
    setSuccessCode(null);
    setVisitorName('');
    setMobileNumber('');
    setPhotoUrl(null);
    onClose();
  };

  const getTitle = () => {
    switch (category) {
      case 'Guest':
        return isGuardView ? 'New Guest Check-in' : 'Pre-Approve Guest';
      case 'Delivery':
        return isGuardView ? 'New Delivery Entry' : 'Pre-Approve Delivery';
      case 'Service':
        return isGuardView ? 'Service Technician Entry' : 'Pre-Approve Service';
      case 'Cab':
        return isGuardView ? 'Cab / Taxi Entry' : 'Pre-Approve Cab';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDone}
      title={getTitle()}
      description="Add verified visitor details for swift gate clearance"
      maxWidth="md"
    >
      {successCode ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111111]">
              {isGuardView ? 'Visitor Checked In Successfully!' : 'Pass Generated Successfully!'}
            </h3>
            <p className="text-xs text-[#A9B0B8] mt-1">
              Share this 6-digit entry code with the visitor or security gate
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] max-w-xs mx-auto">
            <p className="text-xs font-semibold text-[#A9B0B8] uppercase tracking-wider mb-1">
              6-Digit Gate Code
            </p>
            <p className="text-3xl font-mono font-extrabold text-[#673AB7] tracking-widest">
              {successCode}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="w-full py-3 rounded-xl bg-[#673AB7] text-white font-bold text-sm hover:bg-[#512DA8] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Guest Form */}
          {category === 'Guest' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Visitor Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Karan Mehra"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </>
          )}

          {/* Delivery Form */}
          {category === 'Delivery' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Delivery Person
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Ramesh"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Company
                  </label>
                  <select
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="Swiggy">Swiggy</option>
                    <option value="Zomato">Zomato</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Blinkit">Blinkit</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </>
          )}

          {/* Service Form */}
          {category === 'Service' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Technician Name
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Service / Agency
                  </label>
                  <select
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="Urban Company">Urban Company</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="AC Servicing">AC Servicing</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Pest Control">Pest Control</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </>
          )}

          {/* Cab Form */}
          {category === 'Cab' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Cab Provider
                  </label>
                  <select
                    value={cabCompany}
                    onChange={(e) => setCabCompany(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="Uber">Uber</option>
                    <option value="Ola">Ola</option>
                    <option value="Rapido">Rapido</option>
                    <option value="Private Taxi">Private Taxi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={lastFourDigits}
                    onChange={(e) => setLastFourDigits(e.target.value)}
                    placeholder="e.g. 4821"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] font-mono font-bold text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">
                  Vehicle Reg. Details
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. MH 02 CZ 4821"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
            </>
          )}

          {/* Flat & Wing Location (Consistent across all forms) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Wing / Tower *
              </label>
              <input
                type="text"
                required
                value={wing}
                onChange={(e) => setWing(e.target.value)}
                placeholder="Tower B"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Flat Number *
              </label>
              <input
                type="text"
                required
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="704"
                className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-sm text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          {/* Optional Visitor Photo for Guard Terminal */}
          {isGuardView && (
            <div className="pt-1">
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Visitor Photo / Gate Snapshot
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulatePhoto}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-bold text-[#673AB7] hover:bg-[#E6F1F5] transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{photoUrl ? 'Retake Photo' : 'Capture Gate Camera'}</span>
                </button>
                {photoUrl && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Snapshot Captured
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#673AB7] text-white font-bold text-sm hover:bg-[#512DA8] active:scale-[0.98] transition-all shadow-md shadow-[#673AB7]/20 flex items-center justify-center cursor-pointer"
            >
              {isSubmitting ? 'Verifying & Generating...' : isGuardView ? 'Grant Gate Entry' : 'Generate Pre-Approval Pass'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
