import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Calculator,
  Check,
  Compass,
  Hammer,
  HardHat,
  Lock,
  Mail,
  Phone,
  Sofa,
} from 'lucide-react';
import { JOURNEY_STAGES, ROUGH_ESTIMATE_DISCLAIMER } from '@hausco/shared';
import { ConstructionStoryScroll } from '../../components/motion/ConstructionStoryScroll';
import { LivingBlueprint } from '../../components/motion/LivingBlueprint';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  SampleDataPill,
  Select,
  SurfaceCard,
  Textarea,
} from '../../components/ui/Primitives';
import { PublicLayout } from '../../components/ui/PublicLayout';
import { TeamSection } from '../../components/ui/TeamSection';
import { apiFetch } from '../../services/api';

const PageHero: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: string;
}> = ({ eyebrow, title, description, ctaLabel = 'Start Building', ctaTo = '/auth/role-selection' }) => (
  <section className="border-b border-[#1C1C1A]/12 arch-grid-bg py-12 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="max-w-2xl space-y-3">
        <span className="font-mono-num text-xs font-semibold uppercase tracking-wider text-[#D9940A]">
          {eyebrow}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1C1C1A]">{title}</h1>
        <p className="text-base text-[#1C1C1A]/80 leading-relaxed">{description}</p>
      </div>
      <Link to={ctaTo} className="shrink-0">
        <Button size="lg">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  </section>
);

export const HowItWorksPage: React.FC = () => (
  <PublicLayout>
    <PageHero
      eyebrow="End-to-End Platform Architecture"
      title="How Haus & Co guides your build across 7 structured stages"
      description="Every step passes verified plot bounds, plan versions, and material quantities forward—so cost estimates, BOQ audits, and furniture fit checks stay synchronised."
    />
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {JOURNEY_STAGES.map((stage) => (
          <SurfaceCard key={stage.key} tone="pale" className="p-5 space-y-2">
            <Badge tone="amber">Stage 0{stage.step}</Badge>
            <h2 className="font-display font-bold text-lg pt-1">{stage.label}</h2>
            <p className="text-xs text-[#1C1C1A]/80 leading-relaxed">
              {stage.step === 1 && 'Draw regular or irregular plot polygons, convert m² to Sri Lankan perches (25.29 m²), and apply configurable municipal setbacks.'}
              {stage.step === 2 && 'Generate Variant A (Compact / Open-Plan) and Variant B (Spacious / Traditional), refine via controlled AI tools, or unlock 3D.'}
              {stage.step === 3 && 'Run transparent Method A and Method B rough calculations across 5 construction stages with live what-if sliders.'}
              {stage.step === 4 && 'Consult CIDA contractors and chartered civil engineers via free WebRTC voice calls or book paid site inspections.'}
              {stage.step === 5 && 'Audit turnkey and labour-only itemised BOQs for omitted items, low regional rates, and unreasonable markups.'}
              {stage.step === 6 && 'Drag dimensioned furniture from verified Sri Lankan stores onto rooms to check door swings, walls, and walkways.'}
              {stage.step === 7 && 'Post scoped micro-tasks to verified electricians, plumbers, masons, painters, and carpenters.'}
            </p>
          </SurfaceCard>
        ))}
      </div>
      <ConstructionStoryScroll />
    </section>
  </PublicLayout>
);

