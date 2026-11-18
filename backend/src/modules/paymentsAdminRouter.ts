import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { EntitlementType } from '@hausco/shared';
import { verifyPayHereCallback } from '../common/adapters.js';
import type { AppConfig } from '../common/config.js';
import { authenticate, requirePermission, type AuthenticatedRequest } from '../common/middleware.js';
import type { PlatformStore } from '../db/store.js';

export function createPaymentsAdminRouter(store: PlatformStore, config: AppConfig): Router {
  const router = Router();

  router.get('/pricing', (_req, res) => {
    res.json({ pricingConfigs: store.state.pricingConfigs });
  });

  router.get('/entitlements', authenticate(config), (req: AuthenticatedRequest, res) => {
    res.json({
      entitlements: store.state.entitlements.filter((e) => e.userId === req.auth!.sub),
      payments: store.state.payments.filter((p) => p.payerUserId === req.auth!.sub),
    });
  });

  router.post('/payments/checkout', authenticate(config), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      entitlementType: z.enum([
        'MODEL_3D_UNLOCK',
        'FURNITURE_PREMIUM_PLAN',
        'FURNITURE_MONTHLY_PASS',
        'CONTRACTOR_LEAD_UNLOCK',
        'SHOP_SUBSCRIPTION_FEATURED',
        'ENGINEER_SITE_VISIT',
      ]),
      resourceId: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid checkout request.' });
      return;
    }
    let amountLkr = 0;
    if (parsed.data.entitlementType === 'ENGINEER_SITE_VISIT') {
      const booking = store.state.bookings.find((b) => b.id === parsed.data.resourceId);
      if (!booking) {
        res.status(404).json({ error: 'Site visit booking not found.' });
        return;
      }
      amountLkr = booking.amountLkr;
    } else {
      const cfg = store.state.pricingConfigs.find((c) => c.key === parsed.data.entitlementType);
      amountLkr = cfg?.amountLkr ?? 2500;
    }

    const payment = {
      id: `pay-${crypto.randomUUID()}`,
      payerUserId: req.auth!.sub,
      provider: (config.payhereMode === 'demo' ? 'DEMO_ADAPTER' : 'PAYHERE') as 'PAYHERE' | 'DEMO_ADAPTER',
      externalOrderId: `HCO-${Date.now()}-${crypto.randomInt(1000, 9999)}`,
      entitlementType: parsed.data.entitlementType,
      resourceId: parsed.data.resourceId,
      amountLkr,
      status: 'INITIATED' as const,
      createdAt: new Date().toISOString(),
    };
    store.state.payments.unshift(payment);
    store.save();

    res.status(201).json({
      payment,
      payhereMode: config.payhereMode,
      demoNotice:
        config.payhereMode === 'demo'
          ? 'PayHere Demo Adapter active. Confirm via server verification callback to test entitlements without live card charges.'
          : undefined,
    });
  });

  // Idempotent payment callback verification (PayHere notify or Demo confirmation)
  router.post('/payments/payhere/notify', (req, res) => {
    const schema = z.object({
      orderId: z.string().min(1),
      statusCode: z.string().default('2'),
      merchantId: z.string().default(''),
      amount: z.string().default('0.00'),
      currency: z.string().default('LKR'),
      md5sig: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid callback payload.' });
      return;
    }
    const payment = store.state.payments.find((p) => p.externalOrderId === parsed.data.orderId);
    if (!payment) {
      res.status(404).json({ error: 'Payment order not found.' });
      return;
    }

    // Idempotent guard
    if (payment.status === 'VERIFIED') {
      res.json({ idempotent: true, payment });
      return;
    }

    const verification = verifyPayHereCallback(
      {
        merchantId: parsed.data.merchantId,
        orderId: parsed.data.orderId,
        amount: parsed.data.amount || payment.amountLkr.toFixed(2),
        currency: parsed.data.currency,
        statusCode: parsed.data.statusCode,
        md5sig: parsed.data.md5sig,
      },
      config
    );
    if (!verification.valid) {
      payment.status = 'FAILED';
      store.save();
      res.status(400).json({ error: verification.reason ?? 'Payment verification failed.' });
      return;
    }

    payment.status = 'VERIFIED';
    payment.verifiedAt = new Date().toISOString();

    if (payment.entitlementType === 'ENGINEER_SITE_VISIT') {
      const booking = store.state.bookings.find((b) => b.id === payment.resourceId);
      if (booking) booking.status = 'CONFIRMED';
    } else {
      const entType = payment.entitlementType as EntitlementType;
      const exists = store.state.entitlements.some(
        (e) => e.userId === payment.payerUserId && e.entitlementType === entType && e.resourceId === payment.resourceId
      );
      if (!exists) {
        store.state.entitlements.push({
          id: `ent-${crypto.randomUUID()}`,
          userId: payment.payerUserId,
          entitlementType: entType,
          resourceId: payment.resourceId,
          paymentId: payment.id,
          createdAt: payment.verifiedAt,
        });
      }
      if (entType === 'SHOP_SUBSCRIPTION_FEATURED') {
        const shop = store.state.shops.find((s) => s.id === payment.resourceId);
        if (shop) shop.subscriptionTier = 'FEATURED';
      }
    }

    store.addAuditLog(payment.payerUserId, 'VERIFY_PAYMENT', 'PAYMENT', payment.id, {
      entitlementType: payment.entitlementType,
      resourceId: payment.resourceId,
      amountLkr: payment.amountLkr,
    });
    res.json({ verified: true, payment });
  });

  // Admin Operations (protected by PLATFORM_ADMIN permissions)
  router.get('/admin/overview', authenticate(config), requirePermission('admin:view_audit_logs'), (_req, res) => {
    const verifiedRevenueLkr = store.state.payments
      .filter((p) => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + p.amountLkr, 0);
    res.json({
      metrics: {
        usersCount: store.state.users.length,
        projectsCount: store.state.projects.length,
        pendingKycCount: store.state.kycSubmissions.filter((k) => k.status === 'PENDING').length,
        boqsCount: store.state.boqs.length,
        verifiedRevenueLkr,
      },
      kycSubmissions: store.state.kycSubmissions,
      rateSets: store.state.rateSets,
      pricingConfigs: store.state.pricingConfigs,
      campaigns: store.state.campaigns,
      disputes: store.state.disputes,
      auditLogs: store.state.auditLogs.slice(0, 60),
    });
  });

  router.post('/admin/kyc/:id/decision', authenticate(config), requirePermission('admin:manage_kyc'), (req: AuthenticatedRequest, res) => {
    const sub = store.state.kycSubmissions.find((k) => k.id === req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'KYC submission not found.' });
      return;
    }
    const decision = req.body?.decision;
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      res.status(400).json({ error: 'Decision must be APPROVED or REJECTED.' });
      return;
    }
    sub.status = decision;
    sub.reviewNotes = typeof req.body?.reviewNotes === 'string' ? req.body.reviewNotes : undefined;
    const user = store.state.users.find((u) => u.id === sub.userId);
    if (user) {
      user.verificationStatus = decision === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
    }
    store.addAuditLog(req.auth!.sub, `KYC_${decision}`, 'KYC_SUBMISSION', sub.id, { userId: sub.userId });
    res.json({ submission: sub });
  });

  // Effective-dated versioned rate updates (historical estimates preserve prior rateSet!)
  router.post('/admin/rates', authenticate(config), requirePermission('admin:manage_rates'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      versionLabel: z.string().min(3).max(48),
      baseRateLkrPerSqm: z.number().min(50_000).max(2_000_000),
      isDemoSample: z.boolean().default(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid versionLabel and baseRateLkrPerSqm are required.' });
      return;
    }
    const current = store.state.rateSets[0]!;
    const newRateSet = {
      ...current,
      id: `rate-set-${crypto.randomUUID()}`,
      versionLabel: parsed.data.versionLabel,
      baseRateLkrPerSqm: parsed.data.baseRateLkrPerSqm,
      isDemoSample: parsed.data.isDemoSample,
      effectiveFrom: new Date().toISOString(),
    };
    store.state.rateSets.unshift(newRateSet);
    store.addAuditLog(req.auth!.sub, 'PUBLISH_RATE_SET', 'RATE_SET', newRateSet.id, {
      versionLabel: newRateSet.versionLabel,
      baseRateLkrPerSqm: newRateSet.baseRateLkrPerSqm,
    });
    res.status(201).json({ rateSet: newRateSet });
  });

  router.patch('/admin/pricing/:key', authenticate(config), requirePermission('admin:manage_rates'), (req: AuthenticatedRequest, res) => {
    const cfg = store.state.pricingConfigs.find((c) => c.key === req.params.key);
    if (!cfg) {
      res.status(404).json({ error: 'Pricing config key not found.' });
      return;
    }
    if (typeof req.body?.amountLkr !== 'number' || req.body.amountLkr < 0) {
      res.status(400).json({ error: 'Valid non-negative amountLkr is required.' });
      return;
    }
    cfg.amountLkr = req.body.amountLkr;
    store.addAuditLog(req.auth!.sub, 'UPDATE_PRICING_CONFIG', 'PRICING_CONFIG', cfg.key, {
      amountLkr: cfg.amountLkr,
    });
    res.json({ pricingConfig: cfg });
  });

  router.post('/admin/campaigns/:id/decision', authenticate(config), requirePermission('admin:manage_ads'), (req: AuthenticatedRequest, res) => {
    const camp = store.state.campaigns.find((c) => c.id === req.params.id);
    if (!camp) {
      res.status(404).json({ error: 'Campaign not found.' });
      return;
    }
    const status = req.body?.status;
    if (status !== 'ACTIVE' && status !== 'REJECTED' && status !== 'PAUSED') {
      res.status(400).json({ error: 'Status must be ACTIVE, PAUSED, or REJECTED.' });
      return;
    }
    camp.status = status;
    store.addAuditLog(req.auth!.sub, `CAMPAIGN_${status}`, 'AD_CAMPAIGN', camp.id);
    res.json({ campaign: camp });
  });

  router.post('/disputes', authenticate(config), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      projectId: z.string().min(1),
      subject: z.string().min(4).max(160),
      details: z.string().min(10).max(1200),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Subject and details are required.' });
      return;
    }
    const dispute = {
      id: `disp-${crypto.randomUUID()}`,
      raisedByUserId: req.auth!.sub,
      projectId: parsed.data.projectId,
      subject: parsed.data.subject,
      details: parsed.data.details,
      status: 'OPEN' as const,
      createdAt: new Date().toISOString(),
    };
    store.state.disputes.unshift(dispute);
    store.save();
    res.status(201).json({ dispute });
  });

  router.post('/admin/disputes/:id/resolve', authenticate(config), requirePermission('admin:manage_disputes'), (req: AuthenticatedRequest, res) => {
    const disp = store.state.disputes.find((d) => d.id === req.params.id);
    if (!disp) {
      res.status(404).json({ error: 'Dispute not found.' });
      return;
    }
    disp.status = 'RESOLVED';
    disp.resolutionNote = typeof req.body?.resolutionNote === 'string' ? req.body.resolutionNote : 'Resolved by operations.';
    store.addAuditLog(req.auth!.sub, 'RESOLVE_DISPUTE', 'DISPUTE', disp.id);
    res.json({ dispute: disp });
  });

  return router;
}
