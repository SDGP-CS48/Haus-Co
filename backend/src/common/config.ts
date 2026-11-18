import path from 'node:path';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  demoMode: boolean;
  sqlitePath: string;
  otpProvider: 'demo' | 'dialog' | 'mobitel';
  payhereMode: 'demo' | 'sandbox' | 'live';
  payhereMerchantId: string;
  payhereMerchantSecret: string;
  s3Bucket: string;
  webrtcStunUrl: string;
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const demoMode = (process.env.DEMO_MODE ?? 'true').toLowerCase() === 'true';
  return {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET ?? 'hausco-local-dev-ephemeral-secret-change-in-prod',
    demoMode,
    sqlitePath: process.env.SQLITE_PATH ?? path.resolve(process.cwd(), 'data', 'hausco-demo.sqlite'),
    otpProvider: (process.env.OTP_PROVIDER as AppConfig['otpProvider']) ?? 'demo',
    payhereMode: (process.env.PAYHERE_MODE as AppConfig['payhereMode']) ?? 'demo',
    payhereMerchantId: process.env.PAYHERE_MERCHANT_ID ?? '',
    payhereMerchantSecret: process.env.PAYHERE_MERCHANT_SECRET ?? '',
    s3Bucket: process.env.S3_BUCKET ?? 'hausco-private-docs',
    webrtcStunUrl: process.env.WEBRTC_STUN_URL ?? 'stun:stun.l.google.com:19302',
  };
}
