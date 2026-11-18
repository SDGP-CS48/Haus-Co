# Haus & Co — Digital Home Construction Platform

**Positioning:** *From floor plan to finished home.*  
An end-to-end digital home-construction platform built for the Sri Lankan market connecting **Home Builders**, **General Contractors**, **Civil Engineers**, **Hardware & Furniture Shops**, and **Skilled Workers**.

---

## Architecture Overview

This repository is structured as a three-package TypeScript workspace:

1. **`shared/` (`@hausco/shared`)** — Pure TypeScript domain core shared by frontend and backend:
   - Polygon land geometry, Sri Lankan perch conversion (`1 perch = 25.29 m²`), self-intersection checks, and configurable municipal setback buffer calculation (`geometry.ts`).
   - Deterministic 2D concept layout engine (`Variant A: Compact / Open-Plan` and `Variant B: Spacious / Traditional`), controlled AI-edit tool handlers (`resize_room`, `add_bedroom`, `change_style`, `set_storeys`, `set_roof_type`), and to-scale furniture collision & door-swing fit checks (`FITS`, `TIGHT`, `DOES_NOT_FIT`).
   - Cost Estimator **Method A** (area-based) and **Method B** (quantity-based material breakdown) with 5-stage allocations (`estimator.ts`).
   - Multi-Stage BOQ Auditor (`MISSING_ITEM`, `PRICE_LOW_WARNING`, `PRICE_HIGH_WARNING`) (`boqAuditor.ts`).
   - Role-based access control matrix across all 6 system roles (`permissions.ts`).

2. **`backend/` (`@hausco/backend`)** — Modular monolith REST API (Node 24 + Express 5 + Zod + built-in `node:sqlite` local store + OpenAPI 3.1):
   - Enforces server-side RBAC, PayHere/demo payment verification, 3D model entitlement gates (`402 Payment Required`), Free vs Premium furniture price/contact redaction, payment-gated skilled worker reviews (`403 Forbidden` before `COMPLETED_PAID`), effective-dated rate versioning, and privileged audit logs.
   - OpenAPI 3.1 spec served at `GET /api/v1/openapi.json`.

3. **`frontend/` (`@hausco/frontend`)** — React 19 + TypeScript + Vite + Tailwind CSS v4 + Three.js (`@react-three/fiber`, `@react-three/drei`) + GSAP + Motion for React:
   - Brand palette strictly preserved (`#D9940A` Golden Amber, `#F4B41A` Golden Yellow, `#FDE8A5` Pale Gold, `#FAF7EE` Warm Off-white, `#1C1C1A` Ink) and unmodified official Haus & Co logo (`frontend/public/assets/haus-co-logo.png`).
   - Complete public marketing website (`/`, `/how-it-works`, `/house-planner`, `/cost-estimator`, `/professionals`, `/marketplace`, `/workers`, `/about`, `/contact`), role-selection & OTP/KYC auth (`/auth/*`), 7-module Home Builder Portal (`/builder/*`), Contractor Portal (`/contractor/*`), Civil Engineer Portal (`/engineer/*`), Shop Owner Portal (`/shop/*`), Skilled Worker Portal (`/worker/*`), and Internal Operations Console (`/admin/*`).

4. **`database/migrations/` & `docker-compose.yml`** — Production PostgreSQL DDL schema (`001_initial_schema.sql`) and local Postgres + MinIO services.

---

## Setup & Scripts

### Prerequisites
- Node.js v22+ (tested on Node v24.14.1) & npm 10+

### Quick Start (Local Demo Mode)
```bash
cp .env.example .env
npm install
npm run build --workspace=shared
npm run dev
```
- Frontend runs at `http://localhost:5173`
- Backend API runs at `http://localhost:4000/api/v1` (with Vite `/api` proxy configured)

### Verification Commands
```bash
npm run typecheck
npm test
npm run build
```

---

## Demo Seed Data & Safe Integration Adapters

All pre-seeded entities (projects, sample rate `LKR 200,000/m²`, CIDA contractors, chartered civil engineers, Sri Lankan hardware/furniture shops, skilled workers, and demo credentials) are **clearly marked as Sample Data** and must **never** be treated as verified live suppliers, real market prices, or legal municipal approvals.

Where external services require credentials:
- **Sri Lankan Phone OTP (Dialog / Mobitel):** Routes by `+94` prefix (`077/076/074` Dialog, `071/070` Mobitel). In `DEMO_MODE=true`, returns a labelled demo OTP adapter notice; in production mode without SMS keys, returns HTTP `503` rather than faking delivery.
- **PayHere Payments:** Uses `PayHereDemoAdapter` in demo mode and verifies MD5 signatures via `/api/v1/payments/payhere/notify` in live/sandbox mode.
- **WebRTC Consultations:** Initializes signaling room tokens and STUN/TURN metadata; media peer connection requires TURN/signaling infrastructure in production.
- **External Retailer Fallback Search:** Generates labelled external search links (Damro, Singer Sri Lanka, Arpico) when platform stock is unavailable.

---

## Known Limitations & Implementation Assumptions
1. **Runtime Backend Stack:** Although Spring Boot was listed as a default option, Maven/Gradle and PostgreSQL binaries are not installed on this workstation; therefore the backend was built as a modular TypeScript monolith on Node 24 (`node:sqlite` local persistence) alongside production PostgreSQL DDL migrations (`database/migrations/001_initial_schema.sql`) so the full stack compiles, runs, and passes automated tests immediately offline.
2. **Blueprint Upload Parsing:** Uploading an existing architect PDF/PNG attaches the file metadata to the private vault and initializes a baseline plan structure; automated OCR/CAD vector extraction from arbitrary PDFs is not included.
3. **2D Furniture Canvas Controls:** Supports click-to-place, wall snapping, 90° rotation, and keyboard/button coordinate nudging; freeform pointer dragging of placed items is backed by the coordinate nudge controls for accessible precision.
