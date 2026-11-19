/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 text-slate-950 px-3.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-md border border-amber-300">
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Offline Mode · Cached gate data active</span>
    </div>
  );
};
