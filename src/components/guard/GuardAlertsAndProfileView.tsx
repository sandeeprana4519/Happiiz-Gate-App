/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  HeartPulse, 
  AlertTriangle, 
  Phone, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Search, 
  Filter, 
  History, 
  LogOut, 
  Globe, 
  User, 
  ShieldCheck, 
  QrCode, 
  Check, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GuardEmergencyAlert, GuardVisitor, GuardProfileInfo } from '../../types/guard';
import { soundAlert } from '../../utils/soundAlert';

interface GuardAlertsAndProfileViewProps {
  emergencies: GuardEmergencyAlert[];
  visitors: GuardVisitor[];
  guardProfile: GuardProfileInfo;
  onAcknowledgeEmergency: (alertId: string) => Promise<void>;
  onResolveEmergency: (alertId: string, notes: string) => Promise<void>;
  onFastTrackCheckIn: (visitorId: string) => Promise<void>;
  onLogout: () => void;
}

export const GuardAlertsAndProfileView: React.FC<GuardAlertsAndProfileViewProps> = ({
  emergencies,
  visitors,
  guardProfile,
  onAcknowledgeEmergency,
  onResolveEmergency,
  onFastTrackCheckIn,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'SOS' | 'PRE_APPROVED' | 'HISTORY' | 'PROFILE'>('SOS');
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState<GuardEmergencyAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // History state
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterDate, setHistoryFilterDate] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'ALL'>('TODAY');
  const [historyCategory, setHistoryCategory] = useState('ALL');

  // Language state
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const activeEmergencies = emergencies.filter(e => e.status !== 'RESOLVED');
  const resolvedEmergencies = emergencies.filter(e => e.status === 'RESOLVED');
  const preApprovedList = visitors.filter(v => v.isPreApproved || v.status === 'APPROVED');

  const handleToggleSiren = () => {
    if (sirenPlaying) {
      soundAlert.stopEmergencySiren();
      setSirenPlaying(false);
    } else {
      soundAlert.startEmergencySiren();
      setSirenPlaying(true);
    }
  };

  const handleConfirmResolveAlert = async () => {
    if (!selectedAlertForResolve || !resolutionNotes.trim()) return;
    setResolving(true);
    try {
      await onResolveEmergency(selectedAlertForResolve.id, resolutionNotes);
      setSelectedAlertForResolve(null);
      setResolutionNotes('');
      if (sirenPlaying) {
        soundAlert.stopEmergencySiren();
        setSirenPlaying(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  // Filter history
  const filteredHistory = visitors.filter(v => {
    const matchSearch = historySearch === '' ||
      v.visitorName.toLowerCase().includes(historySearch.toLowerCase()) ||
      v.flatNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      v.passCode.includes(historySearch) ||
      (v.visitorPhone && v.visitorPhone.includes(historySearch)) ||
      (v.cabVehiclePlate && v.cabVehiclePlate.toLowerCase().includes(historySearch.toLowerCase()));
    const matchCat = historyCategory === 'ALL' || v.category === historyCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4 px-4 pt-4 pb-20 animate-fade-in max-w-lg mx-auto">
      {/* Sub navigation pills */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F9FC] rounded-2xl border border-[#E6F1F5] text-[11px] font-bold">
        <button
          onClick={() => setActiveSubTab('SOS')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeSubTab === 'SOS' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>SOS ({activeEmergencies.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PRE_APPROVED')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeSubTab === 'PRE_APPROVED' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pre-App</span>
        </button>

        <button
          onClick={() => setActiveSubTab('HISTORY')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeSubTab === 'HISTORY' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Logs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PROFILE')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeSubTab === 'PROFILE' ? 'bg-[#673AB7] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>
      </div>

      {/* SUBTAB 1: EMERGENCY SOS MONITOR */}
      {activeSubTab === 'SOS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Emergency Incident Dispatch</h3>
              <p className="text-[11px] text-gray-400">Panic buttons triggered by residents or elevator sensors</p>
            </div>

            <button
              onClick={handleToggleSiren}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                sirenPlaying
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {sirenPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{sirenPlaying ? 'Mute Siren' : 'Test Siren'}</span>
            </button>
          </div>

          {activeEmergencies.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
              <p className="font-bold text-sm">All Premises Secure</p>
              <p className="text-[11px] text-emerald-700">No active fire, lift entrapment, or medical alerts reported.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeEmergencies.map((emg) => (
                <div
                  key={emg.id}
                  className="p-4 rounded-3xl bg-white border-2 border-red-500 shadow-lg space-y-3 animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                        {emg.alertType === 'Fire Alert' ? <Flame className="w-6 h-6" /> :
                         emg.alertType === 'Medical Emergency' ? <HeartPulse className="w-6 h-6" /> :
                         <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-red-600 uppercase tracking-wide">
                          {emg.alertType}
                        </h4>
                        <p className="font-bold text-gray-900 text-xs">
                          {emg.building} • {emg.flatNumber}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Reported by {emg.reportingResident}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-red-600 text-white font-bold px-2.5 py-1 rounded-full uppercase">
                      {emg.status}
                    </span>
                  </div>

                  {emg.responseNotes && (
                    <div className="p-2.5 bg-red-50 rounded-xl text-[11px] text-red-800 italic">
                      Notes: {emg.responseNotes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${emg.residentPhone}`}
                      className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Resident
                    </a>

                    <button
                      onClick={() => setSelectedAlertForResolve(emg)}
                      className="flex-1 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition"
                    >
                      Resolve Incident
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historical Log */}
          {resolvedEmergencies.length > 0 && (
            <div className="pt-3">
              <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2">Resolved Incidents Log</h4>
              <div className="space-y-2">
                {resolvedEmergencies.map(r => (
                  <div key={r.id} className="p-3 bg-[#F1F9FC] rounded-2xl border border-gray-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{r.alertType}</span>
                      <p className="text-[11px] text-gray-500">{r.building} • {r.flatNumber}</p>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                      Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: PRE-APPROVED VISITORS */}
      {activeSubTab === 'PRE_APPROVED' && (
        <div className="space-y-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">Resident Pre-Approved Passes</h3>
            <p className="text-[11px] text-gray-400">Scheduled guests and delivery agents cleared in advance</p>
          </div>

          <div className="space-y-2.5">
            {preApprovedList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-gray-400">
                No active pre-approved GatePasses found.
              </div>
            ) : (
              preApprovedList.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{p.visitorName}</h4>
                      <p className="text-[11px] text-gray-500">
                        To Flat <strong>{p.flatNumber}</strong> ({p.residentName || 'Resident'})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#673AB7] bg-purple-50 px-2 py-0.5 rounded-md">
                      #{p.passCode}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Pre-Approved Clearance</span>
                    <button
                      onClick={() => onFastTrackCheckIn(p.id)}
                      className="px-3 py-1 bg-[#673AB7] text-white rounded-lg text-xs font-bold hover:bg-[#5E35B1] transition"
                    >
                      Fast Check-In
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: VISITOR HISTORY & AUDIT */}
      {activeSubTab === 'HISTORY' && (
        <div className="space-y-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">Gate Ingress & Exit Logs</h3>
            <p className="text-[11px] text-gray-400">Historical visitor movements with timestamps</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search visitor, plate, pass code..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
            />
          </div>

          {/* List */}
          <div className="space-y-2">
            {filteredHistory.map((v) => (
              <div key={v.id} className="p-3 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{v.visitorName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    v.status === 'INSIDE' ? 'bg-purple-100 text-[#673AB7]' :
                    v.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-600' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {v.status}
                  </span>
                </div>
                <div className="text-gray-500 text-[11px] flex items-center justify-between">
                  <span>Flat {v.flatNumber} ({v.category})</span>
                  <span className="font-mono text-gray-400">
                    {v.entryAt ? new Date(v.entryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: GUARD PROFILE & SETTINGS */}
      {activeSubTab === 'PROFILE' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-[#E6F1F5] shadow-xs text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-[#673AB7] font-black text-xl flex items-center justify-center mx-auto border-2 border-purple-200">
              {guardProfile.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">{guardProfile.fullName}</h3>
              <p className="text-xs text-gray-500">Badge #{guardProfile.badgeNumber} • {guardProfile.employeeId}</p>
              <p className="text-xs font-semibold text-[#673AB7] mt-1">{guardProfile.assignedSocietyName}</p>
              <p className="text-[11px] text-gray-400">{guardProfile.assignedGateName} • Shift: {guardProfile.shift}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#673AB7]" /> Operating Language
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${language === 'en' ? 'bg-[#673AB7] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${language === 'hi' ? 'bg-[#673AB7] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Terminal Status
              </span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                Authorized Station
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 bg-red-50 text-red-600 border border-red-200 font-extrabold text-xs rounded-2xl hover:bg-red-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Guard Duty Handover & Sign Out</span>
          </button>
        </div>
      )}

      {/* Resolve Alert Modal */}
      {selectedAlertForResolve && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 animate-scale-in">
            <h4 className="font-extrabold text-gray-900 text-sm mb-1">
              Resolve Incident: {selectedAlertForResolve.alertType}
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              {selectedAlertForResolve.building} - {selectedAlertForResolve.flatNumber}
            </p>

            <label className="block text-xs font-bold text-gray-700 mb-1">
              Response Remarks & Dispatch Summary *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Guard team reached spot; elevator technician attended; resident confirmed all passengers safe."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none mb-3"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAlertForResolve(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resolving || !resolutionNotes.trim()}
                onClick={handleConfirmResolveAlert}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {resolving ? 'Saving...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
