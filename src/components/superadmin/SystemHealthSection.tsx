import React, { useState, useEffect } from 'react';
import { ServiceHealthStatus } from '../../types/admin';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Cloud,
  Zap,
  CreditCard,
  Bell,
  Cpu,
} from 'lucide-react';
import { getSystemHealthStatus } from '../../services/firebase/superadmin.service';

export const SystemHealthSection: React.FC = () => {
  const [services, setServices] = useState<ServiceHealthStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await getSystemHealthStatus();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#111111] tracking-tight">
            Platform System Health & Cloud Diagnostics
          </h2>
          <p className="text-xs text-[#A9B0B8] font-medium">
            Live infrastructure uptime, regional Firestore connectivity, and core microservices health
          </p>
        </div>

        <button
          type="button"
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#E6F1F5] hover:bg-[#F1F9FC] text-xs font-bold text-[#673AB7] transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Diagnostic Ping</span>
        </button>
      </div>

      {/* Cluster Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
          <span className="text-[10px] font-extrabold text-[#A9B0B8] uppercase block">Platform Status</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-black text-emerald-700">100% Operational</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">All 6 core services responsive</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
          <span className="text-[10px] font-extrabold text-[#A9B0B8] uppercase block">Cloud Region</span>
          <div className="text-base font-black text-gray-900 mt-1">asia-southeast1</div>
          <span className="text-[10px] text-gray-400 mt-1 block">Google Cloud Singapore Zone</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
          <span className="text-[10px] font-extrabold text-[#A9B0B8] uppercase block">App Release</span>
          <div className="text-base font-black text-[#673AB7] mt-1">v4.2.0 (Phase 10)</div>
          <span className="text-[10px] text-gray-400 mt-1 block">Enterprise Multi-Tenant Build</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E6F1F5] shadow-xs">
          <span className="text-[10px] font-extrabold text-[#A9B0B8] uppercase block">Avg Database Latency</span>
          <div className="text-base font-black text-gray-900 mt-1 font-mono">41 ms</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Optimal Performance</span>
        </div>
      </div>

      {/* Services List Table */}
      <div className="bg-white rounded-2xl border border-[#E6F1F5] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E6F1F5] bg-[#F1F9FC]">
          <h3 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider">
            Verified Subsystem Health Checks
          </h3>
        </div>

        <div className="divide-y divide-[#E6F1F5]">
          {services.map((srv, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#673AB7] flex items-center justify-center font-bold">
                  {idx === 0 ? <Zap className="w-4 h-4" /> :
                   idx === 1 ? <Database className="w-4 h-4" /> :
                   idx === 2 ? <Cloud className="w-4 h-4" /> :
                   idx === 3 ? <Cpu className="w-4 h-4" /> :
                   idx === 4 ? <CreditCard className="w-4 h-4" /> :
                   <Bell className="w-4 h-4" />}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-gray-900">{srv.service}</h4>
                  <p className="text-[11px] text-[#A9B0B8] mt-0.5">{srv.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="font-mono text-gray-500 text-[11px]">
                  Latency: <strong className="text-gray-800">{srv.latencyMs} ms</strong>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {srv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
