/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { Button } from '../common/Button';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="bg-gradient-to-r from-blue-900/90 via-slate-900/95 to-slate-950 border-b border-sky-500/30 px-4 py-2.5 text-xs text-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Install Happiiz Gate App</span>
              <span className="hidden sm:inline text-slate-400 ml-1.5">
                · Add to home screen for lightning-fast gate verification & offline access.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="primary" onClick={install}>
              Install App
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-sky-500/20 px-4 py-2 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sky-300">iPhone / iPad User?</span>
              <span className="text-slate-400">Install for fullscreen app experience.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowIOSGuide(true)}>
                Add to Home Screen
              </Button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-slate-400 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-sky-500/30 p-6 shadow-2xl text-slate-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <Share className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Step 1:</strong> Tap the{' '}
                    <strong className="text-sky-300">Share</strong> icon in the Safari navigation bar at the bottom.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <PlusSquare className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Step 2:</strong> Scroll down the share sheet and tap{' '}
                    <strong className="text-sky-300">"Add to Home Screen"</strong>.
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full mt-6"
                onClick={() => setShowIOSGuide(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
