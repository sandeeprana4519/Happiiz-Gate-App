/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { AnprImageInput, AnprProvider, AnprProviderOutput } from './types';
import { generateServerAmbiguityCandidates, normalizeIndianPlateServer } from './normalization';

const SYSTEM_PROMPT = `You are a high-precision Automatic Number Plate Recognition (ANPR / ALPR) computer vision engine deployed at Indian residential society security gates.

Inspect the supplied photograph carefully:
1. Detect the vehicle and locate any visible license / registration plate.
2. Focus on the primary vehicle closest to the gate camera; if multiple readable plates appear, count them in plateCountInImage and transcribe only the clearest primary front/rear plate.
3. Read Indian registration plates accurately (standard white private, yellow commercial, green EV, BH series, two-wheeler two-line plates such as DL8CAF1234, MH12AB1234, UP16CD5678, HR26DK1234, KA05MN4421, 22BH1234AA). Ignore the small blue "IND" hologram text.
4. Distinguish look-alike characters carefully by context: O vs 0, I vs 1, B vs 8, S vs 5, Z vs 2.
5. Never invent or hallucinate characters that cannot be seen. If obscured, blurred, missing, or unreadable, set plateDetected=false or lower the confidence score honestly below 65 and document issues in imageQualityIssues.
6. Return strict structured JSON matching the schema.`;

const ANPR_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    plateDetected: {
      type: Type.BOOLEAN,
      description: 'Whether any vehicle registration number plate is visible and at least partially readable.',
    },
    rawPlateText: {
      type: Type.STRING,
      description: 'Exact characters visible on the primary license plate (e.g. "DL 8C AF 1234"), or empty string if unreadable.',
    },
    plateCountInImage: {
      type: Type.INTEGER,
      description: 'Number of distinct vehicle license plates visible in the frame.',
    },
    vehicleType: {
      type: Type.STRING,
      enum: ['Car', 'Motorcycle', 'EV', 'Auto', 'Commercial', 'Bicycle', 'Unknown'],
      description: 'Detected vehicle category.',
    },
    vehicleBrand: {
      type: Type.STRING,
      description: 'Recognized vehicle manufacturer/brand if visible (e.g. Hyundai, Tata, Honda, Maruti Suzuki), or empty.',
    },
    vehicleColor: {
      type: Type.STRING,
      description: 'Primary exterior vehicle color (e.g. White, Silver, Midnight Blue), or empty.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'OCR confidence percentage from 0 to 100 reflecting clarity and certainty.',
    },
    imageQualityIssues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Any visual issues observed, e.g. blur, low_light, glare, angled_plate, obstructed, small_plate, multiple_plates.',
    },
    ambiguityNote: {
      type: Type.STRING,
      description: 'Optional note if characters such as O/0, I/1, B/8, S/5 are borderline.',
    },
    boundingBox: {
      type: Type.OBJECT,
      properties: {
        ymin: { type: Type.INTEGER },
        xmin: { type: Type.INTEGER },
        ymax: { type: Type.INTEGER },
        xmax: { type: Type.INTEGER },
      },
      description: 'Normalized 0..1000 bounding box coordinates around the detected license plate.',
    },
  },
  required: ['plateDetected', 'rawPlateText', 'plateCountInImage', 'vehicleType', 'confidence', 'imageQualityIssues'],
};

export class GeminiAnprProvider implements AnprProvider {
  readonly id = 'gemini_vision' as const;
  readonly displayName = 'Gemini Vision Multimodal ANPR Engine';

  private getApiKey(): string | undefined {
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key || key === 'YOUR_GEMINI_API_KEY' || key.includes('PLACEHOLDER')) {
      return undefined;
    }
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
        errorCode: 'ANPR_PROVIDER_NOT_CONFIGURED',
        errorMessage:
          'Server ANPR Vision key (GEMINI_API_KEY) is not configured. Please set GEMINI_API_KEY in the server environment or use Manual Plate Entry.',
      };
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: input.mimeType,
                  data: input.imageBase64,
                },
              },
              {
                text: 'Detect the primary vehicle license plate in this gate image, extract the plate number, bounding box, vehicle type/brand/color, and confidence score.',
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: ANPR_RESPONSE_SCHEMA,
        },
      });

      const rawJson = response.text?.trim();
      if (!rawJson) {
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
          imageQualityIssues: ['empty_vision_response'],
          processingMs: Date.now() - start,
          errorCode: 'ANPR_EMPTY_RESPONSE',
          errorMessage: 'AI vision engine returned an empty response. Please rescan or enter plate manually.',
        };
      }

      const parsed = JSON.parse(rawJson);
      const rawPlateText = String(parsed.rawPlateText || '').trim();
      const normalizedPlate = normalizeIndianPlateServer(rawPlateText);
      const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence || 0))));
      const plateCountInImage = Number(parsed.plateCountInImage || (normalizedPlate ? 1 : 0));
      const plateDetected = Boolean(parsed.plateDetected && normalizedPlate.length >= 4);
      const imageQualityIssues: string[] = Array.isArray(parsed.imageQualityIssues)
        ? parsed.imageQualityIssues.map((x: unknown) => String(x))
        : [];
      if (plateCountInImage > 1 && !imageQualityIssues.includes('multiple_plates')) {
        imageQualityIssues.push('multiple_plates');
      }

      const candidatePlates = generateServerAmbiguityCandidates(normalizedPlate);
      const lowConfidence = !plateDetected || confidence < minConfidence;

      return {
        success: true,
        provider: this.id,
        plateDetected,
        rawPlateText,
        normalizedPlate,
        candidatePlates,
        plateCountInImage,
        vehicleType: parsed.vehicleType || 'Unknown',
        vehicleBrand: parsed.vehicleBrand ? String(parsed.vehicleBrand).trim() : undefined,
        vehicleColor: parsed.vehicleColor ? String(parsed.vehicleColor).trim() : undefined,
        confidence,
        lowConfidence,
        imageQualityIssues,
        ambiguityNote: parsed.ambiguityNote ? String(parsed.ambiguityNote).trim() : undefined,
        boundingBox: parsed.boundingBox || undefined,
        processingMs: Date.now() - start,
      };
    } catch (err: any) {
      console.error('[GeminiAnprProvider] Recognition error:', err?.message || err);
      const isTimeout = err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('timeout');
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
        imageQualityIssues: [isTimeout ? 'timeout' : 'vision_api_error'],
        processingMs: Date.now() - start,
        errorCode: isTimeout ? 'ANPR_TIMEOUT' : 'ANPR_PROVIDER_ERROR',
        errorMessage:
          err?.message ||
          'Unable to process vehicle image via AI ANPR service. Please retry or use manual plate entry.',
      };
    }
  }
}
