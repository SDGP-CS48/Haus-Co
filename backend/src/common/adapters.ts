import crypto from 'node:crypto';
import type { AppConfig } from './config.js';

export type SriLankanCarrier = 'DIALOG' | 'MOBITEL' | 'OTHER';

export interface OtpDispatchResult {
  dispatched: boolean;
  providerMode: 'DEMO_ADAPTER' | 'LIVE_GATEWAY';
  carrier: SriLankanCarrier;
  message: string;
  demoOtpCode?: string; // Only populated in explicit demo mode
}

export function detectSriLankanCarrier(phoneE164: string): SriLankanCarrier {
  const digits = phoneE164.replace(/\D/g, '');
  // Sri Lankan mobile prefixes: 077/076/074 -> Dialog; 071/070 -> Mobitel
  if (/^(94)?(77|76|74)/.test(digits)) return 'DIALOG';
  if (/^(94)?(71|70)/.test(digits)) return 'MOBITEL';
  return 'OTHER';
}

export function dispatchSriLankanOtp(
  phoneE164: string,
  code: string,
  config: AppConfig
): OtpDispatchResult {
  const carrier = detectSriLankanCarrier(phoneE164);
  if (config.otpProvider === 'demo' && config.demoMode) {
    return {
      dispatched: true,
      providerMode: 'DEMO_ADAPTER',
      carrier,
      message: `Demo OTP adapter active (${carrier} compatible route). No real SMS was sent.`,
      demoOtpCode: code,
    };
  }

  // Never fake OTP delivery in production mode when credentials are missing
  const hasDialogKey = Boolean(process.env.DIALOG_SMS_API_KEY);
  const hasMobitelKey = Boolean(process.env.MOBITEL_SMS_API_KEY);
  if (!hasDialogKey && !hasMobitelKey) {
    return {
      dispatched: false,
      providerMode: 'LIVE_GATEWAY',
      carrier,
      message: 'SMS gateway credentials (DIALOG_SMS_API_KEY / MOBITEL_SMS_API_KEY) are not configured.',
    };
  }

  return {
    dispatched: true,
    providerMode: 'LIVE_GATEWAY',
    carrier,
    message: `OTP queued via ${carrier} SMS gateway.`,
  };
}

export interface PayHereVerifyResult {
  valid: boolean;
  reason?: string;
}

export function verifyPayHereCallback(
  params: {
    merchantId: string;
    orderId: string;
    amount: string;
    currency: string;
    statusCode: string;
    md5sig: string;
  },
  config: AppConfig
): PayHereVerifyResult {
  if (config.payhereMode === 'demo' && config.demoMode) {
    return { valid: params.statusCode === '2' };
  }
  if (!config.payhereMerchantSecret || !config.payhereMerchantId) {
    return { valid: false, reason: 'PayHere merchant credentials are not configured on server.' };
  }
  const secretHash = crypto
    .createHash('md5')
    .update(config.payhereMerchantSecret)
    .digest('hex')
    .toUpperCase();
  const expectedSig = crypto
    .createHash('md5')
    .update(
      `${params.merchantId}${params.orderId}${params.amount}${params.currency}${params.statusCode}${secretHash}`
    )
    .digest('hex')
    .toUpperCase();
  if (expectedSig !== params.md5sig.toUpperCase()) {
    return { valid: false, reason: 'Invalid PayHere md5sig signature.' };
  }
  return { valid: params.statusCode === '2' };
}

export interface ExternalRetailerLink {
  retailer: 'Damro' | 'Singer Sri Lanka' | 'Arpico Furniture';
  searchQuery: string;
  url: string;
  sourceLabel: string;
  disclaimer: string;
}

export function buildExternalRetailerFallbackLinks(productName: string): ExternalRetailerLink[] {
  const encoded = encodeURIComponent(productName);
  const disclaimer =
    'External retailer search link (non-partner). Live stock & price must be confirmed directly on the external retailer website.';
  return [
    {
      retailer: 'Damro',
      searchQuery: productName,
      url: `https://www.damro.lk/?s=${encoded}`,
      sourceLabel: 'External Source: Damro',
      disclaimer,
    },
    {
      retailer: 'Singer Sri Lanka',
      searchQuery: productName,
      url: `https://www.singersl.com/search?q=${encoded}`,
      sourceLabel: 'External Source: Singer Sri Lanka',
      disclaimer,
    },
    {
      retailer: 'Arpico Furniture',
      searchQuery: productName,
      url: `https://arpicofurniture.com/?s=${encoded}`,
      sourceLabel: 'External Source: Arpico Furniture',
      disclaimer,
    },
  ];
}
