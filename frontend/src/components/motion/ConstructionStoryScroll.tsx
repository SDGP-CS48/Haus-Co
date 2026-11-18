import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    id: 0,
    phase: 'Stage 01 · Foundation & Substructure (15%)',
    title: 'Plot setbacks, soil testing & plinth beam',
    desc: 'Draw your irregular or rectangular plot, apply municipal setbacks, and book a chartered civil engineer for soil bearing validation before excavation.',
  },
  {
    id: 1,
    phase: 'Stage 02 · Superstructure & Masonry (30%)',
    title: 'Walls, columns & lintels audited to plan',
    desc: 'Compare contractor masonry and concrete BOQ rates against plan-derived block and reinforcement quantities.',
  },
  {
    id: 2,
    phase: 'Stage 03 · Roofing & MEP (30%)',
    title: 'Roof trusses, waterproofing & rough-in',
    desc: 'Ensure roof waterproofing, electrical conduits and plumbing rough-ins are never omitted from turnkey quotations.',
  },
  {
    id: 3,
    phase: 'Stage 04 · Finishes & Furnishing (25%)',
    title: 'Tiling, verified tradespeople & to-scale furniture',
    desc: 'Place dimensioned furniture from Sri Lankan shops inside your exact rooms, verify fit status, and hire verified tradespeople.',
  },
];

export const ConstructionStoryScroll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!containerRef.current || prefersReduced) return;

    const ctx = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>('.story-step-card');
      steps.forEach((step, idx) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 62%',
          end: 'bottom 42%',
          onEnter: () => setActiveStage(idx),
          onEnterBack: () => setActiveStage(idx),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-xl border border-[#1C1C1A]/15 bg-[#FAF7EE] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono-num text-xs font-semibold text-[#D9940A]">
            BUILDING PROGRESSION · {activeStage + 1} / 4
          </span>
          <div className="flex gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-label={`View ${s.phase}`}
                onClick={() => setActiveStage(s.id)}
                className={`h-2 w-7 rounded-full transition-colors ${
                  activeStage >= s.id ? 'bg-[#D9940A]' : 'bg-[#FDE8A5]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Consistent architectural SVG model evolving across 4 stages */}
        <svg viewBox="0 0 420 260" className="w-full h-56 arch-grid-fine rounded-lg border border-[#1C1C1A]/10 bg-[#FAF7EE]">
          {/* Ground & Foundation Slab (always visible) */}
          <line x1="30" y1="224" x2="390" y2="224" stroke="#1C1C1A" strokeOpacity="0.3" strokeWidth="1.5" />
          <rect
            x="78"
            y="204"
            width="264"
            height="20"
            fill="#D9940A"
            fillOpacity={activeStage === 0 ? 0.95 : 0.4}
            stroke="#1C1C1A"
            strokeWidth="1.2"
          />
          <rect x="92" y="224" width="24" height="16" fill="#57534A" />
          <rect x="198" y="224" width="24" height="16" fill="#57534A" />
          <rect x="304" y="224" width="24" height="16" fill="#57534A" />

          {/* Stage 2+: Superstructure & Masonry */}
          <g style={{ opacity: activeStage >= 1 ? 1 : 0.14, transition: 'opacity 300ms ease' }}>
            <rect x="86" y="118" width="248" height="86" fill="#FAF7EE" stroke="#D9940A" strokeWidth="3" />
            <line x1="210" y1="118" x2="210" y2="204" stroke="#D9940A" strokeWidth="2" />
            <rect x="112" y="142" width="48" height="32" fill="#FDE8A5" stroke="#1C1C1A" strokeWidth="1.2" />
            <rect x="242" y="142" width="60" height="32" fill="#FDE8A5" stroke="#1C1C1A" strokeWidth="1.2" />
          </g>

          {/* Stage 3+: Roof & Truss */}
          <g style={{ opacity: activeStage >= 2 ? 1 : 0.1, transition: 'opacity 300ms ease' }}>
            <polygon
              points="64,120 210,48 356,120"
              fill={activeStage >= 3 ? '#D9940A' : '#F4B41A'}
              fillOpacity="0.88"
              stroke="#1C1C1A"
              strokeWidth="1.6"
            />
            <line x1="145" y1="80" x2="210" y2="118" stroke="#1C1C1A" strokeWidth="1" strokeOpacity="0.45" />
            <line x1="275" y1="80" x2="210" y2="118" stroke="#1C1C1A" strokeWidth="1" strokeOpacity="0.45" />
          </g>

          {/* Stage 4: Finished Home + Interior Furniture Silhouette */}
          <g style={{ opacity: activeStage >= 3 ? 1 : 0, transition: 'opacity 350ms ease' }}>
            <rect x="172" y="152" width="26" height="52" fill="#1C1C1A" />
            <rect x="115" y="185" width="42" height="16" rx="2" fill="#F4B41A" stroke="#1C1C1A" strokeWidth="1" />
            <circle cx="282" cy="146" r="6" fill="#F4B41A" />
          </g>
        </svg>

        <p className="mt-4 text-xs text-[#1C1C1A]/75 leading-relaxed">
          {STAGES[activeStage]?.phase}
        </p>
      </div>

      <div className="lg:col-span-7 space-y-4">
        {STAGES.map((stage, idx) => {
          const isCurrent = activeStage === idx;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(idx)}
              className={`story-step-card w-full text-left rounded-xl border p-5 transition-all ${
                isCurrent
                  ? 'border-[#D9940A] bg-[#FDE8A5]/80 shadow-xs'
                  : 'border-[#1C1C1A]/12 bg-[#FAF7EE] hover:bg-[#FDE8A5]/40'
              }`}
            >
              <span className="font-mono-num text-xs font-semibold text-[#D9940A]">{stage.phase}</span>
              <h3 className="font-display text-lg font-bold text-[#1C1C1A] mt-1">{stage.title}</h3>
              <p className="text-sm text-[#1C1C1A]/80 mt-1.5 leading-relaxed">{stage.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
