import { roundTo } from './geometry.js';
import type {
  CostEstimateInput,
  CostEstimateResult,
  FinishGrade,
  MaterialEstimateLine,
  RateSet,
  StageAllocationResult,
  StageShareConfig,
} from './types.js';

export const FINISH_MULTIPLIERS: Record<FinishGrade, number> = {
  STANDARD: 1.0,
  MID_RANGE: 1.2,
  PREMIUM: 1.45,
};

export const STOREY_MULTIPLIERS: Record<1 | 2, number> = {
  1: 1.0,
  2: 1.1,
};

export const DEFAULT_STAGE_SHARES: StageShareConfig[] = [
  { key: 'FOUNDATION', label: '1. Foundation & Substructure', sharePct: 15 },
  { key: 'SUPERSTRUCTURE', label: '2. Superstructure & Masonry', sharePct: 30 },
  { key: 'ROOFING', label: '3. Roofing & Truss Work', sharePct: 15 },
  { key: 'MEP', label: '4. Electrical & Plumbing (MEP)', sharePct: 15 },
  { key: 'FINISHES', label: '5. Finishes & Tile Work', sharePct: 25 },
];

export const ROUGH_ESTIMATE_DISCLAIMER =
  'Rough estimate only — not a binding contractor quotation. Actual construction cost must be confirmed via itemised contractor BOQ quotations and site engineering validation.';

export function getDefaultSampleRateSet(): RateSet {
  return {
    id: 'rate-set-demo-v1',
    versionLabel: '2026.11-DEMO-SAMPLE',
    isDemoSample: true,
    baseRateLkrPerSqm: 200_000, // Placeholder demo rate from spec worked example
    defaultWallAllowance: 0.15,
    defaultContingencyPct: 0.1,
    districtFactors: {
      Colombo: 1.0,
      Gampaha: 1.0,
      Kalutara: 1.0,
      Kandy: 1.0,
      Galle: 1.0,
    },
    stageShares: DEFAULT_STAGE_SHARES.map((s) => ({ ...s })),
    effectiveFrom: '2026-11-01T00:00:00Z',
    materials: [
      {
        materialCode: 'CEMENT_50KG',
        name: 'OPC Cement (50kg bags)',
        unit: 'bags',
        unitPriceLkr: 2450,
        defaultCoeffK: 2.1,
        defaultWastePct: 0.05,
        quantityBasis: 'BUILT_AREA_SQM',
      },
      {
        materialCode: 'SAND_CUBE',
        name: 'Washed River Sand',
        unit: 'cubes',
        unitPriceLkr: 28000,
        defaultCoeffK: 0.085,
        defaultWastePct: 0.08,
        quantityBasis: 'WALL_AREA_SQM',
      },
      {
        materialCode: 'METAL_AGGREGATE_CUBE',
        name: '3/4" Crushed Aggregate Metal',
        unit: 'cubes',
        unitPriceLkr: 22000,
        defaultCoeffK: 0.075,
        defaultWastePct: 0.05,
        quantityBasis: 'SLAB_AREA_SQM',
      },
      {
        materialCode: 'TOR_STEEL_MT',
        name: 'Reinforcement Steel (Tor Steel)',
        unit: 'kg',
        unitPriceLkr: 365,
        defaultCoeffK: 28.0,
        defaultWastePct: 0.06,
        quantityBasis: 'SLAB_AREA_SQM',
      },
      {
        materialCode: 'MASONRY_BLOCKS',
        name: '4" & 6" Cement Sand Blocks',
        unit: 'blocks',
        unitPriceLkr: 95,
        defaultCoeffK: 12.5,
        defaultWastePct: 0.05,
        quantityBasis: 'WALL_AREA_SQM',
      },
      {
        materialCode: 'ROOF_SHEETS_SQM',
        name: 'Roofing Sheets & Timber/Steel Truss Allocation',
        unit: 'm²',
        unitPriceLkr: 6400,
        defaultCoeffK: 1.0,
        defaultWastePct: 0.08,
        quantityBasis: 'ROOF_AREA_SQM',
      },
      {
        materialCode: 'FLOOR_TILES_SQM',
        name: 'Porcelain Floor & Bathroom Tiles',
        unit: 'm²',
        unitPriceLkr: 5800,
        defaultCoeffK: 1.0,
        defaultWastePct: 0.1,
        quantityBasis: 'SLAB_AREA_SQM',
      },
      {
        materialCode: 'WATERPROOFING_ROOF',
        name: 'Roof & Wet-Area Waterproofing Membrane',
        unit: 'm²',
        unitPriceLkr: 2900,
        defaultCoeffK: 0.35,
        defaultWastePct: 0.05,
        quantityBasis: 'ROOF_AREA_SQM',
      },
    ],
  };
}

