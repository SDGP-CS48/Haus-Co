-- Haus & Co PostgreSQL Schema Migration 001
-- Preserves explicit units, versioned rates, plan snapshots, BOQ audit history, and strict RBAC.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Identity, Users, Roles & KYC
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone_e164 TEXT UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL CHECK (role IN (
    'HOME_BUILDER',
    'GENERAL_CONTRACTOR',
    'CIVIL_ENGINEER',
    'SHOP_OWNER',
    'SKILLED_WORKER',
    'PLATFORM_ADMIN'
  )),
  portal TEXT NOT NULL CHECK (portal IN (
    'HOME_BUILDER_PORTAL',
    'CONTRACTOR_ENGINEER_PORTAL',
    'SHOP_OWNER_PORTAL',
    'SYSTEM_OPERATIONS'
  )),
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN (
    'UNVERIFIED', 'PENDING_KYC', 'VERIFIED', 'REJECTED', 'SUSPENDED'
  )),
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 TEXT NOT NULL,
  carrier TEXT NOT NULL CHECK (carrier IN ('DIALOG', 'MOBITEL', 'OTHER')),
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('REGISTER', 'LOGIN', 'PHONE_VERIFY')),
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nic_masked TEXT NOT NULL,
  nic_encrypted_ref TEXT NOT NULL,
  credential_code TEXT, -- e.g. CIDA / IESL registration reference
  document_object_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects & Documents
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  district TEXT NOT NULL,
  local_authority TEXT NOT NULL,
  onboarding_path TEXT NOT NULL CHECK (onboarding_path IN ('START_FROM_SCRATCH', 'UPLOAD_EXISTING_PLAN')),
  active_stage TEXT NOT NULL DEFAULT 'DRAW_PLOT' CHECK (active_stage IN (
    'DRAW_PLOT', 'GENERATE_2D_PLAN', 'ROUGH_COST_ESTIMATE',
    'ENGINEER_AND_CONTRACTOR', 'BOQ_AUDIT', 'FURNISH_SPACE', 'HIRE_WORKERS'
  )),
  active_plan_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploader_user_id UUID NOT NULL REFERENCES users(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('EXTERNAL_PLAN', 'LAND_SURVEY', 'SOIL_REPORT', 'STRUCTURAL_REPORT', 'SITE_PHOTO')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  s3_object_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Plots, Vertices & Configurable Municipal Setback Rules
CREATE TABLE IF NOT EXISTS setback_rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_name TEXT NOT NULL,
  district TEXT NOT NULL,
  version_label TEXT NOT NULL,
  rule_source_note TEXT NOT NULL,
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  front_setback_m NUMERIC(6,2) NOT NULL,
  rear_setback_m NUMERIC(6,2) NOT NULL,
  left_setback_m NUMERIC(6,2) NOT NULL,
  right_setback_m NUMERIC(6,2) NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS plots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  setback_rule_set_id UUID REFERENCES setback_rule_sets(id),
  vertices_json JSONB NOT NULL, -- [{x, y}] in metres
  area_sqm NUMERIC(12,3) NOT NULL,
  area_perches NUMERIC(12,3) NOT NULL,
  perimeter_m NUMERIC(12,3) NOT NULL,
  buildable_area_sqm NUMERIC(12,3) NOT NULL,
  buildable_area_perches NUMERIC(12,3) NOT NULL,
  buildable_polygon_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. House Plans & Versioned Snapshots
CREATE TABLE IF NOT EXISTS house_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  variant_code TEXT NOT NULL CHECK (variant_code IN ('VARIANT_A_COMPACT', 'VARIANT_B_SPACIOUS', 'UPLOADED_PLAN')),
  title TEXT NOT NULL,
  storeys INT NOT NULL CHECK (storeys IN (1, 2)),
  roof_type TEXT NOT NULL CHECK (roof_type IN ('GABLE', 'HIP', 'FLAT_SLAB', 'MONO_PITCH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_plan_id UUID NOT NULL REFERENCES house_plans(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  edit_source TEXT NOT NULL CHECK (edit_source IN ('INITIAL_GENERATOR', 'AI_TOOL_EDIT', 'MANUAL_EDIT', 'UPLOAD')),
  edit_summary TEXT NOT NULL,
  rooms_json JSONB NOT NULL,
  walls_json JSONB NOT NULL,
  openings_json JSONB NOT NULL,
  total_room_area_sqm NUMERIC(10,3) NOT NULL,
  total_wall_length_m NUMERIC(10,3) NOT NULL,
  footprint_width_m NUMERIC(8,3) NOT NULL,
  footprint_depth_m NUMERIC(8,3) NOT NULL,
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (house_plan_id, version_number)
);

-- 5. Versioned Rates & Cost Estimates (Snapshots Never Mutate Retroactively)
CREATE TABLE IF NOT EXISTS rate_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label TEXT NOT NULL,
  is_demo_sample BOOLEAN NOT NULL DEFAULT TRUE,
  base_rate_lkr_per_sqm NUMERIC(14,2) NOT NULL,
  default_wall_allowance NUMERIC(5,3) NOT NULL DEFAULT 0.150,
  default_contingency_pct NUMERIC(5,3) NOT NULL DEFAULT 0.100,
  district_factors_json JSONB NOT NULL,
  stage_shares_json JSONB NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_set_id UUID NOT NULL REFERENCES rate_sets(id) ON DELETE CASCADE,
  material_code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_price_lkr NUMERIC(14,2) NOT NULL,
  default_coeff_k NUMERIC(8,4) NOT NULL,
  default_waste_pct NUMERIC(5,4) NOT NULL,
  quantity_basis TEXT NOT NULL CHECK (quantity_basis IN ('WALL_AREA_SQM', 'SLAB_AREA_SQM', 'ROOF_AREA_SQM', 'BUILT_AREA_SQM'))
);

CREATE TABLE IF NOT EXISTS cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_version_id UUID NOT NULL REFERENCES plan_versions(id),
  rate_set_id UUID NOT NULL REFERENCES rate_sets(id),
  finish_grade TEXT NOT NULL CHECK (finish_grade IN ('STANDARD', 'MID_RANGE', 'PREMIUM')),
  district TEXT NOT NULL,
  storeys INT NOT NULL,
  contingency_pct NUMERIC(5,3) NOT NULL,
  method_a_total_lkr NUMERIC(16,2) NOT NULL,
  method_a_low_lkr NUMERIC(16,2) NOT NULL,
  method_a_high_lkr NUMERIC(16,2) NOT NULL,
  method_a_per_sqm_lkr NUMERIC(14,2) NOT NULL,
  method_b_material_total_lkr NUMERIC(16,2) NOT NULL,
  stage_breakdown_json JSONB NOT NULL,
  material_lines_json JSONB NOT NULL,
  disclaimer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Professionals, Bookings & WebRTC Consultations
CREATE TABLE IF NOT EXISTS contractor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cida_grade TEXT NOT NULL,
  cida_reg_no TEXT NOT NULL,
  service_districts_json JSONB NOT NULL,
  bio TEXT NOT NULL,
  years_experience INT NOT NULL,
  is_sample_data BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS engineer_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  chartered_reg_no TEXT NOT NULL,
  qualification TEXT NOT NULL,
  service_districts_json JSONB NOT NULL,
  site_visit_fee_lkr NUMERIC(12,2) NOT NULL,
  bio TEXT NOT NULL,
  is_sample_data BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  builder_user_id UUID NOT NULL REFERENCES users(id),
  provider_user_id UUID NOT NULL REFERENCES users(id),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('ENGINEER_SITE_VISIT', 'WEBRTC_VOICE_CONSULT', 'CONTRACTOR_LEAD_UNLOCK')),
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  amount_lkr NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_commission_lkr NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engineer_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  engineer_user_id UUID NOT NULL REFERENCES users(id),
  land_quality_summary TEXT NOT NULL,
  soil_bearing_kpa NUMERIC(8,2),
  recommended_foundation_depth_m NUMERIC(6,2) NOT NULL,
  structural_load_notes TEXT NOT NULL,
  plan_technically_verified BOOLEAN NOT NULL DEFAULT FALSE,
  report_object_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BOQ Quotations, Audit Runs & Contractor Rebuttals
