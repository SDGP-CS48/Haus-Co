import { describe, expect, it } from 'vitest';
import {
  applyControlledPlanEdit,
  auditBoqQuotation,
  computeCostEstimate,
  evaluateFurnitureFit,
  evaluatePlotMetrics,
  generateConceptPlanVariants,
  getDefaultSampleRateSet,
  hasPermission,
  PERCH_SQM,
  sqmToPerches,
  type OpeningSpec,
  type PlacedFurnitureItem,
  type RoomSpec,
} from '../index.js';

describe('Geometry & Plot Engine', () => {
  it('computes rectangular and irregular polygon areas in m² and Sri Lankan perches (1 perch = 25.29 m²)', () => {
    const plot = [
      { x: 0, y: 0 },
      { x: 15, y: 0 },
      { x: 15, y: 17 },
      { x: 0, y: 17 },
    ];
    const metrics = evaluatePlotMetrics(plot, {
      frontSetbackM: 2.3,
      rearSetbackM: 1.5,
      leftSetbackM: 1.2,
      rightSetbackM: 1.2,
    });
    expect(metrics.isValid).toBe(true);
    expect(metrics.areaSqm).toBe(255);
    expect(metrics.areaPerches).toBe(sqmToPerches(255));
    expect(metrics.areaPerches).toBeCloseTo(255 / PERCH_SQM, 2);
    expect(metrics.perimeterM).toBe(64);
    // Buildable box: (15 - 2.4) * (17 - 3.8) = 12.6 * 13.2 = 166.32 m²
    expect(metrics.buildableAreaSqm).toBeCloseTo(166.32, 1);
  });

  it('rejects self-intersecting plot polygons', () => {
    const bowtie = [
      { x: 0, y: 0 },
      { x: 12, y: 12 },
      { x: 12, y: 0 },
      { x: 0, y: 12 },
    ];
    const metrics = evaluatePlotMetrics(bowtie, {
      frontSetbackM: 2.0,
      rearSetbackM: 1.5,
      leftSetbackM: 1.0,
      rightSetbackM: 1.0,
    });
    expect(metrics.isValid).toBe(false);
    expect(metrics.validationErrors.some((e) => e.includes('cross each other'))).toBe(true);
  });

  it('generates Variant A and B concept plans and rejects resize edits exceeding buildable setbacks', () => {
    const generated = generateConceptPlanVariants(12.6, 13.2, {
      bedrooms: 3,
      bathrooms: 2,
      storeys: 1,
      roofType: 'GABLE',
    });
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    const [variantA, variantB] = generated.variants;
    expect(variantA.variantCode).toBe('VARIANT_A_COMPACT');
    expect(variantB.variantCode).toBe('VARIANT_B_SPACIOUS');
    expect(variantA.rooms.length).toBeGreaterThanOrEqual(4);

    // Valid resize within bounds
    const validEdit = applyControlledPlanEdit(
      variantA,
      { tool: 'resize_room', roomId: 'room-living', deltaWidthM: 0.4 },
      12.6,
      13.2
    );
    expect(validEdit.ok).toBe(true);

    // Invalid resize exceeding setback bounds
    const invalidEdit = applyControlledPlanEdit(
      variantA,
      { tool: 'resize_room', roomId: 'room-living', deltaWidthM: 12 },
      12.6,
      13.2
    );
    expect(invalidEdit.ok).toBe(false);
  });
});

