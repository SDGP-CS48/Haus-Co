import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import type { AppConfig } from '../common/config.js';
import { PlatformStore } from '../db/store.js';

const testConfig: AppConfig = {
  nodeEnv: 'test',
  port: 4001,
  corsOrigin: '*',
  jwtSecret: 'test-secret-for-unit-suite',
  demoMode: true,
  sqlitePath: ':memory:',
  otpProvider: 'demo',
  payhereMode: 'demo',
  payhereMerchantId: '',
  payhereMerchantSecret: '',
  s3Bucket: 'test-bucket',
  webrtcStunUrl: 'stun:stun.l.google.com:19302',
};

describe('Haus & Co Backend API & Server-Enforced Gates', () => {
  let store: PlatformStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new PlatformStore(':memory:');
    app = createApp(store, testConfig);
  });

  it('enforces Free vs Premium furniture prices and unlocks via PayHere/demo payment verification', async () => {
    const loginRes = await request(app).post('/api/v1/auth/demo-login').send({ role: 'HOME_BUILDER' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    // Free user sees dimensions & store name, but priceLkr is null and shopPhone is omitted
    const freeProducts = await request(app)
      .get('/api/v1/marketplace/products?projectId=proj-sample-1')
      .set('Authorization', `Bearer ${token}`);
    expect(freeProducts.status).toBe(200);
    expect(freeProducts.body.pricesUnlocked).toBe(false);
    expect(freeProducts.body.products[0].priceLkr).toBeNull();
    expect(freeProducts.body.products[0].shopPhone).toBeUndefined();

    // Free user blocked from cross-store comparison (402)
    const freeCompare = await request(app)
      .get('/api/v1/marketplace/products/prod-sofa-1/compare?projectId=proj-sample-1')
      .set('Authorization', `Bearer ${token}`);
    expect(freeCompare.status).toBe(402);

    // Free user blocked from 3D model view (402)
    const locked3D = await request(app)
      .get('/api/v1/projects/proj-sample-1/plans/plan-v1/3d-model')
      .set('Authorization', `Bearer ${token}`);
    expect(locked3D.status).toBe(402);

    // Checkout & verify Furniture Premium entitlement
    const checkout = await request(app)
      .post('/api/v1/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ entitlementType: 'FURNITURE_PREMIUM_PLAN', resourceId: 'proj-sample-1' });
    expect(checkout.status).toBe(201);

    const notify = await request(app)
      .post('/api/v1/payments/payhere/notify')
      .send({ orderId: checkout.body.payment.externalOrderId, statusCode: '2' });
    expect(notify.status).toBe(200);
    expect(notify.body.verified).toBe(true);

    // Now prices & comparison are unlocked!
    const paidProducts = await request(app)
      .get('/api/v1/marketplace/products?projectId=proj-sample-1')
      .set('Authorization', `Bearer ${token}`);
    expect(paidProducts.body.pricesUnlocked).toBe(true);
    expect(paidProducts.body.products[0].priceLkr).toBeGreaterThan(0);
    expect(paidProducts.body.products[0].shopPhone).toBeDefined();

    const paidCompare = await request(app)
      .get('/api/v1/marketplace/products/prod-sofa-1/compare?projectId=proj-sample-1')
      .set('Authorization', `Bearer ${token}`);
    expect(paidCompare.status).toBe(200);
    expect(paidCompare.body.comparisons.some((c: { isLowestPrice: boolean }) => c.isLowestPrice)).toBe(true);
  });

  it('enforces RBAC permissions and prevents worker reviews before COMPLETED_PAID', async () => {
    const builderToken = (await request(app).post('/api/v1/auth/demo-login').send({ role: 'HOME_BUILDER' })).body.token;
    const workerToken = (await request(app).post('/api/v1/auth/demo-login').send({ role: 'SKILLED_WORKER' })).body.token;

    // Builder cannot access admin overview
    const adminAttempt = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${builderToken}`);
    expect(adminAttempt.status).toBe(403);

    // Builder books worker micro-task
    const jobRes = await request(app)
      .post('/api/v1/worker-jobs')
      .set('Authorization', `Bearer ${builderToken}`)
      .send({
        projectId: 'proj-sample-1',
        workerUserId: 'user-worker-1',
        title: 'Main DB board earthing test',
        scopeDescription: 'Install earth rod and test RCD trip latency for main distribution board.',
        agreedAmountLkr: 12000,
      });
    expect(jobRes.status).toBe(201);
    const jobId = jobRes.body.job.id as string;

    // Review MUST fail before COMPLETED_PAID
    const earlyReview = await request(app)
      .post(`/api/v1/worker-jobs/${jobId}/review`)
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ rating: 5, comment: 'Too early!' });
    expect(earlyReview.status).toBe(403);

    // Worker accepts, builder marks completed & paid, then review succeeds
    await request(app)
      .patch(`/api/v1/worker-jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ status: 'ACCEPTED' });
    await request(app)
      .patch(`/api/v1/worker-jobs/${jobId}/status`)
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ status: 'COMPLETED_PAID' });

    const validReview = await request(app)
      .post(`/api/v1/worker-jobs/${jobId}/review`)
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ rating: 5, comment: 'Clean RCD wiring and punctual handover.' });
    expect(validReview.status).toBe(201);
  });

  it('refuses to fake OTP in production mode without SMS gateway keys', async () => {
    const prodConfig: AppConfig = { ...testConfig, demoMode: false, otpProvider: 'dialog' };
    const prodApp = createApp(store, prodConfig);
    const res = await request(prodApp).post('/api/v1/auth/otp/request').send({ phoneE164: '+94771234567' });
    expect(res.status).toBe(503);
    expect(res.body.demoOtpCode).toBeUndefined();
  });

  it('validates controlled AI plan edits against plot setbacks and runs BOQ audit + rebuttal', async () => {
    const builderToken = (await request(app).post('/api/v1/auth/demo-login').send({ role: 'HOME_BUILDER' })).body.token;
    const contractorToken = (await request(app).post('/api/v1/auth/demo-login').send({ role: 'GENERAL_CONTRACTOR' })).body.token;

    // Invalid oversized room edit must fail server-side
    const invalidEdit = await request(app)
      .post('/api/v1/projects/proj-sample-1/plans/ai-edit')
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ prompt: 'Expand living room by 20m' });
    expect(invalidEdit.status).toBe(422);

    // Valid edit creates a new plan version and refreshes estimate
    const validEdit = await request(app)
      .post('/api/v1/projects/proj-sample-1/plans/ai-edit')
      .set('Authorization', `Bearer ${builderToken}`)
      .send({ prompt: 'Switch to 2 storeys' });
    expect(validEdit.status).toBe(200);
    expect(validEdit.body.planVersion.versionNumber).toBe(3);

    // Contractor submits BOQ missing waterproofing, triggering audit flag, then submits rebuttal
    const boqRes = await request(app)
      .post('/api/v1/projects/proj-sample-1/boqs')
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({
        quoteMode: 'WITH_MATERIALS',
        items: [
          {
            id: 'item-1',
            stageKey: 'FOUNDATION',
            itemCode: 'FND_EXCAVATION',
            description: 'Foundation excavation & rubble',
            unit: 'm3',
            quantity: 120,
            unitRateLkr: 14500,
            labourMarkupPct: 18,
          },
        ],
      });
    expect(boqRes.status).toBe(201);
    const missingFlag = boqRes.body.boq.audit.flags.find(
      (f: { flagType: string }) => f.flagType === 'MISSING_ITEM'
    );
    expect(missingFlag).toBeDefined();

    const rebuttal = await request(app)
      .post(`/api/v1/boqs/${boqRes.body.boq.id}/rebuttal`)
      .set('Authorization', `Bearer ${contractorToken}`)
      .send({
        flagId: missingFlag.id,
        justification: 'Roof waterproofing will be quoted after engineer confirms slab pitch.',
      });
    expect(rebuttal.status).toBe(200);
    expect(rebuttal.body.boq.status).toBe('REBUTTED');
  });
});