CREATE TABLE IF NOT EXISTS boqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_version_id UUID NOT NULL REFERENCES plan_versions(id),
  contractor_user_id UUID NOT NULL REFERENCES users(id),
  quote_mode TEXT NOT NULL CHECK (quote_mode IN ('WITH_MATERIALS', 'WITHOUT_MATERIALS')),
  version_number INT NOT NULL DEFAULT 1,
  total_lkr NUMERIC(16,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_AUDIT', 'REBUTTED', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_id UUID NOT NULL REFERENCES boqs(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL CHECK (stage_key IN ('FOUNDATION', 'SUPERSTRUCTURE', 'ROOFING', 'MEP', 'FINISHES')),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_rate_lkr NUMERIC(14,2) NOT NULL,
  labour_markup_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  line_total_lkr NUMERIC(16,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_id UUID NOT NULL REFERENCES boqs(id) ON DELETE CASCADE,
  estimate_id UUID REFERENCES cost_estimates(id),
  variance_pct NUMERIC(8,2) NOT NULL,
  summary_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id UUID NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE,
  boq_item_id UUID REFERENCES boq_items(id),
  flag_type TEXT NOT NULL CHECK (flag_type IN ('MISSING_ITEM', 'PRICE_LOW_WARNING', 'PRICE_HIGH_WARNING')),
  severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  explanation TEXT NOT NULL,
  contractor_rebuttal TEXT,
  revised_unit_rate_lkr NUMERIC(14,2),
  rebutted_at TIMESTAMPTZ
);

-- 8. Shops, Dimensioned Products, Interior Placements & Fit Checks
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  branches_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  operating_hours TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'BASIC' CHECK (subscription_tier IN ('BASIC', 'FEATURED')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_sample_data BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  product_kind TEXT NOT NULL CHECK (product_kind IN ('FURNITURE', 'HARDWARE')),
  category TEXT NOT NULL,
  width_m NUMERIC(6,3) NOT NULL,
  depth_m NUMERIC(6,3) NOT NULL,
  height_m NUMERIC(6,3) NOT NULL,
  material TEXT NOT NULL,
  colour TEXT NOT NULL,
  price_lkr NUMERIC(14,2) NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  footprint_shape TEXT NOT NULL DEFAULT 'RECTANGLE' CHECK (footprint_shape IN ('RECTANGLE', 'CIRCLE', 'L_SHAPE')),
  photo_url TEXT,
  price_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_sample_data BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS furniture_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_version_id UUID NOT NULL REFERENCES plan_versions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  room_id TEXT NOT NULL,
  x_m NUMERIC(8,3) NOT NULL,
  y_m NUMERIC(8,3) NOT NULL,
  rotation_deg INT NOT NULL CHECK (rotation_deg IN (0, 90, 180, 270)),
  fit_status TEXT NOT NULL CHECK (fit_status IN ('FITS', 'TIGHT', 'DOES_NOT_FIT')),
  fit_reasons_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Skilled Workers, Jobs & Completion-Gated Reviews
CREATE TABLE IF NOT EXISTS worker_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trade_category TEXT NOT NULL CHECK (trade_category IN ('ELECTRICIAN', 'PLUMBER', 'MASON', 'PAINTER', 'CARPENTER')),
  district TEXT NOT NULL,
  certifications_json JSONB NOT NULL,
  availability_note TEXT,
  daily_rate_hint_lkr NUMERIC(10,2),
  is_sample_data BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS job_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  builder_user_id UUID NOT NULL REFERENCES users(id),
  worker_user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  scope_description TEXT NOT NULL,
  agreed_amount_lkr NUMERIC(12,2) NOT NULL,
  platform_commission_lkr NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED_PAID', 'CANCELLED')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_booking_id UUID UNIQUE NOT NULL REFERENCES job_bookings(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id),
  worker_user_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Payments, Entitlements, Sponsored Ads & Audit Logs
CREATE TABLE IF NOT EXISTS pricing_configs (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  amount_lkr NUMERIC(12,2) NOT NULL,
  billing_model TEXT NOT NULL,
  is_configurable_policy BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL CHECK (provider IN ('PAYHERE', 'DEMO_ADAPTER')),
  external_order_id TEXT UNIQUE NOT NULL,
  entitlement_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  amount_lkr NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('INITIATED', 'VERIFIED', 'FAILED', 'REFUNDED')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_type TEXT NOT NULL CHECK (entitlement_type IN (
    'MODEL_3D_UNLOCK', 'FURNITURE_PREMIUM_PLAN', 'FURNITURE_MONTHLY_PASS',
    'CONTRACTOR_LEAD_UNLOCK', 'SHOP_SUBSCRIPTION_FEATURED'
  )),
  resource_id TEXT NOT NULL,
  payment_id UUID REFERENCES payments(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entitlement_type, resource_id)
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_stage TEXT NOT NULL CHECK (target_stage IN (
    'DRAW_PLOT', 'GENERATE_2D_PLAN', 'ROUGH_COST_ESTIMATE',
    'ENGINEER_AND_CONTRACTOR', 'BOQ_AUDIT', 'FURNISH_SPACE', 'HIRE_WORKERS'
  )),
  billing_model TEXT NOT NULL CHECK (billing_model IN ('CPM', 'CPC')),
  budget_lkr NUMERIC(12,2) NOT NULL,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'REJECTED')),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
