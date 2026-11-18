import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import {
  applyControlledPlanEdit,
  computeCostEstimate,
  evaluatePlotMetrics,
  generateConceptPlanVariants,
  getBoundingBox,
  JOURNEY_STAGES,
  type PlanEditToolCall,
  type PlanVersion,
} from '@hausco/shared';
import type { AppConfig } from '../common/config.js';
import { authenticate, requirePermission, type AuthenticatedRequest } from '../common/middleware.js';
import type { PlatformStore, StoredProject } from '../db/store.js';

function parseNaturalLanguageEdit(promptText: string, project: StoredProject): PlanEditToolCall {
  const lower = promptText.toLowerCase();
  const activePlan = project.planVersions.find((v) => v.id === project.activePlanVersionId);

  if (lower.includes('two storey') || lower.includes('2 storey') || lower.includes('two-storey')) {
    return { tool: 'set_storeys', storeys: 2 };
  }
  if (lower.includes('single storey') || lower.includes('1 storey') || lower.includes('single-storey')) {
    return { tool: 'set_storeys', storeys: 1 };
  }
  if (lower.includes('spacious') || lower.includes('traditional') || lower.includes('variant b')) {
    return { tool: 'change_style', variantCode: 'VARIANT_B_SPACIOUS' };
  }
  if (lower.includes('compact') || lower.includes('open-plan') || lower.includes('variant a')) {
    return { tool: 'change_style', variantCode: 'VARIANT_A_COMPACT' };
  }
  if (lower.includes('flat roof') || lower.includes('flat slab')) {
    return { tool: 'set_roof_type', roofType: 'FLAT_SLAB' };
  }
  if (lower.includes('hip roof')) {
    return { tool: 'set_roof_type', roofType: 'HIP' };
  }
  if (lower.includes('add bedroom') || lower.includes('extra bedroom') || lower.includes('another bedroom')) {
    return { tool: 'add_bedroom' };
  }

  // Room resize detection e.g. "expand living room by 1.2m" or "shrink master bedroom"
  const deltaMatch = lower.match(/(\d+(?:\.\d+)?)\s*m/);
  const deltaVal = deltaMatch ? Number(deltaMatch[1]) : 0.8;
  const sign = lower.includes('shrink') || lower.includes('reduce') || lower.includes('smaller') ? -1 : 1;
  const targetRoom =
    activePlan?.snapshot.rooms.find(
      (r) =>
        (lower.includes('living') && r.category === 'LIVING') ||
        (lower.includes('master') && r.category === 'MASTER_BEDROOM') ||
        (lower.includes('kitchen') && r.category === 'KITCHEN') ||
        (lower.includes('dining') && r.category === 'DINING')
    ) ?? activePlan?.snapshot.rooms[0];

  return {
    tool: 'resize_room',
    roomId: targetRoom?.id ?? 'room-living',
    deltaWidthM: sign * deltaVal,
  };
}

