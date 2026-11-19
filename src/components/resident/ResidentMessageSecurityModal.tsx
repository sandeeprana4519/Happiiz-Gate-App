/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Shield, MessageSquare, CheckCircle2 } from 'lucide-react';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentMessageSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  building: string;
  flatNumber: string;
  residentUid: string;
  residentName: string;
}

export const ResidentMessageSecurityModal: React.FC<ResidentMessageSecurityModalProps> = ({
  isOpen,
  onClose,
  societyId,
  building,
  flatNumber,
  residentUid,
  residentName,
}) => {
  const [recipient, setRecipient] = useState<'SECURITY' | 'ADMIN'>('SECURITY');
  const [category, setCategory] = useState<'Delivery' | 'Parking' | 'Security' | 'General'>('Delivery');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      await residentService.sendMessageToSecurity(
        societyId,
        residentUid,
        residentName,
        building,
        flatNumber,
        category,
        title,
        message
      );
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 1500);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
          <div>
            <h2 className="text-base font-black text-[#111111]">
              Send Gate Instruction
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Direct line to Gate Guards & Society Office
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-black text-[#111111]">Message Delivered!</h4>
            <p className="text-xs text-[#64748B]">
              Guard station has received your instructions for Flat {flatNumber}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-3.5 text-xs">
            {/* Recipient */}
            <div>
              <label className="block font-bold text-[#111111] mb-1">Send To</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipient('SECURITY')}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    recipient === 'SECURITY'
                      ? 'bg-[#673AB7] text-white shadow-xs'
                      : 'bg-[#F1F9FC] text-[#64748B]'
                  }`}
                >
                  Gate Guards
                </button>
                <button
                  type="button"
                  onClick={() => setRecipient('ADMIN')}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    recipient === 'ADMIN'
                      ? 'bg-[#673AB7] text-white shadow-xs'
                      : 'bg-[#F1F9FC] text-[#64748B]'
                  }`}
                >
                  Society Admin
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-[#111111] mb-1">Instruction Type</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              >
                <option value="Delivery">Delivery / Parcel drop-off</option>
                <option value="Parking">Visitor Car Parking slot</option>
                <option value="Security">Quiet hours / Contractor restriction</option>
                <option value="General">General gate instruction</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#111111] mb-1">Subject / Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Keep Amazon parcel at Gate Cabin"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#111111] mb-1">Instruction Details</label>
              <textarea
                rows={3}
                required
                placeholder="Write specific instructions for guards..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-2xl bg-[#673AB7] text-white font-extrabold text-xs hover:bg-[#512DA8] shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending...' : 'Transmit to Gate Post'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