export const HousePlannerMarketingPage: React.FC = () => (
  <PublicLayout>
    <PageHero
      eyebrow="Plot & Concept Plan Suite"
      title="Plot geometry, two compliant 2D variants, AI editing & 3D extrusion"
      description="Start from scratch with plot coordinates or upload an existing PDF/image blueprint from an external architect."
      ctaLabel="Open House Planner"
      ctaTo="/auth/role-selection?intent=planner"
    />
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-6">
        <LivingBlueprint />
      </div>
      <div className="lg:col-span-6 space-y-4">
        <SurfaceCard tone="pale" className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-display font-bold">
            <Compass className="h-5 w-5 text-[#D9940A]" />
            Deterministic Layout Variants A & B
          </div>
          <p className="text-sm text-[#1C1C1A]/80">
            Receive Variant A (Compact / Open-Plan) and Variant B (Spacious / Traditional) sized strictly
            inside your buildable setback envelope, complete with wall thickness, door swings, and windows.
          </p>
        </SurfaceCard>
        <SurfaceCard tone="canvas" className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-display font-bold">
            <Check className="h-5 w-5 text-[#D9940A]" />
            Controlled Server-Side AI Tool Edits
          </div>
          <p className="text-sm text-[#1C1C1A]/80">
            Natural-language edits map to validated server tools (resize_room, add_bedroom, change_style).
            Edits that breach plot setbacks are automatically rejected with clear geometric explanations.
          </p>
        </SurfaceCard>
        <SurfaceCard tone="canvas" className="p-5 space-y-2">
          <div className="flex items-center gap-2 font-display font-bold">
            <Lock className="h-5 w-5 text-[#D9940A]" />
            Paid Three.js 3D Procedural View
          </div>
          <p className="text-sm text-[#1C1C1A]/80">
            Once your 2D plan is confirmed, unlock interactive Three.js 3D extruded walls, floor slabs,
            gable/hip/flat roofs, sky lighting, and orbit/zoom/pan controls via a one-time plan unlock.
          </p>
        </SurfaceCard>
      </div>
    </section>
  </PublicLayout>
);

export const CostEstimatorMarketingPage: React.FC = () => (
  <PublicLayout>
    <PageHero
      eyebrow="Transparent Cost Intelligence"
      title="Method A & Method B rough construction estimation"
      description="Inspect every multiplier, allowance, material coefficient, and stage share before requesting contractor BOQ quotations."
      ctaLabel="Estimate Your Plan"
      ctaTo="/auth/role-selection?intent=estimator"
    />
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SurfaceCard tone="pale" className="p-6 space-y-3">
          <Badge tone="amber">Method A · Area-Based Quick Estimate</Badge>
          <pre className="rounded bg-[#FAF7EE] border border-[#1C1C1A]/12 p-3 font-mono-num text-xs overflow-x-auto">
            {`A = A_rooms × (1 + w)\nTotal = A × R × F × S × L × (1 + C)`}
          </pre>
          <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
            Uses sum of room areas (`A_rooms`), wall/circulation allowance `w = 0.15`, base LKR/m² rate `R`,
            finish multiplier `F` (1.00 / 1.20 / 1.45), storey multiplier `S` (1.00 / 1.10), district factor `L`,
            and contingency `C` (default 10%).
          </p>
        </SurfaceCard>

        <SurfaceCard tone="pale" className="p-6 space-y-3">
          <Badge tone="yellow">Method B · Quantity-Based Material Breakdown</Badge>
          <pre className="rounded bg-[#FAF7EE] border border-[#1C1C1A]/12 p-3 font-mono-num text-xs overflow-x-auto">
            {`Qty_m = PlanQuantity_m × k_m × (1 + waste_m)\nMaterialCost = Σ (Qty_m × Price_m)`}
          </pre>
          <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
            Derives cement, river sand, aggregate, Tor steel, masonry blocks, roofing, tiles, and waterproofing
            directly from plan wall, slab, and roof quantities with editable `k` and wastage factors.
          </p>
        </SurfaceCard>
      </div>

      <DisclaimerBanner title="Rough Estimate & Demo Rate Disclaimer" body={ROUGH_ESTIMATE_DISCLAIMER} tone="warning" />
    </section>
  </PublicLayout>
);

