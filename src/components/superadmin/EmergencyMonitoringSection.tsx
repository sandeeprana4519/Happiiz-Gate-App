import React, { useState } from 'react';
import { GlobalEmergencyIncident } from '../../types/admin';
import {
  AlertOctagon,
  Flame,
  HeartPulse,
  Building,
  CheckCircle2,
  Phone,
  Clock,
  ShieldCheck,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import { resolveGlobalEmergency } from '../../services/firebase/superadmin.service';

interface EmergencyMonitoringSectionProps {
  incidents: GlobalEmergencyIncident[];
  onRefresh: () => void;
}

export const EmergencyMonitoringSection: React.FC<EmergencyMonitoringSectionProps> = ({
  incidents,
  onRefresh,
}) => {
  const [sirenEnabled, setSirenEnabled] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<GlobalEmergencyIncident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const activeIncidents = incidents.filter((i) => i.status === 'ACTIVE' || i.status === 'ESCALATED');
  const resolvedIncidents = incidents.filter((i) => i.status === 'RESOLVED');

  const handleResolve = async () => {
    if (!selectedIncident || !resolutionNotes.trim()) return;
    setResolving(true);
    try {
      await resolveGlobalEmergency(selectedIncident.id, resolutionNotes.trim());
      setSelectedIncident(null);
      setResolutionNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Siren Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Global Emergency Monitoring & Escalation Center
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Real-time SOS and panic events across all housing societies and commercial corporate parks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSirenEnabled(!sirenEnabled)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              sirenEnabled
                ? 'bg-red-500 text-white border-red-600 shadow-sm animate-pulse'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {sirenEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{sirenEnabled ? 'Platform Siren Active' : 'Siren Muted'}</span>
          </button>
        </div>
      </div>

      {/* Primary Responder Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Local Response Authority Rule</strong>
          The Platform Master Control Center monitors high-level SLAs and escalation metrics. Local on-duty Security Guards and Society Managing Committees remain the authoritative primary responders.
        </div>
      </div>

      {/* Active Alerts Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
            Live Escalations & Active Incidents ({activeIncidents.length})
          </h3>
          {activeIncidents.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 animate-pulse">
              Attention Required
            </span>
          )}
        </div>

        {activeIncidents.length === 0 ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            All premises and societies secure. Zero active SOS panic alerts across the platform.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white rounded-2xl border-2 border-red-400 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">{inc.alertType} Alert</h4>
                      <p className="text-[11px] text-gray-500 font-semibold">{inc.societyName}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase animate-pulse">
                    {inc.status}
                  </span>
                </div>

                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Location</span>
                    <span className="font-bold text-gray-800">{inc.buildingName} • {inc.flatNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Reported At</span>
                    <span className="font-mono text-gray-700">{new Date(inc.alertTime).toLocaleTimeString()}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between text-gray-700 pt-1 border-t border-red-100">
                    <span>Reported by: <strong>{inc.reportedByName}</strong></span>
                    <span className="font-mono text-[11px]">{inc.reportedByPhone}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setResolutionNotes('');
                    }}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#673AB7] text-white hover:bg-[#5E35B1] transition shadow-xs cursor-pointer"
                  >
                    Escalation Notes & Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Resolved Alerts */}
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-3">
          Recently Resolved Security Incidents ({resolvedIncidents.length})
        </h3>
        <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6F1F5] bg-[#F1F9FC] text-[11px] font-extrabold text-[#A9B0B8] uppercase">
                  <th className="py-2.5 px-4">Alert Type</th>
                  <th className="py-2.5 px-4">Society / Location</th>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Resolved By</th>
                  <th className="py-2.5 px-4">Resolution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F1F5]">
                {resolvedIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-purple-50/20">
                    <td className="py-3 px-4 font-bold text-gray-900">
                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                        {inc.alertType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{inc.societyName}</div>
                      <div className="text-[11px] text-gray-400">{inc.buildingName} • {inc.flatNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                      {new Date(inc.alertTime).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700">
                      {inc.resolvedBy || 'Chief Guard'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-sm truncate" title={inc.escalationNotes}>
                      {inc.escalationNotes || 'Premises secured.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Resolution Notes Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Resolve Emergency Incident</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter mandatory investigation and resolution debrief for <strong className="text-gray-800">{selectedIncident.alertType}</strong> at {selectedIncident.societyName}.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resolution / Investigation Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Elevator mechanical technician rectified sensor. All occupants safely evacuated without injury..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!resolutionNotes.trim() || resolving}
                  onClick={handleResolve}
                  className="px-4 py-2 bg-[#673AB7] disabled:opacity-50 text-white rounded-xl text-xs font-bold hover:bg-[#5E35B1] transition cursor-pointer"
                >
                  {resolving ? 'Recording...' : 'Mark Incident Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
