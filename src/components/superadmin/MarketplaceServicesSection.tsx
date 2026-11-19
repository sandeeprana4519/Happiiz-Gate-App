/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MarketplaceService,
  ServicePricingType,
} from '../../types/marketplace';
import { marketplaceService } from '../../services/firebase/marketplace.service';
import { ServicePartnerProfile } from '../../types/auth';
import {
  Plus,
  Search,
  Wrench,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Clock,
  Percent,
  Layers,
  Sparkles,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  SlidersHorizontal,
  Download,
} from 'lucide-react';

interface MarketplaceServicesSectionProps {
  onRefresh?: () => Promise<void>;
  partners?: ServicePartnerProfile[];
}

const PRESET_BANNERS = [
  { label: 'Car Wash', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop' },
  { label: 'Plumbing', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop' },
  { label: 'Electrical', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop' },
  { label: 'AC Jet Cleaning', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop' },
  { label: 'Deep Cleaning', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop' },
  { label: 'Carpentry', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop' },
];

export const MarketplaceServicesSection: React.FC<MarketplaceServicesSectionProps> = ({
  onRefresh,
  partners = [],
}) => {
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MarketplaceService | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Automotive Cleaning');
  const [customCategory, setCustomCategory] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_BANNERS[0].url);
  const [description, setDescription] = useState('');
  const [whatIsIncluded, setWhatIsIncluded] = useState<string[]>([
    'Doorstep visit with complete professional toolset',
    'Certified technician with background verification',
    '30-day post-service warranty on repair work',
  ]);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [pricingType, setPricingType] = useState<ServicePricingType>('FIXED');
  const [basePrice, setBasePrice] = useState<number>(399);
  const [commissionRate, setCommissionRate] = useState<number>(15);
  const [estimatedDuration, setEstimatedDuration] = useState('45 mins');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [popularBadge, setPopularBadge] = useState(false);

  // Partner Mapping Modal
  const [mappingModalService, setMappingModalService] = useState<MarketplaceService | null>(null);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await marketplaceService.getServices();
      setServices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCategory('Automotive Cleaning');
    setCustomCategory('');
    setImageUrl(PRESET_BANNERS[0].url);
    setDescription('');
    setWhatIsIncluded([
      'Doorstep inspection & diagnosis by verified professional',
      'Execution using specialized grade tools',
      '30-day post-service work guarantee',
    ]);
    setPricingType('FIXED');
    setBasePrice(399);
    setCommissionRate(15);
    setEstimatedDuration('45 mins');
    setStatus('ACTIVE');
    setPopularBadge(false);
    setModalOpen(true);
  };

  const openEditModal = (svc: MarketplaceService) => {
    setEditingService(svc);
    setName(svc.name);
    setCategory(svc.category);
    setCustomCategory('');
    setImageUrl(svc.imageUrl);
    setDescription(svc.description);
    setWhatIsIncluded(svc.whatIsIncluded || []);
    setPricingType(svc.pricingType);
    setBasePrice(svc.basePrice);
    setCommissionRate(svc.commissionRate);
    setEstimatedDuration(svc.estimatedDuration);
    setStatus(svc.status);
    setPopularBadge(Boolean(svc.popularBadge));
    setModalOpen(true);
  };

  // Direct File Upload Handler (Base64 live preview & storage)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddIncludedItem = () => {
    if (!newIncludedItem.trim()) return;
    setWhatIsIncluded([...whatIsIncluded, newIncludedItem.trim()]);
    setNewIncludedItem('');
  };

  const handleRemoveIncludedItem = (idx: number) => {
    setWhatIsIncluded(whatIsIncluded.filter((_, i) => i !== idx));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCategory = category === 'CUSTOM' ? customCategory.trim() || 'General' : category;

    if (editingService) {
      await marketplaceService.updateService(editingService.id, {
        name: name.trim(),
        category: finalCategory,
        imageUrl: imageUrl || PRESET_BANNERS[0].url,
        description,
        whatIsIncluded,
        pricingType,
        basePrice: Number(basePrice) || 299,
        commissionRate: Number(commissionRate) || 15,
        estimatedDuration,
        status,
        popularBadge,
      });
    } else {
      await marketplaceService.createService({
        name: name.trim(),
        category: finalCategory,
        imageUrl: imageUrl || PRESET_BANNERS[0].url,
        description,
        whatIsIncluded,
        pricingType,
        basePrice: Number(basePrice) || 299,
        commissionRate: Number(commissionRate) || 15,
        estimatedDuration,
        status,
        popularBadge,
      });
    }

    setModalOpen(false);
    await loadServices();
    if (onRefresh) onRefresh();
  };

  const handleToggleStatus = async (id: string) => {
    await marketplaceService.toggleServiceStatus(id);
    await loadServices();
    if (onRefresh) onRefresh();
  };

  const handleDeleteService = async (id: string, svcName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${svcName}" from the Marketplace catalog?`)) {
      return;
    }
    await marketplaceService.deleteService(id);
    await loadServices();
    if (onRefresh) onRefresh();
  };

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalActive = services.filter((s) => s.status === 'ACTIVE').length;
  const avgCommission = services.length > 0
    ? Math.round(services.reduce((acc, s) => acc + s.commissionRate, 0) / services.length)
    : 15;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Total Catalog Services</p>
            <h3 className="text-2xl font-black text-[#111111] mt-0.5">{services.length}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Ready for on-demand booking</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Active Doorstep Services</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{totalActive}</h3>
            <p className="text-[11px] text-[#A9B0B8] mt-1">{services.length - totalActive} paused or archived</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Average Platform Cut</p>
            <h3 className="text-2xl font-black text-[#673AB7] mt-0.5">{avgCommission}%</h3>
            <p className="text-[11px] text-[#A9B0B8] mt-1">Direct SaaS commission margin</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B]">Resident Home Services</p>
            <h3 className="text-2xl font-black text-blue-600 mt-0.5">Live Synced</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Instant Resident App feed</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Add Service Button */}
      <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search services by title, category, or scope of work..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] placeholder:text-[#A9B0B8] focus:outline-none focus:border-[#673AB7]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export Catalog to PDF */}
            <button
              type="button"
              onClick={() => marketplaceService.exportCatalogPdf(services)}
              className="px-3.5 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#673AB7] text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download branded printable PDF catalog"
            >
              <Download className="w-4 h-4" />
              <span>Export Catalog to PDF</span>
            </button>

            {/* Add Service Button */}
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#673AB7] text-white shadow-xs'
                  : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
              }`}
            >
              {cat === 'ALL' ? 'All Domains' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TABLE-FIRST SERVICE CATALOG VIEW (OPTIMIZED 7 COLUMNS)       */}
      {/* ============================================================ */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white rounded-2xl border border-[#E6F1F5]">
          Loading marketplace services catalog...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#E6F1F5] space-y-3">
          <Wrench className="w-10 h-10 text-[#A9B0B8] mx-auto" />
          <h4 className="text-sm font-bold text-[#111111]">No Services Found</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No services match your search or domain filter. Add your first service to publish it to residents.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-[#E6F1F5] shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F1F9FC] border-b border-[#E6F1F5] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-[30%] min-w-[200px]">Service</th>
                  <th className="py-3.5 px-3.5 w-[18%] min-w-[130px]">Category / Domain</th>
                  <th className="py-3.5 px-3.5 w-[13%] whitespace-nowrap">Base Price (₹)</th>
                  <th className="py-3.5 px-3.5 w-[13%] whitespace-nowrap">Platform Cut (%)</th>
                  <th className="py-3.5 px-3.5 w-[12%] whitespace-nowrap">Duration</th>
                  <th className="py-3.5 px-3.5 w-[10%] text-center whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 w-[14%] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F1F5]">
                {filteredServices.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#F9FCFD] transition-colors">
                    {/* 1. Service: Thumbnail preview + Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={svc.imageUrl}
                          alt={svc.name}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#111111] line-clamp-1 text-xs" title={svc.name}>
                              {svc.name}
                            </span>
                            {svc.popularBadge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                ★ Popular
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#A9B0B8] font-semibold mt-0.5">
                            {svc.pricingType === 'FIXED' ? 'Fixed Fee Booking' : svc.pricingType === 'INSPECTION' ? 'Doorstep Inspection' : 'Hourly Rate'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Category / Domain */}
                    <td className="py-3.5 px-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-[#673AB7] border border-purple-100">
                        {svc.category}
                      </span>
                    </td>

                    {/* 3. Base / Suggested Price (₹) */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="text-xs font-mono font-black text-[#111111]">₹{svc.basePrice}</span>
                      <span className="block text-[10px] text-[#A9B0B8] font-medium">suggested base</span>
                    </td>

                    {/* 4. Platform Commission (%) */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-purple-50 text-[#673AB7] border border-purple-100 font-mono">
                        {svc.commissionRate}%
                      </span>
                      <span className="block text-[10px] text-[#A9B0B8] mt-0.5 font-mono">
                        Cut: ₹{Math.round((svc.basePrice * svc.commissionRate) / 100)}
                      </span>
                    </td>

                    {/* 5. Estimated Duration */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#475569]">
                        <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                        {svc.estimatedDuration}
                      </span>
                    </td>

                    {/* 6. Status Badge (Toggleable) */}
                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(svc.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          svc.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            svc.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        <span>{svc.status}</span>
                      </button>
                    </td>

                    {/* 7. Actions: Mapped Partners, Edit, Delete / Archive (Never clipped) */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMappingModalService(svc)}
                          title="View Mapped Partners"
                          className="px-2.5 py-1 rounded-lg border border-[#E6F1F5] bg-white hover:bg-purple-50 text-[#673AB7] font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <span>Partners</span>
                          <span className="w-4 h-4 rounded-full bg-purple-100 text-[#673AB7] text-[10px] flex items-center justify-center font-bold">
                            {svc.partnerCount || 4}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(svc)}
                          title="Edit Service"
                          className="p-1.5 rounded-lg border border-[#E6F1F5] bg-white hover:bg-purple-50 text-[#673AB7] transition cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc.id, svc.name)}
                          title="Delete / Archive Service"
                          className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 transition cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD / EDIT SERVICE MODAL WITH NATIVE FILE UPLOADER           */}
      {/* ============================================================ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-purple-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#673AB7] text-white flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#111111]">
                    {editingService ? 'Edit Marketplace Service' : 'Configure New Marketplace Service'}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Urban Company style catalog item with pricing & commission
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveService} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Service Name */}
              <div>
                <label className="block font-bold text-[#111111] mb-1">Service Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Car Wash & Foam Detailing (Hatchback/Sedan)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              {/* Category Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#111111] mb-1">Domain / Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="Automotive Cleaning">Automotive Cleaning</option>
                    <option value="Plumbing">Plumbing & Sanitary</option>
                    <option value="Electrical">Electrical Repairs</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Cleaning & Sanitization">Cleaning & Sanitization</option>
                    <option value="Carpentry">Carpentry & Woodwork</option>
                    <option value="Painting">Painting & Waterproofing</option>
                    <option value="CUSTOM">+ Add Custom Domain...</option>
                  </select>
                </div>

                {category === 'CUSTOM' ? (
                  <div>
                    <label className="block font-bold text-[#111111] mb-1">New Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pest Control"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] focus:outline-none focus:border-[#673AB7]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-[#111111] mb-1">Estimated Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 45 mins, 2 hours"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] focus:outline-none focus:border-[#673AB7]"
                    />
                  </div>
                )}
              </div>

              {/* 2B. Direct File Uploader for Service Image (Replacing static URL) */}
              <div className="space-y-2">
                <label className="block font-bold text-[#111111]">
                  Service Thumbnail / Banner (Upload from Device) *
                </label>

                {imageUrl ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#E6F1F5] group shadow-xs">
                    <img
                      src={imageUrl}
                      alt="Service Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-white text-[#111111] font-bold text-xs cursor-pointer shadow-md hover:bg-slate-100 inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#673AB7]" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="px-3.5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#E6F1F5] rounded-2xl bg-[#F1F9FC] hover:bg-purple-50/40 hover:border-[#673AB7] transition-all cursor-pointer">
                    <Upload className="w-8 h-8 text-[#673AB7] mb-2" />
                    <span className="text-xs font-bold text-[#111111]">
                      Click to Browse & Pick Image File
                    </span>
                    <span className="text-[11px] text-[#64748B] mt-0.5">
                      JPG, PNG, or WEBP from Laptop / Mobile
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Preset fallback selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                  <span className="text-[10px] text-[#64748B] shrink-0">Or pick preset:</span>
                  {PRESET_BANNERS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold shrink-0 border ${
                        imageUrl === p.url
                          ? 'border-[#673AB7] bg-purple-50 text-[#673AB7]'
                          : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-[#111111] mb-1">Description / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Overview of the service scope for residents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              {/* What's Included (Bullet points) */}
              <div>
                <label className="block font-bold text-[#111111] mb-1">
                  What's Included (Service Scope Deliverables)
                </label>
                <div className="space-y-1.5">
                  {whatIsIncluded.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#F1F9FC] text-[#334155]">
                      <div className="flex items-center gap-2 truncate">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIncludedItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add an included deliverable (e.g. 30-day warranty)..."
                      value={newIncludedItem}
                      onChange={(e) => setNewIncludedItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIncludedItem();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#111111]"
                    />
                    <button
                      type="button"
                      onClick={handleAddIncludedItem}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 text-[#673AB7] font-bold shrink-0 hover:bg-purple-200"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing Model & Commission */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#111111] mb-1">Pricing Model *</label>
                    <select
                      value={pricingType}
                      onChange={(e) => setPricingType(e.target.value as ServicePricingType)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E6F1F5] text-[#111111] font-semibold"
                    >
                      <option value="FIXED">Fixed Price</option>
                      <option value="INSPECTION">Inspection Base Fee</option>
                      <option value="HOURLY">Hourly Rate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#111111] mb-1">Base Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-[#111111] font-black"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#111111] mb-1">Platform Cut (%) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={50}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-[#673AB7] font-black"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#64748B] flex items-center justify-between pt-1">
                  <span>
                    Resident pays: <strong>₹{basePrice}</strong>
                  </span>
                  <span>
                    Partner earns: <strong>₹{Math.round(basePrice * (1 - commissionRate / 100))}</strong>
                  </span>
                  <span className="text-[#673AB7] font-bold">
                    Admin Cut: <strong>₹{Math.round((basePrice * commissionRate) / 100)}</strong>
                  </span>
                </div>
              </div>

              {/* Status and Best Seller Toggle */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={status === 'ACTIVE'}
                    onChange={(e) => setStatus(e.target.checked ? 'ACTIVE' : 'INACTIVE')}
                    className="w-4 h-4 rounded text-[#673AB7] focus:ring-[#673AB7]"
                  />
                  <span className="font-bold text-[#111111]">Publish Service Live (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={popularBadge}
                    onChange={(e) => setPopularBadge(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-amber-700">Mark as Popular</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E6F1F5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E6F1F5] text-[#64748B] font-bold hover:bg-[#F1F9FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#673AB7] hover:bg-[#5E35B1] text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingService ? 'Save Changes' : 'Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAPPED PARTNERS MODAL                                         */}
      {/* ============================================================ */}
      {mappingModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-3">
              <div>
                <h3 className="font-black text-sm text-[#111111]">
                  Active Partners for "{mappingModalService.name}"
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Verified service providers eligible to receive on-demand bookings
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMappingModalService(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-[#64748B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 text-xs">
              {partners.length > 0 ? (
                partners.map((p) => (
                  <div
                    key={p.uid || p.id}
                    className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#673AB7] font-bold flex items-center justify-center shrink-0">
                        {(p.name || p.businessName || 'SP').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#111111]">{p.businessName || p.name}</p>
                        <p className="text-[11px] text-[#64748B]">{p.phone || p.contactNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Opted In
                      </span>
                      <p className="text-[10px] text-[#A9B0B8] mt-0.5">Rate: ₹{mappingModalService.basePrice}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-[#64748B]">
                  <p>All active community service providers are eligible to fulfill this service.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMappingModalService(null)}
              className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