export const ProfessionalsMarketingPage: React.FC = () => {
  const [pros, setPros] = useState<{ userId: string; kind: string; fullName: string; companyOrTitle: string; gradeOrQualification: string; serviceDistricts: string[] }[]>([]);

  useEffect(() => {
    apiFetch<{ professionals: typeof pros }>('/professionals')
      .then((res) => setPros(res.professionals))
      .catch(() => setPros([]));
  }, []);

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Verified Professional Network"
        title="Chartered Civil Engineers & CIDA-Registered Contractors"
        description="Distinct discovery paths for technical soil/structural verification and competitive multi-stage BOQ tendering."
        ctaLabel="Book a Professional"
        ctaTo="/auth/role-selection?intent=professionals"
      />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Directory Preview</h2>
          <SampleDataPill label="Sample data — illustrative profiles only" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pros.map((pro) => (
            <SurfaceCard key={pro.userId} tone="canvas" className="p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={pro.kind === 'ENGINEER' ? 'amber' : 'yellow'}>
                  {pro.kind === 'ENGINEER' ? <HardHat className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                  {pro.kind === 'ENGINEER' ? 'Civil Engineer' : 'General Contractor'}
                </Badge>
                <span className="text-xs text-[#1C1C1A]/70">{pro.serviceDistricts.join(', ')}</span>
              </div>
              <h3 className="font-display font-bold text-lg">{pro.fullName}</h3>
              <p className="text-sm font-medium text-[#D9940A]">{pro.companyOrTitle}</p>
              <p className="text-xs text-[#1C1C1A]/75">{pro.gradeOrQualification}</p>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};

export const MarketplaceMarketingPage: React.FC = () => (
  <PublicLayout>
    <PageHero
      eyebrow="Hardware & Dimensioned Furniture"
      title="Furnish every room to scale before visiting a store"
      description="Place real dimensioned products from local hardware & furniture shops onto your 2D floor plan with instant wall and door-swing fit checks."
      ctaLabel="Try Interior & Shop Studio"
      ctaTo="/auth/role-selection?intent=marketplace"
    />
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 space-y-10">
      <SurfaceCard tone="pale" className="p-6 overflow-x-auto">
        <h2 className="font-display text-xl font-bold mb-4">Free vs. Premium Furniture Capabilities</h2>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#D9940A] text-white">
              <th className="p-3 rounded-tl">Furniture Capability</th>
              <th className="p-3">Free</th>
              <th className="p-3 rounded-tr">Premium (Paid)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C1C1A]/10 bg-[#FAF7EE]">
            {[
              ['Browse supplier furniture with dimensions', 'Yes', 'Yes'],
              ['Place items to scale in rooms & run fit check', 'Yes', 'Yes'],
              ['Supplier name & store location', 'Yes', 'Yes'],
              ['Prices', 'Hidden (locked)', 'Visible for every supplier'],
              ['Compare prices across stores', 'No', 'Yes, side by side with lowest highlighted'],
              ['Total furnishing budget (room / house)', 'No', 'Yes'],
              ['Store contact number (tap to call)', 'No', 'Yes'],
              ['Book or reserve item with store', 'No', 'Yes (booking request sent to store)'],
              ['Download shopping list with prices (PDF)', 'No', 'Yes'],
            ].map(([cap, freeVal, premVal]) => (
              <tr key={cap}>
                <td className="p-3 font-medium">{cap}</td>
                <td className="p-3 text-[#1C1C1A]/75">{freeVal}</td>
                <td className="p-3 font-semibold text-[#D9940A]">{premVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SurfaceCard>
    </section>
  </PublicLayout>
);

export const WorkersMarketingPage: React.FC = () => (
  <PublicLayout>
    <PageHero
      eyebrow="Skilled Worker Marketplace"
      title="Electricians, plumbers, masons, painters & carpenters"
      description="Post clearly scoped micro-tasks with transparent booking flow and completion-verified reviews."
      ctaLabel="Browse Tradespeople"
      ctaTo="/auth/role-selection?intent=workers"
    />
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {[
        ['Electricians', 'DB boards, earthing, CEB-compliant wiring & fixture fit-outs.'],
        ['Plumbers', 'Water supply lines, drainage, pressure testing & sanitaryware.'],
        ['Masons', 'Blockwork, plastering, concrete lintels & porcelain floor tiling.'],
        ['Painters', 'Skim-coating, weather-shield exteriors & interior finishes.'],
        ['Carpenters', 'Roof trusses, timber doors, custom cabinetry & staircase joinery.'],
      ].map(([title, desc]) => (
        <SurfaceCard key={title} tone="pale" className="p-5 space-y-2">
          <Hammer className="h-5 w-5 text-[#D9940A]" />
          <h3 className="font-display font-bold text-base">{title}</h3>
          <p className="text-xs text-[#1C1C1A]/80 leading-relaxed">{desc}</p>
        </SurfaceCard>
      ))}
    </section>
  </PublicLayout>
);

export const AboutPage: React.FC = () => (
  <PublicLayout>
    <PageHero
      eyebrow="About Haus & Co"
      title="Architectural clarity for Sri Lankan home builders"
      description="Haus & Co consolidates plot geometry, concept layouts, rough estimation, engineering validation, BOQ auditing, furnishing, and skilled trade hiring into one unified platform."
    />
    <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-6 text-sm leading-relaxed text-[#1C1C1A]/85">
      <p>
        Home builders across Sri Lanka traditionally navigate disconnected spreadsheets, unverified quotes,
        and multiple showroom visits before a single foundation trench is excavated. Haus & Co solves this
        by preserving one versioned source of truth for your plot, rooms, and material quantities.
      </p>
      <p>
        Every calculation is expressed in LKR and metric units alongside Sri Lankan perches (1 perch = 25.29 m²).
        Where external municipal setback bylaws, live market prices, or chartered engineering approvals are required,
        the platform marks rules clearly as illustrative until verified by a qualified professional.
      </p>
    </section>
    <TeamSection className="border-t border-[#1C1C1A]/10 bg-[#FDE8A5]/15" />
  </PublicLayout>
);

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pathway, setPathway] = useState('HOME_BUILDER_ENQUIRY');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  return (
    <PublicLayout>
      <PageHero
        eyebrow="Contact & Partner Onboarding"
        title="Speak with Haus & Co"
        description="Reach out for home-builder onboarding support or register as a contractor, civil engineer, shop owner, or skilled worker."
      />
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-4">
          <SurfaceCard tone="pale" className="p-5 space-y-3">
            <h2 className="font-display font-bold text-lg">Direct Pathways</h2>
            <p className="text-xs text-[#1C1C1A]/80">
              Select a role directly in our authentication gateway to start building or submit KYC documents.
            </p>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#D9940A]" /> hello@hausandco.lk (placeholder)</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#D9940A]" /> +94 11 000 0000 (placeholder)</p>
            </div>
            <Link to="/auth/role-selection?intent=partner" className="block pt-2">
              <Button variant="secondary" size="sm" className="w-full">
                Open Partner Registration Gateway
              </Button>
            </Link>
          </SurfaceCard>
        </div>

        <div className="md:col-span-7">
          <SurfaceCard tone="canvas" className="p-6">
            {submitted ? (
              <div className="space-y-3 py-6 text-center">
                <Badge tone="ok">Enquiry Logged (Demo Form)</Badge>
                <h3 className="font-display font-bold text-lg">Thank you, {name}</h3>
                <p className="text-sm text-[#1C1C1A]/80">
                  Your {pathway.replace(/_/g, ' ').toLowerCase()} note has been recorded locally for this session.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <FieldLabel htmlFor="contact-name">Full Name</FieldLabel>
                  <Input id="contact-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Amila Jayawardena" />
                </div>
                <div>
                  <FieldLabel htmlFor="contact-email">Email Address</FieldLabel>
                  <Input id="contact-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.lk" />
                </div>
                <div>
                  <FieldLabel htmlFor="contact-pathway">Enquiry Pathway</FieldLabel>
                  <Select id="contact-pathway" value={pathway} onChange={(e) => setPathway(e.target.value)}>
                    <option value="HOME_BUILDER_ENQUIRY">Home Builder Support</option>
                    <option value="CONTRACTOR_PARTNER">General Contractor Registration</option>
                    <option value="ENGINEER_PARTNER">Chartered Civil Engineer Onboarding</option>
                    <option value="SHOP_PARTNER">Hardware & Furniture Shop Partnership</option>
                    <option value="WORKER_PARTNER">Skilled Worker Verification</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="contact-msg">Message</FieldLabel>
                  <Textarea id="contact-msg" rows={4} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your project district or business category..." />
                </div>
                <Button type="submit">Submit Enquiry</Button>
              </form>
            )}
          </SurfaceCard>
        </div>
      </section>
    </PublicLayout>
  );
};
