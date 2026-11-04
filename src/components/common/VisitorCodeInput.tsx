/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface VisitorCodeInputProps {
  code: string;
  length?: number;
}

export const VisitorCodeInput: React.FC<VisitorCodeInputProps> = ({
  code,
  length = 6,
}) => {
  const digits = code.split('');

  return (
    <div className="w-full max-w-sm mx-auto px-4 -mt-5 z-10 relative">
      <div className="h-16 sm:h-20 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] shadow-sm flex items-center justify-evenly px-4 select-none">
        {Array.from({ length }).map((_, idx) => {
          const char = digits[idx];
          return (
            <div
              key={idx}
              className="flex items-center justify-center w-9 sm:w-11 h-12"
            >
              {char ? (
                <span className="text-2xl sm:text-3xl font-extrabold text-[#111111] animate-scale-in">
                  {char}
                </span>
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-[#A9B0B8]">
                  —
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
