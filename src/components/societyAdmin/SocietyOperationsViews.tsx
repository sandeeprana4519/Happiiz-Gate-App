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
  Edit3,
  Trash2,
  RefreshCw,
  Sparkles,
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
import { SocietyPdfExportToolbar } from './SocietyPdfExportToolbar';
import {
  SocietyPeriodMode,
  matchesSocietyPeriod,
  buildSocietyPeriodLabel,
  buildSocietySlug,
  exportSocietyPdf,
  normalizeSocietyIsoDate,
} from './societyPdfExportUtils';

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
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const filteredNotices = notices.filter((n) =>
    matchesSocietyPeriod(n.publishedAt, periodMode, dayValue, monthValue, yearValue)
  );

  const handleExportNoticesPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Digital Notice Board Register',
      subtitle: 'Community & Facilities • Published Circulars, Announcements & Urgent Alerts',
      filename: `${socSlug}_notice_board_${period.slug}`,
      filterSummary: `Period: ${period.label} · Records: ${filteredNotices.length}`,
      columns: ['Notice Title', 'Category', 'Audience', 'Flag', 'Status', 'Published By', 'Published Date'],
      rows: filteredNotices.map((n) => ({
        'Notice Title': n.title,
        Category: n.category,
        Audience: n.targetAudience,
        Flag: n.isEmergencyAlert ? 'Urgent Alert' : n.isPinned ? 'Pinned' : 'Standard',
        Status: n.status,
        'Published By': n.publishedBy,
        'Published Date': normalizeSocietyIsoDate(n.publishedAt) || '—',
      })),
    });
  };

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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Notice
        </button>
      </div>

      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredNotices.length}
        onExportPdf={handleExportNoticesPdf}
        pdfButtonLabel="Download Notices PDF"
        onResetPeriod={() => setPeriodMode('ALL')}
      />

      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            No notices match the selected period filter.
          </div>
        ) : (
          filteredNotices.map((n) => (
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
        ))
        )}
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
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const filtered = complaints.filter((c) => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchPeriod = matchesSocietyPeriod(
      c.createdAt || c.updatedAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    return matchStatus && matchPeriod;
  });

  const handleExportComplaintsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'HelpDesk & Complaints Report',
      subtitle: 'Community & Facilities • Resident Maintenance Tickets & Resolution Triage',
      filename: `${socSlug}_helpdesk_complaints_${period.slug}`,
      filterSummary: `Period: ${period.label} · Status Filter: ${statusFilter} · Tickets: ${filtered.length}`,
      columns: [
        'Ticket No',
        'Subject',
        'Resident',
        'Flat No',
        'Category',
        'Priority',
        'Assigned To',
        'Status',
        'Created Date',
      ],
      rows: filtered.map((c) => ({
        'Ticket No': c.complaintNumber || c.id,
        Subject: c.subject,
        Resident: c.submittedByName,
        'Flat No': c.flatNumber,
        Category: c.category,
        Priority: c.priority,
        'Assigned To': c.assignedStaff || 'Unassigned',
        Status: c.status.replace(/_/g, ' '),
        'Created Date': normalizeSocietyIsoDate(c.createdAt || c.updatedAt) || '—',
      })),
    });
  };

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

      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filtered.length}
        onExportPdf={handleExportComplaintsPdf}
        pdfButtonLabel="Download Complaints PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setStatusFilter('ALL');
        }}
      />

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No helpdesk complaints match the selected period or status filter.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
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
              ))
              )}
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const filteredInvoices = invoices.filter((inv) => {
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchPeriod = matchesSocietyPeriod(
      inv.dueDate || inv.paidDate || inv.createdAt,
      periodMode,
      dayValue,
      monthValue,
      yearValue
    );
    return matchStatus && matchPeriod;
  });

  const totalBilled = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = filteredInvoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = filteredInvoices
    .filter((inv) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleExportInvoicesPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Dues & Maintenance Invoices Ledger',
      subtitle: 'Finance & Administration • Society Maintenance Billing & Collections',
      filename: `${socSlug}_maintenance_dues_${period.slug}`,
      filterSummary: `Period: ${period.label} · Status: ${statusFilter} · Billed: INR ${totalBilled.toLocaleString('en-IN')} · Collected: INR ${totalCollected.toLocaleString('en-IN')} · Pending: INR ${totalPending.toLocaleString('en-IN')} · Invoices: ${filteredInvoices.length}`,
      columns: [
        'Invoice No',
        'Flat No',
        'Resident Name',
        'Category',
        'Amount',
        'Due Date',
        'Status',
        'Receipt / UTR',
        'Paid Date',
      ],
      rows: filteredInvoices.map((inv) => ({
        'Invoice No': inv.invoiceNumber,
        'Flat No': inv.flatNumber,
        'Resident Name': inv.residentName,
        Category: inv.category,
        Amount: `INR ${inv.amount.toLocaleString('en-IN')}`,
        'Due Date': inv.dueDate || '—',
        Status: inv.status,
        'Receipt / UTR': inv.receiptNumber || '—',
        'Paid Date': normalizeSocietyIsoDate(inv.paidDate) || '—',
      })),
    });
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Generate Monthly Dues
          </button>
        </div>
      </div>

      {/* Period Filter & PDF Export */}
      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredInvoices.length}
        onExportPdf={handleExportInvoicesPdf}
        pdfButtonLabel="Download Dues PDF"
        onResetPeriod={() => {
          setPeriodMode('ALL');
          setStatusFilter('ALL');
        }}
      />

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
          <span className="text-2xl font-black text-gray-900 tabular-nums">₹{totalBilled.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-emerald-600 font-semibold block mb-1">Total Realized & Collected</span>
          <span className="text-2xl font-black text-emerald-600 tabular-nums">₹{totalCollected.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-amber-600 font-semibold block mb-1">Outstanding / Overdue</span>
          <span className="text-2xl font-black text-amber-600 tabular-nums">₹{totalPending.toLocaleString('en-IN')}</span>
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No maintenance invoices match the selected period or status filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
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
              ))
              )}
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
  onCreateAmenity?: (amenity: Partial<SocietyAmenity>) => Promise<void>;
  onUpdateAmenity?: (id: string, updates: Partial<SocietyAmenity>) => Promise<void>;
  onRenewAmenity?: (id: string, validUntil: string, updates?: Partial<SocietyAmenity>) => Promise<void>;
  onDeleteAmenity?: (id: string) => Promise<void>;
}

