# Haus & Co Advanced Website Generation Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md`, a self-contained, production-grade AI generation prompt capturing all 15 sections of the Haus & Co Website Architecture Blueprint (`v1.0`) plus advanced animations and motion graphics specifications.

**Architecture:** The deliverable is a single modular Markdown prompt file (`docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md`) organized into an execution preamble and eight bounded modules (Visual System, Motion & 3D Engine, Public Site IA, Auth & 6-Role Onboarding, 7 Home Builder Modules, Partner & Admin Portals, Data/Security/Revenue Architecture, and Stack/Responsive/Roadmap). Verification tests every required token, formula, role, motion constraint, and Blueprint table against the spec before delivery.

**Tech Stack:** Markdown specification targeting React 19 + TypeScript + Vite + Tailwind CSS + GSAP/ScrollTrigger + Motion for React + SVG/Canvas + Three.js/R3F + Modular Monolith REST/OpenAPI + PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-11-15-haus-co-website-prompt-design.md`

## Global Constraints

- Exact brand palette: `#D9940A` (Golden Amber), `#F4B41A` (Golden Yellow — Ink `#1C1C1A` text only, never white), `#FDE8A5` (Pale Gold), `#FAF7EE` (Warm Off-white Canvas), `#1C1C1A` (Ink).
- Logo order preserved (`#D9940A` top, `#F4B41A` middle, `#FDE8A5` bottom), never recolored, redrawn, or distorted.
- Sri Lankan localization: `1 perch = 25.29 m²`, `+94` phone OTP (Dialog / Mobitel), PayHere verification, `LKR 200,000/m²` (`LKR 30,360,000` for `100 m²`) and `2.3 m` setback explicitly marked illustrative only, zero hard-coded commercial prices.
- Motion accessibility: `prefers-reduced-motion: reduce`, `<= 2` pinned ScrollTrigger sections per page, GPU-composited transforms/opacity/SVG stroke, keyboard/button alternatives for all drag interactions, non-WebGL fallbacks.
- Trust & honesty: `Sample Data` labeling, rough-estimate disclaimers, evidence-based non-accusatory BOQ flags, server-side RBAC & entitlement enforcement.

## Review Focus

- Missing Blueprint tables (all 10 homepage sections, 10 main nav items, Free vs Premium furniture table, 8 revenue streams, 10 admin areas, 7 responsive surfaces, 7 implementation phases).
- Accidental white-on-Golden-Yellow contrast allowance or omitted logo-integrity rule.
- Ambiguous or omitted Method A / Method B formulas, 5 stage shares (`15/30/15/15/25`), or missing placeholder warnings.
- Motion spec lacking reduced-motion parity, pinning caps, cursor exclusion rules, or Three.js/Drag accessibility fallbacks.
- Hard-coded repo seed fees (`LKR 2,500`, etc.) leaking in as canonical production rules instead of admin-configured fees.

---

### Task 1: Author `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md`

**Files:**
- Create: `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md`
- Reference: `docs/superpowers/specs/2026-11-15-haus-co-website-prompt-design.md`

- [ ] **Step 1: Write the complete modular prompt into `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md`**
  Include: Execution Mode Preamble, 7 Experience Principles, Visual System & Typography (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`), 6 Signature Motion Systems (Living Blueprint Hero + Three.js reveal, Pinned 4-Stage Construction Scrollytelling, 2D-to-3D Plan Transformation, Interactive Rough Estimator Motion, Tactile Furniture Fit-Check Motion, Architecture-Aware Cursor & Micro-Interactions), 10 Nav + 10 Homepage Sections + 8 Supporting Pages, 6-Role Gateway + OTP/KYC + Dual Onboarding, All 7 Home Builder Modules + Formulas + Free/Premium Table, Contractor/Engineer/Shop/Worker/Admin Portals, 14 Data Domains + 6 Integrity Rules + 8 Revenue Streams + Security Controls, Stack + Responsive Matrix + Accessibility + 7-Phase Roadmap + Definition of Done.

- [ ] **Step 2: Verify structural completeness & zero forbidden regressions**
  Run a PowerShell verification check confirming presence of all palette hexes, formulas, `25.29`, `LKR 200,000`, all 10 homepage sections, all 6 roles, all 8 revenue streams, all 7 roadmap phases, and reduced-motion/WCAG rules.
  Expected: Exit 0 with all assertions matched.

- [ ] **Step 3: Independent spec-fidelity audit**
  Dispatch a fresh read-only `research` subagent to audit `docs/Haus_and_Co_Advanced_Website_Generation_Prompt.md` against `docs/superpowers/specs/2026-11-15-haus-co-website-prompt-design.md` and the Review Focus list.
  Expected: Zero Critical/Important gaps before presenting the final `.md` file to the user.
