import crypto from 'node:crypto';
import type { PortalType, SystemRole } from '@hausco/shared';

export interface AuthTokenPayload {
  sub: string;
  role: SystemRole;
  portal: PortalType;
  fullName: string;
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replaceAll('-', '+').replaceAll('_', '/') + '==='.slice((input.length + 3) % 4);
  return Buffer.from(padded, 'base64');
}

export function signJwt(payload: Omit<AuthTokenPayload, 'exp'>, secret: string, ttlSeconds = 86400): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${encodedBody}`)
    .digest();
  return `${header}.${encodedBody}.${base64UrlEncode(signature)}`;
}

export function verifyJwt(token: string, secret: string): AuthTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts as [string, string, string];
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest()
  );
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(base64UrlDecode(body).toString('utf8')) as AuthTokenPayload;
    if (!parsed.sub || !parsed.role || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  return derived.length === keyBuf.length && crypto.timingSafeEqual(derived, keyBuf);
}

export function hashOtp(code: string, phone: string): string {
  return crypto.createHash('sha256').update(`${phone}:${code}`).digest('hex');
}

export function maskNic(nic: string): string {
  const trimmed = nic.trim();
  if (trimmed.length <= 4) return '****';
  return `${'*'.repeat(trimmed.length - 4)}${trimmed.slice(-4)}`;
}
