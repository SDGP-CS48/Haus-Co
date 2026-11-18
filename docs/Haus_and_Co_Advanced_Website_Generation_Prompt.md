# Haus & Co — Advanced Website & Platform Generation Prompt

> **Target Product:** **Haus & Co** — *"From floor plan to finished home."*  
> **Derived From:** *Haus & Co Website Architecture: Product, Experience & Technical Blueprint (v1.0, 14 November 2026)*  
> **Scope:** Public architectural marketing website with advanced motion graphics & WebGL 3D + Role-based multi-portal home construction platform for Sri Lanka.

---

## How to Use This Prompt

You can paste this entire prompt into a capable AI software architect / coding agent, or run it in two focused passes:

1. **Full-Platform Build Mode (Recommended for Agents & Engineering Teams):** Paste the entire document and instruct the builder to execute sequentially across **Phases 01–07** (Section 8).
2. **Public Marketing & Motion Showcase First Mode (For Rapid Frontend/Visual Prototyping):** Paste **Preamble + Section 1 (Visual System) + Section 2 (Advanced Motion & 3D Engine) + Section 3 (Public Website IA)**, instructing the builder to stub deep-linked portal routes cleanly while preserving every brand, accessibility, and honesty rule.

---

## Preamble: Role, Product Vision & Non-Negotiable Principles

Act as a **Principal Full-Stack Web Architect, Creative Technologist, and Motion Design Engineer**. Build **Haus & Co**, an all-in-one digital home-construction technology platform bridging the journey from owning a land plot to completing and furnishing a home—specifically calibrated for the Sri Lankan construction ecosystem.

**Critical Positioning:** Haus & Co is a **technology platform**, NOT a traditional construction contractor brochure website. Communicate precision, transparency, and guided orchestration across homeowners, CIDA-registered contractors, chartered civil engineers, local hardware & furniture shops, and verified skilled tradespeople.

### Seven Experience Principles (Enforce Everywhere)
1. **One guided journey:** Keep plot geometry, concept plans, cost estimates, professional inspections, BOQ audits, interior furnishing, and worker bookings connected inside one continuous project workflow.
2. **Explain the numbers:** Always display calculation inputs, assumptions, rate basis, effective dates, formulas, and rough-estimate disclaimers.
3. **Trust through verification:** Surface professional credentials (CIDA registration, chartered engineering status, KYC verification) clearly and honestly.
4. **Real-world fit:** Use exact supplier dimensions (`width × depth × height`) for furniture placement and collision checks—never decorative mock sizes.
5. **Role clarity:** Enforce role-based portal boundaries server-side and show each user only actions and records permitted for their active role.
6. **Premium, calm interface:** Pair the official Golden Amber architectural palette with spacious editorial layouts, high-craft motion, and disciplined visual hierarchy.
7. **Honest product states:** Explicitly distinguish `Sample Data` / demo mode from live integrations, pending KYC/approvals, unconfigured commercial prices, and unavailable services.

---

## 1. Visual Identity, Brand Tokens & Experience Modes

### 1.1 Official Brand Palette (Exact Hex Values)

| Token | Hex | Intended Usage | Contrast & Text Rule |
|---|---|---|---|
| **Golden Amber (Primary)** | `#D9940A` | Logo top layer, display accents, primary buttons, active tabs, links, table headers, key architectural linework & icons | White (`#FFFFFF`) text permitted |
| **Golden Yellow (Secondary)** | `#F4B41A` | Logo middle layer, progress fills, selected pills, hover highlights, dividers, badges | **Ink (`#1C1C1A`) text ONLY — NEVER white text** |
| **Pale Gold (Surface)** | `#FDE8A5` | Logo bottom layer, selected cards, info panels, form input surfaces, highlighted table rows | **Ink (`#1C1C1A`) text ONLY** |
| **Warm Off-white (Canvas)** | `#FAF7EE` | Base background canvas across public & authenticated screens | **Ink (`#1C1C1A`) body text** |
| **Ink (Text Neutral)** | `#1C1C1A` | Primary body text, headings, labels, structural borders (use muted warm ink `#57534A` sparingly for captions while maintaining >= 4.5:1 contrast) | Soft near-black instead of pure `#000000` |

### 1.2 Mandatory Visual & Logo Rules
- **Base Canvas & Surfaces:** Use `#FAF7EE` as the primary background everywhere; use `#FDE8A5` for selected cards/panels; reserve `#D9940A` for primary CTAs and focal architectural lines.
- **Logo Integrity:** Always render the official Haus & Co 3-layer isometric stack logo strictly in order: **Top `#D9940A` -> Middle `#F4B41A` -> Bottom `#FDE8A5`**. Never recolor, redraw, re-proportion, or distort the supplied logo asset.
- **Status Color Restraint:** Use semantic red/amber/green alert colors sparingly so BOQ audit findings and furniture fit-check states remain immediately distinguishable.
- **Anti-Patterns (Forbidden):** Never use generic AI purple/pink gradients, dark cyber aesthetics, emoji icons (use crisp vector SVG icons such as Lucide), or white text on Golden Yellow (`#F4B41A`) or Pale Gold (`#FDE8A5`).

