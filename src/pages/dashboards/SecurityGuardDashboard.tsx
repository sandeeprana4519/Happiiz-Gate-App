/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GuardHeader } from '../../components/layout/GuardHeader';
import { GuardTopNav, GuardNavTab } from '../../components/layout/GuardTopNav';
import { VisitorCodeInput } from '../../components/common/VisitorCodeInput';
import { Modal } from '../../components/common/Modal';
import { NumericKeypad } from '../../components/common/NumericKeypad';
import { VisitorCategoryCard } from '../../components/common/VisitorCategoryCard';
import { GuestIllustration3D } from '../../components/illustrations/GuestIllustration3D';
import { DeliveryIllustration3D } from '../../components/illustrations/DeliveryIllustration3D';
import { ServiceIllustration3D } from '../../components/illustrations/ServiceIllustration3D';
import { CabIllustration3D } from '../../components/illustrations/CabIllustration3D';
import { GuardOfflineBanner } from '../../components/guard/GuardOfflineBanner';
import { GuardBottomNav, GuardBottomTab } from '../../components/guard/GuardBottomNav';
import { GuardVisitorEntryModal } from '../../components/guard/GuardVisitorEntryModal';
import { GuardQRScannerModal } from '../../components/guard/GuardQRScannerModal';
import { GuardWaitingView } from '../../components/guard/GuardWaitingView';
import { GuardInsideView } from '../../components/guard/GuardInsideView';
import { GuardDirectoryView } from '../../components/guard/GuardDirectoryView';
import { GuardAlertsAndProfileView } from '../../components/guard/GuardAlertsAndProfileView';
import { GuardPreApprovedView } from '../../components/guard/GuardPreApprovedView';
import { guardService } from '../../services/firebase/guard.service';
import { syncBus } from '../../services/firebase/sync.service';
import { soundAlert } from '../../utils/soundAlert';
import { 
  GuardVisitor, 
  GuardKPIStats, 
  VisitorCategoryType, 
  ResidentMessageToGuard, 
  GuardEmergencyAlert, 
  GuardResidentDirectoryItem,
  GuardProfileInfo 
} from '../../types/guard';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  UserCheck,
  Car,
  Truck,
  Phone,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SecurityGuardDashboard: React.FC = () => {
  const { user, logout, activeMembership } = useAuth();
  const navigate = useNavigate();

  // Guard Terminal Identity & Assigned Gate
  const assignedGateFromAuth = activeMembership?.gateAssigned || (user as any)?.gateAssigned;
  const storageKey = 'hpz_active_gate_' + (user?.uid || 'guard');
  const [activeGate, setActiveGate] = useState<string>(() => {
    return localStorage.getItem(storageKey) || assignedGateFromAuth || 'Gate #1 (North Main)';
  });
  const societyId = user?.societyId || activeMembership?.societyId || 'soc_emerald_heights';
  const guardProfile: GuardProfileInfo = guardService.getGuardSession({
    ...user,
    gateAssigned: activeGate,
    societyId,
  });

  const handleSelectGate = (gate: string) => {
    setActiveGate(gate);
    localStorage.setItem(storageKey, gate);
  };

  // Active Navigation Tab: 'home' | 'waiting' | 'inside' | 'directory' | 'alerts' | 'preapproved'
  const [activeTab, setActiveTab] = useState<GuardBottomTab | 'preapproved'>('home');

  // Keypad & Pass Verification State
  const [enteredCode, setEnteredCode] = useState('');
  const [keypadError, setKeypadError] = useState<string | null>(null);
  const [verifiedVisitor, setVerifiedVisitor] = useState<GuardVisitor | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedVisitorCategory, setSelectedVisitorCategory] = useState<VisitorCategoryType | null>(null);

  // Data Store
  const [visitors, setVisitors] = useState<GuardVisitor[]>([]);
  const [kpiStats, setKpiStats] = useState<GuardKPIStats | null>(null);
  const [messages, setMessages] = useState<ResidentMessageToGuard[]>([]);
  const [emergencies, setEmergencies] = useState<GuardEmergencyAlert[]>([]);
  const [directory, setDirectory] = useState<GuardResidentDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all live guard station data
  const loadData = useCallback(async () => {
    try {
      const [vList, stats, msgList, emgList, dirList] = await Promise.all([
        guardService.getAllVisitors(societyId),
        guardService.getGuardKPIStats(societyId, 'gate_1'),
        guardService.getResidentMessages(societyId),
        guardService.getEmergencyAlerts(societyId),
        guardService.getResidentDirectory(societyId),
      ]);
      setVisitors(vList);
      setKpiStats(stats);
      setMessages(msgList);
      setEmergencies(emgList);
      setDirectory(dirList);
    } catch (err) {
      console.error('[GuardDashboard] Failed to fetch live data:', err);
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    loadData();
    // Real-time sync bus subscription for instant cross-tab / cross-window updates
    const unsubscribeSync = syncBus.subscribeAll((event) => {
      if (event.societyId === societyId || event.societyId === 'all') {
        loadData();
      }
    });

    // Real-time polling fallback interval
    const interval = setInterval(() => {
      loadData();
    }, 8000);

    return () => {
      clearInterval(interval);
      unsubscribeSync();
    };
  }, [loadData, societyId]);

  // Handle keypad digit input
  const handleDigitPress = (digit: string) => {
    setKeypadError(null);
    if (enteredCode.length < 6) {
      const nextCode = enteredCode + digit;
      setEnteredCode(nextCode);

      if (nextCode.length === 6) {
        handleVerifyCode(nextCode);
      }
    }
  };

  const handleDeletePress = () => {
    setKeypadError(null);
    setEnteredCode((prev) => prev.slice(0, -1));
  };

  const handleVerifyCode = async (codeToVerify: string) => {
    setVerifyingCode(true);
    setKeypadError(null);
    try {
      const result = await guardService.verifyVisitorOtp(societyId, codeToVerify);
      if (result.success && result.visitor) {
        soundAlert.playApprovalChime();
        setVerifiedVisitor(result.visitor);
        setShowVerifyModal(true);
      } else {
        setKeypadError(result.message);
      }
    } catch (err: any) {
      setKeypadError(err?.message || 'Verification failed. Please retry.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // Grant entry & open barrier
  const handleApproveEntry = async () => {
    if (!verifiedVisitor) return;
    try {
      await guardService.grantVisitorEntry(societyId, verifiedVisitor.id, guardProfile.fullName);
      soundAlert.playApprovalChime();
      setShowVerifyModal(false);
      setVerifiedVisitor(null);
      setEnteredCode('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to grant clearance.');
    }
  };

  // Handle new visitor submission from category modal
  const handleNewVisitorSubmit = async (data: any) => {
    try {
      await guardService.createVisitorEntry(societyId, activeGate, guardProfile.fullName, {
        category: data.category,
        visitorName: data.visitorName,
        visitorPhone: data.visitorPhone,
        building: data.building,
        flatNumber: data.flatNumber,
        numberOfVisitors: data.numberOfVisitors,
        purpose: data.purpose,
        photoUrl: data.photoUrl,
        deliveryCompany: data.deliveryCompany,
        deliveryType: data.deliveryType,
        packageDescription: data.packageDescription,
        serviceCompany: data.serviceCompany,
        serviceCategory: data.serviceCategory,
        cabCompany: data.cabCompany,
        cabVehiclePlate: data.cabVehiclePlate,
        cabPassengers: data.cabPassengers,
        autoApprove: data.category === 'Cab',
      });
      setSelectedVisitorCategory(null);
      await loadData();
      soundAlert.playApprovalChime();
    } catch (err: any) {
      alert('Error creating visitor entry: ' + (err.message || 'Unknown error'));
    }
  };

  // Action handlers
  const handleAllowEntryDirect = async (visitorId: string) => {
    await guardService.grantVisitorEntry(societyId, visitorId, guardProfile.fullName);
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleSimulateDecision = async (visitorId: string, action: 'APPROVE' | 'DENY') => {
    await guardService.simulateResidentResponse(societyId, visitorId, action);
    await loadData();
  };

  const handleAdminOverride = async (visitorId: string, reason: string) => {
    await guardService.adminOverrideApproval(
      societyId,
      visitorId,
      reason,
      `${guardProfile.fullName} (Supervisor Override)`
    );
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleCheckOut = async (visitorId: string, exitGate: string, guardName: string) => {
    await guardService.checkOutVisitor(societyId, visitorId, exitGate, guardName);
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleAcknowledgeEmergency = async (alertId: string) => {
    await guardService.acknowledgeEmergencyAlert(societyId, alertId, guardProfile.fullName);
    await loadData();
  };

  const handleResolveEmergency = async (alertId: string, notes: string) => {
    await guardService.resolveEmergencyAlert(societyId, alertId, notes);
    await loadData();
  };

  const handleFastTrackCheckIn = async (visitorId: string) => {
    await guardService.grantVisitorEntry(societyId, visitorId, guardProfile.fullName);
    soundAlert.playApprovalChime();
    await loadData();
  };

  const handleMarkMessageRead = async (messageId: string) => {
    await guardService.markMessageAsRead(societyId, messageId);
    await loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Map top nav tabs to bottom nav views
  const handleTopNavChange = (tab: GuardNavTab) => {
    if (tab === 'home') setActiveTab('home');
    else if (tab === 'preapproved') setActiveTab('preapproved');
    else if (tab === 'inout') setActiveTab('inside');
    else if (tab === 'message') setActiveTab('directory');
  };

  const waitingVisitorsCount = visitors.filter((v) => v.status === 'WAITING_APPROVAL').length;
  const insideVisitorsCount = visitors.filter((v) => v.status === 'INSIDE').length;
  const activeEmergenciesCount = emergencies.filter((e) => e.status !== 'RESOLVED').length;
  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;
  const preApprovedList = visitors.filter((v) => v.isPreApproved || v.status === 'APPROVED');

  return (
    <div className="w-full max-w-full select-none relative font-sans antialiased min-h-screen pb-20 sm:pb-22 overflow-x-hidden bg-[#FFFFFF] text-[#111111] no-scrollbar">
      {/* 1. STICKY OFFLINE BANNER */}
      <GuardOfflineBanner />

      {/* 2. BLACK HEADER (Gate Name + Notification Bell + Switch Gate / Handover Menu) */}
      <GuardHeader
        gateName={activeGate}
        onSelectGate={handleSelectGate}
        unreadCount={activeEmergenciesCount + unreadMessagesCount}
        emergenciesCount={activeEmergenciesCount}
        messagesCount={unreadMessagesCount}
        onNotificationPress={() => setActiveTab('alerts')}
      />

      {/* 3. TOP NAVIGATION (Home, Pre-App, In-Out, Message) */}
      <GuardTopNav
        activeTab={
          activeTab === 'home'
            ? 'home'
            : activeTab === 'preapproved'
            ? 'preapproved'
            : activeTab === 'inside'
            ? 'inout'
            : 'message'
        }
        onTabChange={handleTopNavChange}
        preApprovedCount={preApprovedList.length}
        inOutCount={insideVisitorsCount}
        unreadMessagesCount={unreadMessagesCount}
      />

      <main
        className={`w-full max-w-lg mx-auto min-w-0 px-3 sm:px-4 no-scrollbar ${
          activeTab === 'home'
            ? 'py-2 sm:py-3 space-y-4 sm:space-y-5'
            : 'pt-2 pb-6 overflow-x-hidden'
        }`}
      >
        {/* ======================================================== */}
        {/* TAB 1: HOME (Add Visitor, Code Box & Numeric Keypad)     */}
        {/* ======================================================== */}
        {activeTab === 'home' && (
          <div className="flex flex-col animate-fade-in w-full min-w-0 space-y-3.5 sm:space-y-4 pt-1 pb-4">
            {/* 1. ADD NEW VISITOR SECTION (Directly below header) */}
            <section className="space-y-2 w-full min-w-0">
              <div className="flex items-center justify-between px-0.5">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#111111] tracking-wider uppercase">
                  ADD NEW VISITOR
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedVisitorCategory('Guest')}
                  className="text-xs sm:text-sm font-bold text-[#673AB7] hover:underline cursor-pointer"
                >
                  Fast Register
                </button>
              </div>

              {/* 4 Visitor Cards in ONE SINGLE ROW on mobile: Guest | Delivery | Service | Cab */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full min-w-0">
                <VisitorCategoryCard
                  title="Guest"
                  illustration={<GuestIllustration3D size={38} />}
                  onClick={() => setSelectedVisitorCategory('Guest')}
                />
                <VisitorCategoryCard
                  title="Delivery"
                  illustration={<DeliveryIllustration3D size={38} />}
                  onClick={() => setSelectedVisitorCategory('Delivery')}
                />
                <VisitorCategoryCard
                  title="Service"
                  illustration={<ServiceIllustration3D size={38} />}
                  onClick={() => setSelectedVisitorCategory('Service')}
                />
                <VisitorCategoryCard
                  title="Cab"
                  illustration={<CabIllustration3D size={38} />}
                  onClick={() => setSelectedVisitorCategory('Cab')}
                />
              </div>
            </section>

            {/* 2. SIX-DIGIT VISITOR CODE BOX */}
            <VisitorCodeInput code={enteredCode} length={6} />

            {/* Error / Rate Limiting Alert */}
            {keypadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 shrink-0 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="truncate">{keypadError}</span>
              </div>
            )}

            {verifyingCode && (
              <div className="text-center text-xs font-bold text-[#673AB7] flex items-center justify-center gap-2 py-1 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#673AB7] animate-ping" />
                Verifying digital gate code...
              </div>
            )}

            {/* 3. NUMERIC KEYPAD (3 Columns: 1-9, QR in Purple, 0, Delete) */}
            <div className="w-full flex justify-center py-1">
              <NumericKeypad
                onDigitPress={handleDigitPress}
                onDeletePress={handleDeletePress}
                onQrPress={() => setShowQrModal(true)}
                disabled={verifyingCode}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1.5: PRE-APPROVED (Resident Pre-Approved Passes)     */}
        {/* ======================================================== */}
        {activeTab === 'preapproved' && (
          <div className="pt-2 animate-fade-in w-full min-w-0">
            <GuardPreApprovedView
              visitors={visitors}
              onFastTrackCheckIn={handleFastTrackCheckIn}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: WAITING (Live Approval Queue & Resident Decision) */}
        {/* ======================================================== */}
        {activeTab === 'waiting' && (
          <div className="pt-2 animate-fade-in w-full min-w-0">
            <GuardWaitingView
              visitors={visitors}
              onAllowEntry={handleAllowEntryDirect}
              onSimulateDecision={handleSimulateDecision}
              onAdminOverride={handleAdminOverride}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: INSIDE / IN-OUT (In & Out Tabs + Exit Logs)       */}
        {/* ======================================================== */}
        {activeTab === 'inside' && (
          <div className="pt-2 animate-fade-in w-full min-w-0">
            <GuardInsideView
              visitors={visitors}
              activeGate={activeGate}
              guardName={guardProfile.fullName}
              onCheckOut={handleCheckOut}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DIRECTORY & MESSAGES (Safe Resident Phonebook) */}
        {/* ======================================================== */}
        {activeTab === 'directory' && (
          <div className="pt-2 animate-fade-in w-full min-w-0">
            <GuardDirectoryView
              directory={directory}
              messages={messages}
              onMarkMessageRead={handleMarkMessageRead}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SOS ALERTS & PROFILE */}
        {/* ======================================================== */}
        {activeTab === 'alerts' && (
          <div className="pt-2 animate-fade-in w-full min-w-0">
            <GuardAlertsAndProfileView
              emergencies={emergencies}
              visitors={visitors}
              guardProfile={guardProfile}
              onAcknowledgeEmergency={handleAcknowledgeEmergency}
              onResolveEmergency={handleResolveEmergency}
              onFastTrackCheckIn={handleFastTrackCheckIn}
              onLogout={handleLogout}
            />
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. MOBILE BOTTOM NAVIGATION (5 TABS + FLOATING QR SCANNER) */}
      {/* ======================================================== */}
      <GuardBottomNav
        activeTab={activeTab === 'preapproved' ? 'alerts' : activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        waitingCount={waitingVisitorsCount}
        insideCount={insideVisitorsCount}
        activeEmergenciesCount={activeEmergenciesCount}
        onQrPress={() => setShowQrModal(true)}
      />

      {/* ======================================================== */}
      {/* 5. VERIFIED PASS CLEARANCE MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setVerifiedVisitor(null);
          setEnteredCode('');
        }}
        title="Visitor Pass Verification"
        description="Verify visitor credentials before raising gate barrier"
        maxWidth="sm"
      >
        {verifiedVisitor && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A9B0B8] uppercase">
                  Pass Code #{verifiedVisitor.passCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {verifiedVisitor.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {verifiedVisitor.photoUrl ? (
                  <img
                    src={verifiedVisitor.photoUrl}
                    alt={verifiedVisitor.visitorName}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#E6F1F5] shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#E6F1F5] flex items-center justify-center font-bold text-lg text-[#673AB7] shrink-0">
                    {verifiedVisitor.visitorName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">
                    {verifiedVisitor.visitorName}
                  </h3>
                  <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5] mt-0.5">
                    {verifiedVisitor.category}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E6F1F5] space-y-1 text-xs">
                <p className="text-[#64748B]">
                  Destination:{' '}
                  <strong className="text-[#111111]">
                    {verifiedVisitor.building} - Flat {verifiedVisitor.flatNumber}
                  </strong>
                </p>
                {verifiedVisitor.residentName && (
                  <p className="text-[#64748B]">
                    Host Resident: <strong className="text-[#111111]">{verifiedVisitor.residentName}</strong>
                  </p>
                )}
                {verifiedVisitor.visitorPhone && (
                  <p className="text-[#64748B]">
                    Visitor Phone: <strong className="text-[#111111]">{verifiedVisitor.visitorPhone}</strong>
                  </p>
                )}
                {verifiedVisitor.cabVehiclePlate && (
                  <p className="text-[#64748B]">
                    Vehicle Plate: <strong className="text-[#111111]">{verifiedVisitor.cabVehiclePlate}</strong>
                  </p>
                )}
                {verifiedVisitor.deliveryCompany && (
                  <p className="text-[#64748B]">
                    Delivery: <strong className="text-[#111111]">{verifiedVisitor.deliveryCompany}</strong>
                  </p>
                )}
                <p className="text-[#64748B]">
                  Purpose: <strong className="text-[#111111]">{verifiedVisitor.purpose}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifiedVisitor(null);
                  setEnteredCode('');
                }}
                className="flex-1 py-3 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveEntry}
                className="flex-1 py-3 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] shadow-[0_4px_12px_rgba(103,58,183,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Grant Entry & Open Barrier</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 6. QR SCANNER MODAL */}
      {/* ======================================================== */}
      <GuardQRScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onVerifyToken={(token) => guardService.verifyQrToken(societyId, token)}
        onAllowEntry={async (visitorId) => {
          await handleAllowEntryDirect(visitorId);
          setShowQrModal(false);
        }}
      />

      {/* ======================================================== */}
      {/* 7. VISITOR REGISTRATION MODAL (Guest, Delivery, Service, Cab) */}
      {/* ======================================================== */}
      {selectedVisitorCategory && (
        <GuardVisitorEntryModal
          isOpen={Boolean(selectedVisitorCategory)}
          onClose={() => setSelectedVisitorCategory(null)}
          initialCategory={selectedVisitorCategory}
          onSubmit={handleNewVisitorSubmit}
          societyBuildings={['Tower A', 'Tower B', 'Tower C', 'Wing D']}
        />
      )}
    </div>
  );
};
