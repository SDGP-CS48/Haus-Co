import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  computeCostEstimate,
  evaluatePlotMetrics,
  generateConceptPlanVariants,
  getDefaultSampleRateSet,
  ROLE_TO_PORTAL,
  type AuditFlagResult,
  type BoqAuditResult,
  type BoqItemInput,
  type BoqQuoteMode,
  type CostEstimateResult,
  type EntitlementType,
  type FurnitureProduct,
  type JourneyStage,
  type PlacedFurnitureItem,
  type PlanVersion,
  type PlotMetrics,
  type Point2D,
  type RateSet,
  type SetbackRuleSet,
  type SystemRole,
  type TradeCategory,
  type VerificationStatus,
} from '@hausco/shared';
import { hashPassword } from '../common/crypto.js';

export interface StoredUser {
  id: string;
  email: string;
  phoneE164: string;
  fullName: string;
  passwordHash: string;
  role: SystemRole;
  portal: string;
  verificationStatus: VerificationStatus;
  phoneVerified: boolean;
  createdAt: string;
}

export interface StoredKycSubmission {
  id: string;
  userId: string;
  nicMasked: string;
  credentialCode: string;
  documentName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
}

export interface StoredProject {
  id: string;
  ownerUserId: string;
  title: string;
  district: string;
  localAuthority: string;
  onboardingPath: 'START_FROM_SCRATCH' | 'UPLOAD_EXISTING_PLAN';
  activeStage: JourneyStage;
  setbackRuleId: string;
  plot: PlotMetrics;
  planVersions: PlanVersion[];
  activePlanVersionId: string;
  estimates: (CostEstimateResult & { id: string; planVersionId: string; finishGrade: string; district: string; createdAt: string })[];
  documents: { id: string; docType: string; fileName: string; mimeType: string; sizeBytes: number; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredProfessional {
  userId: string;
  kind: 'CONTRACTOR' | 'ENGINEER';
  fullName: string;
  companyOrTitle: string;
  registrationNo: string;
  gradeOrQualification: string;
  serviceDistricts: string[];
  siteVisitFeeLkr: number;
  yearsExperience: number;
  bio: string;
  verificationStatus: VerificationStatus;
  isSampleData: boolean;
}

export interface StoredBooking {
  id: string;
  projectId: string;
  builderUserId: string;
  providerUserId: string;
  bookingType: 'ENGINEER_SITE_VISIT' | 'WEBRTC_VOICE_CONSULT' | 'CONTRACTOR_LEAD_UNLOCK';
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  scheduledFor?: string;
  amountLkr: number;
  platformCommissionLkr: number;
  roomToken?: string;
  notes?: string;
  createdAt: string;
}

export interface StoredEngineerReport {
  id: string;
  bookingId: string;
  projectId: string;
  engineerUserId: string;
  landQualitySummary: string;
  soilBearingKpa: number;
  recommendedFoundationDepthM: number;
  structuralLoadNotes: string;
  planTechnicallyVerified: boolean;
  createdAt: string;
}

export interface StoredBoq {
  id: string;
  projectId: string;
  planVersionId: string;
  contractorUserId: string;
  contractorName: string;
  quoteMode: BoqQuoteMode;
  versionNumber: number;
  items: BoqItemInput[];
  audit: BoqAuditResult;
  status: 'SUBMITTED' | 'UNDER_AUDIT' | 'REBUTTED' | 'ACCEPTED';
  createdAt: string;
}

export interface StoredShop {
  id: string;
  ownerUserId: string;
  storeName: string;
  district: string;
  address: string;
  branches: string[];
  operatingHours: string;
  contactPhone: string;
  subscriptionTier: 'BASIC' | 'FEATURED';
  isVerified: boolean;
  isSampleData: boolean;
}

export interface StoredShopLead {
  id: string;
  shopId: string;
  builderUserId: string;
  builderName: string;
  projectId: string;
  roomName: string;
  productId: string;
  productName: string;
  leadType: 'BOOKING_REQUEST' | 'CALL_CLICK';
  status: 'NEW' | 'CONTACTED' | 'RESERVED';
  createdAt: string;
}

export interface StoredAdCampaign {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  targetStage: JourneyStage;
  billingModel: 'CPM' | 'CPC';
  budgetLkr: number;
  impressions: number;
  clicks: number;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'PAUSED' | 'REJECTED';
  createdAt: string;
}

export interface StoredWorker {
  userId: string;
  fullName: string;
  tradeCategory: TradeCategory;
  district: string;
  certifications: string[];
  availabilityNote: string;
  dailyRateHintLkr: number;
  verificationStatus: VerificationStatus;
  isSampleData: boolean;
}

export interface StoredWorkerJob {
  id: string;
  projectId: string;
  builderUserId: string;
  workerUserId: string;
  workerName: string;
  title: string;
  scopeDescription: string;
  agreedAmountLkr: number;
  platformCommissionLkr: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED_PAID' | 'CANCELLED';
  review?: { rating: number; comment: string; createdAt: string };
  createdAt: string;
}

export interface StoredPricingConfig {
  key: string;
  label: string;
  amountLkr: number;
  billingModel: string;
  note: string;
}

export interface StoredPayment {
  id: string;
  payerUserId: string;
  provider: 'PAYHERE' | 'DEMO_ADAPTER';
  externalOrderId: string;
  entitlementType: string;
  resourceId: string;
  amountLkr: number;
  status: 'INITIATED' | 'VERIFIED' | 'FAILED';
  createdAt: string;
  verifiedAt?: string;
}

export interface StoredEntitlement {
  id: string;
  userId: string;
  entitlementType: EntitlementType;
  resourceId: string;
  paymentId: string;
  createdAt: string;
}

export interface StoredDispute {
  id: string;
  raisedByUserId: string;
  projectId: string;
  subject: string;
  details: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  resolutionNote?: string;
  createdAt: string;
}

export interface StoredAuditLog {
  id: string;
  actorUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StoredOtp {
  id: string;
  phoneE164: string;
  codeHash: string;
  carrier: string;
  attempts: number;
  expiresAt: number;
  verified: boolean;
}

export interface PlatformSnapshot {
  users: StoredUser[];
  kycSubmissions: StoredKycSubmission[];
  setbackRules: SetbackRuleSet[];
  rateSets: RateSet[];
  projects: StoredProject[];
  professionals: StoredProfessional[];
  bookings: StoredBooking[];
  engineerReports: StoredEngineerReport[];
  boqs: StoredBoq[];
  shops: StoredShop[];
  products: (FurnitureProduct & { rawPriceLkr: number; rawShopPhone: string })[];
  placements: (PlacedFurnitureItem & { projectId: string; planVersionId: string })[];
  shopLeads: StoredShopLead[];
  campaigns: StoredAdCampaign[];
  workers: StoredWorker[];
  workerJobs: StoredWorkerJob[];
  pricingConfigs: StoredPricingConfig[];
  payments: StoredPayment[];
  entitlements: StoredEntitlement[];
  disputes: StoredDispute[];
  auditLogs: StoredAuditLog[];
  otps: StoredOtp[];
}

function createInitialSeed(): PlatformSnapshot {
  const now = '2026-11-14T10:00:00.000Z';
  const demoPass = hashPassword('HausDemo!2026');

  const users: StoredUser[] = [
    {
      id: 'user-builder-1',
      email: 'builder@hausco.demo',
      phoneE164: '+94771234501',
      fullName: 'Kasun Perera (Sample Builder)',
      passwordHash: demoPass,
      role: 'HOME_BUILDER',
      portal: ROLE_TO_PORTAL.HOME_BUILDER,
      verificationStatus: 'VERIFIED',
      phoneVerified: true,
      createdAt: now,
    },
    {
      id: 'user-contractor-1',
      email: 'contractor@hausco.demo',
      phoneE164: '+94771234502',
      fullName: 'Rohan Jayawardena (Sample Contractor)',
      passwordHash: demoPass,
      role: 'GENERAL_CONTRACTOR',
      portal: ROLE_TO_PORTAL.GENERAL_CONTRACTOR,
      verificationStatus: 'VERIFIED',
      phoneVerified: true,
      createdAt: now,
    },
    {
      id: 'user-engineer-1',
      email: 'engineer@hausco.demo',
      phoneE164: '+94711234503',
      fullName: 'Eng. Nimali Fernando (Sample Civil Engineer)',
      passwordHash: demoPass,
      role: 'CIVIL_ENGINEER',
      portal: ROLE_TO_PORTAL.CIVIL_ENGINEER,
      verificationStatus: 'VERIFIED',
      phoneVerified: true,
      createdAt: now,
    },
    {
      id: 'user-shop-1',
      email: 'shop@hausco.demo',
      phoneE164: '+94771234504',
      fullName: 'Lanka Living & Hardware (Sample Shop)',
      passwordHash: demoPass,
      role: 'SHOP_OWNER',
      portal: ROLE_TO_PORTAL.SHOP_OWNER,
      verificationStatus: 'VERIFIED',
      phoneVerified: true,
      createdAt: now,
    },
    {
      id: 'user-worker-1',
      email: 'worker@hausco.demo',
      phoneE164: '+94711234505',
      fullName: 'Samantha Kumara (Sample Electrician)',
      passwordHash: demoPass,
      role: 'SKILLED_WORKER',
      portal: ROLE_TO_PORTAL.SKILLED_WORKER,
      verificationStatus: 'VERIFIED',
      phoneVerified: true,
      createdAt: now,
    },
    {
      id: 'user-admin-1',
      email: 'admin@hausco.demo',
      phoneE164: '+94770000001',
      fullName: 'Haus & Co Operations Admin',
      passwordHash: demoPass,
      role: 'PLATFORM_ADMIN',
      portal: ROLE_TO_PORTAL.PLATFORM_ADMIN,
      verificationStatus: 'VERIFIED',
      phoneVerified: true,
      createdAt: now,
    },
  ];

  const setbackRules: SetbackRuleSet[] = [
    {
      id: 'rule-cmc-illustrative',
      authorityName: 'Colombo Municipal Council (Illustrative Residential Guideline)',
      district: 'Colombo',
      versionLabel: 'DEMO-2026.1',
      ruleSourceNote:
        'Illustrative sample only (e.g. 2.3m front road setback). Confirm actual UDA / local authority building line before submission.',
      isConfirmed: false,
      frontSetbackM: 2.3,
      rearSetbackM: 1.5,
      leftSetbackM: 1.2,
      rightSetbackM: 1.2,
    },
    {
      id: 'rule-kandy-illustrative',
      authorityName: 'Kandy Municipal Council (Illustrative Residential Guideline)',
      district: 'Kandy',
      versionLabel: 'DEMO-2026.1',
      ruleSourceNote:
        'Illustrative sample only. Sloped terrain and UDA street lines must be verified by a chartered civil engineer.',
      isConfirmed: false,
      frontSetbackM: 2.5,
      rearSetbackM: 1.8,
      leftSetbackM: 1.5,
      rightSetbackM: 1.5,
    },
    {
      id: 'rule-pradeshiya-default',
      authorityName: 'General Pradeshiya Sabha Residential Baseline (Unconfirmed)',
      district: 'Gampaha',
      versionLabel: 'DEMO-2026.1',
      ruleSourceNote:
        'Configurable placeholder rule. Verify road-widening reservation and rear light/ventilation buffer with local Pradeshiya Sabha.',
      isConfirmed: false,
      frontSetbackM: 2.0,
      rearSetbackM: 1.5,
      leftSetbackM: 1.0,
      rightSetbackM: 1.0,
    },
  ];

  const defaultRateSet = getDefaultSampleRateSet();
  const sampleVertices: Point2D[] = [
    { x: 0, y: 0 },
    { x: 15, y: 0 },
    { x: 15, y: 17 },
    { x: 0, y: 17 },
  ];
  const samplePlot = evaluatePlotMetrics(sampleVertices, setbackRules[0]!);
  const generated = generateConceptPlanVariants(12.6, 13.2, {
    bedrooms: 3,
    bathrooms: 2,
    storeys: 1,
    roofType: 'GABLE',
    includeStudy: true,
    includeVerandah: true,
  });

  const planA = generated.ok ? generated.variants[0] : null;
  const planB = generated.ok ? generated.variants[1] : null;

  const planVersions: PlanVersion[] = [];
  if (planA && planB) {
    planVersions.push({
      id: 'plan-v1',
      projectId: 'proj-sample-1',
      versionNumber: 1,
      editSource: 'INITIAL_GENERATOR',
      editSummary: 'Generated Variant A (Compact / Open-Plan) from 10.08 perch Colombo sample plot.',
      snapshot: planA,
      isConfirmed: true,
      createdAt: now,
    });
    planVersions.push({
      id: 'plan-v2',
      projectId: 'proj-sample-1',
      versionNumber: 2,
      editSource: 'INITIAL_GENERATOR',
      editSummary: 'Generated Variant B (Spacious / Traditional) alternative.',
      snapshot: planB,
      isConfirmed: false,
      createdAt: now,
    });
  }

  const initialEst = planA
    ? computeCostEstimate({
        planSnapshot: planA,
        finishGrade: 'MID_RANGE',
        district: 'Colombo',
        contingencyPct: 0.1,
        rateSet: defaultRateSet,
      })
    : null;

  const projects: StoredProject[] = [
    {
      id: 'proj-sample-1',
      ownerUserId: 'user-builder-1',
      title: 'Battaramulla 10-Perch Residence (Sample Project)',
      district: 'Colombo',
      localAuthority: setbackRules[0]!.authorityName,
      onboardingPath: 'START_FROM_SCRATCH',
      activeStage: 'GENERATE_2D_PLAN',
      setbackRuleId: setbackRules[0]!.id,
      plot: samplePlot,
      planVersions,
      activePlanVersionId: 'plan-v1',
      estimates: initialEst
        ? [
            {
              ...initialEst,
              id: 'est-sample-1',
              planVersionId: 'plan-v1',
              finishGrade: 'MID_RANGE',
              district: 'Colombo',
              createdAt: now,
            },
          ]
        : [],
      documents: [
        {
          id: 'doc-sample-1',
          docType: 'LAND_SURVEY',
          fileName: 'sample_survey_plan_lot_14.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 245760,
          uploadedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const professionals: StoredProfessional[] = [
    {
      userId: 'user-contractor-1',
      kind: 'CONTRACTOR',
      fullName: 'Rohan Jayawardena',
      companyOrTitle: 'Serendib Civil & Turnkey Builders (Sample)',
      registrationNo: 'CIDA-C5-DEMO-1042',
      gradeOrQualification: 'CIDA Grade C5 — Residential & Low-Rise',
      serviceDistricts: ['Colombo', 'Gampaha', 'Kalutara'],
      siteVisitFeeLkr: 0,
      yearsExperience: 12,
      bio: 'Sample CIDA-grade residential contractor demo profile supporting turnkey and labour-only 5-stage BOQs.',
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-contractor-2',
      kind: 'CONTRACTOR',
      fullName: 'Mahesh Senanayake',
      companyOrTitle: 'Hillside Structural & Home Builders (Sample)',
      registrationNo: 'CIDA-C6-DEMO-2189',
      gradeOrQualification: 'CIDA Grade C6 — Single & Two-Storey Homes',
      serviceDistricts: ['Kandy', 'Matale', 'Colombo'],
      siteVisitFeeLkr: 0,
      yearsExperience: 9,
      bio: 'Sample contractor demo profile specialising in sloped-plot foundations and timber-truss roofing.',
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-engineer-1',
      kind: 'ENGINEER',
      fullName: 'Eng. Nimali Fernando',
      companyOrTitle: 'Chartered Civil & Structural Engineer (Sample)',
      registrationNo: 'IESL-CE-DEMO-4410',
      gradeOrQualification: 'B.Sc. Eng (Hons), C.Eng, MIE(SL)',
      serviceDistricts: ['Colombo', 'Gampaha', 'Kandy'],
      siteVisitFeeLkr: 15000,
      yearsExperience: 14,
      bio: 'Sample chartered civil engineer for soil inspection, foundation depth sizing and structural plan verification.',
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-engineer-2',
      kind: 'ENGINEER',
      fullName: 'Eng. Dinesh Wickramasinghe',
      companyOrTitle: 'Geotechnical & Structural Advisory (Sample)',
      registrationNo: 'IESL-CE-DEMO-5190',
      gradeOrQualification: 'B.Sc. Eng, M.Eng (Geotech), C.Eng',
      serviceDistricts: ['Galle', 'Matara', 'Kalutara', 'Colombo'],
      siteVisitFeeLkr: 18500,
      yearsExperience: 11,
      bio: 'Sample coastal & high-water-table foundation specialist.',
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
  ];

  const shops: StoredShop[] = [
    {
      id: 'shop-1',
      ownerUserId: 'user-shop-1',
      storeName: 'Lanka Living & Timber Gallery (Sample)',
      district: 'Colombo',
      address: '214 Nawala Road, Rajagiriya (Sample Address)',
      branches: ['Nawala Flagship', 'Dehiwala Showroom'],
      operatingHours: 'Mon–Sat 9:00 AM – 6:30 PM',
      contactPhone: '+94 11 000 1100 (Sample)',
      subscriptionTier: 'FEATURED',
      isVerified: true,
      isSampleData: true,
    },
    {
      id: 'shop-2',
      ownerUserId: 'user-shop-1',
      storeName: 'Ceylon BuildMart & Interiors (Sample)',
      district: 'Gampaha',
      address: '88 Kandy Road, Kadawatha (Sample Address)',
      branches: ['Kadawatha Hub'],
      operatingHours: 'Daily 8:30 AM – 7:00 PM',
      contactPhone: '+94 11 000 2200 (Sample)',
      subscriptionTier: 'BASIC',
      isVerified: true,
      isSampleData: true,
    },
  ];

  const products: PlatformSnapshot['products'] = [
    {
      id: 'prod-sofa-1',
      shopId: 'shop-1',
      shopName: 'Lanka Living & Timber Gallery (Sample)',
      shopDistrict: 'Colombo',
      shopAddress: '214 Nawala Road, Rajagiriya',
      rawShopPhone: '+94 11 000 1100 (Sample)',
      sku: 'LL-SOFA-3S-01',
      name: 'Kandy Teak 3-Seater Sofa',
      productKind: 'FURNITURE',
      category: 'SOFA',
      widthM: 2.15,
      depthM: 0.9,
      heightM: 0.82,
      material: 'Kiln-dried Teak & Linen Weave',
      colour: 'Warm Sand',
      rawPriceLkr: 185000,
      priceLkr: 185000,
      inStock: true,
      footprintShape: 'RECTANGLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
    {
      id: 'prod-sofa-2',
      shopId: 'shop-2',
      shopName: 'Ceylon BuildMart & Interiors (Sample)',
      shopDistrict: 'Gampaha',
      shopAddress: '88 Kandy Road, Kadawatha',
      rawShopPhone: '+94 11 000 2200 (Sample)',
      sku: 'CB-SOFA-3S-02',
      name: 'Kandy Teak 3-Seater Sofa',
      productKind: 'FURNITURE',
      category: 'SOFA',
      widthM: 2.15,
      depthM: 0.9,
      heightM: 0.82,
      material: 'Treated Jak Wood & Woven Fabric',
      colour: 'Oatmeal',
      rawPriceLkr: 172500,
      priceLkr: 172500,
      inStock: true,
      footprintShape: 'RECTANGLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
    {
      id: 'prod-bed-1',
      shopId: 'shop-1',
      shopName: 'Lanka Living & Timber Gallery (Sample)',
      shopDistrict: 'Colombo',
      shopAddress: '214 Nawala Road, Rajagiriya',
      rawShopPhone: '+94 11 000 1100 (Sample)',
      sku: 'LL-BED-Q-01',
      name: 'Negombo Queen Bed Frame',
      productKind: 'FURNITURE',
      category: 'BED',
      widthM: 1.68,
      depthM: 2.12,
      heightM: 1.05,
      material: 'Solid Mahogany',
      colour: 'Natural Amber Stain',
      rawPriceLkr: 148000,
      priceLkr: 148000,
      inStock: true,
      footprintShape: 'RECTANGLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
    {
      id: 'prod-dining-1',
      shopId: 'shop-1',
      shopName: 'Lanka Living & Timber Gallery (Sample)',
      shopDistrict: 'Colombo',
      shopAddress: '214 Nawala Road, Rajagiriya',
      rawShopPhone: '+94 11 000 1100 (Sample)',
      sku: 'LL-DIN-6S-01',
      name: '6-Seater Tropical Dining Set',
      productKind: 'FURNITURE',
      category: 'DINING_SET',
      widthM: 1.85,
      depthM: 1.05,
      heightM: 0.76,
      material: 'Solid Teak & Cane Back Chairs',
      colour: 'Golden Teak',
      rawPriceLkr: 245000,
      priceLkr: 245000,
      inStock: false, // Intentionally out of stock to demonstrate External Web Fallback Search!
      footprintShape: 'RECTANGLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
    {
      id: 'prod-wardrobe-1',
      shopId: 'shop-2',
      shopName: 'Ceylon BuildMart & Interiors (Sample)',
      shopDistrict: 'Gampaha',
      shopAddress: '88 Kandy Road, Kadawatha',
      rawShopPhone: '+94 11 000 2200 (Sample)',
      sku: 'CB-WRD-2D-01',
      name: 'Sliding 2-Door Architectural Wardrobe',
      productKind: 'FURNITURE',
      category: 'WARDROBE',
      widthM: 1.8,
      depthM: 0.62,
      heightM: 2.1,
      material: 'Melamine-Faced Moisture-Resistant Board',
      colour: 'Warm Oak',
      rawPriceLkr: 132000,
      priceLkr: 132000,
      inStock: true,
      footprintShape: 'RECTANGLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
    {
      id: 'prod-light-1',
      shopId: 'shop-1',
      shopName: 'Lanka Living & Timber Gallery (Sample)',
      shopDistrict: 'Colombo',
      shopAddress: '214 Nawala Road, Rajagiriya',
      rawShopPhone: '+94 11 000 1100 (Sample)',
      sku: 'LL-LGT-PND-01',
      name: 'Brushed Brass Dining Pendant',
      productKind: 'FURNITURE',
      category: 'LIGHT_FIXTURE',
      widthM: 0.55,
      depthM: 0.55,
      heightM: 0.38,
      material: 'Anodised Brass & Frosted Glass',
      colour: 'Warm Brass',
      rawPriceLkr: 34500,
      priceLkr: 34500,
      inStock: true,
      footprintShape: 'CIRCLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
    {
      id: 'prod-hw-cement',
      shopId: 'shop-2',
      shopName: 'Ceylon BuildMart & Interiors (Sample)',
      shopDistrict: 'Gampaha',
      shopAddress: '88 Kandy Road, Kadawatha',
      rawShopPhone: '+94 11 000 2200 (Sample)',
      sku: 'CB-HW-CEM-50',
      name: '42.5N Portland Cement (50kg Bag)',
      productKind: 'HARDWARE',
      category: 'CEMENT',
      widthM: 0.45,
      depthM: 0.35,
      heightM: 0.15,
      material: 'OPC Structural Cement',
      colour: 'Grey',
      rawPriceLkr: 2450,
      priceLkr: 2450,
      inStock: true,
      footprintShape: 'RECTANGLE',
      priceUpdatedAt: now,
      isSampleData: true,
    },
  ];

  const workers: StoredWorker[] = [
    {
      userId: 'user-worker-1',
      fullName: 'Samantha Kumara',
      tradeCategory: 'ELECTRICIAN',
      district: 'Colombo',
      certifications: ['NVQ Level 4 Electrical Installation', 'CEB Wiring Guidelines Trained'],
      availabilityNote: 'Available Weekdays & Saturdays (Colombo / Gampaha)',
      dailyRateHintLkr: 5500,
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-worker-2',
      fullName: 'Prasanna Wijeratne',
      tradeCategory: 'PLUMBER',
      district: 'Colombo',
      certifications: ['NVQ Level 3 Plumbing & Sanitary', 'Pressure Pipe Testing'],
      availabilityNote: 'Available for MEP rough-in & bathroom fit-outs',
      dailyRateHintLkr: 5200,
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-worker-3',
      fullName: 'Nandana Silva',
      tradeCategory: 'MASON',
      district: 'Kandy',
      certifications: ['NAITA Masonry & Tiling Certificate'],
      availabilityNote: 'Available for blockwork, plastering and porcelain tiling',
      dailyRateHintLkr: 5000,
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-worker-4',
      fullName: 'Ruwan Bandara',
      tradeCategory: 'CARPENTER',
      district: 'Gampaha',
      certifications: ['Timber Roof Truss & Door Frame Specialist'],
      availabilityNote: 'Available from next Monday',
      dailyRateHintLkr: 5800,
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
    {
      userId: 'user-worker-5',
      fullName: 'Tharindu Jayasinghe',
      tradeCategory: 'PAINTER',
      district: 'Colombo',
      certifications: ['Weather-shield & Interior Skim Coat Specialist'],
      availabilityNote: 'Available for full exterior & interior finishes',
      dailyRateHintLkr: 4600,
      verificationStatus: 'VERIFIED',
      isSampleData: true,
    },
  ];

  const campaigns: StoredAdCampaign[] = [
    {
      id: 'ad-sample-1',
      shopId: 'shop-2',
      shopName: 'Ceylon BuildMart & Interiors (Sample)',
      title: 'Foundation Grade OPC Cement Bulk Delivery — Colombo & Gampaha (Sample Ad)',
      targetStage: 'ROUGH_COST_ESTIMATE',
      billingModel: 'CPM',
      budgetLkr: 25000,
      impressions: 120,
      clicks: 8,
      status: 'ACTIVE',
      createdAt: now,
    },
    {
      id: 'ad-sample-2',
      shopId: 'shop-1',
      shopName: 'Lanka Living & Timber Gallery (Sample)',
      title: 'To-Scale Kandy Teak Living & Dining Collections — Verify Fit First (Sample Ad)',
      targetStage: 'FURNISH_SPACE',
      billingModel: 'CPC',
      budgetLkr: 35000,
      impressions: 240,
      clicks: 19,
      status: 'ACTIVE',
      createdAt: now,
    },
  ];

  const pricingConfigs: StoredPricingConfig[] = [
    {
      key: 'MODEL_3D_UNLOCK',
      label: '3D Procedural Model Unlock (per confirmed plan)',
      amountLkr: 2500,
      billingModel: 'One-time unlock fee per plan',
      note: 'Configurable sample commercial fee — admin editable.',
    },
    {
      key: 'FURNITURE_PREMIUM_PLAN',
      label: 'Furniture Premium Unlock (per plan)',
      amountLkr: 1900,
      billingModel: 'One-time unlock fee per plan',
      note: 'Unlocks supplier prices, store comparison, room budget, tap-to-call, booking & priced PDF.',
    },
    {
      key: 'FURNITURE_MONTHLY_PASS',
      label: 'Furniture Premium Monthly Pass',
      amountLkr: 3500,
      billingModel: 'Monthly pass',
      note: 'Unlocks furniture pricing & store contact across all active plans.',
    },
    {
      key: 'CONTRACTOR_LEAD_UNLOCK',
      label: 'Contractor Contact / Lead Unlock',
      amountLkr: 1500,
      billingModel: 'Fixed lead fee',
      note: 'Unlocks direct contractor contact & verified project lead package.',
    },
    {
      key: 'ENGINEER_COMMISSION_PCT',
      label: 'Civil Engineer Site Visit Platform Share (%)',
      amountLkr: 15,
      billingModel: 'Percentage commission on fixed site visit fee',
      note: 'Platform retains configurable % share on PayHere engineer bookings.',
    },
    {
      key: 'SHOP_SUBSCRIPTION_FEATURED',
      label: 'Featured Shop Store Subscription (Monthly)',
      amountLkr: 9500,
      billingModel: 'Monthly recurring platform fee',
      note: 'Basic vs Featured Store tier.',
    },
    {
      key: 'WORKER_JOB_COMMISSION_LKR',
      label: 'Skilled Worker Completed Job Commission',
      amountLkr: 500,
      billingModel: 'Flat commission per completed job',
      note: 'Applied on job completion approval.',
    },
    {
      key: 'FURNITURE_REFERRAL_PCT',
      label: 'Furniture Purchase / Referral Commission (%) [Planned]',
      amountLkr: 0,
      billingModel: 'Referral commission — mechanism configurable / not yet finalised',
      note: 'Per spec: mechanism to be finalised; disabled (0%) until policy is settled.',
    },
  ];

  return {
    users,
    kycSubmissions: [],
    setbackRules,
    rateSets: [defaultRateSet],
    projects,
    professionals,
    bookings: [],
    engineerReports: [],
    boqs: [],
    shops,
    products,
    placements: [],
    shopLeads: [],
    campaigns,
    workers,
    workerJobs: [],
    pricingConfigs,
    payments: [],
    entitlements: [],
    disputes: [],
    auditLogs: [
      {
        id: 'audit-seed-1',
        actorUserId: 'user-admin-1',
        action: 'SEED_DEMO_BASELINE',
        targetType: 'RATE_SET',
        targetId: defaultRateSet.id,
        metadata: { versionLabel: defaultRateSet.versionLabel, isDemoSample: true },
        createdAt: now,
      },
    ],
    otps: [],
  };
}

export class PlatformStore {
  private db: DatabaseSync | null = null;
  public state: PlatformSnapshot;

  constructor(sqlitePath?: string) {
    if (sqlitePath && sqlitePath !== ':memory:') {
      fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
      this.db = new DatabaseSync(sqlitePath);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS kv_snapshot (
          id TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      const row = this.db.prepare('SELECT payload FROM kv_snapshot WHERE id = ?').get('main') as
        | { payload: string }
        | undefined;
      if (row) {
        this.state = JSON.parse(row.payload) as PlatformSnapshot;
      } else {
        this.state = createInitialSeed();
        this.save();
      }
    } else {
      this.state = createInitialSeed();
    }
  }

  public save(): void {
    if (!this.db) return;
    this.db
      .prepare(
        'INSERT INTO kv_snapshot (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at'
      )
      .run('main', JSON.stringify(this.state), new Date().toISOString());
  }

  public resetDemo(): void {
    this.state = createInitialSeed();
    this.save();
  }

  public hasEntitlement(userId: string, entitlementType: EntitlementType, resourceId: string): boolean {
    return this.state.entitlements.some(
      (e) =>
        e.userId === userId &&
        ((e.entitlementType === entitlementType && e.resourceId === resourceId) ||
          (entitlementType === 'FURNITURE_PREMIUM_PLAN' && e.entitlementType === 'FURNITURE_MONTHLY_PASS'))
    );
  }

  public addAuditLog(actorUserId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}): void {
    this.state.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actorUserId,
      action,
      targetType,
      targetId,
      metadata,
      createdAt: new Date().toISOString(),
    });
    this.save();
  }
}
