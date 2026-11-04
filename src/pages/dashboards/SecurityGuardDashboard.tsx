/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GuardHeader } from '../../components/layout/GuardHeader';
import { GuardTopNav, GuardNavTab } from '../../components/layout/GuardTopNav';
import { VisitorCodeInput } from '../../components/common/VisitorCodeInput';
import { NumericKeypad } from '../../components/common/NumericKeypad';
import { VisitorCategoryCard } from '../../components/common/VisitorCategoryCard';
import { GuestIllustration3D } from '../../components/illustrations/GuestIllustration3D';
import { DeliveryIllustration3D } from '../../components/illustrations/DeliveryIllustration3D';
import { ServiceIllustration3D } from '../../components/illustrations/ServiceIllustration3D';
import { CabIllustration3D } from '../../components/illustrations/CabIllustration3D';
import { VisitorEntryModal, VisitorCategory } from '../../components/common/VisitorEntryModal';
import { QRScannerModal } from '../../components/common/QRScannerModal';
import { Modal } from '../../components/common/Modal';
import { MOCK_GATE_PASSES } from '../../services/mock/mockData';
import { GatePass } from '../../types/society';
import {
  CheckCircle2,
  Clock,
  LogOut,
  Search,
  AlertTriangle,
  ArrowDownUp,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export const SecurityGuardDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<GuardNavTab>('home');
  const [activeGate, setActiveGate] = useState('Gate A, West Corner');

  // Keypad State
  const [enteredCode, setEnteredCode] = useState('');
  const [verifiedPass, setVerifiedPass] = useState<GatePass | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // QR Scanner Modal State
  const [showQrModal, setShowQrModal] = useState(false);

  // New Visitor Modal State
  const [selectedVisitorCategory, setSelectedVisitorCategory] = useState<VisitorCategory | null>(null);

  // Passes Data
  const [passes, setPasses] = useState<GatePass[]>(MOCK_GATE_PASSES);

  // Keypad Handlers
  const handleDigitPress = (digit: string) => {
    if (enteredCode.length < 6) {
      const nextCode = enteredCode + digit;
      setEnteredCode(nextCode);

      if (nextCode.length === 6) {
        // Automatic verification on 6 digits
        verifyCode(nextCode);
      }
    }
  };

  const handleDeletePress = () => {
    setEnteredCode((prev) => prev.slice(0, -1));
  };

  const verifyCode = (codeToVerify: string) => {
    const found = passes.find(
      (p) => p.passCode === codeToVerify || p.id.toLowerCase().includes(codeToVerify.toLowerCase())
    );

    if (found) {
      setVerifiedPass(found);
      setShowVerifyModal(true);
    } else {
      // Create a fallback verified mock pass for demonstration
      const mockPass: GatePass = {
        id: `PASS-${codeToVerify}`,
        visitorName: 'Rajesh Sharma (Verified Guest)',
        visitorPhone: '+91 98210 33411',
        visitorType: 'Guest',
        hostFlat: 'B-704',
        hostResidentName: 'Dr. Priya Varma',
        entryGate: activeGate,
        passCode: codeToVerify,
        status: 'Approved',
        purpose: 'Social Visit',
      };
      setVerifiedPass(mockPass);
      setShowVerifyModal(true);
    }
  };

  const handleApproveEntry = () => {
    if (verifiedPass) {
      const updated = {
        ...verifiedPass,
        status: 'CheckedIn' as const,
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setPasses([updated, ...passes.filter((p) => p.id !== updated.id)]);
      setShowVerifyModal(false);
      setVerifiedPass(null);
      setEnteredCode('');
      alert(`Entry granted to ${updated.visitorName} for Flat ${updated.hostFlat}.`);
    }
  };

  const handleCheckOut = (passId: string) => {
    setPasses((prev) =>
      prev.map((p) =>
        p.id === passId
          ? {
              ...p,
              status: 'CheckedOut',
              checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : p
      )
    );
  };

  const handleNewVisitorSubmit = (data: any) => {
    const newPass: GatePass = {
      id: `PASS-${data.passCode}`,
      visitorName: data.visitorName || data.category,
      visitorPhone: data.mobileNumber || '+91 90000 00000',
      visitorType: data.category,
      hostFlat: `${data.wing}-${data.flatNumber}`,
      hostResidentName: `Resident of Flat ${data.flatNumber}`,
      entryGate: activeGate,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      passCode: data.passCode,
      status: 'CheckedIn',
      purpose: `${data.category} Entry Check-in`,
    };
    setPasses([newPass, ...passes]);
  };

  const insideVisitors = passes.filter((p) => p.status === 'CheckedIn');

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111111] pb-12 select-none">
      {/* 1. BLACK HEADER (Gate Name + Options) */}
      <GuardHeader gateName={activeGate} onSelectGate={(g) => setActiveGate(g)} />

      {/* 2. TOP NAVIGATION (Home, In-Out, Message) */}
      <GuardTopNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        inOutCount={insideVisitors.length}
      />

      <main className="max-w-lg mx-auto">
        {/* TAB 1: HOME (Exact Recreation of Reference Screenshot 2) */}
        {activeTab === 'home' && (
          <div className="space-y-6 pt-1">
            {/* 3. SIX-DIGIT VISITOR CODE BOX (Light-blue card overlapping seam) */}
            <VisitorCodeInput code={enteredCode} length={6} />

            {/* 4. NUMERIC KEYPAD (3 Columns: 1-9, QR in Purple, 0, Delete) */}
            <NumericKeypad
              onDigitPress={handleDigitPress}
              onDeletePress={handleDeletePress}
              onQrPress={() => setShowQrModal(true)}
            />

            {/* 5. ADD NEW VISITOR SECTION */}
            <section className="px-5 pt-2 space-y-3">
              <h2 className="text-sm sm:text-base font-extrabold text-[#111111] tracking-wider uppercase text-center sm:text-left">
                ADD NEW VISITOR
              </h2>

              {/* Horizontal Scrollable Cards */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                <VisitorCategoryCard
                  title="Guest"
                  illustration={<GuestIllustration3D size={105} />}
                  onClick={() => setSelectedVisitorCategory('Guest')}
                />
                <VisitorCategoryCard
                  title="Delivery"
                  illustration={<DeliveryIllustration3D size={105} />}
                  onClick={() => setSelectedVisitorCategory('Delivery')}
                />
                <VisitorCategoryCard
                  title="Service"
                  illustration={<ServiceIllustration3D size={105} />}
                  onClick={() => setSelectedVisitorCategory('Service')}
                />
                <VisitorCategoryCard
                  title="Cab"
                  illustration={<CabIllustration3D size={105} />}
                  onClick={() => setSelectedVisitorCategory('Cab')}
                />
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: IN-OUT (Inside Visitors & Exit Checkout) */}
        {activeTab === 'inout' && (
          <div className="px-4 sm:px-6 pt-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
                  Inside Visitors & Vehicles
                </h2>
                <p className="text-xs text-[#A9B0B8]">
                  {insideVisitors.length} active visitors currently inside
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] text-xs font-bold text-[#673AB7]">
                {insideVisitors.length} Inside
              </span>
            </div>

            <div className="space-y-2.5">
              {insideVisitors.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs text-[#A9B0B8]">
                  No visitors currently inside society premises.
                </div>
              ) : (
                insideVisitors.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#111111]">{p.visitorName}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {p.visitorType}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B]">
                        To Flat <strong className="text-[#111111]">{p.hostFlat}</strong> ({p.hostResidentName})
                      </p>
                      <p className="text-[11px] text-[#A9B0B8] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>Entered at {p.checkInTime || '10:30 AM'} via {p.entryGate}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleCheckOut(p.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGE (Intercom, Society Broadcasts & SOS Alerts) */}
        {activeTab === 'message' && (
          <div className="px-4 sm:px-6 pt-5 space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
                Gate Intercom & Broadcasts
              </h2>
              <p className="text-xs text-[#A9B0B8]">
                Real-time communications from Society Office & Residents
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#673AB7]">Society Admin Notice</span>
                  <span className="text-[10px] text-[#A9B0B8]">15m ago</span>
                </div>
                <p className="text-xs text-[#111111] font-semibold">
                  Heavy Vehicle Restrictions between 4 PM – 7 PM
                </p>
                <p className="text-xs text-[#64748B]">
                  Diverting all cement mixers and large shifting trucks to South Gate #3 during school bus arrival hours.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#111111]">Flat B-704 (Dr. Priya Varma)</span>
                  <span className="text-[10px] text-[#A9B0B8]">1 hour ago</span>
                </div>
                <p className="text-xs text-[#111111] font-semibold">
                  Expecting Amazon delivery package
                </p>
                <p className="text-xs text-[#64748B]">
                  Pre-approved delivery pass code #310928 issued. Please clear delivery agent at gate.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* VERIFY PASS MODAL */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setVerifiedPass(null);
          setEnteredCode('');
        }}
        title="Visitor Pass Verification"
        description="Verify pass details before granting gate clearance"
        maxWidth="sm"
      >
        {verifiedPass && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A9B0B8] uppercase">Code #{verifiedPass.passCode}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {verifiedPass.status}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#111111]">
                {verifiedPass.visitorName}
              </h3>
              <p className="text-xs text-[#64748B]">
                Destination: <strong className="text-[#111111]">Flat {verifiedPass.hostFlat}</strong> ({verifiedPass.hostResidentName})
              </p>
              <p className="text-xs text-[#64748B]">
                Visitor Contact: <strong className="text-[#111111]">{verifiedPass.visitorPhone}</strong>
              </p>
              <p className="text-xs text-[#64748B]">
                Purpose: <strong className="text-[#111111]">{verifiedPass.purpose}</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifiedPass(null);
                  setEnteredCode('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#E6F1F5] text-xs font-bold text-[#64748B] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Deny / Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveEntry}
                className="flex-1 py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
              >
                Grant Entry & Check In
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR SCANNER MODAL */}
      <QRScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScanSuccess={(code) => {
          setShowQrModal(false);
          verifyCode(code);
        }}
      />

      {/* NEW VISITOR MODAL (Guest, Delivery, Service, Cab) */}
      {selectedVisitorCategory && (
        <VisitorEntryModal
          isOpen={Boolean(selectedVisitorCategory)}
          onClose={() => setSelectedVisitorCategory(null)}
          category={selectedVisitorCategory}
          onSubmit={handleNewVisitorSubmit}
          isGuardView={true}
        />
      )}
    </div>
  );
};
