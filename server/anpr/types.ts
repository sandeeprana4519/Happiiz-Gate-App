/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AnprProviderId = 'gemini_vision' | 'plate_recognizer' | 'cloud_vision_alpr';

export interface AnprImageInput {
  imageBase64: string;
  mimeType: string;
  minConfidence?: number;
}

export interface AnprBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface AnprProviderOutput {
  success: boolean;
  provider: AnprProviderId;
  plateDetected: boolean;
  rawPlateText: string;
  normalizedPlate: string;
  candidatePlates: string[];
  plateCountInImage: number;
  vehicleType: 'Car' | 'Motorcycle' | 'EV' | 'Auto' | 'Commercial' | 'Bicycle' | 'Unknown';
  vehicleBrand?: string;
  vehicleColor?: string;
  confidence: number;
  lowConfidence: boolean;
  imageQualityIssues: string[];
  ambiguityNote?: string;
  boundingBox?: AnprBoundingBox;
  processingMs: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface AnprProvider {
  readonly id: AnprProviderId;
  readonly displayName: string;
  isConfigured(): boolean;
  recognizePlate(input: AnprImageInput): Promise<AnprProviderOutput>;
}
