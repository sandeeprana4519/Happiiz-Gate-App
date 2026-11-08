/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  MoreVertical,
  LogOut,
  MapPin,
  Building,
  ShieldCheck,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  Radio,
  Clock,
  MessageSquare,
  ShieldAlert,
  Camera,
  Layers,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSocietyById } from '../../services/firebase/firestore.service';
import { getSocietyGates } from '../../services/firebase/societyAdmin.service';
import { Society } from '../../types/society';
import { SocietyGate } from '../../types/societyAdmin';

interface GuardHeaderProps {
  gateName: string;
  onSelectGate?: (gate: string) => void;
  unreadCount?: number;
  onNotificationPress?: () => void;
  emergenciesCount?: number;
  messagesCount?: number;
}

export const GuardHeader: React.FC<GuardHeaderProps> = ({
  gateName,
  onSelectGate,
  unreadCount = 0,
  onNotificationPress,
  emergenciesCount = 0,
  messagesCount = 0,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [societyDetails, setSocietyDetails] = useState<Society | null>(null);
  const [societyGates, setSocietyGates] = useState<SocietyGate[]>([]);
  const [loadingGates, setLoadingGates] = useState(true);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const { logout, user, activeMembership } = useAuth();
  const navigate = useNavigate();

  const societyId = user?.societyId || activeMembership?.societyId || 'soc_emerald_heights';
  const societyName =
    activeMembership?.societyName ||
    user?.societyName ||
    societyDetails?.societyName ||
    'Emerald Heights Luxury Enclave';

  // Fetch actual society details & registered gates dynamically from Firebase
  useEffect(() => {
    let isMounted = true;
    if (societyId) {
      // 1. Fetch society document
      getSocietyById(societyId).then((data) => {
        if (isMounted && data) {
          setSocietyDetails(data);
        }
      });

      // 2. Fetch all registered gates under that society
      getSocietyGates(societyId)
        .then((gatesList) => {
          if (isMounted) {
            setSocietyGates(gatesList);
            setLoadingGates(false);
          }
        })
        .catch((err) => {
          console.error('[GuardHeader] Failed to load society gates:', err);
          if (isMounted) setLoadingGates(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [societyId]);

  // Handle escape key to dismiss open sheets/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setShowNotificationPanel(false);
        setShowLogoutConfirm(false);
      }
    };
    if (showMenu || showNotificationPanel || showLogoutConfirm) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMenu, showNotificationPanel, showLogoutConfirm]);

  const hasActiveDeployment = Boolean(
    (activeMembership && activeMembership.membershipStatus === 'ACTIVE') ||
      user?.accountStatus === 'ACTIVE' ||
      user?.primaryRole === 'SECURITY_GUARD'
  );

  const guardName = user?.displayName || user?.fullName || 'Bahadur Singh';
  const guardPhone = user?.phoneNumber || '+91 98765 00010';
  const guardBadge = (user as any)?.badgeNumber || (user as any)?.employmentId || 'EMP-SEC-01';

  const societyAddress = societyDetails?.address
    ? `${societyDetails.address}, ${societyDetails.city || ''}`
    : 'Bellandur Ring Road, Bengaluru';

  // Determine which gates the logged-in guard is assigned or authorized for
  const assignedGateFromAuth = activeMembership?.gateAssigned || (user as any)?.gateAssigned;

  const isGateAuthorizedForGuard = (gate: SocietyGate): boolean => {
    // If guard assignment explicitly names this gate
    if (assignedGateFromAuth) {
      if (assignedGateFromAuth.toLowerCase().includes(gate.name.toLowerCase())) {
        return true;
      }
      if (gate.name.toLowerCase().includes(assignedGateFromAuth.toLowerCase())) {
        return true;
      }
    }
    // If gate record explicitly lists this guard's uid or employeeId
    if (gate.assignedGuards && gate.assignedGuards.length > 0) {
      const identifiers = [user?.uid, guardBadge, guardName].filter(Boolean) as string[];
      if (gate.assignedGuards.some((g) => identifiers.includes(g))) {
        return true;
      }
    }
    // If active gate matches
    if (gate.name === gateName) {
      return true;
    }
    // In multi-gate deployment without restrictive ACLs, allow shift officer to toggle between open checkpoints
    return false;
  };

  const handleGateSelect = (gate: SocietyGate) => {
    setSwitchError(null);
    const authorized = isGateAuthorizedForGuard(gate);
    if (!authorized) {
      setSwitchError(
        `You are currently not deployed to ${gate.name}. Please contact your Society Administrator for shift reassignment.`
      );
      return;
    }
    onSelectGate?.(gate.name);
    setShowMenu(false);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    setShowMenu(false);
    await logout();
    navigate('/login');
  };

  const handleBellClick = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setShowNotificationPanel((v) => !v);
    }
  };

  return (
    <>
      <header className="bg-[#000000] text-white pt-3 pb-2 px-3 sm:px-6 select-none relative w-full overflow-hidden">
        <div className="flex items-center justify-between h-10 max-w-lg mx-auto w-full">
          {/* Left: Complete Notification Bell Icon with Badge */}
          <div className="w-10 flex items-center justify-start relative">
            <button
              type="button"
              onClick={handleBellClick}
              className="relative p-1.5 rounded-xl text-white hover:text-white/80 active:scale-95 transition-all cursor-pointer"
              aria-label="Guard Notifications"
              title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E53945] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-black animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Center: Currently Deployed Gate Name */}
          <div className="flex-1 flex items-center justify-center px-1 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-white tracking-wide text-center truncate">
              {gateName}
            </h1>
          </div>

          {/* Right: Three Dots Menu Button */}
          <div className="relative w-10 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSwitchError(null);
                setShowMenu((v) => !v);
              }}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Society & Gate Options"
              title="Society & Gate Details"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* THREE-DOT MENU: RESPONSIVE BOTTOM SHEET / CENTERED MODAL */}
      {/* ======================================================== */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in w-full max-w-full overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMenu(false)}
          />

          {/* Sheet / Modal Container (Zero horizontal overflow) */}
          <div className="relative z-10 w-full sm:max-w-md max-h-[90vh] bg-white text-[#111111] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col p-4 sm:p-6 border-t sm:border border-gray-100 pb-safe max-w-full">
            {/* Sheet Handle (Mobile) */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden" />

            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6F1F5]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-[#673AB7]">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
                    Society & Gate Terminal
                  </h2>
                  <p className="text-[11px] text-[#64748B]">Connected Firebase Security Checkpoint</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Society Information Section */}
            <div className="mt-3.5 p-3.5 bg-[#F1F9FC] rounded-2xl border border-[#E6F1F5] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#673AB7] block">
                    REGISTERED SOCIETY
                  </span>
                  <h3 className="font-extrabold text-sm text-[#111111] mt-0.5 leading-snug">
                    {societyName}
                  </h3>
                  <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#673AB7] shrink-0" />
                    <span>{societyAddress}</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#E6F1F5] text-[#64748B] font-bold shrink-0">
                  {societyId}
                </span>
              </div>

              {/* Guard On-Duty Info */}
              <div className="pt-2 border-t border-[#E6F1F5] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#64748B] text-[11px]">Station Officer: </span>
                  <strong className="text-[#111111] font-bold">{guardName}</strong>
                  <span className="text-[10px] text-[#64748B] block">{guardPhone} • Badge {guardBadge}</span>
                </div>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 text-[10px] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active On-Duty
                </span>
              </div>
            </div>

            {/* Active Deployment Check */}
            {!hasActiveDeployment ? (
              <div className="mt-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-medium leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">No Active Deployment</p>
                  <p className="text-[11px] mt-0.5">
                    No active gate deployment assigned. Please contact your Society Administrator.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Error Message if unauthorized gate selected */}
            {switchError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{switchError}</span>
              </div>
            )}

            {/* 2. Registered Society Gates List */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#111111] uppercase tracking-wider">
                    REGISTERED SOCIETY GATES ({societyGates.length})
                  </h4>
                  <p className="text-[10px] text-[#64748B]">
                    Current deployment highlighted in purple
                  </p>
                </div>
                <span className="text-[10px] font-bold text-[#673AB7]">
                  Tap to Switch
                </span>
              </div>

              {loadingGates ? (
                <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#673AB7] animate-ping" />
                  Fetching society gates from Firebase...
                </div>
              ) : societyGates.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                  No gates configured for this society. Contact Society Administrator.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {societyGates.map((gate) => {
                    const isCurrent = gate.name === gateName;
                    const authorized = isGateAuthorizedForGuard(gate);

                    return (
                      <div
                        key={gate.id}
                        onClick={() => handleGateSelect(gate)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                          isCurrent
                            ? 'bg-[#F1F9FC] border-[#673AB7] shadow-xs ring-1 ring-[#673AB7]/30'
                            : authorized
                            ? 'bg-white border-gray-200 hover:border-[#673AB7]/50 hover:bg-slate-50'
                            : 'bg-gray-50 border-gray-100 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-extrabold text-xs text-[#111111] truncate">
                                {gate.name}
                              </h5>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-[#673AB7] text-white text-[9px] font-extrabold flex items-center gap-0.5 shrink-0">
                                  <Check className="w-2.5 h-2.5" />
                                  Currently Deployed
                                </span>
                              )}
                              {!isCurrent && authorized && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#673AB7] text-[9px] font-bold border border-purple-200 shrink-0">
                                  Authorized
                                </span>
                              )}
                              {!authorized && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold flex items-center gap-0.5 shrink-0">
                                  <Lock className="w-2.5 h-2.5" />
                                  Other Station
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                              {gate.locationDescription}
                            </p>

                            {/* Gate Features & Status Chips */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold ${
                                  gate.operatingStatus === 'OPEN'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : gate.operatingStatus === 'RESTRICTED'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {gate.operatingStatus}
                              </span>

                              {gate.hasBoomBarrier && (
                                <span className="text-[#64748B] bg-white border border-[#E6F1F5] px-1.5 py-0.5 rounded">
                                  Boom Barrier
                                </span>
                              )}

                              {gate.hasLicensePlateCamera && (
                                <span className="text-[#64748B] bg-white border border-[#E6F1F5] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Camera className="w-2.5 h-2.5 text-[#673AB7]" />
                                  ANPR
                                </span>
                              )}

                              <span className="text-[#64748B]">
                                Guards: {gate.assignedGuardsCount || 2}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Actions Section */}
            <div className="mt-5 pt-3 border-t border-[#E6F1F5] space-y-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#E53945] font-extrabold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Guard Shift Handover / Sign Out</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F1F9FC] text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LOGOUT / SHIFT HANDOVER CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 animate-fade-in w-full max-w-full overflow-hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-gray-100 space-y-3 max-w-full overflow-x-hidden">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-base text-gray-900">
                Confirm Shift Handover?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to end your active guard shift at{' '}
                <strong className="text-gray-900">{gateName}</strong>? All station logs will be finalized.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-xs text-gray-700 cursor-pointer"
              >
                Stay On-Duty
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 font-extrabold text-xs text-white cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* QUICK NOTIFICATION DRAWER (Opened via Bell Icon) */}
      {/* ======================================================== */}
      {showNotificationPanel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in w-full max-w-full overflow-hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowNotificationPanel(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md max-h-[85vh] bg-white text-[#111111] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col p-4 sm:p-5 border-t sm:border border-gray-100 pb-safe max-w-full">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E6F1F5]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-50 text-[#673AB7]">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-[#111111]">
                  Gate Station Alerts ({unreadCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationPanel(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 py-2">
              {emergenciesCount > 0 ? (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <p className="font-extrabold text-xs text-red-700">
                      {emergenciesCount} Active Emergency SOS Alert(s)!
                    </p>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      Immediate security sentry response required.
                    </p>
                  </div>
                </div>
              ) : null}

              {messagesCount > 0 ? (
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[#673AB7] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-xs text-[#673AB7]">
                      {messagesCount} Unread Resident Message(s)
                    </p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Special gate entry instructions pending guard review.
                    </p>
                  </div>
                </div>
              ) : null}

              {emergenciesCount === 0 && messagesCount === 0 && (
                <div className="text-center py-6 text-[#64748B] text-xs space-y-1">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="font-bold text-sm text-[#111111]">All Quiet at Gate</p>
                  <p className="text-[11px] text-[#A9B0B8]">
                    No pending emergency alerts or unread resident instructions.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E6F1F5]">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationPanel(false);
                  onNotificationPress?.();
                }}
                className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-center font-extrabold text-xs hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Open Full SOS & Notification Hub</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
