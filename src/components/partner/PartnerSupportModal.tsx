/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send 
} from 'lucide-react';
import { PartnerSupportTicket } from '../../types/servicePartner';
import { servicePartnerService } from '../../services/firebase/servicePartner.service';

interface PartnerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
}

export const PartnerSupportModal: React.FC<PartnerSupportModalProps> = ({
  isOpen,
  onClose,
  partnerId,
}) => {
  const [tickets, setTickets] = useState<PartnerSupportTicket[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState<'Payment Dispute' | 'Customer Issue' | 'Gate Clearance' | 'App Bug' | 'Other'>('Gate Clearance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const list = await servicePartnerService.getSupportTickets(partnerId);
    setTickets(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, partnerId]);

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await servicePartnerService.createSupportTicket(partnerId, {
        topic,
        title,
        description,
      });
      setTitle('');
      setDescription('');
      setShowCreate(false);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#673AB7]" />
            <div>
              <h2 className="text-base font-black text-[#111111]">Partner Support Hub</h2>
              <p className="text-xs text-[#A9B0B8]">Direct line to Happiiz Platform Admins</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-white border-b border-[#E6F1F5] flex items-center justify-between">
          <span className="text-xs font-bold text-[#64748B]">
            {tickets.length} Support Tickets
          </span>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {showCreate && (
            <form onSubmit={handleCreateTicket} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
              <h4 className="font-bold text-xs text-[#111111]">Raise Support Request</h4>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Issue Topic</label>
                <select
                  value={topic}
                  onChange={(e: any) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                >
                  <option value="Gate Clearance">Gate Clearance / Scanner Issue</option>
                  <option value="Payment Dispute">Payment Dispute / Wallet Settlement</option>
                  <option value="Customer Issue">Resident / Customer Coordination</option>
                  <option value="App Bug">Application Technical Bug</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guard terminal scanner issue at Gate A"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe what occurred..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit to Admin Desk'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                      {t.topic}
                    </span>
                    <h4 className="font-extrabold text-xs text-[#111111] mt-1">{t.title}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <p className="text-xs text-[#64748B]">{t.description}</p>

                {t.adminReply && (
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                    <p className="text-[10px] font-bold text-purple-900 uppercase">Platform Admin Response:</p>
                    <p className="text-purple-800 mt-0.5">{t.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
