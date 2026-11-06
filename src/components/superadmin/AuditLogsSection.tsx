/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog } from '../../types/admin';
import {
  History,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Filter,
  FileCode,
  X,
} from 'lucide-react';

interface AuditLogsSectionProps {
  logs: AuditLog[];
}

export const AuditLogsSection: React.FC<AuditLogsSectionProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.reason && l.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.targetRecordId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || l.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">Immutable Administrative Audit Trail</h2>
          <p className="text-xs text-[#A9B0B8]">
            Cryptographically sealed and append-only log of sensitive platform operations
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 self-start sm:self-auto">
          {logs.length} Audit Events Recorded
        </span>
      </div>

      {/* Filter and Search */}
      <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A9B0B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, actor, target ID, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:bg-white focus:border-[#673AB7] focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full sm:w-56 p-2 rounded-xl border border-[#E6F1F5] bg-[#F1F9FC]/60 text-xs text-[#111111] focus:outline-none"
        >
          <option value="ALL">All Action Categories</option>
          <option value="SOCIETY">Society Actions</option>
          <option value="ADMIN">Admin Management</option>
          <option value="RESIDENT">Resident Changes</option>
          <option value="GUARD">Guard Roster</option>
          <option value="SUBSCRIPTION">Subscription Billing</option>
          <option value="NOTIFICATION">Broadcasting</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC]/60 text-[#A9B0B8] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Record & Type</th>
                <th className="py-3 px-4">Administrative Reason</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F1F5]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-[#F1F9FC]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#673AB7]">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#111111]">{log.actorName}</div>
                    <div className="text-[10px] text-[#A9B0B8] font-mono">{log.actorRole}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[#111111] font-medium">{log.targetRecordId}</span>
                    <span className="text-[10px] text-[#A9B0B8] block">{log.targetRecordType}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#111111] max-w-xs truncate">
                    {log.reason || 'Authorized execution'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#A9B0B8] text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg border border-[#E6F1F5] hover:bg-[#F1F9FC] text-[#673AB7] cursor-pointer"
                      title="Inspect Event Metadata"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6F1F5] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#673AB7]" />
                <h3 className="text-sm font-extrabold text-[#111111]">Audit Event: {selectedLog.action}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-[#A9B0B8] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-1">
                <div>Actor: <strong className="text-[#111111]">{selectedLog.actorName}</strong> ({selectedLog.actorUid})</div>
                <div>Target ID: <strong className="text-[#111111]">{selectedLog.targetRecordId}</strong> ({selectedLog.targetRecordType})</div>
                <div>Timestamp: <span className="font-mono text-[#A9B0B8]">{selectedLog.timestamp}</span></div>
                <div>Reason: <span className="text-[#673AB7] font-medium">{selectedLog.reason}</span></div>
              </div>

              <div>
                <span className="font-bold text-[#111111] block mb-1">Payload Metadata (JSON):</span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
