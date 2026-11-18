export type SystemRole =
  | 'HOME_BUILDER'
  | 'GENERAL_CONTRACTOR'
  | 'CIVIL_ENGINEER'
  | 'SHOP_OWNER'
  | 'SKILLED_WORKER'
  | 'PLATFORM_ADMIN';

export type PortalType =
  | 'HOME_BUILDER_PORTAL'
  | 'CONTRACTOR_ENGINEER_PORTAL'
  | 'SHOP_OWNER_PORTAL'
  | 'SYSTEM_OPERATIONS';

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_KYC'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type JourneyStage =
  | 'DRAW_PLOT'
  | 'GENERATE_2D_PLAN'
  | 'ROUGH_COST_ESTIMATE'
  | 'ENGINEER_AND_CONTRACTOR'
  | 'BOQ_AUDIT'
  | 'FURNISH_SPACE'
  | 'HIRE_WORKERS';

export const JOURNEY_STAGES: { key: JourneyStage; step: number; label: string; shortLabel: string }[] = [
  { key: 'DRAW_PLOT', step: 1, label: 'Draw plot', shortLabel: 'Plot' },
  { key: 'GENERATE_2D_PLAN', step: 2, label: 'Generate 2D plan', shortLabel: '2D Plan' },
  { key: 'ROUGH_COST_ESTIMATE', step: 3, label: 'Rough cost estimate', shortLabel: 'Estimate' },
  { key: 'ENGINEER_AND_CONTRACTOR', step: 4, label: 'Engineer & contractor', shortLabel: 'Pros' },
  { key: 'BOQ_AUDIT', step: 5, label: 'BOQ audit', shortLabel: 'BOQ Audit' },
  { key: 'FURNISH_SPACE', step: 6, label: 'Furnish the space', shortLabel: 'Furnish' },
  { key: 'HIRE_WORKERS', step: 7, label: 'Hire workers', shortLabel: 'Workers' },
];

export const SRI_LANKAN_DISTRICTS = [
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
] as const;

export type SriLankanDistrict = (typeof SRI_LANKAN_DISTRICTS)[number];

export interface Point2D {
  x: number; // metres
  y: number; // metres
}

export interface SetbackRuleSet {
  id: string;
  authorityName: string;
  district: string;
  versionLabel: string;
  ruleSourceNote: string;
  isConfirmed: boolean;
  frontSetbackM: number;
  rearSetbackM: number;
  leftSetbackM: number;
  rightSetbackM: number;
}

export interface PlotMetrics {
  vertices: Point2D[];
  areaSqm: number;
  areaPerches: number;
  perimeterM: number;
  buildablePolygon: Point2D[];
  buildableAreaSqm: number;
  buildableAreaPerches: number;
  isValid: boolean;
  validationErrors: string[];
}

export type RoomCategory =
  | 'LIVING'
  | 'DINING'
  | 'KITCHEN'
  | 'BEDROOM'
  | 'MASTER_BEDROOM'
  | 'BATHROOM'
  | 'VERANDAH'
  | 'STUDY'
  | 'UTILITY'
  | 'CORRIDOR';

export interface RoomSpec {
  id: string;
  name: string;
  category: RoomCategory;
  x: number; // metres from buildable origin
  y: number;
  width: number;
  depth: number;
  areaSqm: number;
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thicknessM: number;
  isExterior: boolean;
}

export interface OpeningSpec {
  id: string;
  kind: 'DOOR' | 'WINDOW';
  roomId: string;
  wallSide: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  x: number;
  y: number;
  widthM: number;
  swingRadiusM?: number;
  swingDirection?: 'INWARD' | 'OUTWARD';
}

export type PlanVariantCode = 'VARIANT_A_COMPACT' | 'VARIANT_B_SPACIOUS' | 'UPLOADED_PLAN';
export type RoofType = 'GABLE' | 'HIP' | 'FLAT_SLAB' | 'MONO_PITCH';

export interface PlanRequirements {
  bedrooms: number;
  bathrooms: number;
  storeys: 1 | 2;
  roofType: RoofType;
  includeStudy?: boolean;
  includeVerandah?: boolean;
}

export interface PlanGeometrySnapshot {
  variantCode: PlanVariantCode;
  title: string;
  storeys: 1 | 2;
  roofType: RoofType;
  footprintWidthM: number;
  footprintDepthM: number;
  rooms: RoomSpec[];
  walls: WallSegment[];
  openings: OpeningSpec[];
  totalRoomAreaSqm: number;
  totalWallLengthM: number;
  slabAreaSqm: number;
  roofAreaSqm: number;
}

export interface PlanVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  editSource: 'INITIAL_GENERATOR' | 'AI_TOOL_EDIT' | 'MANUAL_EDIT' | 'UPLOAD';
  editSummary: string;
  snapshot: PlanGeometrySnapshot;
  isConfirmed: boolean;
  createdAt: string;
}

export type FinishGrade = 'STANDARD' | 'MID_RANGE' | 'PREMIUM';

export type ConstructionStageKey = 'FOUNDATION' | 'SUPERSTRUCTURE' | 'ROOFING' | 'MEP' | 'FINISHES';

export interface StageShareConfig {
  key: ConstructionStageKey;
  label: string;
  sharePct: number; // 0..100
}

