/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnprProvider, AnprProviderId } from './types';
import { GeminiAnprProvider } from './geminiProvider';
import { PlateRecognizerAdapter } from './externalAlprAdapter';

const geminiProvider = new GeminiAnprProvider();
const plateRecognizerAdapter = new PlateRecognizerAdapter();

export function getActiveAnprProvider(preferred?: string): AnprProvider {
  const providerId = (preferred || process.env.ANPR_PROVIDER || 'gemini_vision') as AnprProviderId;
  if (providerId === 'plate_recognizer') {
    return plateRecognizerAdapter;
  }
  return geminiProvider;
}

export function getAnprProvidersSummary() {
  const active = getActiveAnprProvider();
  return {
    activeProviderId: active.id,
    activeProviderName: active.displayName,
    activeProviderConfigured: active.isConfigured(),
    availableProviders: [
      {
        id: geminiProvider.id,
        name: geminiProvider.displayName,
        configured: geminiProvider.isConfigured(),
      },
      {
        id: plateRecognizerAdapter.id,
        name: plateRecognizerAdapter.displayName,
        configured: plateRecognizerAdapter.isConfigured(),
      },
    ],
  };
}