export function createProjectsRouter(store: PlatformStore, config: AppConfig): Router {
  const router = Router();

  router.get('/setback-rules', (_req, res) => {
    res.json({ rules: store.state.setbackRules });
  });

  router.get('/rates/active', (_req, res) => {
    const activeRateSet = store.state.rateSets[0]!;
    res.json({ rateSet: activeRateSet });
  });

  router.get('/projects', authenticate(config), (req: AuthenticatedRequest, res) => {
    const role = req.auth!.role;
    if (role === 'HOME_BUILDER') {
      const own = store.state.projects.filter((p) => p.ownerUserId === req.auth!.sub);
      res.json({ projects: own });
      return;
    }
    if (role === 'GENERAL_CONTRACTOR' || role === 'CIVIL_ENGINEER' || role === 'PLATFORM_ADMIN') {
      res.json({ projects: store.state.projects });
      return;
    }
    res.status(403).json({ error: 'Forbidden: Role cannot list builder construction projects.' });
  });

  router.post('/projects', authenticate(config), requirePermission('project:create'), (req: AuthenticatedRequest, res) => {
    const schema = z.object({
      title: z.string().min(3).max(140),
      district: z.string().min(2),
      setbackRuleId: z.string().optional(),
      onboardingPath: z.enum(['START_FROM_SCRATCH', 'UPLOAD_EXISTING_PLAN']),
      uploadedBlueprintName: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid project payload', details: parsed.error.flatten() });
      return;
    }
    const rule =
      store.state.setbackRules.find((r) => r.id === parsed.data.setbackRuleId) ??
      store.state.setbackRules.find((r) => r.district === parsed.data.district) ??
      store.state.setbackRules[0]!;

    const defaultVertices = [
      { x: 0, y: 0 },
      { x: 14, y: 0 },
      { x: 14, y: 18 },
      { x: 0, y: 18 },
    ];
    const plot = evaluatePlotMetrics(defaultVertices, rule);
    const bbox = getBoundingBox(plot.buildablePolygon);
    const gen = generateConceptPlanVariants(bbox.width, bbox.depth, {
      bedrooms: 3,
      bathrooms: 2,
      storeys: 1,
      roofType: 'GABLE',
    });
    const now = new Date().toISOString();
    const projectId = `proj-${crypto.randomUUID()}`;
    const planVersions: PlanVersion[] = [];
    if (gen.ok) {
      planVersions.push({
        id: `plan-${crypto.randomUUID()}`,
        projectId,
        versionNumber: 1,
        editSource: parsed.data.onboardingPath === 'UPLOAD_EXISTING_PLAN' ? 'UPLOAD' : 'INITIAL_GENERATOR',
        editSummary:
          parsed.data.onboardingPath === 'UPLOAD_EXISTING_PLAN'
            ? `Imported baseline geometry from uploaded blueprint (${parsed.data.uploadedBlueprintName ?? 'blueprint.pdf'}).`
            : 'Initial Variant A (Compact / Open-Plan) generated for plot.',
        snapshot: {
          ...gen.variants[0],
          variantCode: parsed.data.onboardingPath === 'UPLOAD_EXISTING_PLAN' ? 'UPLOADED_PLAN' : 'VARIANT_A_COMPACT',
        },
        isConfirmed: parsed.data.onboardingPath === 'UPLOAD_EXISTING_PLAN',
        createdAt: now,
      });
    }

    const activePlan = planVersions[0];
    const activeRateSet = store.state.rateSets[0]!;
    const initialEstimate = activePlan
      ? computeCostEstimate({
          planSnapshot: activePlan.snapshot,
          finishGrade: 'MID_RANGE',
          district: parsed.data.district,
          contingencyPct: activeRateSet.defaultContingencyPct,
          rateSet: activeRateSet,
        })
      : null;

    const project: StoredProject = {
      id: projectId,
      ownerUserId: req.auth!.sub,
      title: parsed.data.title.trim(),
      district: parsed.data.district,
      localAuthority: rule.authorityName,
      onboardingPath: parsed.data.onboardingPath,
      activeStage: parsed.data.onboardingPath === 'UPLOAD_EXISTING_PLAN' ? 'ROUGH_COST_ESTIMATE' : 'DRAW_PLOT',
      setbackRuleId: rule.id,
      plot,
      planVersions,
      activePlanVersionId: activePlan?.id ?? '',
      estimates: initialEstimate
        ? [
            {
              ...initialEstimate,
              id: `est-${crypto.randomUUID()}`,
              planVersionId: activePlan!.id,
              finishGrade: 'MID_RANGE',
              district: parsed.data.district,
              createdAt: now,
            },
          ]
        : [],
      documents: parsed.data.uploadedBlueprintName
        ? [
            {
              id: `doc-${crypto.randomUUID()}`,
              docType: 'EXTERNAL_PLAN',
              fileName: parsed.data.uploadedBlueprintName,
              mimeType: 'application/pdf',
              sizeBytes: 312400,
              uploadedAt: now,
            },
          ]
        : [],
      createdAt: now,
      updatedAt: now,
    };

    store.state.projects.unshift(project);
    store.save();
    res.status(201).json({ project });
  });

  router.get('/projects/:id', authenticate(config), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (
      req.auth!.role === 'HOME_BUILDER' &&
      project.ownerUserId !== req.auth!.sub
    ) {
      res.status(403).json({ error: 'Forbidden: You do not own this project.' });
      return;
    }
    res.json({ project });
  });

  router.patch('/projects/:id/stage', authenticate(config), requirePermission('plot:edit_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const validStage = JOURNEY_STAGES.find((s) => s.key === req.body?.activeStage);
    if (!validStage) {
      res.status(400).json({ error: 'Invalid journey stage key.' });
      return;
    }
    project.activeStage = validStage.key;
    project.updatedAt = new Date().toISOString();
    store.save();
    res.json({ project });
  });

  router.post('/projects/:id/documents', authenticate(config), requirePermission('project:create'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const schema = z.object({
      docType: z.enum(['EXTERNAL_PLAN', 'LAND_SURVEY', 'SOIL_REPORT', 'STRUCTURAL_REPORT', 'SITE_PHOTO']),
      fileName: z.string().min(3).max(160),
      mimeType: z.enum(['application/pdf', 'image/png', 'image/jpeg']),
      sizeBytes: z.number().int().positive().max(25_000_000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid document metadata or unsupported file type/size (max 25MB PDF/PNG/JPG).' });
      return;
    }
    const doc = {
      id: `doc-${crypto.randomUUID()}`,
      ...parsed.data,
      uploadedAt: new Date().toISOString(),
    };
    project.documents.unshift(doc);
    project.updatedAt = new Date().toISOString();
    store.save();
    res.status(201).json({ document: doc });
  });

  router.put('/projects/:id/plot', authenticate(config), requirePermission('plot:edit_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const schema = z.object({
      vertices: z.array(z.object({ x: z.number().min(0).max(500), y: z.number().min(0).max(500) })).min(3).max(20),
      setbackRuleId: z.string().optional(),
      customSetbacks: z
        .object({
          frontSetbackM: z.number().min(0).max(20),
          rearSetbackM: z.number().min(0).max(20),
          leftSetbackM: z.number().min(0).max(20),
          rightSetbackM: z.number().min(0).max(20),
        })
        .optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid plot vertices or setbacks.', details: parsed.error.flatten() });
      return;
    }
    const rule = store.state.setbackRules.find((r) => r.id === (parsed.data.setbackRuleId ?? project.setbackRuleId)) ?? store.state.setbackRules[0]!;
    const activeSetbacks = parsed.data.customSetbacks ?? rule;
    const metrics = evaluatePlotMetrics(parsed.data.vertices, activeSetbacks);
    if (!metrics.isValid) {
      res.status(422).json({ error: metrics.validationErrors.join(' '), plot: metrics });
      return;
    }
    project.setbackRuleId = rule.id;
    project.localAuthority = rule.authorityName;
    project.plot = metrics;
    project.updatedAt = new Date().toISOString();
    store.save();
    res.json({ plot: metrics, setbackRule: rule });
  });

  router.post('/projects/:id/plans/generate', authenticate(config), requirePermission('plan:generate_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const schema = z.object({
      bedrooms: z.number().int().min(1).max(6),
      bathrooms: z.number().int().min(1).max(4),
      storeys: z.union([z.literal(1), z.literal(2)]),
      roofType: z.enum(['GABLE', 'HIP', 'FLAT_SLAB', 'MONO_PITCH']),
      includeStudy: z.boolean().optional(),
      includeVerandah: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid plan requirements.' });
      return;
    }
    const bbox = getBoundingBox(project.plot.buildablePolygon);
    const result = generateConceptPlanVariants(bbox.width, bbox.depth, parsed.data);
    if (!result.ok) {
      res.status(422).json({ error: result.error });
      return;
    }
    const now = new Date().toISOString();
    const nextNum = project.planVersions.length + 1;
    const vA: PlanVersion = {
      id: `plan-${crypto.randomUUID()}`,
      projectId: project.id,
      versionNumber: nextNum,
      editSource: 'INITIAL_GENERATOR',
      editSummary: 'Variant A: Compact / Open-Plan concept generated within setback zone.',
      snapshot: result.variants[0],
      isConfirmed: false,
      createdAt: now,
    };
    const vB: PlanVersion = {
      id: `plan-${crypto.randomUUID()}`,
      projectId: project.id,
      versionNumber: nextNum + 1,
      editSource: 'INITIAL_GENERATOR',
      editSummary: 'Variant B: Spacious / Traditional concept generated within setback zone.',
      snapshot: result.variants[1],
      isConfirmed: false,
      createdAt: now,
    };
    project.planVersions.push(vA, vB);
    project.activePlanVersionId = vA.id;
    project.updatedAt = now;

    // Refresh rough estimate automatically
    const rateSet = store.state.rateSets[0]!;
    const est = computeCostEstimate({
      planSnapshot: vA.snapshot,
      finishGrade: 'MID_RANGE',
      district: project.district,
      contingencyPct: rateSet.defaultContingencyPct,
      rateSet,
    });
    project.estimates.unshift({
      ...est,
      id: `est-${crypto.randomUUID()}`,
      planVersionId: vA.id,
      finishGrade: 'MID_RANGE',
      district: project.district,
      createdAt: now,
    });

    store.save();
    res.status(201).json({ variants: [vA, vB], activePlanVersionId: vA.id, refreshedEstimate: project.estimates[0] });
  });

  router.post('/projects/:id/plans/ai-edit', authenticate(config), requirePermission('plan:generate_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const schema = z.object({
      prompt: z.string().min(2).max(400).optional(),
      toolCall: z
        .discriminatedUnion('tool', [
          z.object({
            tool: z.literal('resize_room'),
            roomId: z.string(),
            deltaWidthM: z.number().optional(),
            deltaDepthM: z.number().optional(),
          }),
          z.object({ tool: z.literal('add_bedroom'), name: z.string().optional() }),
          z.object({
            tool: z.literal('change_style'),
            variantCode: z.enum(['VARIANT_A_COMPACT', 'VARIANT_B_SPACIOUS']),
          }),
          z.object({ tool: z.literal('set_storeys'), storeys: z.union([z.literal(1), z.literal(2)]) }),
          z.object({
            tool: z.literal('set_roof_type'),
            roofType: z.enum(['GABLE', 'HIP', 'FLAT_SLAB', 'MONO_PITCH']),
          }),
        ])
        .optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || (!parsed.data.prompt && !parsed.data.toolCall)) {
      res.status(400).json({ error: 'Provide a natural language instruction or controlled toolCall.' });
      return;
    }

    const activePlan = project.planVersions.find((v) => v.id === project.activePlanVersionId);
    if (!activePlan) {
      res.status(404).json({ error: 'No active plan version found for project.' });
      return;
    }

    const toolCall = parsed.data.toolCall ?? parseNaturalLanguageEdit(parsed.data.prompt!, project);
    const bbox = getBoundingBox(project.plot.buildablePolygon);
    const editResult = applyControlledPlanEdit(activePlan.snapshot, toolCall, bbox.width, bbox.depth);
    if (!editResult.ok) {
      res.status(422).json({ error: editResult.error, rejectedTool: toolCall.tool });
      return;
    }

    const now = new Date().toISOString();
    const newVersion: PlanVersion = {
      id: `plan-${crypto.randomUUID()}`,
      projectId: project.id,
      versionNumber: project.planVersions.length + 1,
      editSource: 'AI_TOOL_EDIT',
      editSummary: editResult.summary,
      snapshot: editResult.next,
      isConfirmed: false,
      createdAt: now,
    };
    project.planVersions.push(newVersion);
    project.activePlanVersionId = newVersion.id;
    project.updatedAt = now;

    // Refresh cost estimate automatically on every accepted plan edit
    const rateSet = store.state.rateSets[0]!;
    const prevEst = project.estimates[0];
    const est = computeCostEstimate({
      planSnapshot: newVersion.snapshot,
      finishGrade: (prevEst?.finishGrade as 'STANDARD' | 'MID_RANGE' | 'PREMIUM') ?? 'MID_RANGE',
      district: project.district,
      contingencyPct: prevEst?.contingencyPctC ?? rateSet.defaultContingencyPct,
      rateSet,
    });
    project.estimates.unshift({
      ...est,
      id: `est-${crypto.randomUUID()}`,
      planVersionId: newVersion.id,
      finishGrade: prevEst?.finishGrade ?? 'MID_RANGE',
      district: project.district,
      createdAt: now,
    });

    store.save();
    res.json({
      toolUsed: toolCall.tool,
      planVersion: newVersion,
      refreshedEstimate: project.estimates[0],
    });
  });

  router.post('/projects/:id/plans/:versionId/confirm', authenticate(config), requirePermission('plan:generate_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const target = project.planVersions.find((v) => v.id === req.params.versionId);
    if (!target) {
      res.status(404).json({ error: 'Plan version not found.' });
      return;
    }
    project.planVersions.forEach((v) => {
      v.isConfirmed = v.id === target.id;
    });
    project.activePlanVersionId = target.id;
    project.updatedAt = new Date().toISOString();
    store.save();
    res.json({ confirmedPlanVersion: target });
  });

  // Server-enforced 3D Model View Entitlement Gate
  router.get('/projects/:id/plans/:versionId/3d-model', authenticate(config), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    if (req.auth!.role === 'HOME_BUILDER' && project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }
    const planVersion = project.planVersions.find((v) => v.id === req.params.versionId);
    if (!planVersion) {
      res.status(404).json({ error: 'Plan version not found.' });
      return;
    }
    const unlocked =
      req.auth!.role === 'PLATFORM_ADMIN' ||
      store.hasEntitlement(req.auth!.sub, 'MODEL_3D_UNLOCK', project.id);

    if (!unlocked) {
      const pricing = store.state.pricingConfigs.find((p) => p.key === 'MODEL_3D_UNLOCK');
      res.status(402).json({
        error: '3D Procedural Model View requires a paid one-time plan unlock.',
        requiredEntitlement: 'MODEL_3D_UNLOCK',
        resourceId: project.id,
        pricing,
      });
      return;
    }

    res.json({
      unlocked: true,
      planVersionId: planVersion.id,
      geometry: planVersion.snapshot,
    });
  });

  router.post('/projects/:id/estimates', authenticate(config), requirePermission('estimate:compute_own'), (req: AuthenticatedRequest, res) => {
    const project = store.state.projects.find((p) => p.id === req.params.id);
    if (!project || project.ownerUserId !== req.auth!.sub) {
      res.status(403).json({ error: 'Project not found or access denied.' });
      return;
    }
    const schema = z.object({
      planVersionId: z.string().optional(),
      finishGrade: z.enum(['STANDARD', 'MID_RANGE', 'PREMIUM']),
      district: z.string().min(2),
      contingencyPct: z.number().min(0).max(0.5),
      wallAllowanceW: z.number().min(0.05).max(0.4).optional(),
      stageSharesOverride: z
        .array(
          z.object({
            key: z.enum(['FOUNDATION', 'SUPERSTRUCTURE', 'ROOFING', 'MEP', 'FINISHES']),
            label: z.string(),
            sharePct: z.number().min(0).max(100),
          })
        )
        .length(5)
        .optional(),
      materialOverrides: z
        .array(
          z.object({
            materialCode: z.string(),
            coeffK: z.number().positive().optional(),
            wastePct: z.number().min(0).max(0.5).optional(),
          })
        )
        .optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid estimate inputs.', details: parsed.error.flatten() });
      return;
    }
    const planVersion =
      project.planVersions.find((v) => v.id === (parsed.data.planVersionId ?? project.activePlanVersionId)) ??
      project.planVersions[0];
    if (!planVersion) {
      res.status(400).json({ error: 'Generate or upload a plan before computing a cost estimate.' });
      return;
    }

    const activeRateSet = store.state.rateSets[0]!;
    const result = computeCostEstimate({
      planSnapshot: planVersion.snapshot,
      finishGrade: parsed.data.finishGrade,
      district: parsed.data.district,
      contingencyPct: parsed.data.contingencyPct,
      wallAllowanceW: parsed.data.wallAllowanceW,
      stageSharesOverride: parsed.data.stageSharesOverride,
      materialOverrides: parsed.data.materialOverrides,
      rateSet: activeRateSet,
    });

    const record = {
      ...result,
      id: `est-${crypto.randomUUID()}`,
      planVersionId: planVersion.id,
      finishGrade: parsed.data.finishGrade,
      district: parsed.data.district,
      createdAt: new Date().toISOString(),
    };
    project.estimates.unshift(record);
    project.updatedAt = record.createdAt;
    store.save();
    res.status(201).json({ estimate: record });
  });

  return router;
}