export interface MaterialRate {
  materialCode: string;
  name: string;
  unit: string;
  unitPriceLkr: number;
  defaultCoeffK: number;
  defaultWastePct: number; // e.g., 0.05 = 5%
  quantityBasis: 'WALL_AREA_SQM' | 'SLAB_AREA_SQM' | 'ROOF_AREA_SQM' | 'BUILT_AREA_SQM';
}

export interface RateSet {
  id: string;
  versionLabel: string;
  isDemoSample: boolean;
  baseRateLkrPerSqm: number;
  defaultWallAllowance: number;
  defaultContingencyPct: number;
  districtFactors: Record<string, number>;
  stageShares: StageShareConfig[];
  materials: MaterialRate[];
  effectiveFrom: string;
}

export interface MaterialOverride {
  materialCode: string;
  coeffK?: number;
  wastePct?: number;
}

export interface CostEstimateInput {
  planSnapshot: Pick<
    PlanGeometrySnapshot,
    'totalRoomAreaSqm' | 'totalWallLengthM' | 'slabAreaSqm' | 'roofAreaSqm' | 'storeys'
  >;
  finishGrade: FinishGrade;
  district: string;
  contingencyPct: number; // e.g. 0.10 for 10%
  wallAllowanceW?: number; // default 0.15
  rangeTolerancePct?: number; // default 0.10
  stageSharesOverride?: StageShareConfig[];
  materialOverrides?: MaterialOverride[];
  rateSet: RateSet;
}

export interface MaterialEstimateLine {
  materialCode: string;
  name: string;
  unit: string;
  planQuantity: number;
  coeffK: number;
  wastePct: number;
  estimatedQty: number;
  unitPriceLkr: number;
  totalCostLkr: number;
}

export interface StageAllocationResult {
  key: ConstructionStageKey;
  label: string;
  sharePct: number;
  costLkr: number;
}

export interface CostEstimateResult {
  rateSetId: string;
  rateVersionLabel: string;
  isDemoSample: boolean;
  totalRoomAreaSqm: number;
  estimatedBuiltUpAreaSqm: number;
  wallAllowanceW: number;
  baseRateLkrPerSqm: number;
  finishMultiplierF: number;
  storeyMultiplierS: number;
  locationFactorL: number;
  contingencyPctC: number;
  methodATotalLkr: number;
  methodALowLkr: number;
  methodAHighLkr: number;
  methodACostPerSqmLkr: number;
  methodBMaterialTotalLkr: number;
  stageAllocations: StageAllocationResult[];
  materialLines: MaterialEstimateLine[];
  disclaimer: string;
}

export type BoqQuoteMode = 'WITH_MATERIALS' | 'WITHOUT_MATERIALS';

export interface BoqItemInput {
  id: string;
  stageKey: ConstructionStageKey;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitRateLkr: number;
  labourMarkupPct: number;
}

export type AuditFlagType = 'MISSING_ITEM' | 'PRICE_LOW_WARNING' | 'PRICE_HIGH_WARNING';
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditFlagResult {
  id: string;
  boqItemId?: string;
  itemCode: string;
  stageKey: ConstructionStageKey;
  flagType: AuditFlagType;
  severity: AuditSeverity;
  explanation: string;
  contractorRebuttal?: string;
  revisedUnitRateLkr?: number;
  rebuttedAt?: string;
}

export interface BoqAuditResult {
  boqId: string;
  quoteTotalLkr: number;
  roughEstimateTotalLkr: number;
  variancePct: number;
  flags: AuditFlagResult[];
  summaryNote: string;
}

export type FurnitureCategory = 'SOFA' | 'BED' | 'DINING_SET' | 'WARDROBE' | 'LIGHT_FIXTURE' | 'TABLE' | 'CHAIR';
export type ProductKind = 'FURNITURE' | 'HARDWARE';

export interface FurnitureProduct {
  id: string;
  shopId: string;
  shopName: string;
  shopDistrict: string;
  shopAddress: string;
  shopPhone?: string; // Redacted server-side for non-premium users
  sku: string;
  name: string;
  productKind: ProductKind;
  category: FurnitureCategory | string;
  widthM: number;
  depthM: number;
  heightM: number;
  material: string;
  colour: string;
  priceLkr: number | null; // Null when locked for free users
  inStock: boolean;
  footprintShape: 'RECTANGLE' | 'CIRCLE' | 'L_SHAPE';
  priceUpdatedAt: string;
  isSampleData: boolean;
}

export type FitStatus = 'FITS' | 'TIGHT' | 'DOES_NOT_FIT';

export interface PlacedFurnitureItem {
  id: string;
  productId: string;
  name: string;
  roomId: string;
  x: number;
  y: number;
  widthM: number;
  depthM: number;
  rotationDeg: 0 | 90 | 180 | 270;
}

export interface FitCheckResult {
  placementId: string;
  status: FitStatus;
  reasons: string[];
  clearanceMinM: number;
}

export type EntitlementType =
  | 'MODEL_3D_UNLOCK'
  | 'FURNITURE_PREMIUM_PLAN'
  | 'FURNITURE_MONTHLY_PASS'
  | 'CONTRACTOR_LEAD_UNLOCK'
  | 'SHOP_SUBSCRIPTION_FEATURED';

export type TradeCategory = 'ELECTRICIAN' | 'PLUMBER' | 'MASON' | 'PAINTER' | 'CARPENTER';
