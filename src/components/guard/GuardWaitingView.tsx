/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldAlert, 
  AlertTriangle, 
  User, 
  Truck, 
  Wrench, 
  Car,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { GuardVisitor } from '../../types/guard';

interface GuardWaitingViewProps {
  visitors: GuardVisitor[];
  onAllowEntry: (visitorId: string) => Promise<void>;
  onSimulateDecision: (visitorId: string, action: 'APPROVE' | 'DENY') => Promise<void>;
  onAdminOverride: (visitorId: string, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export const GuardWaitingView: React.FC<GuardWaitingViewProps> = ({
  visitors,
  onAllowEntry,
  onSimulateDecision,
  onAdminOverride,
  onRefresh,
}) => {
  const [selectedVisitor, setSelectedVisitor] = useState<GuardVisitor | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const waitingList = visitors.filter(v => v.status === 'WAITING_APPROVAL' || v.status === 'APPROVED');

  const handleGrantEntry = async (id: string) => {
    setActionLoading(id);
    try {
      await onAllowEntry(id);
      setSelectedVisitor(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulate = async (id: string, action: 'APPROVE' | 'DENY') => {
    setActionLoading(id);
    try {
      await onSimulateDecision(id, action);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmOverride = async () => {
    if (!selectedVisitor || !overrideReason.trim()) return;
    setOverriding(true);
    try {
      await onAdminOverride(selectedVisitor.id, overrideReason);
      setShowOverrideModal(false);
      setOverrideReason('');
      setSelectedVisitor(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="space-y-4 px-4 pt-4 pb-20 animate-fade-in max-w-lg mx-auto">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Waiting for Approval</h2>
          <p className="text-xs text-gray-400">Visitors stationed at gate awaiting resident mobile authorization</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-[#673AB7] hover:bg-purple-100 transition"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Queue items */}
      <div className="space-y-3">
        {waitingList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-gray-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-gray-700">Gate Queue Clear</p>
            <p className="text-[11px]">No visitors are currently waiting for resident authorization.</p>
          </div>
        ) : (
          waitingList.map((v) => {
            const isApproved = v.status === 'APPROVED';

            return (
              <div
                key={v.id}
                className={`p-4 rounded-2xl border transition shadow-xs ${
                  isApproved
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : 'bg-white border-[#E6F1F5]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {v.photoUrl ? (
                      <img src={v.photoUrl} alt={v.visitorName} className="w-12 h-12 rounded-xl object-cover border border-purple-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
                        {v.category === 'Guest' ? <User className="w-6 h-6" /> :
                         v.category === 'Delivery' ? <Truck className="w-6 h-6" /> :
                         v.category === 'Service' ? <Wrench className="w-6 h-6" /> :
                         <Car className="w-6 h-6" />}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{v.visitorName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F9FC] text-[#673AB7] border border-[#E6F1F5]">
                          {v.deliveryCompany || v.serviceCompany || v.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Visiting Flat <strong className="text-gray-900">{v.flatNumber}</strong>
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Arrived at {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status chip */}
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isApproved ? 'Approved' : 'Waiting...'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {v.residentPhone && (
                    <a
                      href={`tel:${v.residentPhone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Flat ({v.residentName || 'Resident'})</span>
                    </a>
                  )}

                  {isApproved ? (
                    <button
                      onClick={() => handleGrantEntry(v.id)}
                      disabled={actionLoading === v.id}
                      className="px-4 py-2 bg-[#673AB7] text-white font-bold rounded-xl hover:bg-[#5E35B1] transition shadow-xs flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Allow Entry & Open Barrier</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      {/* Testing simulation buttons */}
                      <button
                        onClick={() => handleSimulate(v.id, 'APPROVE')}
                        disabled={actionLoading === v.id}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-[11px] transition"
                        title="Simulate Resident ACCEPT"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleSimulate(v.id, 'DENY')}
                        disabled={actionLoading === v.id}
                        className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl text-[11px] transition"
                        title="Simulate Resident DENY"
                      >
                        Deny
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVisitor(v);
                          setShowOverrideModal(true);
                        }}
                        className="text-[11px] text-gray-400 hover:text-amber-700 font-medium underline"
                      >
                        Admin Override
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Admin Override Modal */}
      {showOverrideModal && selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Manual Administrative Override</span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Guards cannot silently bypass resident rejection or approval. Overriding requires an audited reason recorded in permanent society security logs.
            </p>

            <div className="p-3 bg-[#F1F9FC] rounded-xl text-xs mb-3 space-y-1">
              <div><span className="text-gray-400">Visitor:</span> <strong>{selectedVisitor.visitorName}</strong></div>
              <div><span className="text-gray-400">Destination:</span> <strong>Flat {selectedVisitor.flatNumber}</strong></div>
            </div>

            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mandatory Justification / Emergency Reason *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Resident confirmed verbally via gate intercom; phone battery dead; emergency medical supply delivery."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none mb-3"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideReason('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={overriding || overrideReason.trim().length < 5}
                onClick={handleConfirmOverride}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition disabled:opacity-50"
              >
                {overriding ? 'Logging...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
