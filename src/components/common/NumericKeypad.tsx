/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QrCode, Delete } from 'lucide-react';

interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  onQrPress: () => void;
  disabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigitPress,
  onDeletePress,
  onQrPress,
  disabled = false,
}) => {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <div className="w-full max-w-[280px] sm:max-w-xs mx-auto px-2 py-3 select-none shrink-0">
      <div className="grid grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-3.5 justify-items-center">
        {/* Rows 1-3 (Numbers 1-9) */}
        {rows.map((row) =>
          row.map((num) => (
            <button
              key={num}
              type="button"
              disabled={disabled}
              onClick={() => onDigitPress(num)}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#111111] hover:bg-[#E6F1F5] active:scale-95 transition-all cursor-pointer focus:outline-none"
            >
              {num}
            </button>
          ))
        )}

        {/* Row 4: QR Scanner (Purple), 0 (Light Blue), Delete (Light Blue) */}
        {/* QR Button in vibrant purple */}
        <button
          type="button"
          disabled={disabled}
          onClick={onQrPress}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#673AB7] shadow-[0_4px_16px_rgba(103,58,183,0.35)] flex items-center justify-center text-white hover:bg-[#512DA8] active:scale-95 transition-all cursor-pointer focus:outline-none"
          title="Scan QR Pass"
          aria-label="Scan QR Pass"
        >
          <QrCode className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
        </button>

        {/* Digit 0 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDigitPress('0')}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#111111] hover:bg-[#E6F1F5] active:scale-95 transition-all cursor-pointer focus:outline-none"
        >
          0
        </button>

        {/* Backspace / Delete Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={onDeletePress}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#F1F9FC] border border-[#E6F1F5] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center text-[#111111] hover:bg-[#E6F1F5] active:scale-95 transition-all cursor-pointer focus:outline-none"
          title="Delete Digit"
          aria-label="Delete Digit"
        >
          <Delete className="w-6 h-6 stroke-[2]" />
        </button>
      </div>
    </div>
  );
};
