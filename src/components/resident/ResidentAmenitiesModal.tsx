/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Building,
  Sparkles
} from 'lucide-react';
import { SocietyAmenityItem, AmenityBooking } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentAmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  residentUid: string;
  residentName: string;
  flatNumber: string;
}

export const ResidentAmenitiesModal: React.FC<ResidentAmenitiesModalProps> = ({
  isOpen,
  onClose,
  societyId,
  residentUid,
  residentName,
  flatNumber,
}) => {
  const [amenities, setAmenities] = useState<SocietyAmenityItem[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<SocietyAmenityItem | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeSlot, setTimeSlot] = useState('06:00 PM - 07:00 PM');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'MY_BOOKINGS'>('EXPLORE');

  const loadData = async () => {
    const [amn, bks] = await Promise.all([
      residentService.getAmenities(societyId),
      residentService.getAmenityBookings(societyId, residentUid),
    ]);
    setAmenities(amn);
    setBookings(bks);
    if (amn.length > 0 && !selectedAmenity) {
      setSelectedAmenity(amn[0]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, societyId, residentUid]);

  if (!isOpen) return null;

  const timeSlots = [
    '06:00 AM - 07:00 AM',
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM',
  ];

  const handleBookSlot = async () => {
    if (!selectedAmenity) return;
    setBookingLoading(true);
    try {
      await residentService.bookAmenity(societyId, residentUid, residentName, flatNumber, {
        amenityId: selectedAmenity.id,
        amenityName: selectedAmenity.name,
        bookingDate,
        timeSlot,
        totalCharges: selectedAmenity.chargePerHour,
      });
      alert(`🎉 Booking confirmed for ${selectedAmenity.name} on ${bookingDate} (${timeSlot})!`);
      await loadData();
      setActiveTab('MY_BOOKINGS');
    } catch (err: any) {
      alert(err.message || 'Failed to book amenity.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Book Amenities
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Clubhouse, Pool, Courts & Halls for Flat {flatNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-3 bg-white border-b border-[#E6F1F5] gap-2">
          <button
            onClick={() => setActiveTab('EXPLORE')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'EXPLORE'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Amenities Catalog
          </button>
          <button
            onClick={() => setActiveTab('MY_BOOKINGS')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MY_BOOKINGS'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'EXPLORE' && (
            <div className="space-y-4">
              {/* Horizontal Amenities Selector */}
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {amenities.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAmenity(a)}
                    className={`p-2.5 rounded-2xl border text-left min-w-[140px] shrink-0 transition-all cursor-pointer ${
                      selectedAmenity?.id === a.id
                        ? 'border-[#673AB7] ring-2 ring-[#673AB7]/30 bg-[#F1F9FC]'
                        : 'border-[#E6F1F5] bg-white hover:border-[#673AB7]'
                    }`}
                  >
                    <img
                      src={a.photoUrl}
                      alt={a.name}
                      className="w-full h-16 object-cover rounded-xl mb-2"
                    />
                    <p className="font-extrabold text-xs text-[#111111] truncate">{a.name}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {a.chargePerHour === 0 ? 'Free' : `₹${a.chargePerHour}/hr`}
                    </p>
                  </button>
                ))}
              </div>

              {/* Selected Amenity Details */}
              {selectedAmenity && (
                <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#111111]">{selectedAmenity.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[#673AB7] font-bold text-[10px] border border-[#E6F1F5]">
                      {selectedAmenity.chargePerHour === 0 ? 'Complimentary' : `₹${selectedAmenity.chargePerHour} / hour`}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">{selectedAmenity.description}</p>
                  
                  <div className="text-[11px] text-[#A9B0B8] flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-[#111111]">
                      <Clock className="w-3.5 h-3.5 text-[#673AB7]" />
                      {selectedAmenity.openingTime} - {selectedAmenity.closingTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Capacity: {selectedAmenity.capacity}
                    </span>
                  </div>

                  {/* Rules */}
                  <div className="p-2.5 rounded-xl bg-white border border-[#E6F1F5] text-[11px] text-[#64748B] space-y-1">
                    <p className="font-bold text-[#111111]">Guidelines:</p>
                    {selectedAmenity.rules.map((r, i) => (
                      <p key={i}>• {r}</p>
                    ))}
                  </div>

                  {/* Date & Slot Picker */}
                  <div className="space-y-2 pt-2 border-t border-[#E6F1F5]">
                    <div>
                      <label className="block font-bold text-[#111111] mb-1">Select Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#111111] mb-1">Select Time Slot</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setTimeSlot(slot)}
                            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                              timeSlot === slot
                                ? 'bg-[#673AB7] text-white shadow-xs'
                                : 'bg-white text-[#64748B] border border-[#E6F1F5] hover:border-[#673AB7]'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={bookingLoading}
                      onClick={handleBookSlot}
                      className="w-full py-3 rounded-2xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{bookingLoading ? 'Reserving...' : `Confirm Reservation (${selectedAmenity.chargePerHour === 0 ? 'Free' : `₹${selectedAmenity.chargePerHour}`})`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MY_BOOKINGS' && (
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-slate-500 font-medium">
                  No active amenity reservations. Select a facility to book a slot.
                </div>
              ) : (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#111111]">{b.amenityName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {b.bookingDate} · {b.timeSlot}
                      </p>
                    </div>

                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={async () => {
                          if (confirm('Cancel this booking?')) {
                            await residentService.cancelAmenityBooking(societyId, b.id);
                            await loadData();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
