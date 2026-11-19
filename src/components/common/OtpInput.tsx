/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const otpDigits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...otpDigits];
      if (newDigits[index]) {
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) return;

    const newDigits = [...otpDigits];
    // If user enters a single digit
    newDigits[index] = rawVal[rawVal.length - 1];
    onChange(newDigits.join(''));

    // Move to next input box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otpDigits[index] || ''}
          disabled={disabled}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onChange={(e) => handleChange(index, e)}
          onPaste={handlePaste}
          className={`w-11 sm:w-12 h-13 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl transition-all outline-none select-none
            bg-white/80 dark:bg-slate-900/90
            text-slate-900 dark:text-white
            border ${
              otpDigits[index]
                ? 'border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                : 'border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={`Digit ${index + 1} of OTP`}
        />
      ))}
    </div>
  );
};
