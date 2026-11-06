/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformNotification } from '../../types/admin';
import { Society } from '../../types/society';
import { dispatchPlatformNotification } from '../../services/firebase/superadmin.service';
import {
  Bell,
  Send,
  Radio,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  ShieldAlert,
  Calendar,
} from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<PlatformNotification['targetAudience']>('ALL_SOCIETIES');
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'EMERGENCY'>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-[#111111]">Platform Announcements & Emergency Broadcasts</h2>
        <p className="text-xs text-[#A9B0B8]">
          Send verified administrative alerts, maintenance advisories, and emergency sirens to societies
        </p>
      </div>

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
          <div className="flex items-center justify-between pb-2 border-b border-[#E6F1F5]">
            <h3 className="text-sm font-extrabold text-[#111111]">Broadcast History</h3>
            <span className="text-xs font-mono text-[#A9B0B8]">{notifications.length} dispatches</span>
          </div>

          <div className="space-y-3">
            {notifications.map((n) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
