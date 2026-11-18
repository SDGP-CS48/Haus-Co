# Design Specification: Team Section for Haus & Co

**Date:** 2026-11-19  
**Status:** Pending Approval  
**Author:** Antigravity  

---

## 1. Intent & Context
Haus & Co is an all-in-one digital home construction platform in Sri Lanka connecting home builders with contractors, civil engineers, building material vendors, and skilled workers. To build trust and highlight the multidisciplinary expertise behind the platform, a dedicated Team Section is being added showcasing the core project leadership and technical specialists.

---

## 2. Team Member Information & Asset Mapping
The section features 5 core team members using local images from `/assets/`:
1. **Thenuja** — Agile Project Manager (`/assets/image1.png`)
2. **Kaveesha** — UX/UI & Ethics Specialist (`/assets/image2.png`)
3. **Manishka** — Project & Business Analyst (`/assets/image5.png`)
4. **Thenuk** — Requirements Analyst (`/assets/image3.png`)
5. **Dinel** — System Architect (`/assets/image4.png`)

---

## 3. Goals, Non-Goals, and Anti-Goals
- **Goals:**
  - Create a reusable, responsive `TeamSection` component in `frontend/src/components/ui/TeamSection.tsx`.
  - Maintain the architectural aesthetic of Haus & Co (`#FAF7EE` canvas, `#D9940A` amber accents, `#1C1C1A` ink borders, mono metadata, Syne typography).
  - Embed the section seamlessly into the main marketing landing page (`HomePage.tsx`) and the company page (`AboutPage` in `PublicSubPages.tsx`).
  - Ensure images load reliably, cards have accessible labels and alt text, and the layout looks balanced on mobile, tablet, and desktop viewports.
- **Non-Goals:**
  - Creating separate bio sub-pages for individual team members at this stage.
  - Adding external social media accounts without verified links.
- **Anti-Goals:**
  - No generic template styling or foreign color palettes that clash with the warm Sri Lankan architectural theme.
  - No distorted/stretched portrait aspect ratios or missing image fallbacks.

---

## 4. Approaches Considered
1. **Approach 1 (Selected): Home Page & About Page Integration via Reusable Component**
   - *Pros:* Builds brand credibility directly on the landing page for first-time visitors while also providing a complete, professional About page. High component reusability.
   - *Cons:* Slightly larger code touchpoint than a single-page change.
   - *Decision:* Approved by user.
2. **Approach 2: About Page Only**
   - *Pros:* Keeps the landing page strictly focused on product modules.
   - *Cons:* Homeowners and partners landing on the home page miss the human team and credibility behind the product.
3. **Approach 3: Home Page Only**
   - *Pros:* Quick single-file edit.
   - *Cons:* Leaves `/about` barren and misses the primary place visitors expect company team information.

---

## 5. Component Design & Implementation Details
- **Component:** `frontend/src/components/ui/TeamSection.tsx`
  - Container with section header (Eyebrow: "Leadership & Architecture", Title: "Meet the Team Behind Haus & Co", Subtitle on Sri Lankan construction innovation).
  - Card layout: Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` or 5-item balanced layout with 3 on top row, 2 centered below, or flexible auto-fit).
  - Card details:
    - Image wrapper with rounded corners, subtle `#1C1C1A]/10` border, warm `#FDE8A5]/30` backdrop, and `object-cover object-top` portrait rendering.
    - Full Name in `font-display text-lg font-bold text-[#1C1C1A]`.
    - Role pill badge using existing `Badge` or styled architectural chip with `text-[#D9940A]`.
    - Subtle hover animation (gentle elevation or border shift).
- **Integration Points:**
  - `frontend/src/pages/public/HomePage.tsx`: Placed directly after the Marketplace/Showcase section (Section 6) and before the Partner Invitation card.
  - `frontend/src/pages/public/PublicSubPages.tsx` (`AboutPage`): Placed beneath the introductory mission paragraphs.

---

## 6. Verification Plan
- Typecheck frontend with `npm run typecheck --workspace=frontend`.
- Run frontend test suite (`npm test --workspace=frontend`).
- Verify visual layout, responsive breakpoints, and image asset paths.
