/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_CONFIDENCE_THRESHOLD = 72;

/**
 * Strips spaces, hyphens, dots, special characters and normalizes to uppercase alphanumeric.
 * Handles Indian formats: DL8CAF1234, MH12AB1234, UP16CD5678, HR26DK1234, 22BH1234AA, etc.
 */
export function normalizeIndianPlate(raw: string): string {
  if (!raw) return '';
  let cleaned = raw
    .toUpperCase()
    .replace(/\bIND\b/g, '') // Strip "IND" hologram text if OCR picked it up
    .replace(/[^A-Z0-9]/g, '');

  // If OCR accidentally prefixed "IND" attached to state code (e.g. "INDDL8CAF1234")
  if (cleaned.startsWith('IND') && cleaned.length >= 11 && /^[A-Z]{2}\d/.test(cleaned.slice(3))) {
    cleaned = cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Validates common Indian vehicle registration plate patterns:
 * 1. Standard RTO: [A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4} (e.g. DL8CAF1234, MH12AB1234)
 * 2. Bharat Series (BH): [0-9]{2}BH[0-9]{4}[A-Z]{1,2} (e.g. 22BH1234AA)
 * 3. Military / Diplomatic / Vintage fallback: 6..11 alphanumeric chars containing both letters & digits
 */
export function isValidIndianPlateFormat(normalizedPlate: string): boolean {
  const plate = normalizeIndianPlate(normalizedPlate);
  if (!plate || plate.length < 6 || plate.length > 12) return false;
  const standardRto = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{3,4}$/;
  const bharatSeries = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  const vintageOrSpecial = /^[A-Z]{2,3}[0-9]{2,4}[A-Z]{0,2}[0-9]{1,4}$/;
  return standardRto.test(plate) || bharatSeries.test(plate) || vintageOrSpecial.test(plate);
}

/**
 * Formats an Indian normalized plate for display (e.g. DL8CAF1234 -> DL 8C AF 1234 or MH12AB1234 -> MH 12 AB 1234).
 */
export function formatIndianPlateDisplay(raw: string): string {
  const n = normalizeIndianPlate(raw);
  if (!n) return 'UNREADABLE';
  const match = n.match(/^([A-Z]{2})([0-9]{1,2})([A-Z]{1,3})([0-9]{4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  const bhMatch = n.match(/^([0-9]{2})(BH)([0-9]{4})([A-Z]{1,2})$/);
  if (bhMatch) {
    return `${bhMatch[1]} ${bhMatch[2]} ${bhMatch[3]} ${bhMatch[4]}`;
  }
  return n;
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

/**
 * Generates bounded candidate permutations for common Indian plate OCR confusions
 * (O/0, I/1, B/8, S/5) ONLY to check against verified registered vehicles in the same society.
 * Never alters raw OCR text unless an actual registered vehicle matches the candidate.
 */
export function generateIndianOcrAmbiguityCandidates(normalizedPlate: string): string[] {
  const plate = normalizeIndianPlate(normalizedPlate);
  if (!plate || plate.length < 6 || plate.length > 12) return [];

  const candidates = new Set<string>([plate]);

  // First add positional deterministic Indian RTO normalization candidate:
  // In standard Indian plates: chars 0..1 are letters (State), chars 2..3 digits (RTO), last 4 are digits!
  if (plate.length >= 8 && plate.length <= 11) {
    const chars = plate.split('');
    const letterToDigit: Record<string, string> = { O: '0', I: '1', B: '8', S: '5', Z: '2' };
    const digitToLetter: Record<string, string> = { '0': 'O', '1': 'I', '8': 'B', '5': 'S', '2': 'Z' };

    // Fix first 2 characters to letters
    for (let i = 0; i < 2; i++) {
      if (digitToLetter[chars[i]]) chars[i] = digitToLetter[chars[i]];
    }
    // Fix last 4 characters to digits
    for (let i = Math.max(4, chars.length - 4); i < chars.length; i++) {
      if (letterToDigit[chars[i]]) chars[i] = letterToDigit[chars[i]];
    }
    candidates.add(chars.join(''));
  }

  // Single-character & double-character bounded confusion variants
  const singleVariants: string[] = [];
  for (let i = 0; i < plate.length; i++) {
    const alts = CONFUSABLE_PAIRS[plate[i]];
    if (!alts) continue;
    for (const alt of alts) {
      const variant = plate.slice(0, i) + alt + plate.slice(i + 1);
      candidates.add(variant);
      singleVariants.push(variant);
    }
  }

  // Pairwise combinations (capped to keep lookup O(1) and safe)
  for (let v = 0; v < Math.min(singleVariants.length, 10); v++) {
    const base = singleVariants[v];
    for (let i = 0; i < base.length; i++) {
      const alts = CONFUSABLE_PAIRS[base[i]];
      if (!alts) continue;
      for (const alt of alts) {
        if (candidates.size >= 48) break;
        candidates.add(base.slice(0, i) + alt + base.slice(i + 1));
      }
      if (candidates.size >= 48) break;
    }
    if (candidates.size >= 48) break;
  }

  return Array.from(candidates);
}

/**
 * Compresses and resizes an image Blob/File or HTMLCanvasElement / HTMLVideoElement in the browser
 * before sending it over the network to the ANPR endpoint.
 */
export async function compressVehicleImageToBase64(
  source: File | Blob | HTMLVideoElement | HTMLCanvasElement,
  options: { maxWidth?: number; quality?: number } = {}
): Promise<{ dataUrl: string; base64: string; mimeType: string; width: number; height: number }> {
  const maxWidth = options.maxWidth ?? 1280;
  const quality = options.quality ?? 0.82;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not supported on this device.');
  }

  if (source instanceof HTMLVideoElement) {
    const srcW = source.videoWidth || 1280;
    const srcH = source.videoHeight || 720;
    const scale = Math.min(1, maxWidth / srcW);
    canvas.width = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  } else if (source instanceof HTMLCanvasElement) {
    const scale = Math.min(1, maxWidth / (source.width || maxWidth));
    canvas.width = Math.round(source.width * scale);
    canvas.height = Math.round(source.height * scale);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  } else {
    const imgUrl = URL.createObjectURL(source);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to decode selected vehicle image.'));
        el.src = imgUrl;
      });
      const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  }

  const mimeType = 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const base64 = dataUrl.split(',')[1] || '';

  return {
    dataUrl,
    base64,
    mimeType,
    width: canvas.width,
    height: canvas.height,
  };
}
