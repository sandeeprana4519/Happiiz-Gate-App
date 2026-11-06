/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  User, 
  Phone, 
  Building, 
  Home, 
  Truck, 
  Wrench, 
  Car, 
  Layers, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { VisitorCategoryType } from '../../types/guard';

interface GuardVisitorEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory: VisitorCategoryType;
  onSubmit: (data: any) => Promise<void>;
  societyBuildings?: string[];
}

export const GuardVisitorEntryModal: React.FC<GuardVisitorEntryModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  onSubmit,
  societyBuildings = ['Tower A', 'Tower B', 'Tower C', 'Wing D']
}) => {
  const [category, setCategory] = useState<VisitorCategoryType>(initialCategory);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [building, setBuilding] = useState(societyBuildings[0] || 'Tower A');
  const [flatNumber, setFlatNumber] = useState('402');
  const [numberOfVisitors, setNumberOfVisitors] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Delivery fields
  const [deliveryCompany, setDeliveryCompany] = useState('Zomato');
  const [deliveryType, setDeliveryType] = useState<'Food' | 'Grocery' | 'E-commerce' | 'Courier' | 'Other'>('Food');
  const [packageDescription, setPackageDescription] = useState('');

  // Service fields
  const [serviceCompany, setServiceCompany] = useState('Urban Company');
  const [serviceCategory, setServiceCategory] = useState<any>('Electrician');

  // Cab fields
  const [cabCompany, setCabCompany] = useState<any>('Uber');
  const [cabVehiclePlate, setCabVehiclePlate] = useState('MH 02 CZ 4821');
  const [cabPassengers, setCabPassengers] = useState(1);

  // Camera capture state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  const handleStartCamera = async () => {
    try {
      setShowCamera(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable, using simulated capture:', err);
      // Fallback preset photo
      setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');
      setShowCamera(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoUrl(dataUrl);
      }
    }
    handleStopCamera();
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleSimulatePhoto = () => {
    setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        visitorName,
        visitorPhone: visitorPhone || undefined,
        building,
        flatNumber: `${building.split(' ')[1] || 'A'}-${flatNumber}`,
        numberOfVisitors,
        purpose,
        photoUrl: photoUrl || undefined,
        deliveryCompany: category === 'Delivery' ? deliveryCompany : undefined,
        deliveryType: category === 'Delivery' ? deliveryType : undefined,
        packageDescription: category === 'Delivery' ? packageDescription : undefined,
        serviceCompany: category === 'Service' ? serviceCompany : undefined,
        serviceCategory: category === 'Service' ? serviceCategory : undefined,
        cabCompany: category === 'Cab' ? cabCompany : undefined,
        cabVehiclePlate: category === 'Cab' ? cabVehiclePlate : undefined,
        cabPassengers: category === 'Cab' ? cabPassengers : undefined,
      });

      const randomPass = `${Math.floor(100000 + Math.random() * 900000)}`;
      setSuccessCode(randomPass);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    handleStopCamera();
    setSuccessCode(null);
    setVisitorName('');
    setVisitorPhone('');
    setPhotoUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 my-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-50 text-[#673AB7]">
              {category === 'Guest' ? <User className="w-5 h-5" /> :
               category === 'Delivery' ? <Truck className="w-5 h-5" /> :
               category === 'Service' ? <Wrench className="w-5 h-5" /> :
               <Car className="w-5 h-5" />}
            </span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">
                New {category} Entry
              </h3>
              <p className="text-[11px] text-gray-400">Security Check-in at Gate</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation state */}
        {successCode ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">Visitor Entry Dispatched!</h4>
              <p className="text-xs text-gray-500 mt-1">
                Notification sent to Resident of <strong className="text-gray-900">{building} - Flat {flatNumber}</strong>
              </p>
            </div>

            <div className="p-4 bg-[#F1F9FC] border border-[#BEE3F8] rounded-2xl max-w-xs mx-auto text-center">
              <span className="text-[10px] uppercase font-bold text-[#673AB7] tracking-wider block">Pass OTP Code</span>
              <span className="text-2xl font-mono font-black text-gray-900 tracking-widest">{successCode}</span>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 bg-[#673AB7] text-white font-bold text-sm rounded-xl hover:bg-[#5E35B1] transition shadow-md"
            >
              Done & Return to Terminal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            {/* Category Selector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F9FC] rounded-xl border border-gray-100">
              {(['Guest', 'Delivery', 'Service', 'Cab'] as VisitorCategoryType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    category === cat
                      ? 'bg-[#673AB7] text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Photo capture block */}
            <div className="p-3 bg-[#F1F9FC] rounded-2xl border border-gray-100 flex items-center gap-3">
              {photoUrl ? (
                <div className="relative">
                  <img src={photoUrl} alt="Visitor" className="w-14 h-14 rounded-xl object-cover border-2 border-[#673AB7]" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 text-[#673AB7] flex flex-col items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">Photo</span>
                </div>
              )}

              <div className="flex-1">
                <span className="font-semibold text-gray-800 block text-xs">Visitor Photograph</span>
                <span className="text-[11px] text-gray-400 block mb-2">Required for gate audit compliance</span>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1 text-[11px]"
                  >
                    <Camera className="w-3 h-3 text-[#673AB7]" /> Open Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatePhoto}
                    className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 text-[11px]"
                  >
                    Quick Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Camera Viewfinder if open */}
            {showCamera && (
              <div className="p-3 bg-black rounded-2xl space-y-2">
                <video ref={videoRef} autoPlay playsInline className="w-full h-44 object-cover rounded-xl" />
                <div className="flex justify-between items-center px-2">
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="text-white text-xs underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-4 py-1.5 bg-emerald-500 text-white font-bold rounded-lg text-xs"
                  >
                    Snap Photo
                  </button>
                </div>
              </div>
            )}

            {/* Basic Info: Name & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">
                  {category === 'Cab' ? 'Driver Name (Optional)' : 'Visitor Full Name *'}
                </label>
                <input
                  type="text"
                  placeholder={category === 'Cab' ? 'e.g. Ramesh' : 'e.g. Karan Mehra'}
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  required={category !== 'Cab'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98210 00000"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>
            </div>

            {/* Flat Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-600 mb-1">Tower / Wing *</label>
                <select
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  {societyBuildings.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 mb-1">Flat Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 402 or 704"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-bold text-gray-900"
                />
              </div>
            </div>

            {/* Category-Specific fields */}
            {category === 'Guest' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Number of Guests</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={numberOfVisitors}
                    onChange={(e) => setNumberOfVisitors(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    placeholder="e.g. Family Meet, Dinner"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {category === 'Delivery' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Delivery Company *</label>
                    <select
                      value={deliveryCompany}
                      onChange={(e) => setDeliveryCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-bold"
                    >
                      <option value="Zomato">Zomato</option>
                      <option value="Swiggy">Swiggy</option>
                      <option value="Blinkit">Blinkit</option>
                      <option value="Zepto">Zepto</option>
                      <option value="Amazon">Amazon</option>
                      <option value="Flipkart">Flipkart</option>
                      <option value="Dominos">Domino's</option>
                      <option value="BlueDart">Blue Dart / Courier</option>
                      <option value="Other">Other Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Delivery Type</label>
                    <select
                      value={deliveryType}
                      onChange={(e) => setDeliveryType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                    >
                      <option value="Food">Food Delivery</option>
                      <option value="Grocery">Grocery Delivery</option>
                      <option value="E-commerce">E-Commerce Box</option>
                      <option value="Courier">Postal / Courier</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Package Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Groceries bags, Order #991"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {category === 'Service' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Service Agency</label>
                  <input
                    type="text"
                    placeholder="e.g. Urban Company, Airtel"
                    value={serviceCompany}
                    onChange={(e) => setServiceCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Service Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="AC Technician">AC Technician</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Cleaning">Deep Cleaning</option>
                    <option value="Other">Other Technician</option>
                  </select>
                </div>
              </div>
            )}

            {category === 'Cab' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Cab Aggregator *</label>
                  <select
                    value={cabCompany}
                    onChange={(e) => setCabCompany(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-bold"
                  >
                    <option value="Uber">Uber</option>
                    <option value="Ola">Ola</option>
                    <option value="Rapido">Rapido</option>
                    <option value="InDrive">InDrive</option>
                    <option value="Other">Private Taxi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Vehicle Plate (Last 4 digits) *</label>
                  <input
                    type="text"
                    placeholder="e.g. 4821 or MH 02 CZ 4821"
                    value={cabVehiclePlate}
                    onChange={(e) => setCabVehiclePlate(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#673AB7] text-white font-extrabold text-xs rounded-xl hover:bg-[#5E35B1] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Approval Request...</span>
                  </>
                ) : (
                  <span>
                    {category === 'Cab' ? 'Allow Cab Entry & Check In' : 'Submit & Send Resident Approval'}
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
