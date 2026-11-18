import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import {
  evaluateFurnitureFit,
  type FurnitureProduct,
  type JourneyStage,
  type PlacedFurnitureItem,
} from '@hausco/shared';
import { buildExternalRetailerFallbackLinks } from '../common/adapters.js';
import type { AppConfig } from '../common/config.js';
import {
  authenticate,
  optionalAuthenticate,
  requirePermission,
  requireRole,
  type AuthenticatedRequest,
} from '../common/middleware.js';
import type { PlatformStore } from '../db/store.js';

function isFurniturePremiumUnlocked(store: PlatformStore, req: AuthenticatedRequest, projectId?: string): boolean {
  if (!req.auth) return false;
  if (req.auth.role === 'SHOP_OWNER' || req.auth.role === 'PLATFORM_ADMIN') return true;
  if (store.hasEntitlement(req.auth.sub, 'FURNITURE_MONTHLY_PASS', 'GLOBAL')) return true;
  if (projectId && store.hasEntitlement(req.auth.sub, 'FURNITURE_PREMIUM_PLAN', projectId)) return true;
  return false;
}

function projectProductForViewer(
  product: PlatformStore['state']['products'][number],
  showPricesAndContact: boolean
): FurnitureProduct {
  return {
    id: product.id,
    shopId: product.shopId,
    shopName: product.shopName,
    shopDistrict: product.shopDistrict,
    shopAddress: product.shopAddress,
    shopPhone: showPricesAndContact ? product.rawShopPhone : undefined,
    sku: product.sku,
    name: product.name,
    productKind: product.productKind,
    category: product.category,
    widthM: product.widthM,
    depthM: product.depthM,
    heightM: product.heightM,
    material: product.material,
    colour: product.colour,
    priceLkr: showPricesAndContact ? product.rawPriceLkr : null,
    inStock: product.inStock,
    footprintShape: product.footprintShape,
    priceUpdatedAt: product.priceUpdatedAt,
    isSampleData: product.isSampleData,
  };
}