export function validateStageShares(shares: StageShareConfig[]): boolean {
  const sum = shares.reduce((acc, s) => acc + s.sharePct, 0);
  return Math.abs(sum - 100) < 0.01 && shares.every((s) => s.sharePct >= 0);
}

/**
 * Computes both Method A (area-based quick estimate) and Method B (quantity-based material breakdown).
 */
export function computeCostEstimate(input: CostEstimateInput): CostEstimateResult {
  const { planSnapshot, finishGrade, district, contingencyPct, rateSet } = input;
  const w = input.wallAllowanceW ?? rateSet.defaultWallAllowance;
  const tolerance = input.rangeTolerancePct ?? 0.1;

  const aRooms = Math.max(0, planSnapshot.totalRoomAreaSqm);
  const estimatedBuiltUpAreaSqm = roundTo(aRooms * (1 + w), 2);
  const r = rateSet.baseRateLkrPerSqm;
  const f = FINISH_MULTIPLIERS[finishGrade];
  const s = STOREY_MULTIPLIERS[planSnapshot.storeys];
  const l = rateSet.districtFactors[district] ?? 1.0; // Default 1.00 when district factor is not specifically configured
  const c = Math.max(0, contingencyPct);

  const methodATotalLkr = Math.round(estimatedBuiltUpAreaSqm * r * f * s * l * (1 + c));
  const methodALowLkr = Math.round(methodATotalLkr * (1 - tolerance));
  const methodAHighLkr = Math.round(methodATotalLkr * (1 + tolerance));
  const methodACostPerSqmLkr = estimatedBuiltUpAreaSqm > 0 ? Math.round(methodATotalLkr / estimatedBuiltUpAreaSqm) : 0;

  const activeShares =
    input.stageSharesOverride && validateStageShares(input.stageSharesOverride)
      ? input.stageSharesOverride
      : rateSet.stageShares;

  const stageAllocations: StageAllocationResult[] = activeShares.map((stage) => ({
    key: stage.key,
    label: stage.label,
    sharePct: stage.sharePct,
    costLkr: Math.round((methodATotalLkr * stage.sharePct) / 100),
  }));

  // Standard 3.0m clear wall height for plan quantity wall area derivation
  const wallAreaSqm = roundTo(planSnapshot.totalWallLengthM * 3.0, 2);
  const overrideMap = new Map((input.materialOverrides ?? []).map((o) => [o.materialCode, o]));

  const materialLines: MaterialEstimateLine[] = rateSet.materials.map((mat) => {
    const ov = overrideMap.get(mat.materialCode);
    const coeffK = ov?.coeffK ?? mat.defaultCoeffK;
    const wastePct = ov?.wastePct ?? mat.defaultWastePct;

    let planQty = estimatedBuiltUpAreaSqm;
    if (mat.quantityBasis === 'WALL_AREA_SQM') planQty = wallAreaSqm;
    else if (mat.quantityBasis === 'SLAB_AREA_SQM') planQty = planSnapshot.slabAreaSqm;
    else if (mat.quantityBasis === 'ROOF_AREA_SQM') planQty = planSnapshot.roofAreaSqm;

    const estimatedQty = roundTo(planQty * coeffK * (1 + wastePct), 2);
    const totalCostLkr = Math.round(estimatedQty * mat.unitPriceLkr);
    return {
      materialCode: mat.materialCode,
      name: mat.name,
      unit: mat.unit,
      planQuantity: roundTo(planQty, 2),
      coeffK,
      wastePct,
      estimatedQty,
      unitPriceLkr: mat.unitPriceLkr,
      totalCostLkr,
    };
  });

  const methodBMaterialTotalLkr = materialLines.reduce((sum, lItem) => sum + lItem.totalCostLkr, 0);

  return {
    rateSetId: rateSet.id,
    rateVersionLabel: rateSet.versionLabel,
    isDemoSample: rateSet.isDemoSample,
    totalRoomAreaSqm: roundTo(aRooms, 2),
    estimatedBuiltUpAreaSqm,
    wallAllowanceW: w,
    baseRateLkrPerSqm: r,
    finishMultiplierF: f,
    storeyMultiplierS: s,
    locationFactorL: l,
    contingencyPctC: c,
    methodATotalLkr,
    methodALowLkr,
    methodAHighLkr,
    methodACostPerSqmLkr,
    methodBMaterialTotalLkr,
    stageAllocations,
    materialLines,
    disclaimer: ROUGH_ESTIMATE_DISCLAIMER,
  };
}
