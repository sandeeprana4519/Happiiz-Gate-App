/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { GuardVisitor } from '../../types/guard';

interface GuardQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifyToken: (token: string) => Promise<{ success: boolean; visitor?: GuardVisitor; message: string }>;
  onAllowEntry: (visitorId: string) => Promise<void>;
}

export const GuardQRScannerModal: React.FC<GuardQRScannerModalProps> = ({
  isOpen,
  onClose,
  onVerifyToken,
  onAllowEntry,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<GuardVisitor | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [allowing, setAllowing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedResult(null);
      setErrorMessage(null);
      setManualCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (e) {
      console.warn('Camera feed not accessible:', e);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleSimulateScan = async (sampleCode: string = '829415') => {
    setScanning(true);
    setErrorMessage(null);
    try {
      const res = await onVerifyToken(sampleCode);
      if (res.success && res.visitor) {
        setScannedResult(res.visitor);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSimulateScan(manualCode.trim());
  };

  const handleConfirmAllow = async () => {
    if (!scannedResult) return;
    setAllowing(true);
    try {
      await onAllowEntry(scannedResult.id);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Entry failed');
    } finally {
      setAllowing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 my-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-50 text-[#673AB7]">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">Digital GatePass Scanner</h3>
              <p className="text-[11px] text-gray-400">Scan QR Code from visitor phone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanned result card */}
        {scannedResult ? (
          <div className="space-y-3 pt-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Resident GatePass</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold bg-white px-2 py-0.5 rounded-md text-[#673AB7] border border-emerald-200">
                  #{scannedResult.passCode}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-base text-gray-900">{scannedResult.visitorName}</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  Visiting Flat <strong className="text-gray-900">{scannedResult.flatNumber}</strong> ({scannedResult.building})
                </p>
                <p className="text-[11px] text-gray-500">
                  Resident Host: {scannedResult.residentName || 'Resident Host'}
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-gray-600">
                <span>Category: <strong className="text-[#673AB7]">{scannedResult.category}</strong></span>
                <span className="text-emerald-700 font-bold">Status: Valid for Entry</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setScannedResult(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Scan Another
              </button>
              <button
                type="button"
                disabled={allowing}
                onClick={handleConfirmAllow}
                className="flex-1 py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#5E35B1] transition shadow-xs flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{allowing ? 'Authorizing...' : 'Allow Entry'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            {/* Viewfinder simulation */}
            <div className="relative w-full h-48 bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              
              {/* QR Framing overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-36 border-2 border-[#673AB7] rounded-2xl relative animate-pulse">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white rounded-br" />
                </div>
              </div>

              <div className="absolute bottom-2 text-center text-[10px] text-white/80 bg-black/60 px-3 py-1 rounded-full">
                Align QR Code within frame
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Demo Scan Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSimulateScan('829415')}
                disabled={scanning}
                className="flex-1 py-2 bg-purple-50 text-[#673AB7] border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Valid QR (#829415)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSimulateScan('310928')}
                disabled={scanning}
                className="flex-1 py-2 bg-purple-50 text-[#673AB7] border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Delivery QR</span>
              </button>
            </div>

            {/* Manual Token input */}
            <form onSubmit={handleManualSubmit} className="pt-2 border-t border-gray-100 space-y-2">
              <span className="text-[11px] font-semibold text-gray-500 block">Or Enter Numeric Token manually:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 829415"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#673AB7] focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={scanning || !manualCode.trim()}
                  className="px-4 py-2 bg-[#673AB7] text-white text-xs font-bold rounded-xl hover:bg-[#5E35B1] transition disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
