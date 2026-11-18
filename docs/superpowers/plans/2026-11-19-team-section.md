# Team Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive, accessible Team Section showcasing 5 core team members to the Haus & Co platform on both the Home and About pages.

**Architecture:** Create a standalone, reusable `TeamSection` component in `frontend/src/components/ui/TeamSection.tsx` adhering to Haus & Co's architectural design system (warm parchment `#FAF7EE`, amber `#D9940A`, dark ink `#1C1C1A`, mono metadata, and subtle card borders). Embed this component into `HomePage.tsx` and `AboutPage` in `PublicSubPages.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-19-team-section-design.md`

## Global Constraints

- Team member details and image mapping:
  - Thenuja – Agile Project Manager – `/assets/image1.png`
  - Kaveesha – UX/UI & Ethics Specialist – `/assets/image2.png`
  - Manishka – Project & Business Analyst – `/assets/image5.png`
  - Thenuk – Requirements Analyst – `/assets/image3.png`
  - Dinel – System Architect – `/assets/image4.png`
- Use the existing design language: warm parchment `#FAF7EE`, amber `#D9940A`, ink `#1C1C1A`, font-display, font-mono-num.
- Do not modify or move original image assets in `frontend/public/assets/`.

## Review Focus

1. Image alt texts and aspect ratios: Ensure all 5 portraits have descriptive `alt` tags and maintain proper aspect ratios without distortion.
2. Layout responsiveness: Ensure cards wrap cleanly on mobile (1 col), tablet (2-3 cols), and desktop (balanced 5-member layout).
3. Visual harmony: Section header and card styling matches existing `SurfaceCard` and `Badge` components.
4. Route integration: Renders properly on both `/` and `/about` without hydration or layout issues.
5. Verification: All vitest unit tests and TypeScript compiler checks pass cleanly.

---

### Task 1: Create `TeamSection` Component & Unit Tests

**Files:**
- Create: `frontend/src/components/ui/TeamSection.tsx`
- Create: `frontend/src/__tests__/teamSection.test.tsx`

**Interfaces:**
- Produces: `export const TeamSection: React.FC<{ className?: string }>`
- Consumes: `SurfaceCard`, `Badge` from `frontend/src/components/ui/Primitives`

- [ ] **Step 1: Write the failing unit test**

Create `frontend/src/__tests__/teamSection.test.tsx`:
```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamSection } from '../components/ui/TeamSection';

describe('TeamSection', () => {
  it('renders all 5 team members with their roles and images', () => {
    render(<TeamSection />);

    const members = [
      { name: 'Thenuja', role: 'Agile Project Manager', src: '/assets/image1.png' },
      { name: 'Kaveesha', role: 'UX/UI & Ethics Specialist', src: '/assets/image2.png' },
      { name: 'Manishka', role: 'Project & Business Analyst', src: '/assets/image5.png' },
      { name: 'Thenuk', role: 'Requirements Analyst', src: '/assets/image3.png' },
      { name: 'Dinel', role: 'System Architect', src: '/assets/image4.png' },
    ];

    members.forEach(({ name, role, src }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(role)).toBeInTheDocument();
      const img = screen.getByAltText(name) as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe(src);
    });

    expect(screen.getByText(/Leadership & Core Team/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test --workspace=frontend -- run src/__tests__/teamSection.test.tsx`  
Expected: FAIL (module `TeamSection` not found)

- [ ] **Step 3: Implement `TeamSection` in `frontend/src/components/ui/TeamSection.tsx`**

Implement `TeamSection` with:
- `TEAM_MEMBERS` constant array containing name, role, image, and optional badge/specialty info.
- Architectural layout using `SurfaceCard`, eyebrow badge, display title, descriptive subtitle, and responsive 5-card grid.
- Clean portrait container with rounded borders, object-cover object-top, and subtle hover transition.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test --workspace=frontend -- run src/__tests__/teamSection.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/TeamSection.tsx frontend/src/__tests__/teamSection.test.tsx
git commit -m "feat(ui): add TeamSection component and unit test"
```

---

### Task 2: Integrate `TeamSection` into `HomePage.tsx`

**Files:**
- Modify: `frontend/src/pages/public/HomePage.tsx`

**Interfaces:**
- Consumes: `TeamSection` from `../../components/ui/TeamSection`

- [ ] **Step 1: Update `HomePage.tsx` to include `TeamSection`**

Import `TeamSection` and insert `<TeamSection />` between the 3-module feature cards (Section 6) and the Partner Invitation card.

- [ ] **Step 2: Run frontend test suite to verify no regressions**

Run: `npm test --workspace=frontend`  
Expected: PASS (all tests pass)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/public/HomePage.tsx
git commit -m "feat(home): embed TeamSection on landing page"
```

---

### Task 3: Integrate `TeamSection` into `AboutPage` in `PublicSubPages.tsx`

**Files:**
- Modify: `frontend/src/pages/public/PublicSubPages.tsx`

**Interfaces:**
- Consumes: `TeamSection` from `../../components/ui/TeamSection`

- [ ] **Step 1: Update `AboutPage` in `PublicSubPages.tsx`**

Import `TeamSection` and render `<TeamSection />` inside `AboutPage` below the platform mission description.

- [ ] **Step 2: Run typecheck and full test suite**

Run: `npm run typecheck --workspace=frontend && npm test --workspace=frontend`  
Expected: PASS with 0 errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/public/PublicSubPages.tsx
git commit -m "feat(about): embed TeamSection in About page"
```
