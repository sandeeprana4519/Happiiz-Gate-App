/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Phone, 
  Mail, 
  Home, 
  Building2, 
  User, 
  MessageSquare, 
  Check, 
  CheckCheck,
  Tag
} from 'lucide-react';
import { GuardResidentDirectoryItem, ResidentMessageToGuard } from '../../types/guard';

interface GuardDirectoryViewProps {
  directory: GuardResidentDirectoryItem[];
  messages: ResidentMessageToGuard[];
  onMarkMessageRead: (messageId: string) => Promise<void>;
}

export const GuardDirectoryView: React.FC<GuardDirectoryViewProps> = ({
  directory,
  messages,
  onMarkMessageRead,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'DIRECTORY' | 'MESSAGES'>('DIRECTORY');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTower, setFilterTower] = useState('ALL');

  const unreadCount = messages.filter(m => !m.isRead).length;

  const filteredDirectory = directory.filter(r => {
    const matchSearch = searchTerm === '' ||
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber.includes(searchTerm);
    const matchTower = filterTower === 'ALL' || r.buildingName === filterTower;
    return matchSearch && matchTower;
  });

  return (
    <div className="space-y-4 px-4 pt-4 pb-20 animate-fade-in max-w-lg mx-auto">
      {/* Sub-tabs: Directory & Messages */}
      <div className="flex bg-[#F1F9FC] p-1 rounded-2xl border border-[#E6F1F5]">
        <button
          onClick={() => setActiveSubTab('DIRECTORY')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'DIRECTORY'
              ? 'bg-[#673AB7] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Resident Directory ({directory.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MESSAGES')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 relative ${
            activeSubTab === 'MESSAGES'
              ? 'bg-[#673AB7] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Gate Instructions</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'DIRECTORY' && (
        <div className="space-y-3">
          {/* Search & Tower Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search flat number, resident, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
              />
            </div>
            <select
              value={filterTower}
              onChange={(e) => setFilterTower(e.target.value)}
              className="px-2.5 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-xs font-bold text-gray-700"
            >
              <option value="ALL">All Towers</option>
              <option value="Tower A">Tower A</option>
              <option value="Tower B">Tower B</option>
              <option value="Tower C">Tower C</option>
            </select>
          </div>

          {/* Directory Cards */}
          <div className="space-y-2.5">
            {filteredDirectory.map((r) => (
              <div
                key={r.uid}
                className="p-3.5 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#673AB7] font-extrabold flex items-center justify-center text-sm">
                    {r.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-gray-900">{r.fullName}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-[#673AB7] rounded-md font-semibold">
                        {r.occupantType}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {r.buildingName} • Flat <strong className="text-gray-900">{r.flatNumber}</strong>
                    </p>
                    {r.intercomNumber && (
                      <p className="text-[10px] text-gray-400 font-mono">
                        Intercom Ext: #{r.intercomNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${r.phoneNumber}`}
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1 text-xs font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Call</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'MESSAGES' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>Special instructions logged by residents</span>
            <span>{messages.length} total messages</span>
          </div>

          <div className="space-y-2.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition shadow-xs space-y-2 ${
                  !m.isRead ? 'bg-[#F1F9FC] border-purple-200' : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{m.residentName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-[#673AB7] border border-gray-200">
                        Flat {m.flatNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {m.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#673AB7] mt-1">{m.title}</h4>
                  </div>

                  <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-gray-100/60">
                  {m.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-gray-400">
                    {m.isRead ? 'Acknowledged' : 'New Instruction'}
                  </span>
                  {!m.isRead && (
                    <button
                      onClick={() => onMarkMessageRead(m.id)}
                      className="px-3 py-1 bg-white border border-[#E6F1F5] rounded-lg text-gray-700 font-bold hover:bg-purple-50 hover:text-[#673AB7] transition flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-[#673AB7]" />
                      <span>Mark as Read</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
