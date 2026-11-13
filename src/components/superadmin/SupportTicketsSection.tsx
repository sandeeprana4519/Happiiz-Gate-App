/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { SupportTicket } from '../../types/admin';
import { Society } from '../../types/society';
import { updateSupportTicket } from '../../services/firebase/superadmin.service';
import {
  Headset,
  Search,
  X,
} from 'lucide-react';
import { OperationsExportToolbar } from './OperationsExportToolbar';
import {
  OperationsPeriodMode,
  buildFilterSummaryText,
  buildPeriodLabel,
  exportOperationsPdf,
  getSocietyAreaLabel,
  matchesOperationsPeriod,
  matchesSocietyAndArea,
} from './operationsExportUtils';

interface SupportTicketsSectionProps {
  tickets: SupportTicket[];
  societies?: Society[];
  onRefresh: () => Promise<void>;
}

export const SupportTicketsSection: React.FC<SupportTicketsSectionProps> = ({
  tickets,
  societies = [],
  onRefresh,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [newStatus, setNewStatus] = useState<SupportTicket['status']>('IN_PROGRESS');
  const [loading, setLoading] = useState(false);

  // Operations Period, Society & Area Filters
  const [periodMode, setPeriodMode] = useState<OperationsPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(todayIso);
  const [monthValue, setMonthValue] = useState<string>(todayIso.slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(todayIso.slice(0, 4));
  const [societyFilter, setSocietyFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.submittedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.societyName && t.societyName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesPeriod = matchesOperationsPeriod(
        t.createdAt,
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );
      const matchesScope = matchesSocietyAndArea({
        societies,
        societyId: t.societyId,
        societyName: t.societyName,
        societyFilter,
        areaFilter,
      });

      return matchesSearch && matchesStatus && matchesPeriod && matchesScope;
    });
  }, [
    tickets,
    societies,
    searchTerm,
    statusFilter,
    periodMode,
    dayValue,
    monthValue,
    yearValue,
    societyFilter,
    areaFilter,
  ]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setLoading(true);
    try {
      await updateSupportTicket(
        selectedTicket.id,
        newStatus,
        replyText ? replyText : undefined,
        internalNoteText ? internalNoteText : undefined
      );
      setReplyText('');
      setInternalNoteText('');
      setSelectedTicket(null);
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setPeriodMode('ALL');
    setDayValue(todayIso);
    setMonthValue(todayIso.slice(0, 7));
    setYearValue(todayIso.slice(0, 4));
    setSocietyFilter('ALL');
    setAreaFilter('ALL');
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const handleExportPdf = () => {
    const columns = [
      'Ticket #',
      'Subject',
      'Category',
      'Priority',
      'Submitted By',
      'Phone',
      'Society',
      'Area',
      'Status',
      'Created Date',
    ];
    const rows = filtered.map((t) => ({
      'Ticket #': t.ticketNumber,
      Subject: t.subject,
      Category: t.category,
      Priority: t.priority,
      'Submitted By': t.submittedByName,
      Phone: t.submittedByPhone,
      Society: t.societyName || 'Direct Platform',
      Area: getSocietyAreaLabel(societies, t.societyId, t.societyName),
      Status: t.status,
      'Created Date': new Date(t.createdAt).toLocaleDateString(),
    }));

    const { slug } = buildPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    exportOperationsPdf({
      title: 'Support Tickets & Helpdesk SLA Report',
      subtitle: 'Multi-tenant Support Escalation & Resolution Summary',
      filename: `happiiz_support_tickets_${slug}`,
      columns,
      rows,
      filterSummary: buildFilterSummaryText({
        societies,
        societyFilter,
        areaFilter,
        mode: periodMode,
        dayValue,
        monthValue,
        yearValue,
        searchTerm,
        recordCount: rows.length,
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Platform Support & Helpdesk Triage</h2>
          <p className="text-xs text-[#A9B0B8]">
            Manage technical escalation tickets, IoT hardware inquiries, and society support requests
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200 self-start sm:self-auto">
          {tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length} Active Tickets
        </span>
      </div>

      {/* Period, Society-wise & Area-wise Filter + PDF Export Toolbar */}
      <OperationsExportToolbar
        societies={societies}
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        dayValue={dayValue}
        onDayValueChange={setDayValue}
        monthValue={monthValue}
        onMonthValueChange={setMonthValue}
        yearValue={yearValue}
        onYearValueChange={setYearValue}
        societyFilter={societyFilter}
        onSocietyFilterChange={setSocietyFilter}
        areaFilter={areaFilter}
        onAreaFilterChange={setAreaFilter}
        matchedCount={filtered.length}
        onExportPdf={handleExportPdf}
        pdfButtonLabel="Download Tickets PDF"
        onResetFilters={handleResetFilters}
      />

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket #, subject, applicant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === st ? 'bg-[#673AB7] text-white shadow-xs' : 'bg-[#F1F9FC] text-[#111111]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-[#E6F1F5] text-center text-xs text-[#64748B]">
          No support tickets match your current period, society, or area filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setSelectedTicket(t);
                setNewStatus(t.status);
              }}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#673AB7]/40 transition-all cursor-pointer group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#673AB7]">{t.ticketNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-[#111111] line-clamp-1 group-hover:text-[#673AB7] transition-colors">
                  {t.subject}
                </h3>
                <p className="text-xs text-[#A9B0B8] line-clamp-2 leading-relaxed">{t.description}</p>
              </div>

              <div className="pt-3 border-t border-[#E6F1F5] flex items-center justify-between text-[11px] text-[#A9B0B8]">
                <div>
                  <span className="font-semibold text-[#111111]">{t.submittedByName}</span>
                  {t.societyName && <span className="block truncate max-w-[160px]">{t.societyName}</span>}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.status === 'OPEN'
                      ? 'bg-amber-50 text-amber-700'
                      : t.status === 'IN_PROGRESS'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Management & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-[#F1F9FC]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">{selectedTicket.ticketNumber}</h3>
                  <p className="text-xs text-[#A9B0B8]">
                    {selectedTicket.category} • Priority: {selectedTicket.priority}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <h4 className="font-extrabold text-sm text-[#111111] mb-1">{selectedTicket.subject}</h4>
                <p className="text-xs text-[#111111] bg-[#F1F9FC] p-3 rounded-xl border border-[#E6F1F5] leading-relaxed">
                  {selectedTicket.description}
                </p>
                <div className="flex gap-4 mt-1 text-[11px] text-[#A9B0B8]">
                  <span>By: {selectedTicket.submittedByName} ({selectedTicket.submittedByPhone})</span>
                  <span>Society: {selectedTicket.societyName || 'Direct'}</span>
                </div>
              </div>

              {/* Threaded Replies */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E6F1F5]">
                  <span className="font-bold text-[#111111] block">Conversation History:</span>
                  {selectedTicket.replies.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                      <div className="flex items-center justify-between font-bold text-[#673AB7]">
                        <span>{r.senderName} ({r.senderRole})</span>
                        <span className="text-[10px] text-[#A9B0B8] font-mono">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#111111]">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Update Form */}
              <form onSubmit={handleUpdateTicket} className="space-y-3 pt-3 border-t border-[#E6F1F5]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#111111] block mb-1">Update Ticket Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Reply to User / Committee</label>
                  <textarea
                    rows={2}
                    placeholder="Type official response sent to user PWA..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Internal Support Note (Admin Only)</label>
                  <input
                    type="text"
                    placeholder="e.g. Assigned to hardware tech team for gate telemetry check"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="px-4 py-2 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#111111] hover:bg-[#F1F9FC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] cursor-pointer"
                  >
                    {loading ? 'Saving...' : 'Save & Dispatch Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
