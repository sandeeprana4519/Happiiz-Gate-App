/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Modal } from './Modal';
import { QrCode, CheckCircle2, AlertCircle, Camera, Check } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    visitor: string;
    flat: string;
    type: string;
  } | null>(null);

  const handleSimulateScan = () => {
    const mock = {
      code: '829415',
      visitor: 'Karan Mehra (Guest)',
      flat: 'B-704 (Dr. Priya Varma)',
      type: 'Pre-Approved Resident Pass',
    };
    setScannedResult(mock);
  };

  const handleApprove = () => {
    if (scannedResult) {
      onScanSuccess(scannedResult.code);
      setScannedResult(null);
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode) return;
    onScanSuccess(manualCode);
    setManualCode('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setScannedResult(null);
        onClose();
      }}
      title="Scan Gate Pass QR"
      description="Point camera at visitor's digital QR pass"
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1">
        {scannedResult ? (
          <div className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3 animate-scale-in">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Valid Resident Pass Scanned!</span>
            </div>
            <div className="space-y-1.5 text-xs text-[#111111]">
              <p>
                <span className="text-[#A9B0B8]">Visitor:</span>{' '}
                <strong className="text-[#111111]">{scannedResult.visitor}</strong>
              </p>
              <p>
                <span className="text-[#A9B0B8]">Destination:</span>{' '}
                <strong className="text-[#111111]">Flat {scannedResult.flat}</strong>
              </p>
              <p>
                <span className="text-[#A9B0B8]">Pass Code:</span>{' '}
                <span className="font-mono font-bold text-[#673AB7]">{scannedResult.code}</span>
              </p>
            </div>

            <button
              onClick={handleApprove}
              className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white font-bold text-xs hover:bg-[#512DA8] transition-colors cursor-pointer"
            >
              Approve Entry & Log Inward
            </button>
          </div>
        ) : (
          <>
            {/* Viewfinder box with laser */}
            <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-3xl bg-slate-950 overflow-hidden border-2 border-[#673AB7] shadow-xl flex items-center justify-center">
              {/* Corner targeting brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#673AB7]" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#673AB7]" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#673AB7]" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#673AB7]" />

              {/* Animated laser line */}
              <div className="absolute inset-x-4 h-0.5 bg-[#EC4899] shadow-[0_0_12px_#EC4899] animate-pulse" />

              <div className="text-center text-slate-400 text-xs px-4">
                <Camera className="w-8 h-8 text-white/50 mx-auto mb-2 animate-bounce" />
                <span>Align QR inside frame</span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSimulateScan}
                className="text-xs font-bold text-[#673AB7] hover:underline cursor-pointer"
              >
                Simulate Camera QR Detection
              </button>
            </div>

            {/* Manual Pass Code Fallback */}
            <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#E6F1F5]">
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Or Enter 6-Digit Pass Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. 481920"
                  className="flex-1 h-10 px-3 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] font-mono font-bold text-sm text-[#111111] focus:outline-none focus:border-[#673AB7]"
                />
                <button
                  type="submit"
                  className="px-4 h-10 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};