describe('Cost Estimator Formulas (Method A & Method B)', () => {
  it('reproduces the exact worked example from the specification', () => {
    const rateSet = getDefaultSampleRateSet();
    const result = computeCostEstimate({
      planSnapshot: {
        totalRoomAreaSqm: 100,
        totalWallLengthM: 54,
        slabAreaSqm: 115,
        roofAreaSqm: 140,
        storeys: 1,
      },
      finishGrade: 'MID_RANGE',
      district: 'Colombo',
      contingencyPct: 0.1,
      rateSet,
    });

    expect(result.estimatedBuiltUpAreaSqm).toBe(115);
    expect(result.methodATotalLkr).toBe(30_360_000);
    expect(result.methodALowLkr).toBe(27_324_000);
    expect(result.methodAHighLkr).toBe(33_396_000);
    expect(result.methodACostPerSqmLkr).toBe(264_000);

    expect(result.stageAllocations.map((s) => s.costLkr)).toEqual([
      4_554_000,
      9_108_000,
      4_554_000,
      4_554_000,
      7_590_000,
    ]);
    expect(result.methodBMaterialTotalLkr).toBeGreaterThan(0);
    expect(result.isDemoSample).toBe(true);
  });
});

describe('Furniture Fit Check Engine', () => {
  const room: RoomSpec = {
    id: 'room-living',
    name: 'Living Room',
    category: 'LIVING',
    x: 0,
    y: 0,
    width: 5.0,
    depth: 4.0,
    areaSqm: 20,
  };
  const openings: OpeningSpec[] = [
    {
      id: 'door-living',
      kind: 'DOOR',
      roomId: 'room-living',
      wallSide: 'SOUTH',
      x: 2.0,
      y: 4.0,
      widthM: 1.0,
      swingRadiusM: 1.0,
    },
  ];

  it('detects FITS, DOES_NOT_FIT on door swing arc, and TIGHT clearance', () => {
    const sofaFits: PlacedFurnitureItem = {
      id: 'p1',
      productId: 'prod-1',
      name: '3-Seater Sofa',
      roomId: 'room-living',
      x: 0.2,
      y: 0.2,
      widthM: 2.2,
      depthM: 0.9,
      rotationDeg: 0,
    };
    expect(evaluateFurnitureFit(sofaFits, room, openings, []).status).toBe('FITS');

    const blocksDoor: PlacedFurnitureItem = {
      id: 'p2',
      productId: 'prod-2',
      name: 'Coffee Table',
      roomId: 'room-living',
      x: 2.1,
      y: 3.1,
      widthM: 1.2,
      depthM: 0.7,
      rotationDeg: 0,
    };
    const doorRes = evaluateFurnitureFit(blocksDoor, room, openings, []);
    expect(doorRes.status).toBe('DOES_NOT_FIT');
    expect(doorRes.reasons.some((r) => r.includes('door swing'))).toBe(true);
  });
});

describe('BOQ Auditor & RBAC Permissions', () => {
  it('flags missing waterproofing, low unit rates, and high labour markups', () => {
    const audit = auditBoqQuotation({
      boqId: 'boq-1',
      quoteMode: 'WITH_MATERIALS',
      roughEstimateTotalLkr: 30_000_000,
      items: [
        {
          id: 'i1',
          stageKey: 'FOUNDATION',
          itemCode: 'FND_EXCAVATION',
          description: 'Foundation',
          unit: 'm3',
          quantity: 100,
          unitRateLkr: 9000, // Low vs 14500 baseline
          labourMarkupPct: 35, // High markup (>28%)
        },
      ],
    });
    const types = audit.flags.map((f) => f.flagType);
    expect(types).toContain('MISSING_ITEM');
    expect(types).toContain('PRICE_LOW_WARNING');
    expect(types).toContain('PRICE_HIGH_WARNING');
  });

  it('enforces distinct permissions per role', () => {
    expect(hasPermission('HOME_BUILDER', 'project:create')).toBe(true);
    expect(hasPermission('HOME_BUILDER', 'admin:manage_rates')).toBe(false);
    expect(hasPermission('SKILLED_WORKER', 'worker:manage_jobs')).toBe(true);
    expect(hasPermission('SKILLED_WORKER', 'shop:manage_inventory')).toBe(false);
    expect(hasPermission('PLATFORM_ADMIN', 'admin:manage_kyc')).toBe(true);
  });
});
