# Haus & Co — API & Integration Setup Guide

## REST API Overview (Base: `/api/v1`)
OpenAPI 3.1 JSON is served dynamically at `GET /api/v1/openapi.json`.

### Key Endpoints & Enforcement Boundaries
- **Auth & KYC (`/auth/*`):**
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/demo-login` (`DEMO_MODE=true` only)
  - `POST /auth/otp/request`, `POST /auth/otp/verify` (rate-limited, 5-minute TTL, Dialog/Mobitel carrier routing)
  - `POST /auth/kyc` (masks NIC, stores credential code, sets `PENDING_KYC`)
- **Projects, Plots & Plans (`/projects/*`):**
  - `PUT /projects/:id/plot` (validates polygon, converts m² to perches `1 perch = 25.29 m²`, computes buildable setback polygon)
  - `POST /projects/:id/plans/generate` (Variant A & Variant B)
  - `POST /projects/:id/plans/ai-edit` (controlled server-side tool execution + setback validation + automatic estimate refresh)
  - `GET /projects/:id/plans/:versionId/3d-model` (returns `402` unless `MODEL_3D_UNLOCK` entitlement is active)
- **Estimator & BOQ Audit:**
  - `POST /projects/:id/estimates` (Method A + Method B snapshot bound to active `RateSet` version)
  - `POST /projects/:id/boqs`, `POST /boqs/:boqId/rebuttal`
- **Marketplace & Fit Check:**
  - `GET /marketplace/products` (redacts `priceLkr` and `shopPhone` for free users)
  - `GET /marketplace/products/:id/compare` (returns `402` unless Furniture Premium unlocked)
  - `POST /projects/:id/furniture/placements` (computes `FITS` / `TIGHT` / `DOES_NOT_FIT`)
- **Workers, Payments & Admin:**
  - `POST /worker-jobs/:id/review` (returns `403` unless job status is `COMPLETED_PAID`)
  - `POST /payments/checkout`, `POST /payments/payhere/notify` (idempotent verification)
  - `GET /admin/overview`, `POST /admin/rates`, `POST /admin/kyc/:id/decision` (`PLATFORM_ADMIN` only)

## Production Integration Checklist
1. **PostgreSQL:** Start `docker compose up -d postgres` and run `database/migrations/001_initial_schema.sql`.
2. **S3 Private Object Storage:** Configure `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`.
3. **PayHere:** Set `PAYHERE_MODE=live`, `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, and configure public `PAYHERE_NOTIFY_URL`.
4. **Dialog / Mobitel SMS OTP:** Set `OTP_PROVIDER=dialog` or `mobitel` and configure API keys; set `DEMO_MODE=false`.
