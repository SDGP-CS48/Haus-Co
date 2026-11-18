import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Hammer,
  HardHat,
  Ruler,
  ShieldCheck,
  Sofa,
  Store,
} from 'lucide-react';
import {
  computeCostEstimate,
  getDefaultSampleRateSet,
  JOURNEY_STAGES,
  type FinishGrade,
} from '@hausco/shared';
import { ConstructionStoryScroll } from '../../components/motion/ConstructionStoryScroll';
import { LivingBlueprint } from '../../components/motion/LivingBlueprint';
import {
  Badge,
  Button,
  DisclaimerBanner,
  SampleDataPill,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { PublicLayout } from '../../components/ui/PublicLayout';
import { TeamSection } from '../../components/ui/TeamSection';
import { formatLkr } from '../../services/api';

export const HomePage: React.FC = () => {
  const [previewRoomsSqm, setPreviewRoomsSqm] = useState(100);
  const [previewGrade, setPreviewGrade] = useState<FinishGrade>('MID_RANGE');
  const [previewStoreys, setPreviewStoreys] = useState<1 | 2>(1);

  const sampleRateSet = useMemo(() => getDefaultSampleRateSet(), []);
  const previewEstimate = useMemo(
    () =>
      computeCostEstimate({
        planSnapshot: {
          totalRoomAreaSqm: previewRoomsSqm,
          totalWallLengthM: Math.round(previewRoomsSqm * 0.54),
          slabAreaSqm: Math.round(previewRoomsSqm * 1.15),
          roofAreaSqm: Math.round(previewRoomsSqm * 1.4),
          storeys: previewStoreys,
        },
        finishGrade: previewGrade,
        district: 'Colombo',
        contingencyPct: 0.1,
        rateSet: sampleRateSet,
      }),
    [previewRoomsSqm, previewGrade, previewStoreys, sampleRateSet]
  );

  return (
    <PublicLayout>
      {/* 1. Full-Screen Architectural Hero */}
      <section className="relative overflow-hidden border-b border-[#1C1C1A]/12 arch-grid-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="yellow">Sri Lanka’s Digital Home Construction Platform</Badge>
                <span className="font-mono-num text-xs text-[#1C1C1A]/70">
                  LKR · PERCHES (25.29 m²)
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] text-[#1C1C1A]">
                Your dream home.{' '}
                <span className="text-[#D9940A]">From the ground up.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#1C1C1A]/80 max-w-xl leading-relaxed">
                Plan, design, estimate, build and furnish your home — all in one intelligent platform.
                From floor plan to finished home.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to="/auth/role-selection?intent=start-building">
                  <Button size="lg">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="outline" size="lg">
                    Explore the Platform
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1C1C1A]/12">
                <div>
                  <p className="font-display text-lg font-bold text-[#D9940A]">7 Stages</p>
                  <p className="text-xs text-[#1C1C1A]/75">Plot to tradespeople</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-[#D9940A]">Method A & B</p>
                  <p className="text-xs text-[#1C1C1A]/75">Transparent LKR math</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-[#D9940A]">To-Scale Fit</p>
                  <p className="text-xs text-[#1C1C1A]/75">Real store furniture</p>
                </div>
              </div>
            </motion.div>

            <div className="lg:col-span-6">
              <LivingBlueprint />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <span className="font-mono-num text-xs font-semibold uppercase tracking-wider text-[#D9940A]">
            The Construction Gap
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
            Why building a home in Sri Lanka feels fragmented
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SurfaceCard tone="pale" className="p-6 space-y-2.5">
            <Compass className="h-6 w-6 text-[#D9940A]" />
            <h3 className="font-display font-bold text-lg">Disconnected Services</h3>
            <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
              Home builders juggle separate architects, civil engineers, contractors, hardware suppliers,
              and tradespeople without a single shared plan or project record.
            </p>
          </SurfaceCard>
          <SurfaceCard tone="pale" className="p-6 space-y-2.5">
            <Calculator className="h-6 w-6 text-[#D9940A]" />
            <h3 className="font-display font-bold text-lg">Uncertain Budgets & BOQs</h3>
            <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
              Early material requirements are hard to compute, and contractor quotations vary wildly—making
              omitted items or abnormal markups difficult to spot early.
            </p>
          </SurfaceCard>
          <SurfaceCard tone="pale" className="p-6 space-y-2.5">
            <Sofa className="h-6 w-6 text-[#D9940A]" />
            <h3 className="font-display font-bold text-lg">Furniture & Material Guesswork</h3>
            <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
              Comparing prices across local stores takes days, and homeowners often buy furniture without
              knowing if it clears walls, doors, or walkways.
            </p>
          </SurfaceCard>
        </div>
      </section>

      {/* 3. Seven-Step Journey */}
      <section className="border-y border-[#1C1C1A]/10 bg-[#FDE8A5]/35 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-mono-num text-xs font-semibold uppercase tracking-wider text-[#D9940A]">
                End-to-End Guided Workflow
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                Seven connected steps from plot to handover
              </h2>
            </div>
            <Link to="/how-it-works">
              <Button variant="secondary" size="sm">
                View Full 7-Step Guide
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {JOURNEY_STAGES.map((stage) => (
              <div
                key={stage.key}
                className="rounded-lg border border-[#1C1C1A]/12 bg-[#FAF7EE] p-4 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-[#D9940A] text-white font-mono-num text-xs font-bold">
                    0{stage.step}
                  </span>
                  <h3 className="font-display font-bold text-sm mt-3 text-[#1C1C1A]">
                    {stage.label}
                  </h3>
                </div>
                <div className="mt-4 h-1 w-full rounded bg-[#FDE8A5]">
                  <div
                    className="h-1 rounded bg-[#F4B41A]"
                    style={{ width: `${Math.round((stage.step / 7) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Scroll-Driven Construction Story */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <span className="font-mono-num text-xs font-semibold uppercase tracking-wider text-[#D9940A]">
            Construction Storytelling
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-1">
            One architectural model across every construction phase
          </h2>
        </div>
        <ConstructionStoryScroll />
      </section>

      {/* 5. Cost Estimator Interactive Showcase */}
      <section className="border-y border-[#1C1C1A]/10 bg-[#FDE8A5]/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2">
                <SampleDataPill label="Illustrative Sample Rate (LKR 200,000/m²)" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Transparent Rough Cost Estimation
              </h2>
              <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
                Test how room area, finish grade, and storeys affect Method A (area-based quick
                estimate) and the five construction stage allocations in real time.
              </p>

              <SurfaceCard tone="canvas" className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Total Room Area (A_rooms)</span>
                    <span className="font-mono-num text-[#D9940A]">{previewRoomsSqm} m²</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={260}
                    step={5}
                    value={previewRoomsSqm}
                    onChange={(e) => setPreviewRoomsSqm(Number(e.target.value))}
                    aria-label="Preview room area in square metres"
                    className="w-full accent-[#D9940A]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['STANDARD', 'MID_RANGE', 'PREMIUM'] as FinishGrade[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setPreviewGrade(grade)}
                      className={`rounded-md px-2.5 py-2 text-xs font-semibold border transition-colors ${
                        previewGrade === grade
                          ? 'bg-[#F4B41A] text-[#1C1C1A] border-[#D9940A]'
                          : 'bg-[#FAF7EE] text-[#1C1C1A]/80 border-[#1C1C1A]/15'
                      }`}
                    >
                      {grade.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  {([1, 2] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPreviewStoreys(st)}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold border ${
                        previewStoreys === st
                          ? 'bg-[#D9940A] text-white border-[#D9940A]'
                          : 'bg-[#FAF7EE] text-[#1C1C1A] border-[#1C1C1A]/15'
                      }`}
                    >
                      {st === 1 ? 'Single Storey (1.00×)' : 'Two Storey (1.10×)'}
                    </button>
                  ))}
                </div>
              </SurfaceCard>

              <Link to="/cost-estimator" className="inline-block">
                <Button variant="outline">
                  Inspect Method A & Method B Formulas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <SurfaceCard tone="pale" className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-[#1C1C1A]/12">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#1C1C1A]/70">Estimated Total</p>
                    <p className="font-mono-num text-2xl font-bold text-[#D9940A] mt-1">
                      {formatLkr(previewEstimate.methodATotalLkr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#1C1C1A]/70">±10% Range</p>
                    <p className="font-mono-num text-sm font-semibold mt-1.5">
                      {formatLkr(previewEstimate.methodALowLkr)} – {formatLkr(previewEstimate.methodAHighLkr)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#1C1C1A]/70">Built-up Rate</p>
                    <p className="font-mono-num text-sm font-semibold mt-1.5">
                      {formatLkr(previewEstimate.methodACostPerSqmLkr)} / m² ({previewEstimate.estimatedBuiltUpAreaSqm} m²)
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {previewEstimate.stageAllocations.map((s) => (
                    <div key={s.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{s.label}</span>
                        <span className="font-mono-num">
                          {s.sharePct}% · {formatLkr(s.costLkr)}
                        </span>
                      </div>
                      <div className="h-2 rounded bg-[#FAF7EE]">
                        <div
                          className="h-2 rounded bg-[#F4B41A]"
                          style={{ width: `${s.sharePct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>

              <DisclaimerBanner
                title="Rough Estimate Notice"
                body={previewEstimate.disclaimer}
                tone="warning"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Marketplace, Professionals & Workers Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SurfaceCard tone="canvas" className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-[#FDE8A5] flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-[#D9940A]" />
              </div>
              <h3 className="font-display text-xl font-bold">BOQ Auditor & Professionals</h3>
              <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
                Browse CIDA contractors and chartered civil engineers, hold free in-app WebRTC voice
                calls, book paid site visits, and audit 5-stage BOQs for missing items or abnormal rates.
              </p>
            </div>
            <Link to="/professionals" className="text-sm font-semibold text-[#D9940A] inline-flex items-center gap-1 hover:underline">
              Explore Professionals <ArrowRight className="h-4 w-4" />
            </Link>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-[#FDE8A5] flex items-center justify-center">
                <Sofa className="h-5 w-5 text-[#D9940A]" />
              </div>
              <h3 className="font-display text-xl font-bold">To-Scale Furnishing & Stores</h3>
              <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
                Drag local store furniture (width × depth × height) directly onto your 2D rooms to run
                collision & door-swing checks (Fits / Tight / Does not fit) before visiting the store.
              </p>
            </div>
            <Link to="/marketplace" className="text-sm font-semibold text-[#D9940A] inline-flex items-center gap-1 hover:underline">
              Browse Dimensioned Catalogue <ArrowRight className="h-4 w-4" />
            </Link>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-md bg-[#FDE8A5] flex items-center justify-center">
                <Hammer className="h-5 w-5 text-[#D9940A]" />
              </div>
              <h3 className="font-display text-xl font-bold">Verified Skilled Workers</h3>
              <p className="text-sm text-[#1C1C1A]/80 leading-relaxed">
                Hire electricians, plumbers, masons, painters, and carpenters with scoped micro-tasks.
                Reviews unlock only after jobs are completed and paid through the platform.
              </p>
            </div>
            <Link to="/workers" className="text-sm font-semibold text-[#D9940A] inline-flex items-center gap-1 hover:underline">
              Find Skilled Tradespeople <ArrowRight className="h-4 w-4" />
            </Link>
          </SurfaceCard>
        </div>
      </section>

      {/* 7. Leadership & Core Technical Team */}
      <TeamSection className="border-y border-[#1C1C1A]/10 bg-[#FDE8A5]/20" />

      {/* 8. Partner Ecosystem & Final CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Partner Invitation */}
        <SurfaceCard tone="pale" className="p-8 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <Badge tone="yellow">Partner Ecosystem</Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Built for Sri Lankan contractors, civil engineers, shops & tradespeople
              </h2>
              <p className="text-sm text-[#1C1C1A]/80 max-w-2xl leading-relaxed">
                Receive verified homeowner project briefs with confirmed 2D plans, publish structural
                site reports, showcase dimensioned furniture with qualified booking leads, or accept scoped trade tasks.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-[#1C1C1A]/85">
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-[#D9940A]" /> General Contractors</span>
                <span className="inline-flex items-center gap-1.5"><HardHat className="h-4 w-4 text-[#D9940A]" /> Civil Engineers</span>
                <span className="inline-flex items-center gap-1.5"><Store className="h-4 w-4 text-[#D9940A]" /> Hardware & Furniture Shops</span>
                <span className="inline-flex items-center gap-1.5"><Ruler className="h-4 w-4 text-[#D9940A]" /> Skilled Workers</span>
              </div>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Link to="/auth/role-selection?intent=partner">
                <Button size="lg">
                  Join as a Partner
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </SurfaceCard>

        {/* Final CTA */}
        <div className="rounded-xl border border-[#1C1C1A]/15 bg-[#1C1C1A] text-[#FAF7EE] p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#F4B41A]">
              <ShieldCheck className="h-4 w-4" />
              <span>Start from Scratch or Upload Your Existing Blueprint</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              Ready to plan your Sri Lankan home with clarity?
            </h2>
            <p className="text-sm text-[#FAF7EE]/80">
              Draw your plot in perches, generate two compliant 2D layouts, inspect rough estimates, and
              move cleanly into engineering and BOQ comparisons.
            </p>
          </div>
          <Link to="/auth/role-selection?intent=start-building" className="shrink-0">
            <Button size="lg">
              Start Building Free
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};
