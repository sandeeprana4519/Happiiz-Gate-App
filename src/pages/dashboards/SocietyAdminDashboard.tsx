/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, GlassCard, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatusBadge, MetadataText } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { MOCK_FACILITIES, MOCK_ALERTS } from '../../services/mock/mockData';
import { PendingRequestsCard } from '../../components/admin/PendingRequestsCard';
import {
  Building2,
  Users,
  ShieldCheck,
  Megaphone,
  Plus,
  Calendar,
  AlertTriangle,
  FileText,
  DoorOpen,
} from 'lucide-react';

export const SocietyAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [notices, setNotices] = useState([
    {
      id: 'ntc-1',
      title: 'Elevator Maintenance in Tower B (Nov 06)',
      date: 'Today',
      author: 'Estate Manager',
    },
    {
      id: 'ntc-2',
      title: 'Water Tank Deep Cleaning Schedule',
      date: 'Yesterday',
      author: 'Managing Committee',
    },
  ]);

  const handleBroadcastNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle) return;
    setNotices([
      {
        id: `ntc-${Date.now()}`,
        title: noticeTitle,
        date: 'Just now',
        author: user?.displayName || 'Society Admin',
      },
      ...notices,
    ]);
    setShowNoticeModal(false);
    setNoticeTitle('');
    setNoticeBody('');
    alert('Notice broadcasted to all 412 occupied residences via PWA push.');
  };

  return (
    <div className="space-y-6">
      {/* Society Admin Operations Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white text-[#673AB7] shadow-xs">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                {user?.societyName || 'Emerald Heights Luxury Enclave'}
              </h1>
            </div>
            <MetadataText
              items={[
                'Society Admin Operations Center',
                `President: ${user?.displayName || 'Rajesh Sharma'}`,
                'Society Code: EMR-01',
              ]}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Megaphone className="w-4 h-4" />}
              onClick={() => setShowNoticeModal(true)}
            >
              Broadcast Notice
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Flats"
          value="450"
          subtitle="412 Occupied (91.5%)"
          icon={<DoorOpen className="w-5 h-5" />}
        />
        <StatCard
          title="Guards On Duty"
          value="8 / 8"
          subtitle="All 3 gates covered"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <StatCard
          title="Registered Residents"
          value="1,248"
          subtitle="98% PWA verified"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Security Incidents"
          value="0 Open"
          subtitle="All alerts resolved"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Two Column Grid: Guard Roster & Society Notices */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Guard Station Roster */}
        <Card className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Security Roster
              </h3>
              <p className="text-xs text-slate-400">
                Assigned guards & gate shift tracking
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-500">
              Shift: Day (06:00 - 18:00)
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Bahadur Singh (Chief Sentinel)
                </p>
                <p className="text-[11px] text-slate-400">Gate #1 (North Main) · Logged in at 05:50 AM</p>
              </div>
              <StatusBadge status="Active Post" variant="success" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Ranjit Roy (Commercial Inspection)
                </p>
                <p className="text-[11px] text-slate-400">Gate #2 (Service & Trucks) · Logged in 06:00 AM</p>
              </div>
              <StatusBadge status="Active Post" variant="success" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Kalyan Das (Patrol Mobile Unit)
                </p>
                <p className="text-[11px] text-slate-400">Tower A & B Perimeter Rounds</p>
              </div>
              <StatusBadge status="On Patrol" variant="info" />
            </div>
          </div>
        </Card>

        {/* Notices & Broadcasts */}
        <Card className="md:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Society Notice Board
              </h3>
              <p className="text-xs text-slate-400">Digital notice broadcasts</p>
            </div>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="text-xs text-sky-500 hover:text-sky-400 font-semibold cursor-pointer"
            >
              + New Notice
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs space-y-1"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {n.title}
                </p>
                <MetadataText items={[n.author, n.date]} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Admin Approval Interface for Resident & Guard Access Requests */}
      <PendingRequestsCard societyId={user?.societyId || 'soc_emerald_heights'} />

      {/* Broadcast Notice Modal */}
      <Modal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        title="Broadcast Society Notice"
        description="Notify all residents on their mobile devices instantly"
      >
        <form onSubmit={handleBroadcastNotice} className="space-y-4">
          <Input
            label="Notice Title"
            placeholder="e.g. Annual General Body Meeting Notice"
            value={noticeTitle}
            onChange={(e) => setNoticeTitle(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Content
            </label>
            <textarea
              rows={4}
              placeholder="Enter detailed notice details for residents..."
              value={noticeBody}
              onChange={(e) => setNoticeBody(e.target.value)}
              className="w-full rounded-xl p-3 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowNoticeModal(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              Broadcast Now
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