const AMENITY_PRESETS: Array<{
  label: string;
  name: string;
  category: string;
  description: string;
  operatingHours: string;
  hourlyCharge: number;
  bookingAdvanceDays: number;
  maxCapacity: number;
  rules: string[];
}> = [
  {
    label: 'Clubhouse',
    name: 'Clubhouse Banquet Hall',
    category: 'Clubhouse',
    description: 'Air-conditioned society clubhouse hall with stage, seating & audio setup',
    operatingHours: '09:00 AM - 11:00 PM',
    hourlyCharge: 1500,
    bookingAdvanceDays: 15,
    maxCapacity: 120,
    rules: ['No loud music after 10:00 PM', 'Catering waste must be cleared promptly'],
  },
  {
    label: 'Swimming Pool',
    name: 'Swimming Pool',
    category: 'Swimming Pool',
    description: 'Clean, lifeguard-monitored pool with morning and evening resident slots',
    operatingHours: '06:00 AM - 10:00 AM, 04:30 PM - 08:30 PM',
    hourlyCharge: 0,
    bookingAdvanceDays: 1,
    maxCapacity: 30,
    rules: ['Proper swimwear mandatory', 'Shower before entering pool'],
  },
  {
    label: 'Tennis Court',
    name: 'Tennis Court (Floodlit)',
    category: 'Tennis & Sports',
    description: 'Outdoor synthetic tennis court with LED floodlights for evening play',
    operatingHours: '06:00 AM - 09:00 PM',
    hourlyCharge: 200,
    bookingAdvanceDays: 3,
    maxCapacity: 4,
    rules: ['Non-marking sports shoes required', 'Max 1 hour per flat per day'],
  },
  {
    label: 'Gymnasium',
    name: 'Fitness & Gymnasium',
    category: 'Gym & Fitness',
    description: 'Equipped cardio and strength training center exclusively for residents',
    operatingHours: '05:30 AM - 10:00 PM',
    hourlyCharge: 0,
    bookingAdvanceDays: 1,
    maxCapacity: 25,
    rules: ['Carry personal towel and clean sports shoes', 'Re-rack weights after use'],
  },
  {
    label: 'Badminton Court',
    name: 'Indoor Badminton Court',
    category: 'Tennis & Sports',
    description: 'Wooden-floor indoor badminton court with ventilation',
    operatingHours: '06:00 AM - 10:00 PM',
    hourlyCharge: 150,
    bookingAdvanceDays: 2,
    maxCapacity: 4,
    rules: ['Non-marking gum sole shoes only', 'Turn off court lights after session'],
  },
  {
    label: 'Party Lawn',
    name: 'Central Party Lawn',
    category: 'Banquet / Lawn',
    description: 'Open landscaped garden lawn for family celebrations and community gatherings',
    operatingHours: '08:00 AM - 10:30 PM',
    hourlyCharge: 2500,
    bookingAdvanceDays: 30,
    maxCapacity: 200,
    rules: ['Prior society office clearance mandatory', 'No firecrackers on lawn premises'],
  },
];