export function createMarketplaceRouter(store: PlatformStore, config: AppConfig): Router {
  const router = Router();

  // Public or authenticated product browse — enforces Free vs Premium rules server-side!
  router.get('/marketplace/products', optionalAuthenticate(config), (req: AuthenticatedRequest, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const search = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : '';

    const unlocked = isFurniturePremiumUnlocked(store, req, projectId);
    let items = store.state.products;
    if (kind === 'FURNITURE' || kind === 'HARDWARE') {
      items = items.filter((p) => p.productKind === kind);
    }
    if (category) {
      items = items.filter((p) => p.category === category);
    }
    if (search) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.material.toLowerCase().includes(search) ||
          p.shopName.toLowerCase().includes(search)
      );
    }
    res.json({
      pricesUnlocked: unlocked,
      products: items.map((p) => projectProductForViewer(p, unlocked)),
    });
  });

  // Premium-only cross-store price comparison
  router.get('/marketplace/products/:id/compare', authenticate(config), (req: AuthenticatedRequest, res) => {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const unlocked = isFurniturePremiumUnlocked(store, req, projectId);
    if (!unlocked) {
      res.status(402).json({
        error: 'Cross-store price comparison requires Furniture Premium unlock.',
        requiredEntitlement: 'FURNITURE_PREMIUM_PLAN',
      });
      return;
    }
    const base = store.state.products.find((p) => p.id === req.params.id);
    if (!base) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const matches = store.state.products
      .filter((p) => p.category === base.category && p.productKind === base.productKind)
      .sort((a, b) => a.rawPriceLkr - b.rawPriceLkr)
      .map((p, idx) => ({
        ...projectProductForViewer(p, true),
        isLowestPrice: idx === 0,
      }));
    res.json({ baseProductId: base.id, comparisons: matches });
  });

  // External retailer fallback for out-of-stock products
  router.post('/marketplace/external-fallback', (req, res) => {
    const productName = typeof req.body?.productName === 'string' ? req.body.productName.trim() : '';
    if (!productName) {
      res.status(400).json({ error: 'productName is required.' });
      return;
    }
    res.json({
      isExternalFallback: true,
      links: buildExternalRetailerFallbackLinks(productName),
    });
  });

  // Furniture placement & fit check inside a project's active plan
  router.get('/projects/:id/furniture/placements', authenticate(config), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || (req.auth!.role === 'HOME_BUILDER' && project.ownerUserId !== req.auth!.sub)) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const activePlan = project.planVersions.find((v) => v.id === project.activePlanVersionId);
    const placements = store.state.placements.filter(
      (p) => p.projectId === project.id && p.planVersionId === project.activePlanVersionId
    );
    const fitChecks = placements.map((pl) => {
      const room = activePlan?.snapshot.rooms.find((r) => r.id === pl.roomId);
      if (!room || !activePlan) {
        return { placementId: pl.id, status: 'DOES_NOT_FIT' as const, reasons: ['Room missing in active plan.'], clearanceMinM: 0 };
      }
      return evaluateFurnitureFit(pl, room, activePlan.snapshot.openings, placements);
    });

    const unlocked = isFurniturePremiumUnlocked(store, req, project.id);
    const shoppingList = placements.map((pl) => {
      const prod = store.state.products.find((pr) => pr.id === pl.productId);
      return {
        placementId: pl.id,
        productId: pl.productId,
        productName: prod?.name ?? pl.name,
        dimensions: prod ? `${prod.widthM}m × ${prod.depthM}m × ${prod.heightM}m` : `${pl.widthM}m × ${pl.depthM}m`,
        roomId: pl.roomId,
        shopName: prod?.shopName ?? 'Sample Store',
        shopAddress: prod?.shopAddress ?? '',
        shopPhone: unlocked ? prod?.rawShopPhone : undefined,
        inStock: prod?.inStock ?? false,
        priceLkr: unlocked ? (prod?.rawPriceLkr ?? null) : null,
      };
    });

    const totalBudgetLkr = unlocked
      ? shoppingList.reduce((acc, item) => acc + (item.priceLkr ?? 0), 0)
      : null;

    res.json({
      pricesUnlocked: unlocked,
      placements,
      fitChecks,
      shoppingList,
      totalBudgetLkr,
    });
  });

  router.post('/projects/:id/furniture/placements', authenticate(config), requirePermission('furniture:place_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const schema = z.object({
      productId: z.string().min(1),
      roomId: z.string().min(1),
      x: z.number(),
      y: z.number(),
      rotationDeg: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid placement coordinates.' });
      return;
    }
    const product = store.state.products.find((p) => p.id === parsed.data.productId);
    if (!product) {
      res.status(404).json({ error: 'Furniture product not found.' });
      return;
    }
    const activePlan = project.planVersions.find((v) => v.id === project.activePlanVersionId);
    const room = activePlan?.snapshot.rooms.find((r) => r.id === parsed.data.roomId);
    if (!activePlan || !room) {
      res.status(404).json({ error: 'Target room not found in active plan.' });
      return;
    }

    const placement: PlacedFurnitureItem & { projectId: string; planVersionId: string } = {
      id: `place-${crypto.randomUUID()}`,
      projectId: project.id,
      planVersionId: activePlan.id,
      productId: product.id,
      name: product.name,
      roomId: room.id,
      x: parsed.data.x,
      y: parsed.data.y,
      widthM: product.widthM,
      depthM: product.depthM,
      rotationDeg: parsed.data.rotationDeg,
    };

    const existing = store.state.placements.filter(
      (p) => p.projectId === project.id && p.planVersionId === activePlan.id
    );
    const fit = evaluateFurnitureFit(placement, room, activePlan.snapshot.openings, existing);
    store.state.placements.push(placement);
    store.save();

    res.status(201).json({ placement, fit });
  });

  router.delete('/projects/:id/furniture/placements/:placementId', authenticate(config), requirePermission('furniture:place_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    store.state.placements = store.state.placements.filter((p) => p.id !== req.params.placementId);
    store.save();
    res.json({ deleted: true });
  });

  // Premium-only store booking / reservation lead
  router.post('/marketplace/bookings', authenticate(config), requirePermission('furniture:place_own'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      projectId: z.string().min(1),
      productId: z.string().min(1),
      roomName: z.string().min(1),
      leadType: z.enum(['BOOKING_REQUEST', 'CALL_CLICK']).default('BOOKING_REQUEST'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Project, product, and room name are required.' });
      return;
    }
    if (!isFurniturePremiumUnlocked(store, req, parsed.data.projectId)) {
      res.status(402).json({
        error: 'Store booking & tap-to-call leads require Furniture Premium unlock.',
        requiredEntitlement: 'FURNITURE_PREMIUM_PLAN',
      });
      return;
    }
    const prod = store.state.products.find((p) => p.id === parsed.data.productId);
    if (!prod) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const lead = {
      id: `lead-${crypto.randomUUID()}`,
      shopId: prod.shopId,
      builderUserId: req.auth!.sub,
      builderName: req.auth!.fullName,
      projectId: parsed.data.projectId,
      roomName: parsed.data.roomName,
      productId: prod.id,
      productName: prod.name,
      leadType: parsed.data.leadType,
      status: 'NEW' as const,
      createdAt: new Date().toISOString(),
    };
    store.state.shopLeads.unshift(lead);
    store.save();
    res.status(201).json({ lead });
  });

  // Shop Owner Portal endpoints
  router.get('/shop/dashboard', authenticate(config), requireRole('SHOP_OWNER', 'PLATFORM_ADMIN'), (req: AuthenticatedRequest, res) => {
    const shops =
      req.auth!.role === 'PLATFORM_ADMIN'
        ? store.state.shops
        : store.state.shops.filter((s) => s.ownerUserId === req.auth!.sub);
    const shopIds = new Set(shops.map((s) => s.id));
    const products = store.state.products
      .filter((p) => shopIds.has(p.shopId))
      .map((p) => projectProductForViewer(p, true));
    const leads = store.state.shopLeads.filter((l) => shopIds.has(l.shopId));
    const campaigns = store.state.campaigns.filter((c) => shopIds.has(c.shopId));
    res.json({ shops, products, leads, campaigns });
  });

  router.post('/shop/products', authenticate(config), requirePermission('shop:manage_inventory'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      shopId: z.string().min(1),
      name: z.string().min(2).max(120),
      sku: z.string().min(2).max(40),
      productKind: z.enum(['FURNITURE', 'HARDWARE']),
      category: z.string().min(2).max(40),
      widthM: z.number().positive().max(20),
      depthM: z.number().positive().max(20),
      heightM: z.number().positive().max(10),
      material: z.string().min(2),
      colour: z.string().min(2),
      priceLkr: z.number().positive(),
      inStock: z.boolean(),
      footprintShape: z.enum(['RECTANGLE', 'CIRCLE', 'L_SHAPE']).default('RECTANGLE'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product specification.', details: parsed.error.flatten() });
      return;
    }
    const shop = store.state.shops.find((s) => s.id === parsed.data.shopId && s.ownerUserId === req.auth!.sub);
    if (!shop) {
      res.status(403).json({ error: 'Shop not found or access denied.' });
      return;
    }
    const created = {
      id: `prod-${crypto.randomUUID()}`,
      shopId: shop.id,
      shopName: shop.storeName,
      shopDistrict: shop.district,
      shopAddress: shop.address,
      rawShopPhone: shop.contactPhone,
      sku: parsed.data.sku,
      name: parsed.data.name,
      productKind: parsed.data.productKind,
      category: parsed.data.category,
      widthM: parsed.data.widthM,
      depthM: parsed.data.depthM,
      heightM: parsed.data.heightM,
      material: parsed.data.material,
      colour: parsed.data.colour,
      rawPriceLkr: parsed.data.priceLkr,
      priceLkr: parsed.data.priceLkr,
      inStock: parsed.data.inStock,
      footprintShape: parsed.data.footprintShape,
      priceUpdatedAt: new Date().toISOString(),
      isSampleData: false,
    };
    store.state.products.unshift(created);
    store.save();
    res.status(201).json({ product: projectProductForViewer(created, true) });
  });

  router.patch('/shop/products/:id', authenticate(config), requirePermission('shop:manage_inventory'), (req: AuthenticatedRequest, res) => {
    const prod = store.state.products.find((p) => p.id === req.params.id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const shop = store.state.shops.find((s) => s.id === prod.shopId && s.ownerUserId === req.auth!.sub);
    if (!shop && req.auth!.role !== 'PLATFORM_ADMIN') {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    if (typeof req.body?.inStock === 'boolean') prod.inStock = req.body.inStock;
    if (typeof req.body?.priceLkr === 'number' && req.body.priceLkr > 0) {
      prod.rawPriceLkr = req.body.priceLkr;
      prod.priceLkr = req.body.priceLkr;
    }
    prod.priceUpdatedAt = new Date().toISOString();
    store.save();
    res.json({ product: projectProductForViewer(prod, true) });
  });

  router.post('/shop/campaigns', authenticate(config), requirePermission('shop:manage_ads'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      shopId: z.string().min(1),
      title: z.string().min(5).max(160),
      targetStage: z.enum([
        'DRAW_PLOT',
        'GENERATE_2D_PLAN',
        'ROUGH_COST_ESTIMATE',
        'ENGINEER_AND_CONTRACTOR',
        'BOQ_AUDIT',
        'FURNISH_SPACE',
        'HIRE_WORKERS',
      ]),
      billingModel: z.enum(['CPM', 'CPC']),
      budgetLkr: z.number().min(2000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid campaign parameters.' });
      return;
    }
    const shop = store.state.shops.find((s) => s.id === parsed.data.shopId && s.ownerUserId === req.auth!.sub);
    if (!shop) {
      res.status(403).json({ error: 'Shop not found or access denied.' });
      return;
    }
    const campaign = {
      id: `ad-${crypto.randomUUID()}`,
      shopId: shop.id,
      shopName: shop.storeName,
      title: parsed.data.title,
      targetStage: parsed.data.targetStage as JourneyStage,
      billingModel: parsed.data.billingModel,
      budgetLkr: parsed.data.budgetLkr,
      impressions: 0,
      clicks: 0,
      status: 'PENDING_APPROVAL' as const,
      createdAt: new Date().toISOString(),
    };
    store.state.campaigns.unshift(campaign);
    store.save();
    res.status(201).json({ campaign });
  });

  router.get('/campaigns/active', (req, res) => {
    const stage = typeof req.query.stage === 'string' ? req.query.stage : '';
    const active = store.state.campaigns.filter(
      (c) => c.status === 'ACTIVE' && (!stage || c.targetStage === stage)
    );
    active.forEach((c) => {
      c.impressions += 1;
    });
    if (active.length > 0) store.save();
    res.json({ campaigns: active });
  });

  router.post('/campaigns/:id/click', (req, res) => {
    const camp = store.state.campaigns.find((c) => c.id === req.params.id && c.status === 'ACTIVE');
    if (!camp) {
      res.status(404).json({ error: 'Campaign not active.' });
      return;
    }
    camp.clicks += 1;
    store.save();
    res.json({ clicks: camp.clicks });
  });

  // Skilled Worker Marketplace & Completion-Gated Reviews
  router.get('/workers', (req, res) => {
    const trade = typeof req.query.trade === 'string' ? req.query.trade : '';
    const district = typeof req.query.district === 'string' ? req.query.district : '';
    let workers = store.state.workers;
    if (trade) workers = workers.filter((w) => w.tradeCategory === trade);
    if (district) workers = workers.filter((w) => w.district === district);

    const enriched = workers.map((w) => {
      const reviews = store.state.workerJobs
        .filter((j) => j.workerUserId === w.userId && j.review)
        .map((j) => j.review!);
      return { ...w, reviews };
    });
    res.json({ workers: enriched });
  });

  router.get('/worker-jobs', authenticate(config), (req: AuthenticatedRequest, res) => {
    const userId = req.auth!.sub;
    const role = req.auth!.role;
    const jobs =
      role === 'PLATFORM_ADMIN'
        ? store.state.workerJobs
        : store.state.workerJobs.filter((j) => j.builderUserId === userId || j.workerUserId === userId);
    res.json({ jobs });
  });

  router.post('/worker-jobs', authenticate(config), requirePermission('worker:create_job'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      projectId: z.string().min(1),
      workerUserId: z.string().min(1),
      title: z.string().min(4).max(120),
      scopeDescription: z.string().min(10).max(800),
      agreedAmountLkr: z.number().min(1000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Job title, clear scope description, and amount are required.' });
      return;
    }
    const worker = store.state.workers.find((w) => w.userId === parsed.data.workerUserId);
    if (!worker) {
      res.status(404).json({ error: 'Skilled worker not found.' });
      return;
    }
    const commCfg = store.state.pricingConfigs.find((c) => c.key === 'WORKER_JOB_COMMISSION_LKR');
    const job = {
      id: `job-${crypto.randomUUID()}`,
      projectId: parsed.data.projectId,
      builderUserId: req.auth!.sub,
      workerUserId: worker.userId,
      workerName: worker.fullName,
      title: parsed.data.title,
      scopeDescription: parsed.data.scopeDescription,
      agreedAmountLkr: parsed.data.agreedAmountLkr,
      platformCommissionLkr: commCfg?.amountLkr ?? 500,
      status: 'REQUESTED' as const,
      createdAt: new Date().toISOString(),
    };
    store.state.workerJobs.unshift(job);
    store.save();
    res.status(201).json({ job });
  });

  router.patch('/worker-jobs/:id/status', authenticate(config), (req: AuthenticatedRequest, res) => {
    const job = store.state.workerJobs.find((j) => j.id === req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job booking not found.' });
      return;
    }
    const status = req.body?.status;
    const isWorker = req.auth!.role === 'SKILLED_WORKER' && job.workerUserId === req.auth!.sub;
    const isBuilder = req.auth!.role === 'HOME_BUILDER' && job.builderUserId === req.auth!.sub;
    if (!isWorker && !isBuilder && req.auth!.role !== 'PLATFORM_ADMIN') {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }
    if ((status === 'ACCEPTED' || status === 'IN_PROGRESS') && (isWorker || req.auth!.role === 'PLATFORM_ADMIN')) {
      job.status = status;
      store.save();
      res.json({ job });
      return;
    }
    if (status === 'COMPLETED_PAID' && (isBuilder || req.auth!.role === 'PLATFORM_ADMIN')) {
      job.status = 'COMPLETED_PAID';
      store.save();
      res.json({ job });
      return;
    }
    res.status(400).json({ error: 'Invalid status transition for your role.' });
  });

  // Server-enforced review gate: reviews unlock ONLY after COMPLETED_PAID!
  router.post('/worker-jobs/:id/review', authenticate(config), requirePermission('worker:review_completed_job'), (req: AuthenticatedRequest, res) => {
    const job = store.state.workerJobs.find((j) => j.id === req.params.id);
    if (!job || job.builderUserId !== req.auth!.sub) {
      res.status(404).json({ error: 'Job booking not found.' });
      return;
    }
    if (job.status !== 'COMPLETED_PAID') {
      res.status(403).json({
        error: 'Verified reviews unlock only after the job is marked completed and paid through the platform.',
      });
      return;
    }
    const schema = z.object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().min(4).max(500),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Rating (1-5) and review comment are required.' });
      return;
    }
    job.review = {
      rating: parsed.data.rating,
      comment: parsed.data.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    store.save();
    res.status(201).json({ job });
  });

  return router;
}
