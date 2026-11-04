/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, GlassCard, StatCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, MetadataText } from '../../components/common/Badge';
import { MOCK_SOCIETIES } from '../../services/mock/mockData';
import { Society } from '../../types/society';
import {
  ShieldAlert,
  Building,
  Server,
  Layers,
  Database,
  Plus,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { PendingRequestsCard } from '../../components/admin/PendingRequestsCard';

export const SuperAdminDashboard: React.FC = () => {
  const { user, isFirebaseConfigured } = useAuth();
  const [societies, setSocieties] = useState<Society[]>(MOCK_SOCIETIES);
  const [showAddSocietyModal, setShowAddSocietyModal] = useState(false);
  const [newSocName, setNewSocName] = useState('');
  const [newSocCity, setNewSocCity] = useState('');
  const [newSocFlats, setNewSocFlats] = useState('200');

  const handleAddSociety = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocName || !newSocCity) return;

    const newSoc: Society = {
      id: `soc_${Date.now()}`,
      societyName: newSocName,
      name: newSocName,
      societyCode: `SOC-${societies.length + 1}`,
      code: `SOC-${societies.length + 1}`,
      city: newSocCity,
      address: `${newSocCity} Prime Enclave`,
      totalFlats: parseInt(newSocFlats) || 100,
      occupiedFlats: Math.floor((parseInt(newSocFlats) || 100) * 0.85),
      totalGates: 3,
      activeGuards: 6,
      subscriptionPlan: 'Enterprise',
      status: 'ACTIVE',
    };

    setSocieties([...societies, newSoc]);
    setShowAddSocietyModal(false);
    setNewSocName('');
    setNewSocCity('');
    alert(`Society "${newSocName}" successfully provisioned on Happiiz Gate SaaS.`);
  };

  const totalFlats = societies.reduce((acc, s) => acc + s.totalFlats, 0);
  const totalOccupied = societies.reduce((acc, s) => acc + s.occupiedFlats, 0);

  return (
    <div className="space-y-6">
      {/* Super Admin Master Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white text-[#673AB7] shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] tracking-tight">
                Super Admin Master Console
              </h1>
            </div>
            <MetadataText
              items={[
                'Multi-Tenant SaaS Management',
                `Super Admin: ${user?.displayName || 'Vikram Malhotra'}`,
                'Happiiz Gate App Architecture',
              ]}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddSocietyModal(true)}
          >
            Provision Society
          </Button>
        </div>
      </div>

      {/* Global Cloud Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="Tenant Societies"
          value={societies.length}
          subtitle="Across 3 Metros"
          icon={<Building className="w-5 h-5" />}
        />
        <StatCard
          title="Managed Units"
          value={totalFlats}
          subtitle={`${totalOccupied} Occupied Residences`}
          icon={<Layers className="w-5 h-5" />}
        />
        <StatCard
          title="Active Sentinels"
          value={26}
          subtitle="Guards currently at gates"
          icon={<Cpu className="w-5 h-5" />}
        />
        <StatCard
          title="Database Status"
          value={isFirebaseConfigured ? 'Live' : 'Mock Dev'}
          subtitle={isFirebaseConfigured ? 'Cloud Firestore connected' : 'Local preview mode'}
          icon={<Database className="w-5 h-5" />}
        />
      </div>

      {/* Multi-Society Tenant Overview Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Provisioned Societies & Gated Complexes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-tenant architecture with isolated security zones
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {societies.length} active tenants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Society Name</th>
                <th className="py-2.5 px-3">City / Location</th>
                <th className="py-2.5 px-3">Flats / Units</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Gates / Guards</th>
                <th className="py-2.5 px-3">SaaS Tier</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {societies.map((soc) => (
                <tr
                  key={soc.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {soc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Code: {soc.code} · ID: {soc.id}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {soc.city}
                    </span>
                    <div className="text-[11px] text-slate-400 line-clamp-1">
                      {soc.address}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {soc.occupiedFlats}
                    </span>{' '}
                    / {soc.totalFlats}
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell font-mono text-slate-600 dark:text-slate-400">
                    {soc.totalGates} Gates · {soc.activeGuards} Guards
                  </td>
                  <td className="py-3 px-3 font-semibold text-sky-500">
                    {soc.subscriptionPlan}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={soc.status === 'ACTIVE' ? 'Operational' : 'Evaluation Trial'}
                      variant={soc.status === 'ACTIVE' ? 'success' : 'warning'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Platform Access Requests & Verification Approvals */}
      <PendingRequestsCard isSuperAdmin={true} />

      {/* Provision Society Modal */}
      <Modal
        isOpen={showAddSocietyModal}
        onClose={() => setShowAddSocietyModal(false)}
        title="Provision New Society / Community"
        description="Bootstrap multi-tenant gate policies and security zones"
      >
        <form onSubmit={handleAddSociety} className="space-y-4">
          <Input
            label="Society Name"
            placeholder="e.g. Royal Palms Residency"
            value={newSocName}
            onChange={(e) => setNewSocName(e.target.value)}
            required
          />
          <Input
            label="City"
            placeholder="e.g. Bengaluru, Mumbai, Pune"
            value={newSocCity}
            onChange={(e) => setNewSocCity(e.target.value)}
            required
          />
          <Input
            label="Total Flats / Units"
            type="number"
            placeholder="250"
            value={newSocFlats}
            onChange={(e) => setNewSocFlats(e.target.value)}
            required
          />

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddSocietyModal(false)}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-1/2">
              Provision Tenant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
