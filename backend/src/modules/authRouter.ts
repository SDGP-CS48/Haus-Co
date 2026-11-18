import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { ROLE_TO_PORTAL, type SystemRole } from '@hausco/shared';
import type { AppConfig } from '../common/config.js';
import { detectSriLankanCarrier, dispatchSriLankanOtp } from '../common/adapters.js';
import { hashOtp, hashPassword, maskNic, signJwt, verifyPassword } from '../common/crypto.js';
import { authenticate, createSimpleRateLimiter, type AuthenticatedRequest } from '../common/middleware.js';
import type { PlatformStore, StoredUser } from '../db/store.js';

const ROLES = [
  'HOME_BUILDER',
  'GENERAL_CONTRACTOR',
  'CIVIL_ENGINEER',
  'SHOP_OWNER',
  'SKILLED_WORKER',
  'PLATFORM_ADMIN',
] as const;

function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    email: u.email,
    phoneE164: u.phoneE164,
    fullName: u.fullName,
    role: u.role,
    portal: u.portal,
    verificationStatus: u.verificationStatus,
    phoneVerified: u.phoneVerified,
    createdAt: u.createdAt,
  };
}

export function createAuthRouter(store: PlatformStore, config: AppConfig): Router {
  const router = Router();
  const otpLimiter = createSimpleRateLimiter(20, 60_000);

  router.post('/register', (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      phoneE164: z.string().min(9).max(16),
      fullName: z.string().min(2).max(120),
      password: z.string().min(8),
      role: z.enum(ROLES),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid registration details', details: parsed.error.flatten() });
      return;
    }
    const { email, phoneE164, fullName, password, role } = parsed.data;
    if (role === 'PLATFORM_ADMIN') {
      res.status(403).json({ error: 'Platform Administrator accounts cannot be self-registered.' });
      return;
    }
    const existing = store.state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.phoneE164 === phoneE164
    );
    if (existing) {
      res.status(409).json({ error: 'An account with this email or phone number already exists.' });
      return;
    }
    const user: StoredUser = {
      id: `user-${crypto.randomUUID()}`,
      email: email.toLowerCase(),
      phoneE164,
      fullName,
      passwordHash: hashPassword(password),
      role,
      portal: ROLE_TO_PORTAL[role],
      verificationStatus: role === 'HOME_BUILDER' ? 'VERIFIED' : 'UNVERIFIED',
      phoneVerified: false,
      createdAt: new Date().toISOString(),
    };
    store.state.users.push(user);
    store.save();

    const token = signJwt(
      { sub: user.id, role: user.role, portal: ROLE_TO_PORTAL[user.role], fullName: user.fullName },
      config.jwtSecret
    );
    res.status(201).json({ token, user: sanitizeUser(user) });
  });

  router.post('/login', (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
      expectedRole: z.enum(ROLES).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and password are required.' });
      return;
    }
    const user = store.state.users.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (parsed.data.expectedRole && user.role !== parsed.data.expectedRole) {
      res.status(403).json({
        error: `Account belongs to role '${user.role}', not '${parsed.data.expectedRole}'. Select the matching role.`,
      });
      return;
    }
    const token = signJwt(
      { sub: user.id, role: user.role, portal: ROLE_TO_PORTAL[user.role], fullName: user.fullName },
      config.jwtSecret
    );
    res.json({ token, user: sanitizeUser(user) });
  });

  router.post('/demo-login', (req, res) => {
    if (!config.demoMode) {
      res.status(403).json({ error: 'Demo login is disabled outside demo mode.' });
      return;
    }
    const schema = z.object({ role: z.enum(ROLES) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid role is required.' });
      return;
    }
    const user = store.state.users.find((u) => u.role === (parsed.data.role as SystemRole));
    if (!user) {
      res.status(404).json({ error: 'Demo account not found for selected role.' });
      return;
    }
    const token = signJwt(
      { sub: user.id, role: user.role, portal: ROLE_TO_PORTAL[user.role], fullName: user.fullName },
      config.jwtSecret
    );
    res.json({
      token,
      user: sanitizeUser(user),
      demoNotice: 'Signed into clearly labelled Sample Demo account. Do not treat sample data as live market records.',
    });
  });

  router.post('/otp/request', otpLimiter, (req, res) => {
    const schema = z.object({ phoneE164: z.string().min(9).max(16) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid Sri Lankan phone number (+94...) is required.' });
      return;
    }
    const phone = parsed.data.phoneE164.trim();
    const code = String(crypto.randomInt(100000, 999999));
    const dispatch = dispatchSriLankanOtp(phone, code, config);
    if (!dispatch.dispatched) {
      res.status(503).json({ error: dispatch.message, carrier: dispatch.carrier });
      return;
    }

    const otpRecord = {
      id: `otp-${crypto.randomUUID()}`,
      phoneE164: phone,
      codeHash: hashOtp(code, phone),
      carrier: detectSriLankanCarrier(phone),
      attempts: 0,
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false,
    };
    store.state.otps.push(otpRecord);
    store.save();

    res.json({
      otpId: otpRecord.id,
      carrier: dispatch.carrier,
      providerMode: dispatch.providerMode,
      message: dispatch.message,
      expiresInSeconds: 300,
      demoOtpCode: dispatch.demoOtpCode,
    });
  });

  router.post('/otp/verify', otpLimiter, (req, res) => {
    const schema = z.object({
      otpId: z.string().min(1),
      phoneE164: z.string().min(9).max(16),
      code: z.string().length(6),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'OTP ID, phone number, and 6-digit code are required.' });
      return;
    }
    const otp = store.state.otps.find((o) => o.id === parsed.data.otpId && o.phoneE164 === parsed.data.phoneE164);
    if (!otp) {
      res.status(404).json({ error: 'OTP session not found.' });
      return;
    }
    if (otp.verified) {
      res.status(400).json({ error: 'OTP has already been used.' });
      return;
    }
    if (Date.now() > otp.expiresAt) {
      res.status(400).json({ error: 'OTP has expired. Request a new verification code.' });
      return;
    }
    if (otp.attempts >= 5) {
      res.status(429).json({ error: 'Maximum OTP verification attempts exceeded.' });
      return;
    }
    otp.attempts += 1;
    if (otp.codeHash !== hashOtp(parsed.data.code, otp.phoneE164)) {
      store.save();
      res.status(400).json({ error: 'Incorrect OTP code.' });
      return;
    }
    otp.verified = true;

    const matchingUser = store.state.users.find((u) => u.phoneE164 === otp.phoneE164);
    if (matchingUser) {
      matchingUser.phoneVerified = true;
    }
    store.save();

    res.json({
      verified: true,
      carrier: otp.carrier,
      user: matchingUser ? sanitizeUser(matchingUser) : null,
      token: matchingUser
        ? signJwt(
            {
              sub: matchingUser.id,
              role: matchingUser.role,
              portal: ROLE_TO_PORTAL[matchingUser.role],
              fullName: matchingUser.fullName,
            },
            config.jwtSecret
          )
        : null,
    });
  });

  router.post('/kyc', authenticate(config), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      nicNumber: z.string().min(9).max(15),
      credentialCode: z.string().min(3).max(64),
      documentName: z.string().min(3).max(140),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'NIC number, registration credential, and document filename are required.' });
      return;
    }
    const user = store.state.users.find((u) => u.id === req.auth!.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const submission = {
      id: `kyc-${crypto.randomUUID()}`,
      userId: user.id,
      nicMasked: maskNic(parsed.data.nicNumber),
      credentialCode: parsed.data.credentialCode.trim(),
      documentName: parsed.data.documentName.trim(),
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
    };
    store.state.kycSubmissions.unshift(submission);
    user.verificationStatus = 'PENDING_KYC';
    store.addAuditLog(user.id, 'SUBMIT_KYC', 'KYC_SUBMISSION', submission.id, {
      nicMasked: submission.nicMasked,
    });
    res.status(201).json({ submission, verificationStatus: user.verificationStatus });
  });

  router.get('/me', authenticate(config), (req: AuthenticatedRequest, res) => {
    const user = store.state.users.find((u) => u.id === req.auth!.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({
      user: sanitizeUser(user),
      entitlements: store.state.entitlements.filter((e) => e.userId === user.id),
    });
  });

  return router;
}