const addMonthsToIsoDate = (baseIso: string, months: number): string => {
  const base = baseIso ? new Date(baseIso) : new Date();
  const validDate = Number.isNaN(base.getTime()) ? new Date() : base;
  validDate.setMonth(validDate.getMonth() + months);
  return validDate.toISOString().slice(0, 10);
};

export const SocietyAmenitiesView: React.FC<AmenitiesViewProps> = ({
  society,
  amenities,
  bookings,
  onApproveBooking,
  onRejectBooking,
  onCreateAmenity,
  onUpdateAmenity,
  onRenewAmenity,
  onDeleteAmenity,
}) => {
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  // Amenity Create / Edit / Renew / Delete state
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<SocietyAmenity | null>(null);
  const [renewingAmenity, setRenewingAmenity] = useState<SocietyAmenity | null>(null);
  const [deletingAmenity, setDeletingAmenity] = useState<SocietyAmenity | null>(null);
  const [savingAmenity, setSavingAmenity] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const nextYearIso = addMonthsToIsoDate(todayIso, 12);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Clubhouse');
  const [description, setDescription] = useState('');
  const [operatingHours, setOperatingHours] = useState('06:00 AM - 10:00 PM');
  const [hourlyCharge, setHourlyCharge] = useState<number>(0);
  const [bookingAdvanceDays, setBookingAdvanceDays] = useState<number>(3);
  const [maxCapacity, setMaxCapacity] = useState<number>(30);
  const [availableFrom, setAvailableFrom] = useState<string>(todayIso);
  const [validUntil, setValidUntil] = useState<string>(nextYearIso);
  const [status, setStatus] = useState<SocietyAmenity['status']>('AVAILABLE');
  const [rulesText, setRulesText] = useState('');

  // Renew modal fields
  const [renewValidUntil, setRenewValidUntil] = useState<string>(nextYearIso);
  const [renewCharge, setRenewCharge] = useState<number>(0);
  const [renewAdvanceDays, setRenewAdvanceDays] = useState<number>(3);
  const [renewStatus, setRenewStatus] = useState<SocietyAmenity['status']>('AVAILABLE');

  const openCreateModal = (preset?: (typeof AMENITY_PRESETS)[number]) => {
    setEditingAmenity(null);
    if (preset) {
      setName(preset.name);
      setCategory(preset.category);
      setDescription(preset.description);
      setOperatingHours(preset.operatingHours);
      setHourlyCharge(preset.hourlyCharge);
      setBookingAdvanceDays(preset.bookingAdvanceDays);
      setMaxCapacity(preset.maxCapacity);
      setRulesText(preset.rules.join('\n'));
    } else {
      setName('');
      setCategory('Clubhouse');
      setDescription('');
      setOperatingHours('06:00 AM - 10:00 PM');
      setHourlyCharge(500);
      setBookingAdvanceDays(3);
      setMaxCapacity(30);
      setRulesText('Follow society facility guidelines\nMaintain cleanliness after use');
    }
    setAvailableFrom(todayIso);
    setValidUntil(nextYearIso);
    setStatus('AVAILABLE');
    setShowAmenityModal(true);
  };

  const openEditModal = (a: SocietyAmenity) => {
    setEditingAmenity(a);
    setName(a.name);
    setCategory(a.category || 'Clubhouse');
    setDescription(a.description || '');
    setOperatingHours(a.operatingHours || '06:00 AM - 10:00 PM');
    setHourlyCharge(Number(a.hourlyCharge ?? 0));
    setBookingAdvanceDays(Number(a.bookingAdvanceDays ?? 1));
    setMaxCapacity(Number(a.maxCapacity ?? 20));
    setAvailableFrom(a.availableFrom || todayIso);
    setValidUntil(a.validUntil || '');
    setStatus(a.status || 'AVAILABLE');
    setRulesText((a.rules || []).join('\n'));
    setShowAmenityModal(true);
  };

  const openRenewModal = (a: SocietyAmenity) => {
    setRenewingAmenity(a);
    const base = a.validUntil && a.validUntil > todayIso ? a.validUntil : todayIso;
    setRenewValidUntil(addMonthsToIsoDate(base, 12));
    setRenewCharge(Number(a.hourlyCharge ?? 0));
    setRenewAdvanceDays(Number(a.bookingAdvanceDays ?? 1));
    setRenewStatus('AVAILABLE');
  };

  const handleSubmitAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingAmenity(true);
    setFeedbackBanner(null);

    const payload: Partial<SocietyAmenity> = {
      name: name.trim(),
      category: category.trim() || 'Clubhouse',
      description: description.trim() || `${name.trim()} available for society residents`,
      operatingHours: operatingHours.trim() || '06:00 AM - 10:00 PM',
      hourlyCharge: Math.max(0, Number(hourlyCharge || 0)),
      bookingAdvanceDays: Math.max(0, Number(bookingAdvanceDays || 0)),
      maxCapacity: Math.max(1, Number(maxCapacity || 1)),
      availableFrom: availableFrom || todayIso,
      validUntil: validUntil || '',
      status,
      rules: rulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
    };

    try {
      if (editingAmenity && onUpdateAmenity) {
        await onUpdateAmenity(editingAmenity.id, payload);
        setFeedbackBanner({ type: 'success', message: `Amenity "${payload.name}" updated successfully.` });
      } else if (onCreateAmenity) {
        await onCreateAmenity(payload);
        setFeedbackBanner({ type: 'success', message: `Amenity "${payload.name}" added to society catalog.` });
      }
      setShowAmenityModal(false);
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err?.message || 'Could not save amenity.' });
    } finally {
      setSavingAmenity(false);
    }
  };

  const handleConfirmRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingAmenity || !onRenewAmenity) return;
    setSavingAmenity(true);
    setFeedbackBanner(null);
    try {
      await onRenewAmenity(renewingAmenity.id, renewValidUntil, {
        hourlyCharge: Math.max(0, Number(renewCharge || 0)),
        bookingAdvanceDays: Math.max(0, Number(renewAdvanceDays || 0)),
        status: renewStatus,
      });
      setFeedbackBanner({
        type: 'success',
        message: `Amenity "${renewingAmenity.name}" renewed until ${renewValidUntil || 'Always Open'}.`,
      });
      setRenewingAmenity(null);
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err?.message || 'Could not renew amenity.' });
    } finally {
      setSavingAmenity(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAmenity || !onDeleteAmenity) return;
    setSavingAmenity(true);
    setFeedbackBanner(null);
    try {
      await onDeleteAmenity(deletingAmenity.id);
      setFeedbackBanner({
        type: 'success',
        message: `Amenity "${deletingAmenity.name}" deleted from catalog.`,
      });
      setDeletingAmenity(null);
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err?.message || 'Could not delete amenity.' });
    } finally {
      setSavingAmenity(false);
    }
  };

  const filteredBookings = bookings.filter((b) =>
    matchesSocietyPeriod(b.bookingDate || b.createdAt, periodMode, dayValue, monthValue, yearValue)
  );

  const handleExportBookingsPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Amenities & Facility Bookings Log',
      subtitle: 'Community & Facilities • Resident Club Reservations & Slots',
      filename: `${socSlug}_amenities_bookings_${period.slug}`,
      filterSummary: `Period: ${period.label} · Bookings: ${filteredBookings.length} · Facilities Catalog: ${amenities.length}`,
      columns: ['Amenity', 'Booked By', 'Flat No', 'Booking Date', 'Time Slot', 'Charge', 'Status'],
      rows: filteredBookings.map((b) => ({
        Amenity: b.amenityName,
        'Booked By': b.bookedByName,
        'Flat No': b.flatNumber,
        'Booking Date': normalizeSocietyIsoDate(b.bookingDate) || b.bookingDate || '—',
        'Time Slot': b.timeSlot,
        Charge: b.amount === 0 ? 'Free' : `INR ${b.amount}`,
        Status: b.status,
      })),
    });
  };

  const handleExportCatalogPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Amenities Catalog & Bookings Summary',
      subtitle: 'Community & Facilities • Registered Society Amenities & Active Reservations',
      filename: `${socSlug}_amenities_complete_${period.slug}`,
      filterSummary: `Period: ${period.label} · Amenities: ${amenities.length} · Bookings: ${filteredBookings.length}`,
      columns: [
        'Amenity Name',
        'Category',
        'Operating Hours',
        'Booking Fee',
        'Advance Notice',
        'Active Dates',
        'Max Capacity',
        'Status',
      ],
      rows: amenities.map((a) => ({
        'Amenity Name': a.name,
        Category: a.category || 'Clubhouse',
        'Operating Hours': a.operatingHours,
        'Booking Fee': a.hourlyCharge === 0 ? 'Free for Residents' : `INR ${a.hourlyCharge} / slot`,
        'Advance Notice':
          a.bookingAdvanceDays === 0
            ? 'Same Day'
            : `${a.bookingAdvanceDays} day${a.bookingAdvanceDays === 1 ? '' : 's'} prior`,
        'Active Dates': `${a.availableFrom || 'Open'} to ${a.validUntil || 'No Expiry'}`,
        'Max Capacity': `${a.maxCapacity} people`,
        Status: a.status,
      })),
      extraSections: [
        {
          sectionTitle: `Resident Booking Requests (${filteredBookings.length})`,
          columns: ['Amenity', 'Booked By', 'Flat No', 'Booking Date', 'Time Slot', 'Status'],
          rows: filteredBookings.map((b) => ({
            Amenity: b.amenityName,
            'Booked By': b.bookedByName,
            'Flat No': b.flatNumber,
            'Booking Date': b.bookingDate,
            'Time Slot': b.timeSlot,
            Status: b.status,
          })),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Amenities & Facility Bookings</h2>
          <p className="text-sm text-gray-500">
            Attach & configure Clubhouse, Swimming Pool, Tennis Court, booking fees, advance notice days, dates & reservations
          </p>
        </div>

        {onCreateAmenity && (
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Attach Amenity</span>
          </button>
        )}
      </div>

      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackBanner.message}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredBookings.length}
        onExportPdf={handleExportBookingsPdf}
        pdfButtonLabel="Download Bookings PDF"
        secondaryExportLabel="Catalog + Bookings PDF"
        onSecondaryExportPdf={handleExportCatalogPdf}
        onResetPeriod={() => setPeriodMode('ALL')}
      />

      {/* Catalog of Amenities */}
      {amenities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-teal-600 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">No Society Amenities Added Yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click "Add / Attach Amenity" to configure Clubhouse, Swimming Pool, Tennis Court or other facilities.
            </p>
          </div>
          {onCreateAmenity && (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Amenity
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {amenities.map((a) => {
            const isExpired = Boolean(a.validUntil && a.validUntil < todayIso);
            return (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {a.category && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md mb-1.5">
                          {a.category}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 leading-snug">{a.name}</h3>
                    </div>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
                        isExpired
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : a.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : a.status === 'UNDER_MAINTENANCE'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {isExpired ? 'RENEWAL DUE' : a.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">{a.description}</p>

                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between gap-2">
                      <span>Operating Timings</span>
                      <span className="font-semibold text-gray-900 text-right">{a.operatingHours}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Booking Fee</span>
                      <span className="font-bold text-[#673AB7]">
                        {a.hourlyCharge === 0 ? 'Free for Residents' : `₹${a.hourlyCharge.toLocaleString('en-IN')} / slot`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Advance Booking Notice</span>
                      <span className="font-semibold text-teal-700">
                        {a.bookingAdvanceDays === 0
                          ? 'Same-day allowed'
                          : `${a.bookingAdvanceDays} day${a.bookingAdvanceDays === 1 ? '' : 's'} prior`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Active / Valid Dates</span>
                      <span className={`font-semibold text-right ${isExpired ? 'text-rose-600' : 'text-gray-800'}`}>
                        {a.availableFrom || 'Open'} → {a.validUntil || 'No Expiry'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Maximum Capacity</span>
                      <span className="font-semibold text-gray-900">{a.maxCapacity} people</span>
                    </div>
                  </div>
                </div>

                {/* Admin Actions: Edit / Renew / Delete */}
                {(onUpdateAmenity || onRenewAmenity || onDeleteAmenity) && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {onUpdateAmenity && (
                        <button
                          type="button"
                          onClick={() => openEditModal(a)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
                          title="Edit Amenity Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onRenewAmenity && (
                        <button
                          type="button"
                          onClick={() => openRenewModal(a)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-bold transition cursor-pointer"
                          title="Renew Validity Date"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Renew</span>
                        </button>
                      )}
                    </div>
                    {onDeleteAmenity && (
                      <button
                        type="button"
                        onClick={() => setDeletingAmenity(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] font-bold transition cursor-pointer"
                        title="Delete Amenity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                      No facility bookings match the selected period filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
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
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Amenity Modal */}
      {showAmenityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  {editingAmenity ? 'Edit Society Amenity' : 'Add / Attach Society Amenity'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure facility name, active dates, booking charge, advance booking days & capacity
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAmenityModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!editingAmenity && (
              <div className="mt-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Quick Facility Presets (Optional)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => openCreateModal(preset)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitAmenity} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Amenity Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Clubhouse, Swimming Pool, Tennis Court"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Facility Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Clubhouse">Clubhouse</option>
                    <option value="Swimming Pool">Swimming Pool</option>
                    <option value="Tennis & Sports">Tennis & Sports Court</option>
                    <option value="Gym & Fitness">Gym & Fitness</option>
                    <option value="Banquet / Lawn">Banquet Hall / Party Lawn</option>
                    <option value="Indoor Games">Indoor Games Room</option>
                    <option value="Other">Other Facility</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe facility features, lighting, coaching or equipment"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Available From Date</label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">Valid Till / Renewal Date</label>
                    {validUntil && (
                      <button
                        type="button"
                        onClick={() => setValidUntil('')}
                        className="text-[10px] font-bold text-teal-600 hover:underline cursor-pointer"
                      >
                        Set No Expiry
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">Booking Fee (₹)</label>
                    <button
                      type="button"
                      onClick={() => setHourlyCharge(0)}
                      className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                    >
                      Make Free
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={hourlyCharge}
                    onChange={(e) => setHourlyCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">0 = Free for Residents</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Advance Notice (Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={bookingAdvanceDays}
                    onChange={(e) => setBookingAdvanceDays(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">Days prior to booking</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400">People per slot</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Operating Timings</label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="06:00 AM - 10:00 PM"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Facility Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SocietyAmenity['status'])}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Booking Rules & Guidelines (one rule per line)
                </label>
                <textarea
                  rows={3}
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  placeholder="Enter society rules for using this amenity..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAmenityModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAmenity}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {savingAmenity
                    ? 'Saving...'
                    : editingAmenity
                    ? 'Save Changes'
                    : 'Create & Attach Amenity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Amenity Modal */}
      {renewingAmenity && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Renew Amenity — {renewingAmenity.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Extend active validity dates and optionally update booking fee or advance notice
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenewingAmenity(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRenew} className="space-y-4 mt-4">
              <div>
                <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">
                  Quick Extension
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '+3 Months', months: 3 },
                    { label: '+6 Months', months: 6 },
                    { label: '+1 Year', months: 12 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setRenewValidUntil(addMonthsToIsoDate(todayIso, opt.months))}
                      className="py-1.5 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Valid Till Date</label>
                <input
                  type="date"
                  required
                  value={renewValidUntil}
                  onChange={(e) => setRenewValidUntil(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Booking Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={renewCharge}
                    onChange={(e) => setRenewCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Advance Notice (Days)</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={renewAdvanceDays}
                    onChange={(e) => setRenewAdvanceDays(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status After Renewal</label>
                <select
                  value={renewStatus}
                  onChange={(e) => setRenewStatus(e.target.value as SocietyAmenity['status'])}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRenewingAmenity(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAmenity}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                >
                  {savingAmenity ? 'Renewing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Amenity Confirmation Modal */}
      {deletingAmenity && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Delete Amenity?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Are you sure you want to remove <strong>{deletingAmenity.name}</strong> from your society catalog? Existing historical bookings will remain in records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingAmenity(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAmenity}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                {savingAmenity ? 'Deleting...' : 'Delete Amenity'}
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const filteredPosts = posts.filter((p) =>
    matchesSocietyPeriod(p.timestamp, periodMode, dayValue, monthValue, yearValue)
  );

  const handleExportCommunityPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Community Feed & Events Moderation Log',
      subtitle: 'Community & Facilities • Resident Discussion Threads, Events & Social Activity',
      filename: `${socSlug}_community_feed_${period.slug}`,
      filterSummary: `Period: ${period.label} · Posts: ${filteredPosts.length}`,
      columns: ['Author', 'Flat No', 'Category', 'Post Summary', 'Likes', 'Comments', 'Status', 'Posted Date'],
      rows: filteredPosts.map((p) => ({
        Author: p.authorName,
        'Flat No': p.authorFlat,
        Category: p.category,
        'Post Summary': p.content.length > 140 ? `${p.content.slice(0, 137)}...` : p.content,
        Likes: String(p.likesCount),
        Comments: String(p.commentsCount),
        Status: p.status,
        'Posted Date': normalizeSocietyIsoDate(p.timestamp) || '—',
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Community Social & Moderation</h2>
          <p className="text-sm text-gray-500">Moderate resident discussion threads, carpooling, recommendations and festive events</p>
        </div>
      </div>

      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredPosts.length}
        onExportPdf={handleExportCommunityPdf}
        pdfButtonLabel="Download Feed PDF"
        onResetPeriod={() => setPeriodMode('ALL')}
      />

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            No community feed posts match the selected period filter.
          </div>
        ) : (
          filteredPosts.map((p) => (
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
        ))
        )}
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
  createdAt?: string;
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
  const [periodMode, setPeriodMode] = useState<SocietyPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [monthValue, setMonthValue] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(() => new Date().toISOString().slice(0, 4));

  const filteredPartners = partners.filter((sp) =>
    matchesSocietyPeriod(sp.createdAt, periodMode, dayValue, monthValue, yearValue)
  );

  const handleExportPartnersPdf = () => {
    const period = buildSocietyPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    const socSlug = buildSocietySlug(society);
    exportSocietyPdf({
      society,
      title: 'Verified Service Partners Register',
      subtitle: 'Community & Facilities • Commercial Vendors & Gate Entry Authorizations',
      filename: `${socSlug}_service_partners_${period.slug}`,
      filterSummary: `Period: ${period.label} · Partners: ${filteredPartners.length}`,
      columns: ['Company Name', 'Category', 'Contact Person', 'Phone Number', 'Verification Status', 'Onboarded By', 'Added Date'],
      rows: filteredPartners.map((sp) => ({
        'Company Name': sp.companyName,
        Category: sp.category,
        'Contact Person': sp.contactPerson,
        'Phone Number': sp.phoneNumber,
        'Verification Status': sp.status === 'PENDING' || sp.status === 'pending' ? 'Pending Verification' : 'Verified & Active',
        'Onboarded By': sp.onboardedBy || 'society_admin',
        'Added Date': normalizeSocietyIsoDate(sp.createdAt) || '—',
      })),
    });
  };

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

      <SocietyPdfExportToolbar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        matchedCount={filteredPartners.length}
        onExportPdf={handleExportPartnersPdf}
        pdfButtonLabel="Download Partners PDF"
        onResetPeriod={() => setPeriodMode('ALL')}
      />

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
        {filteredPartners.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            No service partners match the selected period filter.
          </div>
        ) : (
          filteredPartners.map((sp) => {
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
        })
        )}
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
