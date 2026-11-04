/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, GlassCard, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, MetadataText } from '../../components/common/Badge';
import {
  Wrench,
  CheckCircle,
  Clock,
  QrCode,
  ShieldCheck,
  Building,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';

export const ServicePartnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showIssuePassModal, setShowIssuePassModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [techSkill, setTechSkill] = useState('Elevator Specialist');

  const [workOrders, setWorkOrders] = useState([
    {
      id: 'WO-8801',
      title: 'Quarterly Otis Elevator Preventive Maintenance',
      society: 'Emerald Heights Luxury Enclave',
      tower: 'Tower B & C',
      technician: 'Amit Patel',
      status: 'In Progress',
      priority: 'High',
    },
    {
      id: 'WO-8802',
      title: 'Clubhouse Central HVAC Filter Overhaul',
      society: 'Emerald Heights Luxury Enclave',
      tower: 'Clubhouse Wing',
      technician: 'Vikram Joshi',
      status: 'Scheduled',
      priority: 'Medium',
    },
  ]);

  const handleIssuePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName) return;
    setShowIssuePassModal(false);
    alert(`Digital gate pass generated for technician ${techName}. QR code dispatched via SMS.`);
    setTechName('');
  };

  return (
    <div className="space-y-6">
      {/* Service Partner Operations Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white text-[#673AB7] shadow-xs">
                <Wrench className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                {user?.partnerCompany || 'Apex Facilities & Elevators Ltd.'}
              </h1>
            </div>
            <MetadataText
              items={[
                'Service Partner & Vendor Hub',
                `Lead Engineer: ${user?.displayName || 'Amit Patel'}`,
                'Partner ID: #VND-9920',
              ]}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowIssuePassModal(true)}
          >
            Dispatch Technician
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Active Work Orders"
          value={workOrders.length}
          subtitle="Assigned this week"
          icon={<Wrench className="w-5 h-5" />}
        />
        <StatCard
          title="Technicians at Site"
          value="4 Deployed"
          subtitle="Passed security gate"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <StatCard
          title="SLA Compliance"
          value="99.4%"
          subtitle="Within 2-hour window"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Completed Month"
          value="38 Orders"
          subtitle="100% Resident rating"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Work Orders Matrix */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assigned Maintenance & Service Tickets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Work orders with verified Gate Clearance passes
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {workOrders.length} active
          </span>
        </div>

        <div className="space-y-3">
          {workOrders.map((wo) => (
            <div
              key={wo.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-500">{wo.id}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {wo.title}
                  </span>
                </div>
                <MetadataText
                  items={[wo.society, `Location: ${wo.tower}`, `Assigned: ${wo.technician}`]}
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge
                  status={wo.status}
                  variant={wo.status === 'In Progress' ? 'warning' : 'info'}
                />
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={<ArrowUpRight className="w-3 h-3" />}
                  onClick={() => alert(`View details for ${wo.id}`)}
                >
                  View Ticket
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Dispatch Technician Pass Modal */}
      <Modal
        isOpen={showIssuePassModal}
        onClose={() => setShowIssuePassModal(false)}
        title="Dispatch Technician with Gate Pass"
        description="Issue verified vendor credentials to security gate sentinels"
      >
        <form onSubmit={handleIssuePass} className="space-y-4">
          <Input
            label="Technician Full Name"
            placeholder="e.g. Ramesh Chandra"
            value={techName}
            onChange={(e) => setTechName(e.target.value)}
            required
          />
          <div>
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
              Specialization / Trade
            </label>
            <select
              value={techSkill}
              onChange={(e) => setTechSkill(e.target.value)}
              className="w-full min-h-[44px] h-11 rounded-xl px-3 text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="Elevator Specialist">Elevator Specialist</option>
              <option value="HVAC / Air Conditioning">HVAC / Air Conditioning</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Civil & Plumbing">Civil & Plumbing</option>
              <option value="Fire Safety & Extinguishers">Fire Safety & Extinguishers</option>
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowIssuePassModal(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              Issue Gate Pass
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
