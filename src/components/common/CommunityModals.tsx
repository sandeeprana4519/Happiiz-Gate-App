/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from './Modal';
import { CheckCircle2, AlertCircle, FileText, Calendar, CreditCard, Send, Plus } from 'lucide-react';
import { MOCK_FACILITIES } from '../../services/mock/mockData';

interface HelpDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDeskModal: React.FC<HelpDeskModalProps> = ({ isOpen, onClose }) => {
  const [complaintType, setComplaintType] = useState('Plumbing Issue');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tickets, setTickets] = useState([
    { id: 'TKT-104', type: 'Lift Maintenance', status: 'In Progress', date: 'Yesterday' },
    { id: 'TKT-098', type: 'Corridor Light Replacement', status: 'Resolved', date: '3 days ago' },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    const newTkt = {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      type: complaintType,
      status: 'Pending',
      date: 'Just now',
    };
    setTickets([newTkt, ...tickets]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="HelpDesk & Suggestions"
      description="Report maintenance complaints or suggestions to society admin"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-[#111111]">Ticket Raised Successfully</h4>
            <p className="text-xs text-[#A9B0B8]">Society maintenance staff has been assigned.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Category</label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium text-[#111111] focus:outline-none focus:border-[#673AB7]"
              >
                <option value="Plumbing Issue">Plumbing Issue</option>
                <option value="Electrical Problem">Electrical Problem</option>
                <option value="Lift / Elevator Maintenance">Lift / Elevator Maintenance</option>
                <option value="Security & Gate Concern">Security & Gate Concern</option>
                <option value="Housekeeping / Cleanliness">Housekeeping / Cleanliness</option>
                <option value="General Suggestion">General Suggestion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Details & Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue or suggestion for society management..."
                className="w-full p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
            >
              Submit Ticket
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-[#E6F1F5]">
          <p className="text-xs font-bold text-[#111111] mb-2">Recent Tickets</p>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#111111]">{t.type}</p>
                  <p className="text-[10px] text-[#A9B0B8]">{t.id} · {t.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

interface NoticeBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NoticeBoardModal: React.FC<NoticeBoardModalProps> = ({ isOpen, onClose }) => {
  const notices = [
    {
      id: 'N-01',
      title: 'Annual General Body Meeting (AGM)',
      date: 'This Sunday, 10:00 AM',
      body: 'All residents are cordially invited to the Clubhouse for the FY 2026-27 society budget presentation and trustee election.',
      isNew: true,
    },
    {
      id: 'N-02',
      title: 'Water Tank Deep Cleaning Schedule',
      date: 'Thursday, 2:00 PM – 6:00 PM',
      body: 'Overhead tank cleaning for Tower B & C. Please store adequate drinking water in advance.',
      isNew: true,
    },
    {
      id: 'N-03',
      title: 'Clubhouse Swimming Pool Summer Hours',
      date: 'Effective immediately',
      body: 'Pool timings extended: Morning 6:00 AM – 10:30 AM, Evening 4:30 PM – 9:00 PM.',
      isNew: false,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Society Notice Board"
      description="Official announcements & circulars from the Managing Committee"
      maxWidth="md"
    >
      <div className="space-y-3 pt-1">
        {notices.map((n) => (
          <div key={n.id} className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#111111] flex items-center gap-1.5">
                {n.title}
                {n.isNew && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#E53945] text-white text-[9px] font-bold">
                    NEW
                  </span>
                )}
              </h4>
              <span className="text-[10px] text-[#A9B0B8] font-mono">{n.date}</span>
            </div>
            <p className="text-[#64748B] leading-relaxed">{n.body}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SocietyPaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const [paid, setPaid] = useState(false);

  const handlePay = () => {
    setPaid(true);
    setTimeout(() => {
      setPaid(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Do Society Payment"
      description="Direct settlement of society maintenance dues"
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1">
        {paid ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-[#111111]">Payment of ₹4,200 Successful</h4>
            <p className="text-xs text-[#A9B0B8]">Transaction ID: TXN-89218204 · Receipt generated</p>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Society Maintenance (Flat B-704)</span>
                <span className="font-mono font-semibold text-[#111111]">₹3,400</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Sinking & Repair Fund</span>
                <span className="font-mono font-semibold text-[#111111]">₹500</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Water Supply Charges</span>
                <span className="font-mono font-semibold text-[#111111]">₹300</span>
              </div>
              <div className="pt-2 border-t border-[#E6F1F5] flex justify-between font-bold text-sm text-[#111111]">
                <span>Total Amount Due</span>
                <span className="text-[#673AB7]">₹4,200</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              className="w-full py-3 rounded-xl bg-[#673AB7] text-white font-bold text-xs hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay ₹4,200 Now via UPI / NetBanking</span>
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

interface BookAmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookAmenitiesModal: React.FC<BookAmenitiesModalProps> = ({ isOpen, onClose }) => {
  const [selectedAmenity, setSelectedAmenity] = useState('Clubhouse Party Hall');
  const [date, setDate] = useState('2026-11-15');
  const [timeSlot, setTimeSlot] = useState('06:00 PM – 09:00 PM');
  const [booked, setBooked] = useState(false);

  const amenities = [
    { name: 'Clubhouse Party Hall', capacity: '120 Guests', rate: '₹2,500 / event' },
    { name: 'Tennis & Badminton Court', capacity: '4 Players', rate: 'Complimentary' },
    { name: 'Rooftop Lounge & Barbecue', capacity: '35 Guests', rate: '₹1,200 / evening' },
    { name: 'Conference & Co-Working Hub', capacity: '16 Seats', rate: 'Complimentary' },
  ];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      onClose();
    }, 1400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Society Amenities"
      description="Reserve clubhouse, sports courts and common facilities"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {booked ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-[#111111]">Amenity Booking Confirmed</h4>
            <p className="text-xs text-[#A9B0B8]">{selectedAmenity} reserved for {date} ({timeSlot})</p>
          </div>
        ) : (
          <form onSubmit={handleBook} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Select Amenity</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {amenities.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => setSelectedAmenity(a.name)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedAmenity === a.name
                        ? 'bg-[#F1F9FC] border-[#673AB7] ring-1 ring-[#673AB7]'
                        : 'bg-white border-[#E6F1F5] hover:bg-[#F1F9FC]'
                    }`}
                  >
                    <p className="font-bold text-xs text-[#111111]">{a.name}</p>
                    <p className="text-[10px] text-[#A9B0B8]">{a.capacity} · {a.rate}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none focus:border-[#673AB7]"
                >
                  <option value="06:00 AM – 09:00 AM">06:00 AM – 09:00 AM</option>
                  <option value="10:00 AM – 01:00 PM">10:00 AM – 01:00 PM</option>
                  <option value="02:00 PM – 05:00 PM">02:00 PM – 05:00 PM</option>
                  <option value="06:00 PM – 09:00 PM">06:00 PM – 09:00 PM</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
            >
              Confirm Facility Booking
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
