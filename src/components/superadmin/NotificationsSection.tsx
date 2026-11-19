/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { PlatformNotification } from '../../types/admin';
import { Society } from '../../types/society';
import { dispatchPlatformNotification } from '../../services/firebase/superadmin.service';
import {
  Send,
  Radio,
  CheckCircle2,
  Search,
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

interface NotificationsSectionProps {
  notifications: PlatformNotification[];
  societies: Society[];
  onRefresh: () => Promise<void>;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  notifications,
  societies,
  onRefresh,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<PlatformNotification['targetAudience']>('ALL_SOCIETIES');
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Operations Period, Society & Area Filters for Broadcast History & PDF Export
  const [searchTerm, setSearchTerm] = useState('');
  const [periodMode, setPeriodMode] = useState<OperationsPeriodMode>('ALL');
  const [dayValue, setDayValue] = useState<string>(todayIso);
  const [monthValue, setMonthValue] = useState<string>(todayIso.slice(0, 7));
  const [yearValue, setYearValue] = useState<string>(todayIso.slice(0, 4));
  const [societyFilter, setSocietyFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.targetAudience.toLowerCase().includes(q) ||
        (n.selectedSocietyName && n.selectedSocietyName.toLowerCase().includes(q));

      const matchPeriod = matchesOperationsPeriod(
        n.sentAt,
        periodMode,
        dayValue,
        monthValue,
        yearValue
      );

      // Platform-wide broadcasts apply to all societies unless filtered to a specific society/area
      const matchScope =
        societyFilter === 'ALL' && areaFilter === 'ALL'
          ? true
          : matchesSocietyAndArea({
              societies,
              societyId: n.selectedSocietyId,
              societyName: n.selectedSocietyName,
              societyFilter,
              areaFilter,
            });

      return matchSearch && matchPeriod && matchScope;
    });
  }, [
    notifications,
    societies,
    searchTerm,
    periodMode,
    dayValue,
    monthValue,
    yearValue,
    societyFilter,
    areaFilter,
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setLoading(true);
    setSentNotice(null);

    try {
      const soc = societies.find((s) => s.id === selectedSocietyId);
      await dispatchPlatformNotification({
        title,
        message,
        targetAudience,
        selectedSocietyId: selectedSocietyId ? selectedSocietyId : undefined,
        selectedSocietyName: soc?.societyName,
        deliveryStatus: 'SENT',
        recipientCount: targetAudience === 'ALL_SOCIETIES' ? 4200 : 380,
        priority,
      });

      setTitle('');
      setMessage('');
      setSentNotice('Notification successfully broadcast to network devices via push engine.');
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
  };

  const handleExportPdf = () => {
    const columns = [
      'Title',
      'Audience',
      'Society',
      'Area',
      'Priority',
      'Status',
      'Recipients',
      'Sent By',
      'Date & Time',
      'Message',
    ];
    const rows = filteredNotifications.map((n) => ({
      Title: n.title,
      Audience: n.targetAudience,
      Society: n.selectedSocietyName || 'All Societies',
      Area: n.selectedSocietyId || n.selectedSocietyName
        ? getSocietyAreaLabel(societies, n.selectedSocietyId, n.selectedSocietyName)
        : 'All Areas',
      Priority: n.priority || 'NORMAL',
      Status: n.deliveryStatus,
      Recipients: n.recipientCount,
      'Sent By': n.sentBy,
      'Date & Time': new Date(n.sentAt).toLocaleString(),
      Message: n.message,
    }));

    const { slug } = buildPeriodLabel(periodMode, dayValue, monthValue, yearValue);
    exportOperationsPdf({
      title: 'Announcements & Broadcast Log',
      subtitle: 'Platform-wide Advisories, Alerts & Emergency Broadcast History',
      filename: `happiiz_announcements_${slug}`,
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
      <div>
        <h2 className="text-base font-extrabold text-[#111111]">Platform Announcements & Emergency Broadcasts</h2>
        <p className="text-xs text-[#A9B0B8]">
          Send verified administrative alerts, maintenance advisories, and emergency sirens to societies
        </p>
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
        matchedCount={filteredNotifications.length}
        onExportPdf={handleExportPdf}
        pdfButtonLabel="Download Announcements PDF"
        onResetFilters={handleResetFilters}
      />

      {sentNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sentNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form */}
        <form
          onSubmit={handleSend}
          className="lg:col-span-1 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#111111] pb-2 border-b border-[#E6F1F5]">
            <Radio className="w-4 h-4 text-[#673AB7]" />
            <span>Compose Broadcast</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Target Audience *</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
              >
                <option value="ALL_SOCIETIES">All Societies (Platform-wide)</option>
                <option value="SELECTED_SOCIETY">Selected Society Only</option>
                <option value="SOCIETY_ADMINS">Society Admins Only</option>
                <option value="SECURITY_GUARDS">Security Sentinels & Guards</option>
                <option value="RESIDENTS">Residents Only</option>
                <option value="SERVICE_PARTNERS">Service Partners Only</option>
              </select>
            </div>

            {targetAudience === 'SELECTED_SOCIETY' && (
              <div>
                <label className="text-xs font-bold text-[#111111] block mb-1">Select Society *</label>
                <select
                  value={selectedSocietyId}
                  onChange={(e) => setSelectedSocietyId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
                  required
                >
                  <option value="">Choose Society...</option>
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.societyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Alert Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:outline-none"
              >
                <option value="NORMAL">NORMAL (Standard Push)</option>
                <option value="HIGH">HIGH (Advisory Pin)</option>
                <option value="EMERGENCY">EMERGENCY (Full-Screen Siren Alert)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Announcement Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Scheduled Gate System Firmware Upgrade"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#111111] block mb-1">Message Content *</label>
              <textarea
                required
                rows={4}
                placeholder="Enter alert copy or emergency guidance..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E6F1F5] text-xs text-[#111111] focus:border-[#673AB7] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Transmitting...' : 'Transmit Broadcast'}</span>
            </button>
          </div>
        </form>

        {/* Broadcast History */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E6F1F5]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#111111]">Broadcast History</h3>
              <span className="text-xs font-mono text-[#A9B0B8]">
                ({filteredNotifications.length} dispatches)
              </span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, message, society..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:outline-none focus:border-[#673AB7]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#64748B]">
                No announcements match your selected period, society, or area filters.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-xl bg-[#F1F9FC]/60 border border-[#E6F1F5] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#111111]">{n.title}</h4>
                      <div className="text-[11px] text-[#A9B0B8] flex items-center gap-2 mt-0.5">
                        <span>Target: {n.targetAudience}</span>
                        {n.selectedSocietyName && <span>• {n.selectedSocietyName}</span>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {n.deliveryStatus}
                    </span>
                  </div>

                  <p className="text-xs text-[#111111] leading-relaxed">{n.message}</p>

                  <div className="pt-2 border-t border-[#E6F1F5] flex items-center justify-between text-[10px] text-[#A9B0B8]">
                    <span>Sent by: {n.sentBy}</span>
                    <span className="font-mono">
                      {new Date(n.sentAt).toLocaleDateString()} at{' '}
                      {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
