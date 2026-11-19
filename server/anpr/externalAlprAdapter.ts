/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnprImageInput, AnprProvider, AnprProviderOutput } from './types';
import { generateServerAmbiguityCandidates, normalizeIndianPlateServer } from './normalization';

/**
 * Modular adapter for dedicated third-party ALPR services (PlateRecognizer Snapshot API).
 * Activate by setting ANPR_PROVIDER=plate_recognizer and PLATE_RECOGNIZER_API_KEY in server env.
 * Never returns simulated/mock plates when unconfigured or unreachable.
 */
export class PlateRecognizerAdapter implements AnprProvider {
  readonly id = 'plate_recognizer' as const;
  readonly displayName = 'PlateRecognizer Cloud ALPR Adapter';

  private getApiKey(): string | undefined {
    const key = process.env.PLATE_RECOGNIZER_API_KEY?.trim();
    if (!key || key.includes('PLACEHOLDER')) return undefined;
    return key;
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  async recognizePlate(input: AnprImageInput): Promise<AnprProviderOutput> {
    const start = Date.now();
    const apiKey = this.getApiKey();
    const minConfidence = input.minConfidence ?? Number(process.env.ANPR_MIN_CONFIDENCE || 72);

    if (!apiKey) {
      return {
        success: false,
        provider: this.id,
        plateDetected: false,
        rawPlateText: '',
        normalizedPlate: '',
        candidatePlates: [],
        plateCountInImage: 0,
        vehicleType: 'Unknown',
        confidence: 0,
        lowConfidence: true,
        imageQualityIssues: ['provider_not_configured'],
        processingMs: Date.now() - start,
        errorCode: 'PLATE_RECOGNIZER_KEY_MISSING',
        errorMessage: 'PLATE_RECOGNIZER_API_KEY is not configured on the server.',
      };
    }

    try {
      const endpoint = process.env.PLATE_RECOGNIZER_URL || 'https://api.platerecognizer.com/v1/plate-reader/';
      const form = new URLSearchParams();
      form.append('upload', input.imageBase64);
      form.append('regions', 'in');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          provider: this.id,
          plateDetected: false,
          rawPlateText: '',
          normalizedPlate: '',
          candidatePlates: [],
          plateCountInImage: 0,
          vehicleType: 'Unknown',
          confidence: 0,
          lowConfidence: true,
          imageQualityIssues: ['external_alpr_http_error'],
          processingMs: Date.now() - start,
          errorCode: `ALPR_HTTP_${res.status}`,
          errorMessage: `External ALPR HTTP ${res.status}: ${text.slice(0, 140)}`,
        };
      }

      const data: any = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      const top = results[0];
      const rawPlate = String(top?.plate || '').toUpperCase();
      const normalizedPlate = normalizeIndianPlateServer(rawPlate);
      const confidence = Math.round(Number(top?.score || 0) * 100);
      const lowConfidence = !normalizedPlate || confidence < minConfidence;

      return {
        success: true,
        provider: this.id,
        plateDetected: Boolean(normalizedPlate),
        rawPlateText: rawPlate,
        normalizedPlate,
        candidatePlates: generateServerAmbiguityCandidates(normalizedPlate),
        plateCountInImage: results.length,
        vehicleType:
          top?.vehicle?.type === 'Motorcycle'
            ? 'Motorcycle'
            : top?.vehicle?.type
            ? 'Car'
            : 'Unknown',
        confidence,
        lowConfidence,
        imageQualityIssues: results.length > 1 ? ['multiple_plates'] : [],
        processingMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.id,
        plateDetected: false,
        rawPlateText: '',
        normalizedPlate: '',
        candidatePlates: [],
        plateCountInImage: 0,
        vehicleType: 'Unknown',
        confidence: 0,
        lowConfidence: true,
        imageQualityIssues: ['network_error'],
        processingMs: Date.now() - start,
        errorCode: 'ALPR_NETWORK_ERROR',
        errorMessage: err?.message || 'Network failure connecting to external ALPR provider.',
      };
    }
  }
}