### 1.3 Typography System
- **Display / Headings:** `Plus Jakarta Sans` (bold architectural weights `600–800`, tight tracking `-0.02em`, fluid `clamp()` scaling on hero headlines).
- **UI & Body Copy:** `Inter` (`400–600`, base `16px`, comfortable line-height `1.5–1.6`).
- **Measurements, Currency & Formulas:** `JetBrains Mono` with `font-variant-numeric: tabular-nums` for all dimensions (`m`, `m²`), Sri Lankan perches, LKR currency amounts, BOQ unit rates, and mathematical formula breakdowns so live-updating numbers never jitter horizontally.

### 1.4 Three Experience Modes
Adapt visual density and motion energy purposefully across the three product modes:
1. **Public Marketing Website:** *Architectural Editorial* — spacious sections, `#FAF7EE` canvas, fine drafting-grid backdrops (`32px` at ~6% Golden Amber opacity), cinematic scroll storytelling, restrained amber focal accents.
2. **Home Planning Workspace:** *Technical Precision* — clean drafting grids (`20px` fine grid), crisp dimension ticks, persistent project bar, uncluttered tool drawers, interactive 2D SVG blueprint, and controlled 3D viewport.
3. **Marketplace & Role Portals:** *Structured Scannability* — multi-column filterable catalogues, dimensioned product cards, side-by-side comparison tables, audit ribbons, and accessible responsive tables/cards.

---

## 2. Advanced Animations & Motion Graphics Specification

Use **GSAP + ScrollTrigger** (with `gsap.context()` / `@gsap/react` cleanup) for narrative scroll sequences and SVG line choreography, **Motion for React (`motion/react`)** for shared-element transitions (`layoutId`) and spring UI physics, **SVG** for vector blueprint drafting, and **Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`)** for interactive 3D architecture. Optionally pair with **Lenis** smooth scroll synced cleanly to `ScrollTrigger.update` (disabled automatically under `prefers-reduced-motion`).

### 2.1 Signature Motion Systems

#### System A — "Living Blueprint" Hero & 2D-to-3D Reveal
- **Visual Composition:** Full-bleed warm architectural grid hero (`#FAF7EE`) featuring a split editorial layout: crisp kinetic headline & value proposition on the left (`Start Building` primary Golden Amber CTA + `Explore the Platform` outline CTA) and an interactive **Living Blueprint Stage** on the right.
- **Choreography Sequence:**
  1. Headline lines reveal cleanly with a short `450–650ms` `expo.out` upward clip/fade (if using character/word split on short `<= 8`-word display phrases, clean up with `split.revert()` on unmount).
  2. Inside the Living Blueprint SVG (`viewBox` scaled cleanly), a timed GSAP timeline sequentially draws paths using `strokeDasharray` / `strokeDashoffset`:
     - Plot boundary perimeter (`dashed Ink`) + `JetBrains Mono` perch readout (`e.g. 15.0m × 17.0m · 10.08 PERCHES`)
     - Buildable setback envelope (`Pale Gold` translucent fill + `Golden Yellow` dashed boundary)
     - Exterior load-bearing walls (`#D9940A`, `4.5px` stroke) -> Interior partition walls (`2.5px`)
     - Architectural 90° door swing arcs & window glazing markers
     - Staggered room labels (`Living`, `Master Bedroom`, `Kitchen`, `Verandah`) & scale dimensions
  3. **Interactive 2D <-> 3D Toggle (`Motion` `layoutId` tab pill):** Clicking `3D Extrusion` smoothly cross-morphs the 2D SVG blueprint into a **Three.js / React Three Fiber isometric architectural model**:
     - Extruded floor slab, room zone color fills (`#FDE8A5`), interior/exterior walls (`#FAF7EE` / `#EAE3D0`), roof geometry (`GABLE` / `HIP` / `FLAT_SLAB` in `#D9940A`), warm directional sunlight with real soft shadows, and subtle `FogExp2` depth matching `#FAF7EE`.
     - Run a brief scripted camera ease-in (`1.0s`) on first transition, then hand control cleanly to damped `OrbitControls` supporting both mouse and touch (`maxPolarAngle` clamped above ground plane).

#### System B — Scroll-Driven Construction Story (Pinned Scrollytelling)
- **Layout & ScrollTrigger Config:** One signature pinned section on the homepage & `/how-it-works` (`pin: true`, `scrub: 0.8` on desktop `lg+`, `end: "+=220%"`; gracefully collapses to unpinned clickable/scrollable stage cards on tablet/mobile and under reduced motion). **Never pin more than 1–2 sections per page.**
- **Persistent Evolving Architectural Model:** Keep ONE consistent house cutaway model pinned in the visual viewport while scrolling drives continuous progressive assembly across 4 synchronized construction narrative phases (distinct from the 5 cost/BOQ stages in §5):
  1. **Phase 01 · Foundation & Substructure (`15%`):** Excavation boundary, footing pads, damp-proof course, and plinth slab rise into focus (`#D9940A` foundation glow); soil-testing civil engineer callout card activates.
  2. **Phase 02 · Superstructure & Masonry (`30%`):** Walls extrude upward, column grid locks in, door/window lintels draw across openings; contractor BOQ masonry-audit callout activates.
  3. **Phase 03 · Roofing & MEP (`30%`):** Roof timber/steel truss geometry assembles, roofing cladding lays over, and electrical/plumbing conduit lines trace through wall cavities; omission-check callout activates.
  4. **Phase 04 · Finishes & Furnishing (`25%`):** Warm plaster/tile surfaces settle, interior rooms populate with to-scale furniture silhouettes, and ambient lighting warms the model; store-fit & skilled-worker callout activates.
