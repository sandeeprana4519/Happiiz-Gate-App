/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headset,
  Ticket,
  Building2,
  Bell,
  UserCircle2,
  Search,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  WifiOff,
  LogOut,
  Download,
  RefreshCw,
  ArrowUpRight,
  MessageSquare,
  Phone,
  Mail,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SupportTicket, PlatformNotification } from '../../types/admin';
import { Society } from '../../types/society';
import {
  getSupportTickets,
  updateSupportTicket,
  getAllSocieties,
  getPlatformNotifications,
} from '../../services/firebase/superadmin.service';
import { usePWAInstall } from '../../hooks/usePWAInstall';

type SupporterTab = 'tickets' | 'societies' | 'alerts' | 'profile';
type TicketStatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export const DigitalSupporterDashboard: React.FC = () => {
  const { user, logout, activeMembership } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<SupporterTab>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Ticket Filtering & Detail Drawer
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [tktList, socList, notifList] = await Promise.all([
        getSupportTickets(),
        getAllSocieties(),
        getPlatformNotifications(),
      ]);
      setTickets(tktList);
      setSocieties(socList);
      setNotifications(notifList);
      if (selectedTicket) {
        const updatedMatch = tktList.find((t) => t.id === selectedTicket.id);
        if (updatedMatch) setSelectedTicket(updatedMatch);
      }
    } catch (err) {
      console.error('[DigitalSupporter] Failed loading workspace data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const assignedSocietyIds = useMemo(() => {
    if (user?.assignedSocieties && user.assignedSocieties.length > 0) {
      return user.assignedSocieties;
    }
    return [];
  }, [user]);

  const scopedSocieties = useMemo(() => {
    if (assignedSocietyIds.length === 0) return societies;
    return societies.filter((s) => assignedSocietyIds.includes(s.id));
  }, [societies, assignedSocietyIds]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (
        assignedSocietyIds.length > 0 &&
        t.societyId &&
        !assignedSocietyIds.includes(t.societyId) &&
        t.assignedTo !== user?.uid
      ) {
        return false;
      }
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.submittedByName.toLowerCase().includes(q) ||
        (t.societyName || '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [tickets, statusFilter, searchQuery, assignedSocietyIds, user?.uid]);

  const metrics = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const critical = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED').length;
    return { open, inProgress, resolved, critical };
  }, [tickets]);

  const handleUpdateSelectedTicket = async (
    newStatus: SupportTicket['status'],
    customReply?: string,
    customInternalNote?: string
  ) => {
    if (!selectedTicket) return;
    setSubmittingAction(true);
    try {
      await updateSupportTicket(
        selectedTicket.id,
        newStatus,
        customReply?.trim() || undefined,
        customInternalNote?.trim() || undefined
      );
      setReplyText('');
      setInternalNoteText('');
      await loadData(true);
      showToast(`Ticket #${selectedTicket.ticketNumber} updated to ${newStatus}.`);
    } catch (err) {
      showToast('Unable to update ticket right now. Check connection.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const priorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const statusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col pb-20">
      {/* Top Indigo PWA Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#0E7490] text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Headset className="w-5 h-5 text-cyan-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                  Happiiz Digital Supporter
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/30 text-[10px] font-bold uppercase tracking-wider text-cyan-100 shrink-0">
                  {user?.digitalSupporterTier || 'Field Support'}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 truncate">
                {user?.fullName || 'Digital Supporter'} ·{' '}
                {activeMembership?.societyName || 'Multi-Society Helpdesk'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadData(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh queue"
              aria-label="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Offline / Toast Banners */}
        {isOffline && (
          <div className="bg-amber-500 text-slate-950 text-xs font-bold px-4 py-1.5 flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            Offline Mode Active — Showing locally cached tickets & society contacts.
          </div>
        )}
      </header>

      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-cyan-400/30 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Mobile-First Workspace Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* KPI Strip */}
        <section className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Open
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-600 tabular-nums">
              {metrics.open}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-indigo-600 tabular-nums">
              {metrics.inProgress}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Resolved
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 tabular-nums">
              {metrics.resolved}
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Critical
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-600 tabular-nums">
              {metrics.critical}
            </span>
          </div>
        </section>

        {/* TAB 1: ASSIGNED SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <section className="space-y-3">
            {/* Search & Filters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticket #, society, resident, category..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as TicketStatusFilter[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Tickets'
                      : st === 'IN_PROGRESS'
                      ? 'In Progress'
                      : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
                Loading assigned support tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center space-y-2 border border-slate-200">
                <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No Matching Support Tickets</p>
                <p className="text-xs text-slate-500">
                  Tickets matching your filter criteria will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full text-left bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-xs transition-all space-y-2.5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-blue-700">
                            #{ticket.ticketNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${priorityBadge(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadge(
                              ticket.status
                            )}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {ticket.subject}
                        </h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="truncate font-medium">
                        {ticket.societyName || 'General Society'} · {ticket.submittedByName}
                      </span>
                      <span className="shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: SOCIETY ASSISTANCE QUEUE */}
        {activeTab === 'societies' && (
          <section className="space-y-2.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Society Assistance Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Active communities supported by your Digital Supporter assignment
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">
                {scopedSocieties.length} Active
              </span>
            </div>

            {scopedSocieties.map((soc) => (
              <div
                key={soc.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {soc.societyName || soc.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-slate-700">
                        {soc.societyCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {soc.city}, {soc.state} · {soc.totalFlats || 0} Flats · {soc.totalGates || 0}{' '}
                      Gates
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      soc.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {soc.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {soc.contactPhone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      {soc.contactPhone}
                    </span>
                  )}
                  {soc.contactEmail && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      {soc.contactEmail}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* TAB 3: NOTIFICATIONS & ALERTS */}
        {activeTab === 'alerts' && (
          <section className="space-y-2.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h2 className="text-sm font-extrabold text-slate-900">
                Platform Alerts & Escalations
              </h2>
              <p className="text-xs text-slate-500">
                Operational announcements and ticket priority broadcasts
              </p>
            </div>
            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                No active support alerts right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{n.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        n.priority === 'EMERGENCY'
                          ? 'bg-red-100 text-red-700'
                          : n.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {n.priority || 'NORMAL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Audience: {n.targetAudience}</span>
                    <span>{new Date(n.sentAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* TAB 4: PROFILE & PWA INSTALL GUIDE */}
        {activeTab === 'profile' && (
          <section className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#0891B2] text-white font-extrabold text-lg flex items-center justify-center">
                  {(user?.fullName || 'D').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {user?.fullName || 'Digital Supporter'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {user?.email || user?.phoneNumber}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" /> Verified Digital Supporter PWA
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">PWA Scope</span>
                  <span className="font-mono font-bold text-slate-900">/supporter/</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Install Status</span>
                  <span className="font-bold text-emerald-600">
                    {isInstalled ? 'Installed Standalone App' : 'Browser Mode'}
                  </span>
                </div>
              </div>

              {!isInstalled && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>Install Happiiz Supporter on Home Screen</span>
                  </div>
                  {isInstallable ? (
                    <button
                      type="button"
                      onClick={() => install()}
                      className="w-full py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-900 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Install Supporter App
                    </button>
                  ) : isIOS ? (
                    <button
                      type="button"
                      onClick={() => setShowIOSGuide((v) => !v)}
                      className="w-full py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold cursor-pointer"
                    >
                      View iPhone / iPad Safari Install Steps
                    </button>
                  ) : (
                    <p className="text-[11px] text-blue-800">
                      Use your browser menu &rarr; &ldquo;Install App&rdquo; or &ldquo;Add to Home Screen&rdquo; to install this standalone supporter app.
                    </p>
                  )}

                  {showIOSGuide && (
                    <p className="text-[11px] text-blue-900 bg-white rounded-xl p-3 border border-blue-100">
                      1. Tap the <strong>Share</strong> icon in Safari.<br />
                      2. Scroll and tap <strong>Add to Home Screen</strong>.<br />
                      3. Confirm &ldquo;Happiiz Supporter&rdquo;.
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Securely
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Ticket Resolution Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700">
                    #{selectedTicket.ticketNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadge(
                      selectedTicket.status
                    )}`}
                  >
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {selectedTicket.subject}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedTicket.societyName || 'General'} · {selectedTicket.submittedByName} (
                  {selectedTicket.submittedByPhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                aria-label="Close ticket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                {selectedTicket.description}
              </div>

              {/* Conversation Thread */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Response Thread
                  </h4>
                  {selectedTicket.replies.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-blue-800">
                        <span>
                          {r.senderName} ({r.senderRole})
                        </span>
                        <span>{new Date(r.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Supporter Reply Form */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-800">
                  Reply to Society / Resident
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write troubleshooting steps or resolution update..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-blue-600"
                />
                <input
                  type="text"
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  placeholder="Optional internal audit note..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() =>
                  handleUpdateSelectedTicket('IN_PROGRESS', replyText, internalNoteText)
                }
                className="py-2.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                In Progress
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() =>
                  handleUpdateSelectedTicket(
                    'OPEN',
                    replyText || 'Escalated for Super Admin technical review.',
                    internalNoteText || 'Escalated by Digital Supporter'
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Escalate
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() =>
                  handleUpdateSelectedTicket(
                    'RESOLVED',
                    replyText || 'Issue resolved and verified by Digital Supporter.',
                    internalNoteText
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-3xl mx-auto grid grid-cols-4 h-16">
          {(
            [
              { id: 'tickets', label: 'Tickets', icon: Ticket, badge: metrics.open },
              { id: 'societies', label: 'Societies', icon: Building2 },
              { id: 'alerts', label: 'Alerts', icon: Bell, badge: metrics.critical },
              { id: 'profile', label: 'Profile', icon: UserCircle2 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer ${
                  active ? 'text-[#1E3A8A]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[#1D4ED8]' : ''}`} />
                <span>{item.label}</span>
                {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute top-2 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DigitalSupporterDashboard;
