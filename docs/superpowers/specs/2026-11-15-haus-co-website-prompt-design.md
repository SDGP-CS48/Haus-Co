# Haus & Co Advanced Website Generation Prompt — Design Specification

**Date:** 2026-11-15  
**Target Deliverable:** `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md` (Markdown edition of the Blueprint's companion `Haus_and_Co_Advanced_Website_Generation_Prompt.txt` deliverable, per user request)  
**Source Authority:** *Haus & Co Website Architecture: Product, Experience & Technical Blueprint (v1.0, 14 November 2026)* attached in the conversation, cross-checked against the existing `Haus-Co` repository (`README.md`, `shared/`, `frontend/`, `backend/`, `docs/INTEGRATION_AND_API.md`).

> **Source-vs-Repo Precedence:** Whenever the existing repository simplifies a Blueprint requirement (for example, `frontend/src/pages/public/HomePage.tsx` condensing sections or `shared/src/*` using demo seed constants), the **attached Blueprint v1.0 is canonical**. Repo constants (`LKR 2,500` unlock fees, `1.0` district factors, 8 sample materials, `0.78×/1.38×/28%` audit thresholds) must be treated inside the prompt strictly as illustrative `Sample Data` placeholders, never as canonical production rates or fixed domain standards.

---

## 1. Intent & Why

The supplied *Website Architecture Blueprint* defines the complete product, visual, motion, role, security, and commercial architecture for **Haus & Co** (*"From floor plan to finished home"*), and explicitly calls for a missing companion deliverable: `Haus_and_Co_Advanced_Website_Generation_Prompt.txt`.

The purpose of this work is to produce that companion deliverable as a self-contained, production-ready AI generation prompt. Any capable coding agent, AI website builder, or engineering team given this prompt must be able to build (or upgrade) the **Haus & Co** Sri Lankan home-construction platform—combining architectural-grade animations and motion graphics with strict fidelity to the Blueprint's visual identity, six-role portals, Sri Lankan domain rules, and trust/safety guardrails.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Complete Source Fidelity:** Encode all 15 sections of the Blueprint (vision/principles, 3 portals + System Operations across 6 roles, 10 homepage sections & 8 supporting public pages, OTP/KYC auth & dual Home Builder onboarding, 7 Home Builder modules, Contractor/Engineer/Shop/Worker/Admin workspaces, 14 data domains & 6 integrity rules, security/trust controls, 8 revenue streams, and 7-phase roadmap + Definition of Done).
- **Executable Motion & 3D Direction:** Elevate the Blueprint's motion concepts into an explicit choreography spec for GSAP + ScrollTrigger, Motion for React, SVG architectural line-drawing, Three.js / React Three Fiber 2D-to-3D extrusions, interactive fit-check feedback, architecture-aware cursor behavior, and `prefers-reduced-motion` parity.
- **Modular Execution Format:** Organize `Haus_and_Co_Advanced_Website_Generation_Prompt.md` into clearly delimited sections with a short execution guide at the top so a user or agent can run it either end-to-end (Phases 01–07) or public-showcase-first without losing design/domain coherence.
- **Built-in Honesty & Safety Guardrails:** Require explicit `Sample Data` labeling, rate provenance/timestamps, rough-estimate disclaimers, non-accusatory BOQ audit wording, and server-side RBAC/entitlement enforcement.

### Non-Goals
- Modifying existing `frontend/`, `backend/`, `shared/`, or `database/` code directly during this task (the deliverable is the generation prompt file itself).
- Hard-coding unconfigured commercial prices, inventing legal setback regulations for Sri Lankan municipal councils, or fabricating live supplier feeds.
- Splitting the backend into microservices prematurely (Blueprint §2.4 explicitly prescribes a modular monolith).

### Anti-Goals
- **Generic SaaS/AI visuals:** Purple/blue gradients, dark cyberpunk aesthetics, or recolored/distorted Haus & Co logos.
- **Low-contrast palette violations:** White text on Golden Yellow (`#F4B41A`) or Pale Gold (`#FDE8A5`), or overusing red/amber alert tones where they obscure BOQ audit badges.
- **Motion sickness & scroll-jacking:** Pinning more than 1–2 sections per page, animating dozens of bouncing cards simultaneously, parallaxing body copy, or omitting `prefers-reduced-motion` static fallbacks.
- **Drag-only canvases:** Plot vertex editing or furniture placement without keyboard and single-pointer button controls.
- **False precision:** Presenting `LKR 200,000/m²`, `2.3 m` front setback, or rough cost estimates as binding quotes or statutory building rules.

---

## 3. Constraints

### Brand & Visual System (Non-Negotiable)
- **Official Palette Tokens:**
  - Golden Amber (Primary): `#D9940A` — logo top layer, headings, primary CTAs, active tabs, links, table headers, key icons (**white text allowed**).
  - Golden Yellow (Secondary): `#F4B41A` — logo middle layer, accents, progress bars, selected/hover states, dividers, badges (**Ink `#1C1C1A` text only — never white text**).
  - Pale Gold (Surface): `#FDE8A5` — logo bottom layer, selected cards, panels, input surfaces, highlighted rows (**Ink `#1C1C1A` text**).
  - Warm Off-white (Canvas): `#FAF7EE` — base background across all screens.
  - Ink (Text Neutral): `#1C1C1A` — primary body text and labels (soft near-black instead of `#000000`).
- **Logo Rules:** Preserve exact 3-layer isometric stack order (`#D9940A` top, `#F4B41A` middle, `#FDE8A5` bottom). Never recolor, redraw, or distort.
- **Three Experience Modes:**
  1. *Public Marketing Website:* Premium architectural editorial—large architectural imagery, wide layouts, `#FAF7EE` canvas, restrained amber accents, cinematic transitions.
  2. *Home Planning Workspace:* Technical, precise, calm—grids, measurement labels, tool panels, SVG blueprint, controlled 3D viewport, explicit selection states.
  3. *Marketplace & Portals:* Information-dense yet approachable—filters, dimensioned product cards, tables, status badges, responsive navigation.

### Domain, Math & Sri Lankan Localization Rules
- **Land Units:** Square metres (`m²`) and Sri Lankan perches (`1 perch = 25.29 m²`).
- **Plot Geometry & Setbacks:** Irregular and regular polygon drawing with true polygon containment/setback inset validation (not bounding-box-only approximations on irregular plots). Setback rules must come from configurable local authority rule sets; the `2.3 m` front setback example in the Blueprint is explicitly non-universal.
- **Cost Estimator (Method A & Method B Side-by-Side):**
  - *Method A (Area-based):* $A = A_{rooms} \times (1 + w)$ (default $w = 0.15$); $\text{Total} = A \times R \times F \times S \times L \times (1 + C)$ where $F \in \{\text{Standard } 1.00, \text{Mid-range } 1.20, \text{Premium } 1.45\}$, $S \in \{\text{Single } 1.00, \text{Two-storey } 1.10\}$, $L$ = admin-maintained district factor, $C$ = contingency (default $10\%$), outputting estimated total, $\pm 10\%$ low-to-high range, cost per `m²`, and instant what-if recalculation. Must flag the `LKR 200,000/m²` example (`LKR 30,360,000` for `100 m²` room area) as an illustrative placeholder only.
  - *Method B (Quantity-based):* $Qty_m = PlanQuantity_m \times k_m \times (1 + waste_m)$; $MaterialCost = \sum (Qty_m \times Price_m)$, with editable $k_m$, $waste_m$, and admin-maintained material price provenance/timestamps.
  - *5 Construction Stages:* Foundation & Substructure (`15%`), Superstructure & Masonry (`30%`), Roofing & Truss Work (`15%`), Electrical & Plumbing MEP (`15%`), Finishes & Tile Work (`25%`) — default shares editable with total normalized to `100%`.
  - *Disclaimer:* Explicitly state that results are rough estimates, never contractor quotations.
- **AI Plan Generation & Editing Safety:** Deterministic generator creates **Variant A (Compact / Open-Plan)** and **Variant B (Spacious / Traditional)**. AI assistant acts strictly as an intent interpreter calling controlled server-side geometry actions; invalid edits breaching plot/setback constraints must be rejected deterministically with a clear explanation; accepted edits auto-refresh estimates and create immutable plan versions.
- **Commercial Pricing Rule:** Per Blueprint §13.1, **do not hard-code commercial prices until configured by the platform owner**. All paid unlocks, bookings, subscriptions, ad CPM/CPC rates, and commissions read from admin-configured pricing (with any demo preview fees clearly marked as `Sample Data`).
- **Telecom, Payments & Voice:** Sri Lankan `+94` phone OTP (Dialog / Mobitel), NIC KYC for providers, PayHere server-verified callbacks (never trusting frontend success redirects), free in-app WebRTC voice consultations, and external retailer fallback links when platform stock is unavailable.

### Accessibility, Performance & Motion Constraints
- Respect `prefers-reduced-motion: reduce` (`gsap.matchMedia()` + CSS media query): disable scroll-scrubbing, parallax, and SplitText/SVG draw intros, rendering final readable states immediately.
- Cap pinned ScrollTrigger sections at 1–2 per page; call `ScrollTrigger.refresh()` after font/image load; clean up GSAP contexts and SplitText instances on unmount.
- Animate 1–2 focal elements per viewport; animate GPU-composited `transform`, `opacity`, and SVG `stroke-dashoffset` rather than layout dimensions (`width`/`height`/`top`/`left`).
- Lazy-load Three.js / R3F scenes and video; separate scripted camera rigs from free-look `OrbitControls`; support mouse and touch events (`passive: false` where `preventDefault` is needed).
- Provide keyboard/button coordinate controls alongside plot vertex dragging and furniture drag-and-drop (WCAG 2.2 AA dragging movements); preserve `>= 4.5:1` contrast, `2px` visible focus outlines, and text/icon pairings alongside status colors.

---

## 4. Approaches Considered & Selection

| Approach | Summary | Tradeoff | Decision |
|---|---|---|---|
| **1. Full-Platform Master Prompt** *(Selected)* | Produces `Haus_and_Co_Advanced_Website_Generation_Prompt.md` covering design system, deep motion/3D choreography, 10-section public site, 6-role portals, 7 builder modules, domain math, data/security, and 7-phase roadmap. | Longer multi-part prompt; requires modular framing so downstream tools can run all phases or start with the public site. | **Chosen by user** — fulfills the missing Blueprint companion deliverable completely. |
| **2. Repo-Targeted Motion Upgrade Prompt** | Tailored strictly to refactor existing files in `frontend/src/`. | Tightly coupled to current repo paths; non-portable. | Rejected. |
| **3. Public Marketing Showcase Prompt Only** | Scopes only to public pages with heavy motion. | Omits all 7 builder modules, portals, BOQ audit, and role architecture. | Rejected. |

---

## 5. Complete Specification of What the Prompt Must Contain

The generated `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.txt` will be structured into **9 cohesive modules** plus an introductory **"How to Execute This Prompt"** preamble:

### Preamble: Execution Modes & Honesty Mandate
- Explain how an AI agent or team can run the prompt in **Full-Platform Mode** (Phases 01–07) or **Public Showcase First Mode** (Phase 01 + Motion Engine, preserving deep links).
- State the 7 Experience Principles (One guided journey; Explain the numbers; Trust through verification; Real-world fit; Role clarity; Premium, calm interface; Honest product states).

### Module 1: Visual System, Palette & Typography
- Exact hex tokens, contrast matrix, logo layer lock, drafting grid textures, and 3 experience modes.
- `[Our Call]` **Typography pairing:** Specify `Plus Jakarta Sans` (display headings), `Inter` (body/UI), and `JetBrains Mono` with `tabular-nums` (measurements, perches, `m²`, LKR totals, BOQ line items) with fluid `clamp()` sizing, matching the repo's established visual baseline.

### Module 2: Advanced Animations & Motion Graphics Engine
Detailed choreography contracts using **GSAP + ScrollTrigger**, **Motion for React**, **SVG**, and **Three.js / React Three Fiber**:
1. **Living Blueprint Hero & Dual-Layer Reveal:** Architectural grid canvas + staggered headline entrance + animated SVG floor plan (`strokeDasharray`/`strokeDashoffset`) drawing plot boundary -> setback envelope -> exterior/interior walls -> door swing arcs -> dimension callouts -> cross-morphing into a Three.js isometric extruded preview with warm sun lighting, directional shadows, subtle `FogExp2` depth, and a scripted intro camera handing off to damped pointer/touch `OrbitControls`.
2. **Scroll-Driven Construction Narrative (Pinned Scrollytelling):** One pinned narrative section on desktop (`scrub: 0.8`, collapsing cleanly to sequential vertical cards on mobile and reduced motion) evolving one consistent house model across 4 phases synced to progress indicators and LKR stage bars: Foundation & Substructure (15%) -> Superstructure & Masonry (30%) -> Roofing & MEP (30%) -> Finishes & Furnishing (25%).
3. **2D-to-3D Plan Transformation Showcase (`/house-planner` + Homepage Section 05):** Interactive toggle and `Motion` `layoutId` shared transition comparing Variant A (*Compact / Open-Plan*) and Variant B (*Spacious / Traditional*) as 2D SVG walls, slabs, and roof geometry extrude smoothly into a sky-lit 3D model (preview teaser publicly; gated behind `MODEL_3D_UNLOCK` in the builder portal).
4. **Interactive Rough Estimator Showcase (Homepage Section 06 + `/cost-estimator`):** Area slider, finish-grade pills, and storey toggle driving spring-interpolated `tabular-nums` LKR counters, animated 5-stage progress bars, Method A vs Method B side-by-side cards, and a pinned rough-estimate disclaimer banner.
5. **Tactile Furniture Fit-Check Showcase & Workspace (Homepage Section 07 + Module 6):** Real-scale `W×D×H` furniture blocks with magnetic wall snapping, 90° rotational springs, real-time door-swing arc collision overlays, live room floor-utilization meter, and icon+text+color `Fits` / `Tight` / `Does not fit` badges—backed by keyboard/button coordinate controls.
6. **Architecture-Aware Cursor & Restrained Micro-Interactions:** `[data-arch-cursor]` contextual drafting crosshair active solely over blueprint, plot, and 3D canvas zones (showing `MEASURE` / `ORBIT` / `SNAP` micro-hints; disabled on touch & reduced motion), subtle drafting-grid background parallax (`5–10%` delta, never on body text), and crisp `150–250ms` hover/focus micro-motions capped at 1–2 focal animations per view.

### Module 3: Public Website Information Architecture (10 Homepage Sections + 8 Supporting Pages)
Must specify all **10 main nav items** (`Home`, `How It Works`, `House Planner`, `Cost Estimator`, `Professionals`, `Marketplace`, `Skilled Workers`, `About`, `Contact`, `Sign In / Get Started`), **deep-linked conversion CTAs** (routing directly to role selection / onboarding or resuming authenticated project context), and **all 10 Homepage sections verbatim from Blueprint §3.2**:
1. `01. Hero` — Cinematic architectural video or interactive still/blueprint, concise headline, value statement, dual CTAs.
2. `02. Problem` — Fragmented services, uncertain budgets, difficult supplier/product comparison.
3. `03. Platform proposition` — Interactive hub/diagram connecting the home to planning, estimation, professionals, BOQ, furnishing, and workers.
4. `04. Seven-step journey` — Draw plot -> generate 2D plan -> rough cost estimate -> engineer & contractor -> BOQ audit -> furnish -> hire workers.
5. `05. Planner showcase` — 2D blueprint becoming an interactive 3D house model.
6. `06. Estimator showcase` — Estimated total, `±10%` range, cost per `m²`, 5-stage breakdown, approximate materials.
7. `07. Marketplace showcase` — Dimensioned furniture and supplier products with real dimensions & fit teaser.
8. `08. Professional network` — Verified CIDA contractors, chartered civil engineers, and tradespeople.
9. `09. Partner invitation` — Invite hardware/furniture shops, professionals, and tradespeople to join.
10. `10. Closing CTA` — Return visitors to the *Start Building* journey.

Plus the **8 supporting public pages** (`/how-it-works`, `/house-planner`, `/cost-estimator`, `/professionals`, `/marketplace`, `/workers`, `/about`, `/contact`).

### Module 4: Authentication, 6-Role Gateway & Onboarding
- Role-first gateway across the 6 system roles grouped cleanly across portals:
  - *Home Builder Portal:* `Home Builder`
  - *Contractor & Engineer Portal:* `General Contractor`, `Civil Engineer`
  - *Shop Owner Portal:* `Hardware & Furniture Shop` and `Skilled Worker` *(preserving distinct worker workspace & permissions per Blueprint §6.4)*
  - *System Operations (Internal Only, non-public entry):* `Platform Administrator`
- Standard credentials, Google sign-in (where configured), Sri Lankan `+94` phone OTP (Dialog / Mobitel), NIC KYC verification with visible auditable status, explicit multi-role switching only when enabled, save-and-resume project support, and backend-enforced RBAC.
- Dual Home Builder onboarding: **Start from Scratch** (plot geometry -> room requirements -> AI 2D concepts -> estimate) vs **Upload Existing Plan** (PDF/image blueprint upload -> review/confirm plan details -> estimator/engineer/BOQ/interior).
- `[Our Call]` **Upload Existing Plan Boundary:** Render uploaded PDF/image in a secure preview panel with scale/room-area confirmation inputs (plus an optional extraction hook where configured), never fabricating unverified CAD geometry automatically.

### Module 5: Home Builder Portal — 7 Core Modules
Persistent active project switcher across `Overview`, `Projects`, `Land & Plot`, `House Planner`, `Cost Estimator`, `Professionals`, `BOQ Audit`, `Interior & Furniture`, `Skilled Workers`, `Settings`:
1. **Plot Drawer Canvas:** Draggable polygon vertices + manual dimension entry, m² and Sri Lankan perches (`25.29 m²`), configurable setback buffers & buildable-zone overlay with true polygon containment checks.
2. **Rough Cost Estimator:** Method A + Method B side-by-side, editable 5-stage allocations, what-if controls, material breakdown with price provenance, `±10%` range, and disclaimer.
3. **AI Plan Generator & Editing Suite:** Variant A & B generation; controlled AI natural-language edits (`[Our Call]` closed tool registry: `resize_room`, `add_bedroom`, `remove_room`, `change_style`, `set_storeys`, `set_roof_type`, `adjust_opening` backed by an intent-interpreter abstraction with deterministic fallback); setback rejection explanations; auto-refreshing estimates; 2D SVG blueprint; paid Three.js 3D unlock.
   - `[Our Call]` **2-Storey Support:** When `storeys === 2`, maintain floor-indexed rooms (`floor: 1 | 2` with stair circulation allowance), a Floor 1 / Floor 2 switcher in 2D blueprint & furniture placement, and stacked upper slab extrusion in 3D.
4. **Professional Service Booking:** Separate tabs for CIDA contractors and chartered civil engineers; visible credentials/verification; free WebRTC voice consultations; paid PayHere site visits (soil, surveying, structural validation).
5. **Multi-Stage BOQ Auditor:** Contractor itemized quotes (*With Materials / Turnkey* vs *Without Materials / Labour-only*) across 5 stages; comparison vs project rough estimate & plan-derived baseline; evidence-based flags for missing items, below-regional-average rates, and abnormal labour markups; contractor rebuttal panel before final warning badges; non-fraud-accusatory copy.
   - `[Our Call]` **Contractor Lead Privacy & BOQ Award Flow:** Contractors view anonymized project summaries (`district`, `built-up m²`, `confirmed 2D plan`, `rough budget band`) to prepare bids; direct homeowner/contractor contact details remain gated behind `CONTRACTOR_LEAD_UNLOCK` payment (or when requested/unlocked). Home Builders can shortlist or `Accept` a BOQ post-audit/rebuttal to unlock contractor site-progress updates.
6. **Interior Designer, Furniture Placement & Where to Buy:** To-scale placement (`W×D×H`), rotation, wall snapping, door-swing/wall/window/furniture collisions, `Fits`/`Tight`/`Does not fit` status, floor utilization, external retailer fallback search, shopping list, and exact **Free vs Premium** capability matrix (Free: browse, place, fit check, supplier name/location; Premium: view prices, cross-store compare, furnishing budget, tap-to-call, reserve with store, priced shopping-list PDF).
7. **Skilled Worker Marketplace:** Electricians, plumbers, masons, painters, carpenters; filter by trade/location/skills/availability; scoped micro-tasks; booking/completion tracking; reviews strictly unlocked ONLY after job is `completed and paid` through the platform.

### Module 6: Contractor, Engineer, Shop, Worker & Internal Admin Portals
- Complete feature specs for Contractor, Civil Engineer, Hardware & Furniture Shop (storefront, stock toggles with timestamps, top-view footprints, booking/call inbox, stage-timed sponsored ads, lead analytics), and Skilled Worker (dedicated shell/permissions).
- **Internal Admin (`System Operations`, non-public):** All 10 admin areas verbatim from Blueprint §7: `Platform overview`, `User and role management`, `KYC and verification`, `Cost rate editor` (effective-dated/versioned), `Material price management` (provenance, timestamps, region, staleness indicator), `Audit baseline editor` (regional reference rates, coefficients, waste, thresholds — never fixed demo constants), `Dispute resolution` (complaints, replies, status & resolution audit), `Advertising approval`, `Analytics and revenue`, `Audit logs`.
  - `[Our Call]` Include configurable municipal **Setback Rule Set management** inside Admin governance so the non-universal `2.3 m` example is cleanly replaced by admin-maintained authority rule sets.

### Module 7: Data Integrity, Security, Entitlements & Stack Guidance
- All 14 logical data domains + 6 data-integrity rules (immutable plan versions, normalized geometry units, rate snapshots + formula versions per estimate, immutable BOQ/audit runs + replies, product dimension versioning, server-verified payment-to-entitlement mapping).
- **All 8 Revenue Streams & Entitlements (Blueprint §13):**
  1. `3D Model Plan View` (`MODEL_3D_UNLOCK` — one-time per plan)
  2. `Furniture Premium` (`FURNITURE_PREMIUM_PLAN` / `FURNITURE_PREMIUM_ROOM` / `FURNITURE_MONTHLY_PASS` — one-time per plan/room or monthly pass)
  3. `Contractor Lead Unlock` (`CONTRACTOR_LEAD_UNLOCK` — fixed fee on contact request/unlock)
  4. `Civil Engineer Booking` (`ENGINEER_BOOKING` — fixed site-visit/report fee with platform commission share)
  5. `Shop Store Subscription` (`SHOP_SUBSCRIPTION` — monthly/annual Basic vs Featured Store tiers)
  6. `Stage-Timed Ads` (`STAGE_AD_CAMPAIGN` — CPM or CPC campaign pricing)
  7. `Worker Job Bookings` (`WORKER_JOB_COMMISSION` — flat fee or percentage per completed job)
  8. `Furniture Purchase Commission` (`FURNITURE_PURCHASE_COMMISSION` — explicitly marked *planned / mechanism to be finalised*)
  - Enforce all commercial prices via admin configuration (no hard-coded live prices).
- Security & operational quality rules (server-side RBAC, adaptive password hashing, OTP rate limiting/expiry, private object storage + short-lived signed URLs, encrypted/least-privilege NIC KYC, PayHere idempotent server callbacks, audit logging, unit tests for geometry/estimator math, non-WebGL fallbacks).
- `[Our Call]` **Tech Stack Specification:** Specify **React + TypeScript + Vite + Tailwind CSS + GSAP/ScrollTrigger + Motion for React + SVG/Canvas + Three.js / React Three Fiber** for the frontend; specify **Spring Boot modular monolith + PostgreSQL** (per Blueprint §9.1) while explicitly noting a **Node.js + TypeScript modular monolith + PostgreSQL** is an accepted equivalent behind the agreed OpenAPI contract (compatible with the existing workspace).

### Module 8: Responsive Matrix, Accessibility & 7-Phase Delivery Roadmap
- Include Blueprint §11's full Responsive Matrix across Desktop / Tablet / Mobile for all 7 feature zones (`Marketing website`, `Dashboard`, `Plot editor`, `2D planner`, `3D viewer`, `BOQ audit`, `Marketplace`).
- Include Blueprint §14's exact **7-Phase Implementation Roadmap** and **Definition of Done**:
  - `01. Foundation` (Brand, marketing site, navigation, auth, role gateway, onboarding shells)
  - `02. Plot and 2D planning` (Projects, plot drawer, geometry, setbacks, plan generator, SVG renderer, versioning)
  - `03. Estimator` (Rate management, Method A/B, stage allocation, what-if sliders, disclaimer)
  - `04. Professional and BOQ` (Profiles, verification, bookings, quote builder, auditor, rebuttal)
  - `05. Marketplace and interior` (Shop portal, inventory, dimensions, furniture placement, fit checks)
  - `06. Workers, payments and admin` (Worker bookings, entitlements, PayHere, subscriptions, campaigns, disputes, analytics)
  - `07. 3D and refinement` (Paid Three.js viewer, visual polish, performance, responsive & accessibility hardening)

---

## 6. Consolidated `[Our Call]` Decisions for User Review

1. **Output Location:** Save the final deliverable to `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md` (Markdown edition requested by the user, corresponding to the Blueprint's companion deliverable) and summarize/link it in chat.
2. **Backend Stack Flexibility:** Preserve the Blueprint's `Spring Boot + PostgreSQL` modular monolith recommendation while allowing an equivalent `Node/TypeScript + PostgreSQL` backend behind the OpenAPI contract so the prompt works both greenfield and with this repository.
3. **Typography:** Use `Plus Jakarta Sans` + `Inter` + `JetBrains Mono` (`tabular-nums`), matching the existing project typography.
4. **Illustrative Seed Data Policy:** Explicitly mark the repo's numeric fees (`LKR 2,500`, etc.), `1.0` district factors, sample material table, and BOQ thresholds (`0.78×/1.38×/28%`) as `Sample Data` demo placeholders—requiring admin-configured, effective-dated tables in production.
5. **Upload Existing Plan Flow:** File upload to private storage + preview + user confirmation of dimensions/rooms/storeys (plus optional extraction adapter), rather than fragile automatic CAD parsing.
6. **AI Plan Edit Actions & 2-Storey Floor Switching:** Define a closed server tool catalog (`resize_room`, `add_bedroom`, `remove_room`, `change_style`, `set_storeys`, `set_roof_type`, `adjust_opening`) and floor-indexed rooms (`Floor 1 / Floor 2`) when `storeys === 2`.
7. **Contractor Lead Gating & BOQ Acceptance:** Keep anonymized project summaries visible for contractor bidding while gating direct contact details behind `CONTRACTOR_LEAD_UNLOCK`, and add an explicit Home Builder `Accept BOQ` state after audit/rebuttal to unlock site-progress updates.
8. **Admin Setback Governance:** Include authority setback rule publishing in the Admin Console alongside rate, material provenance, audit baseline, dispute, and ad approvals.

---

## 7. What's Left to the Builder (Next Phase After Approval)

- Author `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md` as a crisp, unambiguous, zero-placeholder master generation prompt incorporating every module, formula, motion choreography spec, permission boundary, and checklist item above.
- Verify internal consistency across all 9 modules (tokens, formulas, entitlement keys, reduced-motion rules, and phased execution guidance) before handing it over.