- Sync a top `JetBrains Mono` progress rail (`01 / 04`), animated LKR stage-share pill, and interactive step buttons so users can also click or keyboard-focus any stage directly.

#### System C — 2D-to-3D Plan Transformation Showcase (Section 05 & `/house-planner`)
- Interactive dual-variant preview showcasing **Variant A (Compact / Open-Plan)** vs **Variant B (Spacious / Traditional)** inside the same plot bounds.
- Switching variants animates room partitions and labels via `Motion` shared-layout transitions, recalculates built-up `m²`, and offers an interactive 3D preview teaser with a clear preview ribbon explaining how full 3D procedural models unlock per plan inside the authenticated workspace (`MODEL_3D_UNLOCK`).

#### System D — Interactive Rough Cost Estimator Showcase (Section 06 & `/cost-estimator`)
- Interactive homepage & marketing preview with live controls:
  - Room Area slider (`60 m² – 260 m²`), Finish Grade pills (`Standard`, `Mid-range`, `Premium`), and Storey toggle (`1 Storey 1.00×` / `2 Storeys 1.10×`).
  - Smooth spring-interpolated `JetBrains Mono` (`tabular-nums`) count-up/count-down for **Estimated Total (LKR)**, **±10% Low–High Range**, **Cost per m²**, and **5 animated horizontal stage-allocation bars** (`15% / 30% / 15% / 15% / 25%`).
  - Side-by-side **Method A** vs **Method B** breakdown preview plus an unmistakable `Sample Data` pill (`LKR 200,000/m²` illustrative baseline) and prominent rough-estimate disclaimer.

#### System E — Tactile Furniture Placement & Fit-Check Motion (Section 07 & Module 6)
- Interactive mini-room demo on the public Marketplace showcase and full canvas inside the Home Builder Portal:
  - Dimensioned local furniture footprints (`width × depth × height` in `m`/`cm`) move smoothly along a snap grid, snap magnetically to room walls, rotate `90°` with crisp spring easing, and display live **door-swing clearance arcs**.
  - Real-time collision outlines pulse cleanly into one of three accessible states (always combining **icon + text label + outline**, never color alone, and placing colored status text on `#FAF7EE` / `#FFFFFF` pills rather than `#FDE8A5` so contrast stays `>= 4.5:1`):
    - `Fits` (Forest green `#15803D` check + solid clearance)
    - `Tight` (Amber `#B45309` on `#FAF7EE` pill + alert icon + clearance margin `< 0.6 m` walkway warning)
    - `Does not fit` (Crimson `#B91C1C` X + overlap highlight against wall/door/furniture)
  - Live room floor-space utilization bar animates smoothly beside accessible keyboard/button nudge (`↑ ↓ ← →` + `Rotate 90°`) controls.

#### System F — Architecture-Aware Cursor & Restrained Micro-Interactions
- **Architecture-Aware Cursor (`[data-arch-cursor="true"]`):** Custom precision drafting crosshair with a subtle `JetBrains Mono` contextual micro-badge (`MEASURE`, `ORBIT`, or `SNAP`) that activates **ONLY** inside blueprint, plot-drawer, furniture-canvas, and 3D viewport containers. Automatically hides over inputs, buttons, and links, on coarse/touch pointers, and whenever `prefers-reduced-motion: reduce` is active.
- **Micro-Interactions:** Tactile `150–250ms` `cubic-bezier(0.22, 1, 0.36, 1)` hover lifts on cards (`#FAF7EE` -> `#FDE8A5/40` with `#D9940A` border accent), sliding underline indicators on nav tabs (`layoutId`), subtle drafting-grid background parallax (`5–10%` delta on decorative grid layers only—never on text), and staggered card reveals capped at `<= 8` siblings per trigger.

