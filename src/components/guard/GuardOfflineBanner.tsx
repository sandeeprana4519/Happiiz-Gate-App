/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

export const GuardOfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-amber-600 text-white px-3 sm:px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md sticky top-0 z-50 animate-slide-down">
      <div className="flex items-center gap-2 max-w-lg mx-auto w-full min-w-0">
        <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
        <span>
          <strong>Terminal Offline:</strong> Privileged gate operations & approvals require an active network connection. Cached records available for reference.
        </span>
      </div>
    </div>
  );
};
