/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SecurityShield3D } from '../visuals/SecurityShield3D';

export const LoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Securing connection & gate credentials...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 select-none">
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-sky-500/20 rounded-full blur-xl animate-pulse" />
        <SecurityShield3D size={84} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white mb-2">
        Happiiz Gate App
      </h2>
      <p className="text-xs text-sky-400 font-medium tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  );
};
