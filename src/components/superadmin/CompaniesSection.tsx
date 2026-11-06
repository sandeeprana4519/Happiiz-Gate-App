import React, { useState } from 'react';
import { ManagedCompany } from '../../types/admin';
import {
  Briefcase,
  Search,
  Plus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  MapPin,
  Mail,
  Phone,
  Filter,
} from 'lucide-react';
import { createManagedCompany, updateCompanyStatus } from '../../services/firebase/superadmin.service';

interface CompaniesSectionProps {
  companies: ManagedCompany[];
  onRefresh: () => void;
}

export const CompaniesSection: React.FC<CompaniesSectionProps> = ({
  companies,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState<ManagedCompany['companyType']>('Commercial Building');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560103');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [totalBuildings, setTotalBuildings] = useState(2);
  const [totalOffices, setTotalOffices] = useState(24);
  const [subscriptionPlan, setSubscriptionPlan] = useState('Enterprise Plan');

  const filtered = companies.filter((c) => {
    const matchSearch =
      !searchTerm ||
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || c.companyType === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createManagedCompany({
        companyName,
        companyType,
        address,
        city,
        state,
        pincode,
        contactEmail,
        contactPhone,
        adminName,
        totalBuildings,
        totalOffices,
        subscriptionPlan,
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: ManagedCompany) => {
    const nextStatus = c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateCompanyStatus(c.id, nextStatus, `Platform administrative status toggle to ${nextStatus}`);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Commercial & Corporate Campus Management
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Centralized directory for corporate campuses, tech parks, factories and commercial enterprises
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E6F1F5] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, city, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/50 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#A9B0B8]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F1F9FC] border border-[#E6F1F5] rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Company Types</option>
            <option value="Commercial Building">Commercial Building</option>
            <option value="Corporate Campus">Corporate Campus</option>
            <option value="Factory">Factory</option>
            <option value="Tech Park">Tech Park</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cmp) => (
          <div
            key={cmp.id}
            className="bg-white rounded-2xl border border-[#E6F1F5] p-5 shadow-xs hover:border-[#673AB7]/30 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#111111] text-sm">{cmp.companyName}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#A9B0B8]">
                    <span className="font-semibold text-purple-700">{cmp.companyType}</span>
                    <span>•</span>
                    <span className="font-mono">{cmp.registrationNumber || 'CIN-PENDING'}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  cmp.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : cmp.status === 'PENDING'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {cmp.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F1F9FC] p-3 rounded-xl border border-[#E6F1F5]">
              <div>
                <span className="text-[#A9B0B8] block text-[10px] uppercase font-bold">Campus Scale</span>
                <span className="font-bold text-gray-800">
                  {cmp.totalBuildings} Buildings • {cmp.totalOffices} Offices/Wings
                </span>
              </div>
              <div>
                <span className="text-[#A9B0B8] block text-[10px] uppercase font-bold">Plan Tier</span>
                <span className="font-bold text-[#673AB7]">{cmp.subscriptionPlan}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 text-gray-600 truncate">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{cmp.address}, {cmp.city}, {cmp.state} - {cmp.pincode}</span>
              </div>
              <div className="col-span-2 flex items-center justify-between text-gray-600 pt-1 border-t border-[#E6F1F5]">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{cmp.contactEmail}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>{cmp.contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-500">
                Admin: <strong className="text-gray-800">{cmp.adminName}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(cmp)}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition cursor-pointer ${
                    cmp.status === 'ACTIVE'
                      ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {cmp.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-1">Register Enterprise / Company</h3>
            <p className="text-xs text-gray-500 mb-4">
              Add corporate campus, IT tech park or commercial establishment
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Campus Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Cloud Tech Campus"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Commercial Building">Commercial Building</option>
                    <option value="Corporate Campus">Corporate Campus</option>
                    <option value="Factory">Factory</option>
                    <option value="Tech Park">Tech Park</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subscription Plan</label>
                  <select
                    value={subscriptionPlan}
                    onChange={(e) => setSubscriptionPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="Enterprise Plan">Enterprise Plan</option>
                    <option value="Premium Plan">Premium Plan</option>
                    <option value="Custom High-Volume Plan">Custom High-Volume Plan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  placeholder="Campus address / street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@campus.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 80 4400 9900"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Admin</label>
                  <input
                    type="text"
                    required
                    placeholder="Name of Admin"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Buildings</label>
                  <input
                    type="number"
                    min="1"
                    value={totalBuildings}
                    onChange={(e) => setTotalBuildings(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Offices/Units</label>
                  <input
                    type="number"
                    min="1"
                    value={totalOffices}
                    onChange={(e) => setTotalOffices(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-xs font-bold hover:bg-[#5E35B1] transition cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