### 2.2 Motion Performance & Accessibility Contract (Strict)
1. **Reduced Motion Parity:** Wrap every GSAP sequence in `gsap.matchMedia()` checking `(prefers-reduced-motion: reduce)` and include `@media (prefers-reduced-motion: reduce)` CSS overrides. When reduced motion is requested, **skip scroll-scrubbing, parallax, SplitText reveals, and custom cursor effects**, and render all sections, blueprints, and final copy immediately visible at `opacity: 1`.
2. **GPU-Only Animation Budget:** Animate ONLY `transform`, `opacity`, and SVG `stroke-dashoffset` (never `width`, `height`, `top`, `left`, or layout-thrashing properties). Limit focal motion to `1–2` primary animated elements per viewport.
3. **ScrollTrigger Hygiene:** Call `ScrollTrigger.refresh()` after web fonts (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`) and media settle; always revert GSAP contexts on React unmount.
4. **3D & Media Lazy Loading & Fallback:** Code-split and lazy-load Three.js / R3F scenes and editorial hero video (if used) with React `Suspense`; pause video and `requestAnimationFrame` / set `frameloop="demand"` when canvases or media are offscreen or hidden; attach `{ passive: false }` when custom canvas touch/wheel handlers call `preventDefault()`; dispose geometries/materials on unmount; render a crisp 2D isometric SVG fallback if WebGL context is unavailable.

---

## 3. Public Website Information Architecture & Conversion

### 3.1 Main Navigation & Primary Actions

| Navigation Item | Purpose / Core Content | Primary CTA |
|---|---|---|
| `Home` | Value proposition, problem framing, 7-step journey, interactive planner/estimator/marketplace showcases | `Start Building` |
| `How It Works` | Interactive stage-by-stage walkthrough from plot drawing to hiring tradespeople | `Explore the Journey` |
| `House Planner` | Plot geometry canvas, AI 2D variants A/B, SVG blueprint editing, paid 3D explanation | `Plan Your Home` |
| `Cost Estimator` | Method A & Method B formulas, approximate material quantities, 5 construction stages | `Estimate My Cost` |
| `Professionals` | Separate CIDA-registered contractor & chartered civil engineer discovery flows | `Find a Professional` |
| `Marketplace` | Hardware materials, dimensioned furniture, supplier stores & fit-check preview | `Explore Marketplace` |
| `Skilled Workers` | Electricians, plumbers, masons, painters, carpenters, verification & task booking | `Find a Worker` |
| `About` | Haus & Co mission, Sri Lankan construction ecosystem story, transparency model | `Get Started` |
| `Contact` | General enquiries & partner registration pathways | `Send Enquiry` |
| `Sign In / Get Started` | Role-first gateway & OTP/credential authentication entry | `Create Account` |

### 3.2 Mandatory 10 Homepage Sections (In Exact Narrative Order)
1. **01. Hero:** Cinematic architectural visual + interactive *Living Blueprint* stage, concise display headline (*"Your dream home. From the ground up."*), value statement (*"From floor plan to finished home"*), dual CTAs (`Start Building` -> role/builder onboarding; `Explore the Platform` -> `/how-it-works`).
2. **02. Problem:** Three crisp cards explaining fragmented Sri Lankan home-building—disconnected professionals, uncertain budgets & hidden BOQ omissions, and furniture/material guesswork.
3. **03. Platform Proposition:** Interactive architectural hub diagram connecting a central home model to the six connected pillars: *Planning*, *Cost Estimation*, *Professionals*, *BOQ Audit*, *To-Scale Furnishing*, and *Skilled Workers* (hover/click/focus highlights each spoke and links to its detail).
4. **04. Seven-Step Journey:** Interactive 7-stage visual progression (*01 Draw plot -> 02 Generate 2D plan -> 03 Rough cost estimate -> 04 Engineer & contractor -> 05 BOQ audit -> 06 Furnish -> 07 Hire workers*) + **System B Pinned Construction Storytelling**.
5. **05. Planner Showcase:** Interactive *2D Blueprint <-> 3D Extrusion* switcher demonstrating Variant A vs Variant B layouts inside buildable setbacks.
6. **06. Estimator Showcase:** Live interactive rough estimator preview displaying Estimated Total (LKR), `±10%` range, cost per `m²`, 5-stage breakdown bars, approximate materials list, `Sample Data` notice, and disclaimer.
7. **07. Marketplace Showcase:** Interactive mini *To-Scale Furniture Fit* preview + dimensioned Sri Lankan hardware & furniture store cards (`W × D × H`, stock badge, price-lock indicator for Premium preview).
8. **08. Professional Network:** Verified CIDA contractors, chartered civil engineers, and verified tradespeople showcase highlighting credential verification badges, WebRTC calls, and payment-gated worker reviews.
9. **09. Partner Invitation:** High-contrast `#FDE8A5` Pale Gold editorial band inviting General Contractors, Civil Engineers, Hardware & Furniture Shops, and Skilled Workers to register (`Join as a Partner`).
10. **10. Closing CTA:** Warm Ink (`#1C1C1A`) closing anchor band inviting homeowners to *Start from Scratch* or *Upload an Existing Plan* (`Start Building Free`).

### 3.3 Supporting Public Pages & Deep-Linked Conversion
Implement all 8 supporting routes: `/how-it-works`, `/house-planner`, `/cost-estimator`, `/professionals`, `/marketplace`, `/workers`, `/about`, and `/contact`.  
**Conversion Rule:** Every marketing CTA (`Plan Your Home`, `Estimate My Cost`, `Find a Professional`, `Join as a Partner`) must deep-link directly to `/auth/role-selection?intent=...&role=...` (or directly into the target authenticated builder module if the user is already signed in, resuming their active project).

---

## 4. Authentication, Six-Role Gateway & Onboarding

### 4.1 Role-Based Gateway & Portal Mapping
Require operational role selection **before** standard credential, Google OAuth, or Sri Lankan phone OTP login:

| Portal / Access Area | System Role | Primary Workspace Purpose |
|---|---|---|
| **Home Builder Portal** | `Home Builder` | Manage projects, plot geometry, 2D/3D plans, rough estimates, pro bookings, BOQ audits, interior fit, worker tasks |
| **Contractor & Engineer Portal** | `General Contractor` | View anonymized project leads (unlock contact via entitlement), submit 5-stage turnkey/labour-only BOQs, respond to audit flags, post site updates |
| **Contractor & Engineer Portal** | `Civil Engineer` | Manage inspection calendar/bookings, publish land suitability & foundation reports, generate structural baseline BOQs, verify plans |
| **Shop Owner Portal** | `Hardware & Furniture Shop` | Manage storefront, branches, inventory/timestamps, top-view dimensioned furniture, room-context booking inbox, stage-timed ads |
| **Shop Owner Portal** *(dedicated worker shell)* | `Skilled Worker` | Separate role permissions & workspace UI: manage trade profile, certifications, micro-task job inbox, bookings, paid-job reviews |
| **System Operations** *(Internal Only)* | `Platform Administrator` | Non-public internal route (`/admin/*`): KYC approvals, effective-dated rate/material/baseline/setback editors, disputes, ad approvals, analytics, audit logs |

### 4.2 Sign-In, OTP & KYC Requirements
- **Sign-In Methods:** Email/password (adaptive password hashing like Argon2id/bcrypt), Google Sign-In (where configured), and **Sri Lankan `+94` Phone OTP** routing across local networks (e.g., Dialog `077/076/074`, Mobitel `071/070`) with strict rate limits and short TTL expiry.
- **Provider KYC:** NIC verification and credential evidence upload (CIDA grade, IESL/chartered registration, trade certificates) stored encrypted with least-privilege access. Display explicit verification status (`UNVERIFIED`, `PENDING_KYC`, `VERIFIED`, `REJECTED`, `SUSPENDED`) publicly and auditable in Admin.
- **Role Safety:** Multi-role accounts are allowed only if explicitly enabled by platform policy, with an explicit role switcher. Enforce all role/ownership authorization on the backend—never rely on hiding UI navigation alone. Allow Home Builders to save progress and resume projects across sessions.

### 4.3 Dual Home Builder Onboarding Paths
1. **Path A — Start from Scratch:** Collect plot dimensions/polygon + room requirements -> launch Plot Drawer -> generate Variant A & B AI-assisted 2D concept plans -> compute initial rough cost estimate.
2. **Path B — Upload Existing Plan:** Upload externally created PDF/PNG/JPG blueprint to private object storage -> render blueprint preview alongside structured confirmation inputs (room areas, storey count, roof type, scale reference; optional extraction adapter if configured, never silently assuming unparsed CAD geometry) -> proceed directly to Cost Estimator, Civil Engineer inspection, Contractor bids, and Interior Furnishing.

---

## 5. Home Builder Portal — Seven Core Modules

Keep a persistent **Active Project Header** across all builder modules (`Overview`, `Projects`, `Land & Plot`, `House Planner`, `Cost Estimator`, `Professionals`, `BOQ Audit`, `Interior & Furniture`, `Skilled Workers`, `Settings`) displaying active project name, land perches/`m²`, active plan version, and current rough estimate.

### Module 1 — Interactive Land & Plot Drawer Canvas
- Polygon canvas with draggable vertices (plus precision coordinate/edge-length numeric inputs & keyboard controls) supporting both **regular and irregular plots**.
- Real-time calculation of perimeter (`m`), total area in **`m²` and Sri Lankan perches (`1 perch = 25.29 m²`)**, and buildable area after setbacks.
- Render setback buffers and shaded buildable-zone polygon overlay using **true polygon inset/containment geometry** (do not rely on rectangular bounding boxes for L-shaped or tapered plots).
- Load setback values from configurable local authority / plot rule sets; explicitly label any illustrative `2.3 m` front setback example as non-universal.

### Module 2 — Rough Cost Estimator (Method A & Method B Side-by-Side)
- **Inputs:** Plan-derived room areas, wall lengths, storey count, roof type; user-selected finish grade (`Standard`, `Mid-range`, `Premium`), Sri Lankan district/location (`25` districts), and contingency %; platform admin-maintained effective-dated base construction rate, district factors ($L$), and material prices.
- **Method A — Area-Based Quick Estimate:**
  $$A = A_{rooms} \times (1 + w) \quad (\text{default wall/circulation allowance } w = 0.15)$$
  $$\text{Total} = A \times R \times F \times S \times L \times (1 + C)$$
  where $R$ = base construction rate (`LKR/m²`), $F \in \{1.00\text{ Standard}, 1.20\text{ Mid-range}, 1.45\text{ Premium}\}$, $S \in \{1.00\text{ Single-storey}, 1.10\text{ Two-storey}\}$, $L$ = district location factor, $C$ = contingency (default `10%`).
- **Method B — Quantity-Based Material Breakdown:**
  $$\text{Qty}_m = \text{PlanQuantity}_m \times k_m \times (1 + \text{waste}_m), \qquad \text{MaterialCost} = \sum (\text{Qty}_m \times \text{Price}_m)$$
  Display Method B beside Method A for comparison, showing editable coefficients ($k_m$), waste allowances, current material price basis, and price provenance/timestamps.
- **5-Stage Construction Allocation (Editable Shares Totaling 100%):**
  `Foundation & Substructure (15%)`, `Superstructure & Masonry (30%)`, `Roofing & Truss Work (15%)`, `Electrical & Plumbing MEP (15%)`, `Finishes & Tile Work (25%)`.
- **Outputs & Mandatory Safeguards:** Estimated total, low-to-high range (`±10%` default), cost per `m²`, real-time what-if sliders (`finish grade`, `storeys`, `contingency`), recorded `RateSet` version ID, visible **Sample Rate Warning** whenever demo rates are active (`LKR 200,000/m²` yielding `LKR 30,360,000` for `100 m²` room area is strictly illustrative, not a live market price), and clear **Disclaimer** that rough estimates are not contractor quotations.

### Module 3 — AI Plan Generator & Interactive Editing Suite
- Deterministic layout generator produces two concept variants inside validated buildable bounds: **Variant A (`Compact / Open-Plan`)** and **Variant B (`Spacious / Traditional`)**.
- Natural-language AI assistant acts strictly as an **intent interpreter** invoking a closed server-side tool catalog (`resize_room`, `add_bedroom`, `remove_room`, `change_style`, `set_storeys`, `set_roof_type`, `adjust_opening`) backed by deterministic geometric validation (with rule-based parser fallback if LLM credentials are absent).
- Reject any edit that breaches setback bounds, minimum room geometry, or circulation rules with a clear geometric explanation; save accepted edits as **immutable plan versions** and automatically recalculate rough cost estimates.
- Support **2-storey layouts** cleanly (`Floor 1 / Floor 2` switcher in 2D SVG & interior placement, staircase circulation allowance, stacked intermediate floor slab in 3D).
- **2D SVG Blueprint Renderer:** Room dimensions, wall thickness, door swing arcs, window openings, and room labels.
- **Paid 3D Procedural View (`MODEL_3D_UNLOCK`):** Interactive Three.js / React Three Fiber scene with extruded walls, floor slabs, roof geometry, sky lighting, and damped orbit/zoom/pan controls, gated server-side (`402 Payment Required` until unlocked). Label plans clearly as *Concept Plans* requiring qualified local professional sign-off before statutory submission.

### Module 4 — Professional Service Booking
- Separate discovery tabs for **CIDA-Registered Contractors** and **Chartered Civil Engineers**, displaying verification status, qualification/grade, service districts, and portfolio/scope details.
- **Free In-App Voice Consultations** via WebRTC (clean signaling & availability/fallback states).
- **Paid Site Visit Bookings** (soil testing/inspection, land surveying, structural validation) integrated with **PayHere** server-verified payments.

### Module 5 — Multi-Stage BOQ Quotation Auditor & Lead Flow
- **Lead Privacy & Bidding:** Contractors inspect anonymized project context (`district`, `built-up m²`, `confirmed 2D plan`, `rough budget band`) to submit itemized BOQs; direct homeowner/contractor contact details require `CONTRACTOR_LEAD_UNLOCK`.
- **Dual BOQ Forms:** Contractors submit structured line items across all 5 construction stages in two explicit modes: **With Materials (Turnkey)** and **Without Materials (Labour/Machinery Only)**.
- **Automated Audit Engine:** Compares each BOQ stage and unit rate against the project rough estimate and admin-governed regional material/labour baselines, generating evidence-backed flags for:
  1. Missing scope items (e.g., omitted waterproofing, earthing, lintels)
  2. Unit prices materially below regional material averages
  3. Unreasonable labour/overhead markups
- **Contractor Rebuttal & Honest Framing:** Contractors receive a rebuttal panel to submit technical justifications or revised unit rates (preserved as immutable versions) **before** final warning badges display to the homeowner. Copy must explain exact evidence and baseline comparisons—**never imply a flagged rate is automatically fraudulent**.
- **BOQ Acceptance:** Home Builder can shortlist or **Accept** an audited BOQ to transition the project into active contractor site-progress updates.

### Module 6 — Interior Designer, Furniture Placement & Where to Buy
- Interactive 2D plan placement canvas supporting sofas, beds, dining sets, wardrobes, and light fixtures from supplier catalogues rendered strictly to scale (`width × depth × height`).
- Rotation (`90°` + fine increments), magnetic wall snapping, room floor-space utilization %, and full collision/clearance checks against walls, doors, windows, other furniture, and **door-swing arcs**—producing `Fits`, `Tight`, or `Does not fit` status with keyboard/button nudge parity.
- Product details: category, exact dimensions, material, color, stock status & last-updated timestamp, photos, store location, and external retailer search fallback links (when platform stock is unavailable).
- Compiles placed items into an actionable **Shopping List** (`Free` vs `Premium` capability gating enforced by backend API redaction):

| Capability | Free | Premium (`FURNITURE_PREMIUM`) |
|---|---|---|
| Browse supplier furniture & exact dimensions | Yes | Yes |
| Place items to scale & run collision/fit check | Yes | Yes |
| View supplier name & store location | Yes | Yes |
| View product prices | **Hidden / Locked** | **Visible** |
| Compare prices across stores | No | **Yes** |
| Room / whole-house furnishing budget tracker | No | **Yes** |
| Tap-to-call store contact number | No | **Yes** |
| Book / reserve items directly with store | No | **Yes** |
| Download priced shopping list as PDF | No | **Yes** |

### Module 7 — Skilled Worker Marketplace
- Directory of verified **electricians, plumbers, masons, painters, and carpenters** filterable by trade, district/location, skills, and availability.
- Post scoped micro-task requests, accept quotes/bookings, and track job lifecycle (`Requested -> Booked -> In Progress -> Completed -> Paid`).
- **Strict Review Gate:** Enforce backend `403 Forbidden` on review submission until the job reaches **`COMPLETED_PAID`** through the platform.

---

## 6. Contractor, Civil Engineer, Shop Owner, Skilled Worker & Admin Portals

- **General Contractor Workspace:** Lead inbox (anonymized until contact unlock), project context (plot geometry, survey PDF links, confirmed 2D plan, rough estimate), 5-stage turnkey & labour-only BOQ builder, audit flag rebuttal & revised unit-rate submission, and site-progress update manager.
- **Civil Engineer Workspace:** Inspection calendar & paid booking manager, land suitability & soil/foundation-depth report publisher, structural baseline BOQ generator, and technical plan verification sign-off.
- **Hardware & Furniture Shop Owner Workspace:** Store profile (branches, hours, contact), product & furniture inventory manager (exact `W×D×H`, top-view SVG footprint, price, stock toggle, last-updated timestamp), room-context customer booking/call inbox, stage-timed sponsored ad campaign creator, and lead/click analytics.
- **Skilled Worker Workspace:** Separate role-isolated dashboard (distinct from Shop Owner UI/permissions) with trade profile, skill certifications, scoped micro-task inbox, booking state controls, and verified paid-job review history.
- **Platform Administration (`System Operations` — Non-Public Internal Portal):** Do NOT expose as a public login tab. Implement all 10 Blueprint governance areas plus setback rules:
  1. `Platform overview` (registrations, active projects, operational alerts)
  2. `User and role management` (status, role grants, support controls)
  3. `KYC and verification` (CIDA, Chartered Engineer, Shop & Worker approval queue with audit trail)
  4. `Cost rate editor` (effective-dated/versioned base rates, finish multipliers, district factors $L$, stage allocations—historical estimates stay locked to the `RateSet` version used when created)
  5. `Material price management` (supplier/admin provenance, timestamps, district/region, staleness warnings)
  6. `Audit baseline editor` (regional reference rates, coefficients, waste allowances, configurable anomaly thresholds)
  7. `Dispute resolution` (complaints, BOQ/worker reports, provider replies, resolution notes & actions)
  8. `Advertising approval` (review & approve stage-timed sponsored campaigns and creative)
  9. `Analytics and revenue` (portal activity, bookings, unlocks, subscriptions, campaigns, commissions)
  10. `Audit logs` (immutable traceability for privileged changes and sensitive operations)
  11. `Setback rule management` (configurable municipal authority setback rule sets replacing illustrative defaults)

---

## 7. Data Integrity, Security & Revenue Architecture

### 7.1 Fourteen Logical Domains & Six Integrity Rules
Model clean bounded modules across: `Identity`, `Project`, `Plot`, `Planning`, `Estimation`, `Professional`, `Booking`, `BOQ / Audit`, `Marketplace`, `Interior`, `Worker`, `Commerce`, `Advertising`, and `Governance`.

Enforce six non-negotiable integrity rules:
1. Immutable `PlanVersion` records; every estimate, BOQ, and furniture placement binds to an exact `planVersionId`.
2. Normalize all geometry server-side in explicit metric units (`m`, `m²`, `25.29 m²/perch`).
3. Snapshot `RateSet` ID, formula version, and assumptions onto every saved `CostEstimate`.
4. Version all BOQ submissions, audit runs, and contractor rebuttals—never overwrite prior evidence.
5. Version supplier `ProductDimension` snapshots so later catalogue edits never silently invalidate historical fit checks.
6. Link every payment record to a specific `Entitlement` or business booking and verify status server-side.

### 7.2 Eight Revenue Streams & Named Entitlements
**Commercial Pricing Rule:** **Do NOT hard-code production prices in code or UI until configured by the platform owner.** Read fee schedules dynamically from admin configuration (mark any preview values strictly as `Sample Data`).

| Revenue Stream | Named Entitlement / Model | Payer | Billing & Enforcement Rule |
|---|---|---|---|
| **3D Model Plan View** | `MODEL_3D_UNLOCK` | Home Builder | One-time unlock per confirmed 2D plan (`402` server gate on 3D geometry endpoint) |
| **Furniture Premium** | `FURNITURE_PREMIUM_PLAN` / `FURNITURE_PREMIUM_ROOM` / `FURNITURE_MONTHLY_PASS` | Home Builder | Per-plan, per-room, or monthly pass; backend redacts prices, comparisons, contacts, reserves & PDFs until active |
| **Contractor Lead Unlock** | `CONTRACTOR_LEAD_UNLOCK` | Home Builder / Contractor | Fixed fee when direct contact details are requested/unlocked |
| **Civil Engineer Booking** | `ENGINEER_BOOKING` | Home Builder | Fixed site-visit/report fee with platform commission split |
| **Shop Store Subscription** | `SHOP_SUBSCRIPTION` | Hardware / Furniture Shop | Monthly or annual tiered subscription (`Basic` vs `Featured Store`) |
| **Stage-Timed Ads** | `STAGE_AD_CAMPAIGN` | Shop Owners / Brands | CPM or CPC campaign pricing targeting homeowner construction stage (requires Admin approval) |
| **Worker Job Bookings** | `WORKER_JOB_COMMISSION` | Home Builder / Worker | Flat commission or percentage per completed paid job |
| **Furniture Purchase Commission** *(planned)* | `FURNITURE_PURCHASE_COMMISSION` | Furniture Shop | Referral commission on confirmed purchase/booking — explicitly marked *planned / mechanism to be finalised* |

### 7.3 Security & Operational Quality Controls
- Backend RBAC + resource-ownership checks on every endpoint; adaptive password hashing; OTP rate limiting & TTL; input validation & output encoding; CSRF/secure session cookies or token hygiene.
- Private S3-compatible object storage with file-type/size validation and short-lived signed URLs for blueprints, survey PDFs, and KYC files; encrypted NIC/KYC retention controls.
- Idempotent server-side **PayHere** webhook/API signature verification (never trust client redirect URLs); track failed/pending/refunded/expired states cleanly.
- Unit tests verifying polygon area/perch math, true polygon setback containment, Method A/B cost formulas, BOQ anomaly detection, furniture collision geometry, and RBAC/entitlement gates.

---

## 8. Technical Stack, Responsive Matrix & 7-Phase Implementation Roadmap

### 8.1 Recommended Technical Stack
- **Web Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + accessible component primitives + `lucide-react`.
- **Animation & 3D:** GSAP + ScrollTrigger (`@gsap/react`), Motion for React (`motion/react`), precision SVG/Canvas 2D geometry, Three.js + React Three Fiber (`@react-three/fiber`, `@react-three/drei`).
- **Backend & Persistence:** **Modular Monolith** (per Blueprint §2.4)—`Spring Boot + PostgreSQL` (Blueprint baseline) OR `Node.js + TypeScript + Express/Fastify + PostgreSQL` (accepted modular equivalent) behind a versioned **REST + OpenAPI 3.1** contract, plus private S3 object storage, PayHere adapter, Sri Lankan SMS OTP adapter (`Dialog`/`Mobitel`), and WebRTC signaling.

### 8.2 Responsive & Accessibility Baseline

| Surface | Desktop | Tablet | Mobile |
|---|---|---|---|
| **Marketing Website** | Full cinematic editorial layout, pinned scroll story, interactive 3D | Reflowed 2-col grids, reduced media weight | Single-column, crisp copy, unpinned sequential cards |
| **Portal Dashboards** | Persistent sidebar + active project bar + multi-panel view | Collapsible drawer sidebar + adjustable panes | Bottom nav or compact menu, focused single-task cards |
| **Plot Editor** | Full polygon grid, precision coordinates, keyboard shortcuts | Touch-friendly vertex handles + simplified toolbar | Simplified edge entry / preview; avoid cramped CAD UI |
| **2D Planner** | Full SVG canvas + side room-properties inspector | Canvas + collapsible properties sheet | Plan preview & core edits; deep geometry editing simplified |
| **3D Viewer** | Full interactive Three.js canvas + lighting + orbit | Reduced shadow/poly budget | Adaptive quality + clean 2D isometric fallback |
| **BOQ Audit** | Side-by-side multi-column quote comparison & rebuttal drawer | Horizontal scroll / stacked stage cards | Stage-by-stage expandable line cards |
| **Marketplace** | Multi-column filterable catalogue | Two-column catalogue | Single or compact two-column cards |

**Accessibility Baseline:** Semantic landmarks & heading hierarchy; visible `2px` `#D9940A` keyboard focus rings; `>= 4.5:1` contrast everywhere; keyboard + button alternatives for all vertex and furniture drag actions; `prefers-reduced-motion` parity; pause/skip controls for any extended animations; descriptive text equivalents for diagrams and 3D views.

### 8.3 Seven-Phase Delivery Sequence & Definition of Done

1. **01. Foundation:** Brand tokens, 10-section public site + 8 supporting pages, signature hero/scroll motion engine, role-first auth gateway, OTP/KYC & onboarding shells. *Exit:* Responsive public pages, reduced-motion parity, role sign-in tested.
2. **02. Plot & 2D Planning:** Projects, irregular-polygon plot drawer (`m²`/perches), true polygon setbacks, Variant A/B generator, controlled AI edits, SVG renderer, immutable versioning. *Exit:* Geometry & invalid-setback rejection tests pass; plan versions persist.
3. **03. Estimator:** Effective-dated rate sets, Method A & Method B side-by-side, 5-stage allocations, what-if sliders, rate snapshots, `Sample Data` & rough-estimate disclaimers. *Exit:* Known formula cases pass; edits auto-refresh estimates.
4. **04. Professionals & BOQ:** Contractor/Engineer verification & profiles, WebRTC voice & PayHere site-visit bookings, turnkey/labour-only BOQ builder, automated auditor, contractor rebuttal, BOQ acceptance. *Exit:* RBAC isolation, immutable BOQ/audit runs & rebuttals verified.
5. **05. Marketplace & Interior:** Shop storefront & stock timestamps, dimensioned catalogue, to-scale 2D furniture placement, collision/door-swing fit checks, Free vs Premium gating, retailer fallback. *Exit:* Fit-check math & Free-user redaction verified by tests.
6. **06. Workers, Payments & Admin:** Skilled worker micro-tasks, `COMPLETED_PAID` review gate, PayHere server callbacks across all 8 entitlements, subscriptions, stage-timed ads, full 10-area Admin console + audit logs. *Exit:* Server-verified entitlements & audited admin mutations pass.
7. **07. 3D & Hardening:** Paid Three.js / R3F 3D viewer (`MODEL_3D_UNLOCK`), motion & shader polish, lazy-loading budgets, cross-viewport & keyboard accessibility audit. *Exit:* `402` gate enforced, non-WebGL fallback tested, performance & contrast budgets met.

**Definition of Done (Every Feature):** Connected to active project & immutable plan version -> Frontend validation + backend RBAC/entitlement authorization -> Designed loading, empty, error, success, and permission-denied states -> Audit log & notifications emitted -> Automated unit/integration tests covering edge cases -> Responsive & keyboard-navigable -> Zero fake live providers/prices presented as real -> OpenAPI docs updated.
