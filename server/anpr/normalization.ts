/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function normalizeIndianPlateServer(raw: string): string {
  if (!raw) return '';
  let cleaned = raw
    .toUpperCase()
    .replace(/\bIND\b/g, '')
    .replace(/[^A-Z0-9]/g, '');

  if (cleaned.startsWith('IND') && cleaned.length >= 11 && /^[A-Z]{2}\d/.test(cleaned.slice(3))) {
    cleaned = cleaned.slice(3);
  }
  return cleaned;
}

const CONFUSABLE_PAIRS: Record<string, string[]> = {
  O: ['0'],
  '0': ['O'],
  I: ['1'],
  '1': ['I'],
  B: ['8'],
  '8': ['B'],
  S: ['5'],
  '5': ['S'],
  Z: ['2'],
  '2': ['Z'],
};

export function generateServerAmbiguityCandidates(normalizedPlate: string): string[] {
  const plate = normalizeIndianPlateServer(normalizedPlate);
  if (!plate || plate.length < 6 || plate.length > 12) return [];
  const candidates = new Set<string>([plate]);

  if (plate.length >= 8 && plate.length <= 11) {
    const chars = plate.split('');
    const letterToDigit: Record<string, string> = { O: '0', I: '1', B: '8', S: '5', Z: '2' };
    const digitToLetter: Record<string, string> = { '0': 'O', '1': 'I', '8': 'B', '5': 'S', '2': 'Z' };
    for (let i = 0; i < 2; i++) {
      if (digitToLetter[chars[i]]) chars[i] = digitToLetter[chars[i]];
    }
    for (let i = Math.max(4, chars.length - 4); i < chars.length; i++) {
      if (letterToDigit[chars[i]]) chars[i] = letterToDigit[chars[i]];
    }
    candidates.add(chars.join(''));
  }

  for (let i = 0; i < plate.length; i++) {
    const alts = CONFUSABLE_PAIRS[plate[i]];
    if (!alts) continue;
    for (const alt of alts) {
      if (candidates.size >= 36) break;
      candidates.add(plate.slice(0, i) + alt + plate.slice(i + 1));
    }
  }
  return Array.from(candidates);
}
