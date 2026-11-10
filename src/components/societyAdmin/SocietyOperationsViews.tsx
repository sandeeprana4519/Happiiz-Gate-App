import React, { useState } from 'react';
import { 
  Megaphone, 
  HelpCircle, 
  CreditCard, 
  Calendar, 
  ShoppingBag, 
  Plus, 
  Pin, 
  Check, 
  X, 
  CheckCircle,
  Wrench,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { PartnerOnboardingModal } from '../partner/PartnerOnboardingModal';
import { 
  SocietyNotice, 
  SocietyComplaint, 
  SocietyInvoice, 
  SocietyAmenity, 
  SocietyAmenityBooking, 
  SocietyCommunityPost, 
  SocietyFlat
} from '../../types/societyAdmin';
import { Society } from '../../types/society';

// -------------------------------------------------------------
// MODULE 11: NOTICE BOARD MANAGEMENT
// -------------------------------------------------------------
interface NoticesViewProps {
  society: Society;
  notices: SocietyNotice[];
  onCreateNotice: (n: any) => Promise<void>;
  onArchiveNotice: (id: string) => Promise<void>;
}

export const SocietyNoticesView: React.FC<NoticesViewProps> = ({
  society,
  notices,
  onCreateNotice,
  onArchiveNotice
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SocietyNotice['category']>('General');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'OWNERS_ONLY' | 'TENANTS_ONLY'>('ALL');
  const [isPinned, setIsPinned] = useState(false);
  const [isEmergencyAlert, setIsEmergencyAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      await onCreateNotice({
        societyId: society.id,
        title,
        category,
        content,
        targetAudience,
        isPinned,
        isEmergencyAlert,
        status: 'PUBLISHED',
        publishedBy: 'Society Management Committee',
        publishedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setIsEmergencyAlert(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Notice Board</h2>
          <p className="text-sm text-gray-500">Publish community circulars, AGM announcements, maintenance schedules and urgent alerts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Notice
        </button>
      </div>

      <div className="space-y-4">
        {notices.map((n) => (
          <div 
            key={n.id} 
            className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
              n.isEmergencyAlert 
                ? 'border-red-300 bg-red-50/20' 
                : n.isPinned 
                ? 'border-purple-300 bg-[#F1F9FC]/40' 
                : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.isEmergencyAlert 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-[#F1F9FC] text-[#673AB7]'
                }`}>
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-base">{n.title}</h3>
                    {n.isPinned && (
                      <span className="flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-[#673AB7] px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}
                    {n.isEmergencyAlert && (
                      <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Urgent Alert
                      </span>
                    )}
                    <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {n.category}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Audience: {n.targetAudience}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Published on {new Date(n.publishedAt).toLocaleDateString([], { dateStyle: 'medium' })} by {n.publishedBy}
                  </p>
                </div>
              </div>

              {n.status === 'PUBLISHED' && (
                <button
                  onClick={() => onArchiveNotice(n.id)}
                  className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded transition"
                >
                  Archive
                </button>
              )}
            </div>

            <div className="mt-4 pl-13 text-sm text-gray-700 leading-relaxed whitespace-pre-line border-t border-gray-100/60 pt-3">
              {n.content}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Publish Society Notice</h3>
            <p className="text-xs text-gray-500 mb-4">Post a circular to residents' mobile dashboards and notice boards</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notice Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Annual General Body Meeting (AGM) Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="General">General Notice</option>
                    <option value="Maintenance">Maintenance / Utility</option>
                    <option value="Events">Community Event</option>
                    <option value="Security">Security Advisory</option>
                    <option value="Meeting">Meeting / AGM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="ALL">All Residents</option>
                    <option value="OWNERS_ONLY">Flat Owners Only</option>
                    <option value="TENANTS_ONLY">Tenants Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notice Body</label>
                <textarea
                  rows={5}
                  placeholder="Write clear instructions, dates, timings and contact person details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded text-[#673AB7] focus:ring-[#673AB7]"
                  />
                  <span className="text-xs font-semibold text-gray-700">Pin to top of feed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergencyAlert}
                    onChange={(e) => setIsEmergencyAlert(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs font-semibold text-red-600">Urgent Notice (Red alert)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  {submitting ? 'Publishing...' : 'Publish to Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 12: HELPDESK & COMPLAINT MANAGEMENT
// -------------------------------------------------------------
interface HelpDeskViewProps {
  society: Society;
  complaints: SocietyComplaint[];
  onUpdateComplaint: (id: string, data: Partial<SocietyComplaint>) => Promise<void>;
}

export const SocietyHelpDeskView: React.FC<HelpDeskViewProps> = ({
  society,
  complaints,
  onUpdateComplaint
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState<SocietyComplaint | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');

  const filtered = complaints.filter(c => statusFilter === 'ALL' || c.status === statusFilter);

  const handleOpenDetail = (c: SocietyComplaint) => {
    setSelectedComplaint(c);
    setAdminReply(c.adminReply || '');
    setAssignedStaff(c.assignedStaff || '');
  };

  const handleSaveResolution = async (newStatus: SocietyComplaint['status']) => {
    if (!selectedComplaint) return;
    await onUpdateComplaint(selectedComplaint.id, {
      status: newStatus,
      adminReply,
      assignedStaff,
      updatedAt: new Date().toISOString()
    });
    setSelectedComplaint(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">HelpDesk & Complaints Triage</h2>
          <p className="text-sm text-gray-500">Track resident tickets, assign maintenance technicians, and resolve issues</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-sm focus:outline-none"
          >
            <option value="ALL">All Tickets</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Resident & Flat</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-purple-50/20 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900">{c.subject}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{c.description}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-bold text-gray-800">{c.submittedByName}</div>
                    <div className="text-purple-700 font-semibold">Flat {c.flatNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-[#F1F9FC] text-gray-700 text-xs font-medium">
                      {c.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      c.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                      c.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600">
                    {c.assignedStaff || <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      c.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' :
                      c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(c)}
                      className="text-xs text-[#673AB7] hover:bg-purple-50 px-2.5 py-1 rounded-lg font-semibold transition"
                    >
                      Triage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 text-base mb-1">{selectedComplaint.subject}</h3>
            <p className="text-xs text-gray-500 mb-3">Raised by {selectedComplaint.submittedByName} (Flat {selectedComplaint.flatNumber})</p>

            <div className="bg-[#F1F9FC] p-3.5 rounded-xl border border-gray-100 text-xs text-gray-700 mb-4">
              {selectedComplaint.description}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Technician / Supervisor</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar (Plumbing Dept)"
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Administrative / Resolution Note</label>
                <textarea
                  rows={3}
                  placeholder="Provide resolution remarks visible to resident..."
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveResolution('IN_PROGRESS')}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveResolution('RESOLVED')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    Resolve Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 13: SOCIETY PAYMENT & MAINTENANCE MANAGEMENT
// -------------------------------------------------------------
interface MaintenanceViewProps {
  society: Society;
  invoices: SocietyInvoice[];
  flats: SocietyFlat[];
  onGenerateMonthlyInvoices: (month: string, amountPerFlat: number) => Promise<void>;
  onRecordOfflinePayment: (invoiceId: string, receiptNumber: string) => Promise<void>;
}

export const SocietyMaintenanceView: React.FC<MaintenanceViewProps> = ({
  society,
  invoices,
  flats,
  onGenerateMonthlyInvoices,
  onRecordOfflinePayment
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [targetMonth, setTargetMonth] = useState('April 2026');
  const [ratePerFlat, setRatePerFlat] = useState(3500);
  const [recordingInvoice, setRecordingInvoice] = useState<SocietyInvoice | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerateMonthlyInvoices(targetMonth, ratePerFlat);
    setShowGenerateModal(false);
  };

  const handleConfirmOfflineReceipt = async () => {
    if (!recordingInvoice || !receiptNumber) return;
    await onRecordOfflinePayment(recordingInvoice.id, receiptNumber);
    setRecordingInvoice(null);
    setReceiptNumber('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Maintenance & Invoicing</h2>
          <p className="text-sm text-gray-500">Flat billing generation, bank transaction receipts and accounts reconciliation</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate Monthly Dues
        </button>
      </div>

      {/* Gateway Notice Banner */}
      <div className="p-4 bg-[#F1F9FC] border border-[#BEE3F8] rounded-2xl flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-[#673AB7] shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <span className="font-bold text-gray-900">Bank & Payment Gateway Integrity Notice: </span>
          Online UPI & Netbanking gateway integration requires merchant banking credentials. For verified audit compliance, invoices remain in <span className="font-semibold text-amber-700">PENDING</span> status until an authorized Society Accountant enters a verified offline NEFT/RTGS bank reference or physical counter receipt.
        </div>
      </div>

      {/* Financial KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Total Maintenance Billed</span>
          <span className="text-2xl font-black text-gray-900">₹{totalBilled.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-emerald-600 font-semibold block mb-1">Total Realized & Collected</span>
          <span className="text-2xl font-black text-emerald-600">₹{totalCollected.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-amber-600 font-semibold block mb-1">Outstanding / Overdue</span>
          <span className="text-2xl font-black text-amber-600">₹{totalPending.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Flat & Resident</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-purple-50/20 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 text-xs">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900">{inv.flatNumber}</div>
                    <div className="text-xs text-gray-400">{inv.residentName}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-700 font-medium">
                    {inv.category}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-600">
                    {inv.dueDate}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700'
                        : inv.status === 'OVERDUE'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.status === 'PAID' ? (
                      <span className="text-xs font-mono text-gray-500">
                        {inv.receiptNumber || 'Paid'}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setRecordingInvoice(inv);
                          setReceiptNumber(`REC-${Math.floor(1000 + Math.random() * 9000)}`);
                        }}
                        className="text-xs bg-[#673AB7] text-white hover:bg-[#5E35B1] px-2.5 py-1 rounded-lg font-medium transition"
                      >
                        Record Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Monthly Dues Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Generate Monthly Dues</h3>
            <p className="text-xs text-gray-500 mb-4">Batch generate maintenance invoices for all registered flats</p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Billing Month</label>
                <input
                  type="text"
                  placeholder="e.g. May 2026"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rate per Flat (₹)</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={ratePerFlat}
                  onChange={(e) => setRatePerFlat(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  Generate Invoices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Offline Receipt Modal */}
      {recordingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Record Bank Receipt</h3>
            <p className="text-xs text-gray-500 mb-4">
              Flat {recordingInvoice.flatNumber} — Amount: ₹{recordingInvoice.amount}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank UTR / Cash Receipt Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-9912048"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRecordingInvoice(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOfflineReceipt}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
                >
                  Save & Reconcile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 14: AMENITIES MANAGEMENT
// -------------------------------------------------------------
interface AmenitiesViewProps {
  society: Society;
  amenities: SocietyAmenity[];
  bookings: SocietyAmenityBooking[];
  onApproveBooking: (id: string) => Promise<void>;
  onRejectBooking: (id: string) => Promise<void>;
}

export const SocietyAmenitiesView: React.FC<AmenitiesViewProps> = ({
  society,
  amenities,
  bookings,
  onApproveBooking,
  onRejectBooking
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Amenities & Facility Bookings</h2>
          <p className="text-sm text-gray-500">Clubhouse, tennis court, swimming pool rules, slots and resident reservations</p>
        </div>
      </div>

      {/* Catalog of Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {amenities.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{a.name}</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                a.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {a.status}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-2">{a.description}</p>

            <div className="mt-4 pt-3 border-t border-gray-50 space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>Operating Timings</span>
                <span className="font-semibold text-gray-900">{a.operatingHours}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Booking Fee</span>
                <span className="font-bold text-[#673AB7]">
                  {a.hourlyCharge === 0 ? 'Free for Residents' : `₹${a.hourlyCharge} / slot`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Maximum Capacity</span>
                <span className="font-semibold text-gray-900">{a.maxCapacity} people</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Requests */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Resident Booking Requests</h3>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Amenity</th>
                  <th className="py-3 px-4">Resident & Flat</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{b.amenityName}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-gray-800">{b.bookedByName}</div>
                      <div className="text-purple-700 font-bold">Flat {b.flatNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <div>{b.bookingDate}</div>
                      <div className="text-gray-400">{b.timeSlot}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                        b.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {b.status === 'PENDING_APPROVAL' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onApproveBooking(b.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRejectBooking(b.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 16: RESIDENT COMMUNITY & POST MODERATION
// -------------------------------------------------------------
interface CommunityViewProps {
  society: Society;
  posts: SocietyCommunityPost[];
  onModeratePost: (id: string, action: 'APPROVED' | 'REPORTED' | 'HIDDEN') => Promise<void>;
}

export const SocietyCommunityView: React.FC<CommunityViewProps> = ({
  society,
  posts,
  onModeratePost
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Community Social & Moderation</h2>
          <p className="text-sm text-gray-500">Moderate resident discussion threads, carpooling, recommendations and festive events</p>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-[#673AB7] font-bold flex items-center justify-center text-sm">
                  {p.authorName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{p.authorName}</h4>
                  <p className="text-xs text-gray-400">Flat {p.authorFlat} • {new Date(p.timestamp).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  p.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                  p.status === 'REPORTED' ? 'bg-red-50 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {p.status}
                </span>

                {p.status === 'APPROVED' && (
                  <button
                    onClick={() => onModeratePost(p.id, 'REPORTED')}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition"
                  >
                    Flag / Report
                  </button>
                )}
                {p.status === 'REPORTED' && (
                  <button
                    onClick={() => onModeratePost(p.id, 'APPROVED')}
                    className="text-xs text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-800 leading-relaxed">{p.content}</p>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-500">
              <span>{p.likesCount} Likes</span>
              <span>•</span>
              <span>{p.commentsCount} Comments</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 17: SERVICE PARTNER MANAGEMENT
// -------------------------------------------------------------
export interface ServicePartnerItem {
  id: string;
  companyName: string;
  category: string;
  contactPerson: string;
  phoneNumber: string;
  isVerified?: boolean;
  status?: string;
  onboardedBy?: string;
}

interface ServicePartnersViewProps {
  society: Society;
  partners: ServicePartnerItem[];
  onToggleSocietyAccess: (partnerId: string) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
}

export const SocietyServicePartnersView: React.FC<ServicePartnersViewProps> = ({
  society,
  partners,
  onToggleSocietyAccess,
  onRefresh,
}) => {
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [submissionSuccessNotice, setSubmissionSuccessNotice] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Verified Service Partners</h2>
          <p className="text-sm text-gray-500">
            Control trusted vendor gate permissions for water deliveries, internet fiber, groceries and maintenance
          </p>
        </div>

        {/* 1B. ADD SERVICE PARTNER ACTION FOR SOCIETY ADMIN */}
        <button
          type="button"
          onClick={() => setShowAddPartnerModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Partner</span>
        </button>
      </div>

      {/* Submission Success Toast */}
      {submissionSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              Partner registration submitted successfully! Status set to <strong>Pending Verification</strong> and routed to Super Admin for approval.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionSuccessNotice(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Society Admin Routing Notice */}
      <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl flex items-start gap-3 text-xs text-gray-700">
        <ShieldCheck className="w-4 h-4 text-[#673AB7] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-gray-900">Centralized Security & Police Verification Policy: </span>
          All local service partners registered by the Society Admin are submitted with status <strong className="text-amber-700">Pending Verification</strong> and routed to the Super Admin Security Ops team for document KYC check prior to gate authorization.
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {partners.map((sp) => {
          const isPending = sp.status === 'PENDING' || sp.status === 'pending';
          return (
            <div
              key={sp.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F1F9FC] text-[#673AB7] flex items-center justify-center font-bold">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{sp.companyName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                        {sp.category}
                      </span>
                    </div>
                  </div>

                  {isPending ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Approval
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Partner
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 space-y-1.5 text-xs text-gray-600">
                  <div>
                    Contact: <span className="font-semibold text-gray-900">{sp.contactPerson}</span>
                  </div>
                  <div>
                    Phone: <span className="font-mono text-gray-800">{sp.phoneNumber}</span>
                  </div>
                  <div>
                    Verification:{' '}
                    {isPending ? (
                      <span className="font-semibold text-amber-600">Routing to Super Admin</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">Police Verified & Approved</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Society Gate Entry</span>
                {isPending ? (
                  <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-lg">
                    Awaiting Super Admin
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleSocietyAccess(sp.id)}
                    className="text-xs px-3 py-1 bg-[#673AB7] text-white hover:bg-[#5E35B1] rounded-lg font-medium transition cursor-pointer"
                  >
                    Permitted
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1B. PARTNER ONBOARDING MODAL (SOCIETY ADMIN SCOPE) */}
      <PartnerOnboardingModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onSuccess={async () => {
          setSubmissionSuccessNotice(true);
          if (onRefresh) await onRefresh();
        }}
        onboardedBy="society_admin"
        currentSocietyId={society.id}
        societies={[society]}
      />
    </div>
  );
};
