import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Eye, Layers } from 'lucide-react';

interface LivingBlueprintProps {
  compact?: boolean;
  interactiveToggle?: boolean;
}

/**
 * Signature "Living Blueprint": Golden Amber architectural SVG lines draw a residential floor plan,
 * reveal room dimensions and door swing arcs, and optionally morph into an isometric extruded preview.
 */
export const LivingBlueprint: React.FC<LivingBlueprintProps> = ({
  compact = false,
  interactiveToggle = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [mode, setMode] = useState<'2D' | '3D'>('2D');

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!svgRef.current || prefersReduced) return;

    const ctx = gsap.context(() => {
      const paths = svgRef.current?.querySelectorAll<SVGGeometryElement>('.bp-draw');
      paths?.forEach((el) => {
        const len = typeof el.getTotalLength === 'function' ? el.getTotalLength() : 280;
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
      });

      gsap.to('.bp-draw', {
        strokeDashoffset: 0,
        duration: 1.4,
        stagger: 0.09,
        ease: 'power2.out',
      });

      gsap.fromTo(
        '.bp-label',
        { opacity: 0, y: 4 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, delay: 0.65, ease: 'power1.out' }
      );
    }, svgRef);

    return () => ctx.revert();
  }, [mode]);

  return (
    <div
      data-arch-cursor="true"
      className="relative rounded-xl border border-[#1C1C1A]/15 bg-[#FAF7EE] p-4 sm:p-5 shadow-sm overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#D9940A]" />
          <span className="font-mono-num text-xs font-medium text-[#1C1C1A]/75">
            PLAN VARIANT A · 115 m² BUILT-UP · SCALE 1:100
          </span>
        </div>
        {interactiveToggle ? (
          <div className="inline-flex rounded-md border border-[#1C1C1A]/15 bg-[#FDE8A5]/60 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode('2D')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                mode === '2D' ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              2D Blueprint
            </button>
            <button
              type="button"
              onClick={() => setMode('3D')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                mode === '3D' ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              3D Extrusion
            </button>
          </div>
        ) : null}
      </div>

      <div className="arch-grid-fine rounded-lg border border-[#1C1C1A]/10 bg-[#FAF7EE] p-3">
        {mode === '2D' ? (
          <svg
            ref={svgRef}
            viewBox="0 0 520 340"
            className={`w-full ${compact ? 'max-h-60' : 'max-h-80'} mx-auto`}
            role="img"
            aria-label="Architectural 2D residential concept blueprint showing setbacks, living room, master bedroom, kitchen and door swings"
          >
            {/* Plot boundary & setback buffer */}
            <rect
              x="24"
              y="20"
              width="472"
              height="300"
              fill="none"
              stroke="#1C1C1A"
              strokeOpacity="0.25"
              strokeDasharray="6 4"
              strokeWidth="1.2"
            />
            <text x="32" y="36" className="bp-label" fill="#57534A" fontSize="10" fontFamily="JetBrains Mono">
              PLOT BOUNDARY · 15.0m × 17.0m (10.08 PERCHES)
            </text>

            {/* Buildable setback envelope */}
            <rect
              x="58"
              y="50"
              width="404"
              height="242"
              fill="#FDE8A5"
              fillOpacity="0.22"
              stroke="#F4B41A"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              className="bp-draw"
            />

            {/* Exterior structure walls */}
            <rect
              x="76"
              y="66"
              width="368"
              height="210"
              fill="#FAF7EE"
              stroke="#D9940A"
              strokeWidth="4.5"
              className="bp-draw"
            />

            {/* Interior partition walls */}
            <line x1="270" y1="66" x2="270" y2="276" stroke="#D9940A" strokeWidth="2.8" className="bp-draw" />
            <line x1="76" y1="168" x2="444" y2="168" stroke="#D9940A" strokeWidth="2.8" className="bp-draw" />
            <line x1="355" y1="66" x2="355" y2="168" stroke="#D9940A" strokeWidth="2.4" className="bp-draw" />

            {/* Door swing arcs */}
            <path d="M 270 116 A 26 26 0 0 1 244 142" fill="none" stroke="#1C1C1A" strokeWidth="1.2" className="bp-draw" />
            <line x1="270" y1="142" x2="244" y2="142" stroke="#1C1C1A" strokeWidth="1.4" className="bp-draw" />
            <path d="M 164 276 A 30 30 0 0 1 194 246" fill="none" stroke="#1C1C1A" strokeWidth="1.2" className="bp-draw" />
            <line x1="164" y1="276" x2="164" y2="246" stroke="#1C1C1A" strokeWidth="1.4" className="bp-draw" />

            {/* Windows */}
            <line x1="128" y1="66" x2="192" y2="66" stroke="#F4B41A" strokeWidth="6" className="bp-draw" />
            <line x1="444" y1="196" x2="444" y2="246" stroke="#F4B41A" strokeWidth="6" className="bp-draw" />

            {/* Room annotations */}
            <g className="bp-label" fontFamily="Plus Jakarta Sans" fill="#1C1C1A">
              <text x="173" y="114" textAnchor="middle" fontSize="12" fontWeight="700">Master Bedroom</text>
              <text x="173" y="130" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="#57534A">4.2m × 3.8m</text>

              <text x="312" y="114" textAnchor="middle" fontSize="11" fontWeight="700">Bath</text>
              <text x="312" y="129" textAnchor="middle" fontSize="9.5" fontFamily="JetBrains Mono" fill="#57534A">2.0m × 2.6m</text>

              <text x="400" y="114" textAnchor="middle" fontSize="11" fontWeight="700">Bedroom 2</text>
              <text x="400" y="129" textAnchor="middle" fontSize="9.5" fontFamily="JetBrains Mono" fill="#57534A">3.4m × 3.2m</text>

              <text x="173" y="218" textAnchor="middle" fontSize="12" fontWeight="700">Open Living & Dining</text>
              <text x="173" y="234" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="#57534A">6.1m × 4.0m</text>

              <text x="357" y="218" textAnchor="middle" fontSize="12" fontWeight="700">Kitchen & Pantry</text>
              <text x="357" y="234" textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono" fill="#57534A">4.2m × 3.4m</text>
            </g>

            {/* Dimension ruler callout */}
            <line x1="76" y1="302" x2="444" y2="302" stroke="#D9940A" strokeWidth="1" className="bp-draw" />
            <text x="260" y="316" textAnchor="middle" className="bp-label" fontSize="10" fontFamily="JetBrains Mono" fill="#D9940A" fontWeight="600">
              12.6m BUILDABLE SPAN · 2.3m FRONT ROAD SETBACK
            </text>
          </svg>
        ) : (
          <svg
            ref={svgRef}
            viewBox="0 0 520 340"
            className={`w-full ${compact ? 'max-h-60' : 'max-h-80'} mx-auto`}
            role="img"
            aria-label="Isometric extruded 3D house preview derived from 2D concept blueprint"
          >
            {/* Isometric ground slab */}
            <polygon
              points="260,295 82,222 260,152 438,222"
              fill="#FDE8A5"
              stroke="#D9940A"
              strokeWidth="2"
              className="bp-draw"
            />
            {/* Left wall extrusion */}
            <polygon
              points="110,214 110,136 260,196 260,274"
              fill="#FAF7EE"
              stroke="#D9940A"
              strokeWidth="2.5"
              className="bp-draw"
            />
            {/* Right wall extrusion */}
            <polygon
              points="260,274 260,196 410,136 410,214"
              fill="#FDE8A5"
              fillOpacity="0.65"
              stroke="#D9940A"
              strokeWidth="2.5"
              className="bp-draw"
            />
            {/* Gable roof planes */}
            <polygon
              points="96,142 260,62 260,196"
              fill="#D9940A"
              fillOpacity="0.88"
              stroke="#1C1C1A"
              strokeWidth="1.5"
              className="bp-draw"
            />
            <polygon
              points="260,62 424,142 260,196"
              fill="#F4B41A"
              fillOpacity="0.92"
              stroke="#1C1C1A"
              strokeWidth="1.5"
              className="bp-draw"
            />
            {/* Door & windows */}
            <polygon points="168,237 168,192 198,204 198,249" fill="#1C1C1A" fillOpacity="0.82" className="bp-draw" />
            <polygon points="305,212 305,178 358,156 358,190" fill="#FAF7EE" stroke="#1C1C1A" strokeWidth="1.4" className="bp-draw" />
            <text x="260" y="324" textAnchor="middle" className="bp-label" fontSize="10.5" fontFamily="JetBrains Mono" fill="#1C1C1A">
              PROCEDURAL 3D VIEW · WALL EXTRUSION + GABLE ROOF (PAID UNLOCK IN PORTAL)
            </text>
          </svg>
        )}
      </div>
    </div>
  );
};
