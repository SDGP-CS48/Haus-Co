import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { auditBoqQuotation, type BoqItemInput } from '@hausco/shared';
import type { AppConfig } from '../common/config.js';
import { authenticate, requirePermission, requireRole, type AuthenticatedRequest } from '../common/middleware.js';
import type { PlatformStore, StoredBoq } from '../db/store.js';

export function createServicesRouter(store: PlatformStore, config: AppConfig): Router {
  const router = Router();

  router.get('/professionals', (req, res) => {
    const kind = req.query.type;
    const district = typeof req.query.district === 'string' ? req.query.district : '';
    let list = store.state.professionals;
    if (kind === 'CONTRACTOR' || kind === 'ENGINEER') {
      list = list.filter((p) => p.kind === kind);
    }
    if (district) {
      list = list.filter((p) => p.serviceDistricts.includes(district));
    }
    res.json({ professionals: list });
  });

  router.get('/bookings', authenticate(config), (req: AuthenticatedRequest, res) => {
    const role = req.auth!.role;
    const userId = req.auth!.sub;
    const bookings =
      role === 'PLATFORM_ADMIN'
        ? store.state.bookings
        : store.state.bookings.filter((b) => b.builderUserId === userId || b.providerUserId === userId);
    const reports =
      role === 'PLATFORM_ADMIN'
        ? store.state.engineerReports
        : store.state.engineerReports.filter(
            (r) =>
              r.engineerUserId === userId ||
              store.state.projects.some((p) => p.id === r.projectId && p.ownerUserId === userId)
          );
    res.json({ bookings, engineerReports: reports });
  });

  router.post('/bookings/voice-consult', authenticate(config), requirePermission('booking:create_own'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      projectId: z.string().min(1),
      providerUserId: z.string().min(1),
      notes: z.string().max(400).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Project ID and provider ID are required.' });
      return;
    }
    const pro = store.state.professionals.find((p) => p.userId === parsed.data.providerUserId);
    if (!pro) {
      res.status(404).json({ error: 'Professional not found.' });
      return;
    }
    const booking = {
      id: `book-${crypto.randomUUID()}`,
      projectId: parsed.data.projectId,
      builderUserId: req.auth!.sub,
      providerUserId: pro.userId,
      bookingType: 'WEBRTC_VOICE_CONSULT' as const,
      status: 'CONFIRMED' as const,
      amountLkr: 0,
      platformCommissionLkr: 0,
      roomToken: `webrtc-room-${crypto.randomUUID().slice(0, 8)}`,
      notes: parsed.data.notes ?? 'Free in-app WebRTC voice consultation bridge',
      createdAt: new Date().toISOString(),
    };
    store.state.bookings.unshift(booking);
    store.save();
    res.status(201).json({
      booking,
      webrtc: {
        iceServers: [{ urls: config.webrtcStunUrl }],
        mode: config.demoMode ? 'DEMO_SIGNALING_ADAPTER' : 'WEBRTC_BRIDGE',
        note: 'Zero-cost audio consultation channel initialised. Connect peer audio stream in browser WebRTC pane.',
      },
    });
  });

  router.post('/bookings/site-visit', authenticate(config), requirePermission('booking:create_own'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      projectId: z.string().min(1),
      engineerUserId: z.string().min(1),
      scheduledFor: z.string().min(4),
      notes: z.string().max(500).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Project, engineer, and scheduled date are required.' });
      return;
    }
    const eng = store.state.professionals.find(
      (p) => p.userId === parsed.data.engineerUserId && p.kind === 'ENGINEER'
    );
    if (!eng) {
      res.status(404).json({ error: 'Chartered civil engineer not found.' });
      return;
    }
    const commCfg = store.state.pricingConfigs.find((c) => c.key === 'ENGINEER_COMMISSION_PCT');
    const commPct = commCfg?.amountLkr ?? 15;
    const fee = eng.siteVisitFeeLkr;
    const commission = Math.round((fee * commPct) / 100);

    const booking = {
      id: `book-${crypto.randomUUID()}`,
      projectId: parsed.data.projectId,
      builderUserId: req.auth!.sub,
      providerUserId: eng.userId,
      bookingType: 'ENGINEER_SITE_VISIT' as const,
      status: 'PENDING_PAYMENT' as const,
      scheduledFor: parsed.data.scheduledFor,
      amountLkr: fee,
      platformCommissionLkr: commission,
      notes: parsed.data.notes ?? 'Soil inspection, land survey check & structural validation',
      createdAt: new Date().toISOString(),
    };
    store.state.bookings.unshift(booking);
    store.save();
    res.status(201).json({ booking });
  });

  router.post('/engineer/reports', authenticate(config), requirePermission('engineer:submit_report'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      bookingId: z.string().min(1),
      projectId: z.string().min(1),
      landQualitySummary: z.string().min(10).max(1200),
      soilBearingKpa: z.number().min(20).max(1000),
      recommendedFoundationDepthM: z.number().min(0.4).max(15),
      structuralLoadNotes: z.string().min(10).max(1200),
      planTechnicallyVerified: z.boolean(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete structural & soil report fields are required.' });
      return;
    }
    const report = {
      id: `rep-${crypto.randomUUID()}`,
      engineerUserId: req.auth!.sub,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };
    store.state.engineerReports.unshift(report);
    const booking = store.state.bookings.find((b) => b.id === parsed.data.bookingId);
    if (booking) {
      booking.status = 'COMPLETED';
    }
    store.addAuditLog(req.auth!.sub, 'PUBLISH_ENGINEER_REPORT', 'ENGINEER_REPORT', report.id, {
      projectId: report.projectId,
      planTechnicallyVerified: report.planTechnicallyVerified,
    });
    res.status(201).json({ report });
  });

  router.get('/projects/:id/boqs', authenticate(config), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (req.auth!.role === 'HOME_BUILDER' && project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }
    const boqs = store.state.boqs.filter((b) => b.projectId === project.id);
    res.json({ boqs });
  });

  router.post('/projects/:id/boqs', authenticate(config), requireRole('GENERAL_CONTRACTOR', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const schema = z.object({
      quoteMode: z.enum(['WITH_MATERIALS', 'WITHOUT_MATERIALS']),
      items: z
        .array(
          z.object({
            id: z.string(),
            stageKey: z.enum(['FOUNDATION', 'SUPERSTRUCTURE', 'ROOFING', 'MEP', 'FINISHES']),
            itemCode: z.string().min(2),
            description: z.string().min(2),
            unit: z.string().min(1),
            quantity: z.number().positive(),
            unitRateLkr: z.number().nonnegative(),
            labourMarkupPct: z.number().min(0).max(200),
          })
        )
        .min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid BOQ itemised payload.', details: parsed.error.flatten() });
      return;
    }
    const roughEst = project.estimates[0]?.methodATotalLkr ?? 30_000_000;
    const boqId = `boq-${crypto.randomUUID()}`;
    const audit = auditBoqQuotation({
      boqId,
      quoteMode: parsed.data.quoteMode,
      items: parsed.data.items as BoqItemInput[],
      roughEstimateTotalLkr: roughEst,
    });

    const boq: StoredBoq = {
      id: boqId,
      projectId: project.id,
      planVersionId: project.activePlanVersionId,
      contractorUserId: req.auth!.sub,
      contractorName: req.auth!.fullName,
      quoteMode: parsed.data.quoteMode,
      versionNumber: store.state.boqs.filter((b) => b.projectId === project.id).length + 1,
      items: parsed.data.items,
      audit,
      status: audit.flags.length > 0 ? 'UNDER_AUDIT' : 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    store.state.boqs.unshift(boq);
    store.save();
    res.status(201).json({ boq });
  });

  router.post('/boqs/:boqId/rebuttal', authenticate(config), requirePermission('boq:rebut'), (req: AuthenticatedRequest, res) => {
    const boq = store.state.boqs.find((b) => b.id === req.params.boqId);
    if (!boq) {
      res.status(404).json({ error: 'BOQ not found.' });
      return;
    }
    if (boq.contractorUserId !== req.auth!.sub && req.auth!.role !== 'PLATFORM_ADMIN') {
      res.status(403).json({ error: 'Only the submitting contractor can reply to this BOQ audit.' });
      return;
    }
    const schema = z.object({
      flagId: z.string().min(1),
      justification: z.string().min(5).max(800),
      revisedUnitRateLkr: z.number().positive().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Flag ID and justification text are required.' });
      return;
    }
    const flag = boq.audit.flags.find((f) => f.id === parsed.data.flagId);
    if (!flag) {
      res.status(404).json({ error: 'Audit flag not found.' });
      return;
    }

    flag.contractorRebuttal = parsed.data.justification.trim();
    flag.rebuttedAt = new Date().toISOString();
    if (parsed.data.revisedUnitRateLkr !== undefined && flag.boqItemId) {
      flag.revisedUnitRateLkr = parsed.data.revisedUnitRateLkr;
      const item = boq.items.find((i) => i.id === flag.boqItemId);
      if (item) {
        item.unitRateLkr = parsed.data.revisedUnitRateLkr;
      }
      // Recalculate BOQ total cleanly while preserving rebuttal text
      const project = store.state.projects.find((p) => p.id === boq.projectId);
      const roughEst = project?.estimates[0]?.methodATotalLkr ?? boq.audit.roughEstimateTotalLkr;
      const reAudited = auditBoqQuotation({
        boqId: boq.id,
        quoteMode: boq.quoteMode,
        items: boq.items,
        roughEstimateTotalLkr: roughEst,
      });
      boq.audit.quoteTotalLkr = reAudited.quoteTotalLkr;
      boq.audit.variancePct = reAudited.variancePct;
    }
    boq.status = 'REBUTTED';
    store.save();
    res.json({ boq });
  });

  return router;
}
