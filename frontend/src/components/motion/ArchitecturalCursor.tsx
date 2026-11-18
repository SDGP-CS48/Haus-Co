import React, { useEffect, useState } from 'react';

/**
 * Subtle architecture-aware crosshair cursor active ONLY inside `[data-arch-cursor="true"]` zones.
 * Preserves standard pointer/text cursors everywhere else and disables on touch/reduced motion.
 */
export const ArchitecturalCursor: React.FC = () => {
  const [pos, setPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (prefersReduced || isCoarse) return;

    const handleMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const inZone = Boolean(target?.closest('[data-arch-cursor="true"]'));
      const inInput = Boolean(target?.closest('input, textarea, select, button, a'));
      if (inZone && !inInput) {
        setPos({ x: e.clientX, y: e.clientY, visible: true });
      } else if (pos.visible) {
        setPos((prev) => ({ ...prev, visible: false }));
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [pos.visible]);

  if (!pos.visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="relative h-7 w-7">
        <span className="absolute left-1/2 top-0 h-full w-px bg-[#D9940A]/65" />
        <span className="absolute top-1/2 left-0 w-full h-px bg-[#D9940A]/65" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D9940A] bg-[#FAF7EE]" />
      </div>
    </div>
  );
};
