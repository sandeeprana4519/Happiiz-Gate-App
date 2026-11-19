/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Filter,
  Wrench,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HelpDeskComplaint, ComplaintCategory } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentHelpDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  residentUid: string;
  residentName: string;
  building: string;
  flatNumber: string;
}

export const ResidentHelpDeskModal: React.FC<ResidentHelpDeskModalProps> = ({
  isOpen,
  onClose,
  societyId,
  residentUid,
  residentName,
  building,
  flatNumber,
}) => {
  const [complaints, setComplaints] = useState<HelpDeskComplaint[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [category, setCategory] = useState<ComplaintCategory>('Plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await residentService.getComplaints(societyId, residentUid);
      setComplaints(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, societyId, residentUid]);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await residentService.createComplaint(
        societyId,
        residentUid,
        residentName,
        building,
        flatNumber,
        {
          category,
          title,
          description,
          priority,
        }
      );
      setTitle('');
      setDescription('');
      setShowCreate(false);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (complaintId: string) => {
    if (!commentText.trim()) return;
    await residentService.addComplaintComment(societyId, complaintId, residentName, commentText);
    setCommentText('');
    await loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              HelpDesk & Suggestions
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Manage complaints & maintenance tickets for Flat {flatNumber}
            </p>
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
            {complaints.length} Total Tickets
          </span>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3.5 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Create Complaint Form */}
          {showCreate && (
            <form onSubmit={handleCreateSubmit} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
              <h4 className="font-black text-xs text-[#111111]">Raise New Society Complaint</h4>
              <div>
                <label className="block font-bold text-[#111111] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                >
                  {['Plumbing', 'Electricity', 'Parking', 'Lift', 'Water Supply', 'Security', 'Housekeeping', 'Other'].map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water seepage in ceiling"
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
                  placeholder="Please describe the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">Priority</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold ${
                        priority === p
                          ? 'bg-[#673AB7] text-white'
                          : 'bg-white text-[#64748B] border border-[#E6F1F5]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit to Society Office'}
              </button>
            </form>
          )}

          {/* Complaints List */}
          <div className="space-y-3">
            {complaints.map((c) => {
              const isExpanded = expandedComplaintId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {c.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-[#111111] mt-1">{c.title}</h4>
                    </div>

                    <button
                      onClick={() => setExpandedComplaintId(isExpanded ? null : c.id)}
                      className="p-1 text-[#64748B] hover:text-[#111111] transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-xs text-[#64748B] leading-relaxed">{c.description}</p>

                  <div className="text-[11px] text-[#A9B0B8] flex items-center justify-between pt-1 border-t border-[#E6F1F5]">
                    <span>Raised: {new Date(c.createdAt).toLocaleDateString()}</span>
                    {c.assignedTo && (
                      <span className="font-semibold text-[#673AB7]">Assigned: {c.assignedTo}</span>
                    )}
                  </div>

                  {/* Expanded Thread & Replies */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#E6F1F5] space-y-3">
                      {/* Admin Replies */}
                      {c.adminReplies && c.adminReplies.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-[#673AB7] tracking-wider">
                            Society Admin Updates
                          </span>
                          {c.adminReplies.map((r) => (
                            <div key={r.id} className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                              <p className="text-[11px] font-bold text-purple-900">{r.author} ({r.role})</p>
                              <p className="text-xs text-purple-800 mt-0.5">{r.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comments */}
                      {c.comments && c.comments.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-[#A9B0B8] tracking-wider">
                            Conversation Timeline
                          </span>
                          {c.comments.map((cm) => (
                            <div key={cm.id} className="p-2.5 rounded-xl bg-white border border-[#E6F1F5]">
                              <p className="text-[10px] font-bold text-[#111111]">{cm.author}</p>
                              <p className="text-xs text-[#64748B] mt-0.5">{cm.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Reply or add note..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(c.id)}
                          className="px-3 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
