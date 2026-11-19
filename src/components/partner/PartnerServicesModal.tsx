/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Power, 
  Edit3, 
  Check, 
  DollarSign, 
  Tag, 
  Plus 
} from 'lucide-react';
import { PartnerServiceOffering } from '../../types/servicePartner';
import { servicePartnerService } from '../../services/firebase/servicePartner.service';

interface PartnerServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  services: PartnerServiceOffering[];
  onRefresh: () => void;
}

export const PartnerServicesModal: React.FC<PartnerServicesModalProps> = ({
  isOpen,
  onClose,
  partnerId,
  services,
  onRefresh,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBasePrice, setEditBasePrice] = useState<number>(0);
  const [editInspectionFee, setEditInspectionFee] = useState<number>(0);

  if (!isOpen) return null;

  const handleStartEdit = (service: PartnerServiceOffering) => {
    setEditingId(service.id);
    setEditBasePrice(service.basePrice);
    setEditInspectionFee(service.inspectionFee);
  };

  const handleSavePrice = async (serviceId: string) => {
    await servicePartnerService.updateServiceOffering(partnerId, serviceId, {
      basePrice: editBasePrice,
      inspectionFee: editInspectionFee,
    });
    setEditingId(null);
    onRefresh();
  };

  const handleToggleAvailable = async (serviceId: string, current: boolean) => {
    await servicePartnerService.updateServiceOffering(partnerId, serviceId, {
      isAvailable: !current,
    });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Service Offerings & Pricing
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Manage catalogue, rates and inspection charges
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
          {services.map((s) => {
            const isEditing = editingId === s.id;

            return (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2.5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                      {s.category}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#111111] mt-1">{s.serviceName}</h4>
                  </div>

                  <button
                    onClick={() => handleToggleAvailable(s.id, s.isAvailable)}
                    className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                      s.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                    title={s.isAvailable ? 'Offered to Residents' : 'Currently Disabled'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">{s.description}</p>

                {/* Price Display or Edit Row */}
                {isEditing ? (
                  <div className="p-3 rounded-xl bg-white border border-[#E6F1F5] space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Base Starting (₹)
                        </label>
                        <input
                          type="number"
                          value={editBasePrice}
                          onChange={(e) => setEditBasePrice(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-[#E6F1F5] text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Inspection Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={editInspectionFee}
                          onChange={(e) => setEditInspectionFee(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-[#E6F1F5] text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSavePrice(s.id)}
                        className="px-3 py-1 rounded-lg bg-[#673AB7] text-white text-xs font-bold"
                      >
                        Save Rates
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-[#E6F1F5]">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-[#A9B0B8]">Base Rate:</span>{' '}
                        <strong className="text-xs text-[#111111]">₹{s.basePrice}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#A9B0B8]">Inspection:</span>{' '}
                        <strong className="text-xs text-[#111111]">₹{s.inspectionFee}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartEdit(s)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#673AB7] hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Price</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
