/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountryCodeOption {
  code: string;
  flag: string;
  country: string;
  label: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
  example: string;
}

export const SUPPORTED_COUNTRY_CODES: CountryCodeOption[] = [
  {
    code: '+91',
    flag: '🇮🇳',
    country: 'India',
    label: 'India (+91)',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '98765 43210',
    example: '+919876543210',
  },
  {
    code: '+1',
    flag: '🇺🇸',
    country: 'USA / Canada',
    label: 'USA / Canada (+1)',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '202 555 0199',
    example: '+12025550199',
  },
  {
    code: '+44',
    flag: '🇬🇧',
    country: 'United Kingdom',
    label: 'UK (+44)',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '7911 123456',
    example: '+447911123456',
  },
  {
    code: '+971',
    flag: '🇦🇪',
    country: 'UAE',
    label: 'UAE (+971)',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '50 123 4567',
    example: '+971501234567',
  },
  {
    code: '+65',
    flag: '🇸🇬',
    country: 'Singapore',
    label: 'Singapore (+65)',
    minDigits: 8,
    maxDigits: 8,
    placeholder: '8123 4567',
    example: '+6581234567',
  },
  {
    code: '+61',
    flag: '🇦🇺',
    country: 'Australia',
    label: 'Australia (+61)',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '412 345 678',
    example: '+61412345678',
  },
];

/**
 * Normalizes a phone number to standard international E.164 format (+[countryCode][number]).
 */
export function normalizeToE164(
  countryCode: string,
  rawLocalNumber: string
): { e164: string; isValid: boolean; error?: string } {
  // 1. Clean country code
  const cleanCode = countryCode.trim().startsWith('+')
    ? countryCode.trim()
    : `+${countryCode.trim().replace(/\D/g, '')}`;

  // 2. Strip all non-digit characters from the local number
  let digitsOnly = rawLocalNumber.replace(/\D/g, '');

  // 3. Remove leading 0 if present (common in national dialing like UK/India: 09876543210 -> 9876543210)
  if (digitsOnly.startsWith('0')) {
    digitsOnly = digitsOnly.substring(1);
  }

  // 4. If the user pasted a full number that already includes the country code digits
  const countryDigits = cleanCode.replace('+', '');
  if (digitsOnly.startsWith(countryDigits) && digitsOnly.length > countryDigits.length + 6) {
    digitsOnly = digitsOnly.substring(countryDigits.length);
  }

  // Find country config
  const countryConfig = SUPPORTED_COUNTRY_CODES.find((c) => c.code === cleanCode);

  if (!digitsOnly) {
    return {
      e164: '',
      isValid: false,
      error: 'Please enter your mobile phone number.',
    };
  }

  if (countryConfig) {
    if (digitsOnly.length < countryConfig.minDigits) {
      return {
        e164: `${cleanCode}${digitsOnly}`,
        isValid: false,
        error: `${countryConfig.country} mobile numbers require at least ${countryConfig.minDigits} digits.`,
      };
    }
    if (digitsOnly.length > countryConfig.maxDigits) {
      return {
        e164: `${cleanCode}${digitsOnly}`,
        isValid: false,
        error: `${countryConfig.country} mobile numbers cannot exceed ${countryConfig.maxDigits} digits.`,
      };
    }
  } else if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return {
      e164: `${cleanCode}${digitsOnly}`,
      isValid: false,
      error: 'Phone number length is invalid for international E.164 standard.',
    };
  }

  // Valid canonical E.164 string
  return {
    e164: `${cleanCode}${digitsOnly}`,
    isValid: true,
  };
}

/**
 * Checks whether a phone number matches known Firebase testing phone numbers.
 * Firebase allows configuring test phone numbers in the Console with fixed OTPs.
 */
export function isLikelyTestPhoneNumber(phoneNumberE164: string): boolean {
  const digits = phoneNumberE164.replace(/\D/g, '');
  // Common test patterns: 9999999999, 1234567890, 5555555555, 0000000000
  return (
    digits.endsWith('9999999999') ||
    digits.endsWith('1234567890') ||
    digits.endsWith('5555550100') ||
    digits.endsWith('0000000000') ||
    phoneNumberE164.includes('+919999999999') ||
    phoneNumberE164.includes('+15555550100')
  );
}
