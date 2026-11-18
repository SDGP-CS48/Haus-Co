import React, { Suspense, lazy, useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Eye, Layers, Lock, Send, Sparkles } from 'lucide-react';
import type { PlanGeometrySnapshot, PlanVersion, RoofType } from '@hausco/shared';
const ThreeDModelViewer = lazy(() =>
  import('../../components/ThreeDModelViewer').then((m) => ({ default: m.ThreeDModelViewer }))
);
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  LockedFeatureBanner,
  Select,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { ApiError, apiFetch, formatLkr } from '../../services/api';
import { useAuth } from '../../stores/authContext';
import { useProjects, type ProjectRecord } from '../../stores/projectContext';

export const HousePlannerPage: React.FC = () => {
  const { activeProject, updateActiveProject } = useProjects();
  const { refreshMe } = useAuth();

  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [storeys, setStoreys] = useState<1 | 2>(1);
  const [roofType, setRoofType] = useState<RoofType>('GABLE');
  const [generating, setGenerating] = useState(false);

  const [viewTab, setViewTab] = useState<'2D' | '3D'>('2D');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text: 'Describe an edit (e.g., "Switch to 2 storeys", "Add bedroom", "Expand living room by 0.8m", or "Switch to Variant B"). I execute validated server tools and check setback bounds automatically.',
    },
  ]);
  const [aiBusy, setAiBusy] = useState(false);

  const [unlocked3DGeometry, setUnlocked3DGeometry] = useState<PlanGeometrySnapshot | null>(null);
  const [unlockFeeLkr, setUnlockFeeLkr] = useState<number>(2500);
  const [unlocking3D, setUnlocking3D] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlan = activeProject?.planVersions.find((v) => v.id === activeProject.activePlanVersionId);

  // Check server-side 3D entitlement whenever active plan or project changes
  useEffect(() => {
    if (!activeProject || !activePlan) return;
    apiFetch<{ unlocked: boolean; geometry: PlanGeometrySnapshot }>(
      `/projects/${activeProject.id}/plans/${activePlan.id}/3d-model`
    )
      .then((res) => setUnlocked3DGeometry(res.geometry))
      .catch((err) => {
        setUnlocked3DGeometry(null);
        if (err instanceof ApiError && err.status === 402) {
          const pricing = err.payload.pricing as { amountLkr?: number } | undefined;
          if (pricing?.amountLkr) setUnlockFeeLkr(pricing.amountLkr);
        }
      });
  }, [activeProject, activePlan]);

  const handleGenerateVariants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await apiFetch<{
        variants: PlanVersion[];
        activePlanVersionId: string;
        refreshedEstimate: ProjectRecord['estimates'][number];
      }>(`/projects/${activeProject.id}/plans/generate`, {
        method: 'POST',
        body: JSON.stringify({ bedrooms, bathrooms, storeys, roofType, includeStudy: true, includeVerandah: true }),
      });
      updateActiveProject({
        ...activeProject,
        planVersions: [...activeProject.planVersions, ...res.variants],
        activePlanVersionId: res.activePlanVersionId,
        estimates: [res.refreshedEstimate, ...activeProject.estimates],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate plans.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAiEdit = async (promptText: string) => {
    if (!activeProject || !promptText.trim()) return;
    setAiMessages((prev) => [...prev, { role: 'user', text: promptText }]);
    setAiPrompt('');
    setAiBusy(true);
    try {
      const res = await apiFetch<{
        toolUsed: string;
        planVersion: PlanVersion;
        refreshedEstimate: ProjectRecord['estimates'][number];
      }>(`/projects/${activeProject.id}/plans/ai-edit`, {
        method: 'POST',
        body: JSON.stringify({ prompt: promptText }),
      });
      updateActiveProject({
        ...activeProject,
        planVersions: [...activeProject.planVersions, res.planVersion],
        activePlanVersionId: res.planVersion.id,
        estimates: [res.refreshedEstimate, ...activeProject.estimates],
      });
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Executed tool '${res.toolUsed}' -> ${res.planVersion.editSummary} Cost estimate refreshed (${formatLkr(res.refreshedEstimate.methodATotalLkr)}).`,
        },
      ]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Rejected by geometry validator: ${err instanceof Error ? err.message : 'Invalid edit.'}`,
        },
      ]);
    } finally {
      setAiBusy(false);
    }
  };

  const handleConfirmPlan = async () => {
    if (!activeProject || !activePlan) return;
    const res = await apiFetch<{ confirmedPlanVersion: PlanVersion }>(
      `/projects/${activeProject.id}/plans/${activePlan.id}/confirm`,
      { method: 'POST' }
    );
    updateActiveProject({
      ...activeProject,
      planVersions: activeProject.planVersions.map((v) => ({
        ...v,
        isConfirmed: v.id === res.confirmedPlanVersion.id,
      })),
    });
  };

  const handleUnlock3D = async () => {
    if (!activeProject || !activePlan) return;
    setUnlocking3D(true);
    setError(null);
    try {
      const checkout = await apiFetch<{ payment: { externalOrderId: string } }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({ entitlementType: 'MODEL_3D_UNLOCK', resourceId: activeProject.id }),
      });
      await apiFetch('/payments/payhere/notify', {
        method: 'POST',
        body: JSON.stringify({ orderId: checkout.payment.externalOrderId, statusCode: '2' }),
      });
      await refreshMe();
      const modelRes = await apiFetch<{ unlocked: boolean; geometry: PlanGeometrySnapshot }>(
        `/projects/${activeProject.id}/plans/${activePlan.id}/3d-model`
      );
      setUnlocked3DGeometry(modelRes.geometry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete 3D unlock.');
    } finally {
      setUnlocking3D(false);
    }
  };

  const selectVersion = (versionId: string) => {
    if (!activeProject) return;
    updateActiveProject({ ...activeProject, activePlanVersionId: versionId });
  };

  const snap = activePlan?.snapshot;
  const scale = 24;
  const pad = 28;

  return (
    <PortalShell
      title="2. AI Plan Generator & Interactive Editing Suite"
      subtitle="Deterministic Variant A / B layouts · Server-validated AI edits · Paid Three.js 3D view"
      activeStage="GENERATE_2D_PLAN"
    >
      <div className="space-y-6">
        {error ? <DisclaimerBanner title="Planner Notice" body={error} tone="warning" /> : null}

        {/* Layout Requirements Form */}
        <SurfaceCard tone="pale" className="p-4">
          <form onSubmit={handleGenerateVariants} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
            <div>
              <FieldLabel htmlFor="pl-beds">Bedrooms</FieldLabel>
              <Input id="pl-beds" type="number" min={1} max={6} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} />
            </div>
            <div>
              <FieldLabel htmlFor="pl-baths">Bathrooms</FieldLabel>
              <Input id="pl-baths" type="number" min={1} max={4} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} />
            </div>
            <div>
              <FieldLabel htmlFor="pl-storeys">Storeys</FieldLabel>
              <Select id="pl-storeys" value={storeys} onChange={(e) => setStoreys(Number(e.target.value) as 1 | 2)}>
                <option value={1}>1 Storey</option>
                <option value={2}>2 Storeys</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="pl-roof">Roof Style</FieldLabel>
              <Select id="pl-roof" value={roofType} onChange={(e) => setRoofType(e.target.value as RoofType)}>
                <option value="GABLE">Gable Roof</option>
                <option value="HIP">Hip Roof</option>
                <option value="FLAT_SLAB">Flat Slab</option>
                <option value="MONO_PITCH">Mono-Pitch</option>
              </Select>
            </div>
            <Button type="submit" loading={generating} className="col-span-2 sm:col-span-1">
              <Sparkles className="h-4 w-4" />
              Generate A & B
            </Button>
          </form>
        </SurfaceCard>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 2D SVG Blueprint & Paid 3D Canvas */}
          <SurfaceCard tone="canvas" className="lg:col-span-8 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {activeProject?.planVersions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVersion(v.id)}
                    className={`rounded px-2.5 py-1 text-xs font-semibold border transition-colors ${
                      v.id === activePlan?.id
                        ? 'bg-[#F4B41A] text-[#1C1C1A] border-[#D9940A]'
                        : 'bg-[#FAF7EE] text-[#1C1C1A]/75 border-[#1C1C1A]/15'
                    }`}
                  >
                    v{v.versionNumber} · {v.snapshot.variantCode === 'VARIANT_A_COMPACT' ? 'Compact' : v.snapshot.variantCode === 'VARIANT_B_SPACIOUS' ? 'Spacious' : 'Uploaded'}
                    {v.isConfirmed ? ' ✓' : ''}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded border border-[#1C1C1A]/15 bg-[#FDE8A5]/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewTab('2D')}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium ${
                      viewTab === '2D' ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" /> 2D SVG
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('3D')}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium ${
                      viewTab === '3D' ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
                    }`}
                  >
                    {unlocked3DGeometry ? <Eye className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    3D Model
                  </button>
                </div>

                {activePlan && !activePlan.isConfirmed ? (
                  <Button size="sm" variant="secondary" onClick={handleConfirmPlan}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm Plan
                  </Button>
                ) : activePlan?.isConfirmed ? (
                  <Badge tone="ok">Confirmed Baseline</Badge>
                ) : null}
              </div>
            </div>

            {viewTab === '2D' && snap ? (
              <div className="rounded-lg border border-[#1C1C1A]/15 bg-[#FAF7EE] arch-grid-fine p-3 overflow-x-auto" data-arch-cursor="true">
                <svg
                  viewBox={`0 0 ${snap.footprintWidthM * scale + pad * 2} ${snap.footprintDepthM * scale + pad * 2}`}
                  className="w-full max-h-[420px] mx-auto"
                  role="img"
                  aria-label="2D architectural blueprint with rooms, wall thicknesses, doors and windows"
                >
                  {/* Rooms */}
                  {snap.rooms.map((room) => (
                    <g key={room.id}>
                      <rect
                        x={pad + room.x * scale}
                        y={pad + room.y * scale}
                        width={room.width * scale}
                        height={room.depth * scale}
                        fill={room.category === 'BATHROOM' ? '#E2E8F0' : '#FDE8A5'}
                        fillOpacity="0.32"
                        stroke="none"
                      />
                      <text
                        x={pad + (room.x + room.width / 2) * scale}
                        y={pad + (room.y + room.depth / 2) * scale - 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill="#1C1C1A"
                      >
                        {room.name}
                      </text>
                      <text
                        x={pad + (room.x + room.width / 2) * scale}
                        y={pad + (room.y + room.depth / 2) * scale + 10}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="JetBrains Mono"
                        fill="#57534A"
                      >
                        {room.width}m × {room.depth}m ({room.areaSqm}m²)
                      </text>
                    </g>
                  ))}

                  {/* Walls with explicit thickness */}
                  {snap.walls.map((w) => (
                    <line
                      key={w.id}
                      x1={pad + w.x1 * scale}
                      y1={pad + w.y1 * scale}
                      x2={pad + w.x2 * scale}
                      y2={pad + w.y2 * scale}
                      stroke="#D9940A"
                      strokeWidth={Math.max(2.5, w.thicknessM * scale)}
                      strokeLinecap="square"
                    />
                  ))}

                  {/* Openings: Windows & Door Swings */}
                  {snap.openings.map((op) => {
                    if (op.kind === 'WINDOW') {
                      const isHoriz = op.wallSide === 'NORTH' || op.wallSide === 'SOUTH';
                      return (
                        <line
                          key={op.id}
                          x1={pad + op.x * scale}
                          y1={pad + op.y * scale}
                          x2={pad + (op.x + (isHoriz ? op.widthM : 0)) * scale}
                          y2={pad + (op.y + (isHoriz ? 0 : op.widthM)) * scale}
                          stroke="#F4B41A"
                          strokeWidth="6"
                        />
                      );
                    }
                    const r = (op.swingRadiusM ?? op.widthM) * scale;
                    const ox = pad + op.x * scale;
                    const oy = pad + op.y * scale;
                    return (
                      <g key={op.id}>
                        <circle cx={ox} cy={oy} r="2.5" fill="#1C1C1A" />
                        <path
                          d={
                            op.wallSide === 'SOUTH'
                              ? `M ${ox} ${oy} L ${ox} ${oy - r} A ${r} ${r} 0 0 1 ${ox + r} ${oy}`
                              : `M ${ox} ${oy} L ${ox + r} ${oy} A ${r} ${r} 0 0 1 ${ox} ${oy + r}`
                          }
                          fill="none"
                          stroke="#1C1C1A"
                          strokeOpacity="0.65"
                          strokeDasharray="3 2"
                          strokeWidth="1.2"
                        />
                      </g>
                    );
                  })}
                </svg>
                <div className="flex flex-wrap justify-between gap-2 text-xs font-mono-num text-[#1C1C1A]/75 pt-2 border-t border-[#1C1C1A]/10">
                  <span>Footprint: {snap.footprintWidthM}m × {snap.footprintDepthM}m</span>
                  <span>Room Sum (A_rooms): {snap.totalRoomAreaSqm} m²</span>
                  <span>Wall Run: {snap.totalWallLengthM} m · Roof: {snap.roofType}</span>
                </div>
              </div>
            ) : viewTab === '3D' ? (
              unlocked3DGeometry ? (
                <div className="space-y-2">
                  <Suspense
                    fallback={
                      <div className="h-[380px] flex items-center justify-center rounded-lg border border-[#1C1C1A]/15 bg-[#FAF7EE] text-xs font-medium text-[#1C1C1A]/75">
                        Loading 3D Architectural Engine...
                      </div>
                    }
                  >
                    <ThreeDModelViewer geometry={unlocked3DGeometry} />
                  </Suspense>
                  <p className="text-xs text-[#1C1C1A]/70">
                    Drag to orbit · Scroll to zoom · Right-drag to pan. Generated from confirmed server geometry.
                  </p>
                </div>
              ) : (
                <LockedFeatureBanner
                  title="3D Procedural Model View is Locked"
                  description="Confirm your 2D concept plan and unlock interactive Three.js 3D wall extrusions, floor slabs, roof geometry, and orbit controls for this project."
                  priceLabel={formatLkr(unlockFeeLkr)}
                  onUnlock={handleUnlock3D}
                  unlocking={unlocking3D}
                />
              )
            ) : null}
          </SurfaceCard>

          {/* Controlled AI Plan Editing Assistant */}
          <SurfaceCard tone="pale" className="lg:col-span-4 p-5 flex flex-col h-[520px]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1C1C1A]/12">
              <Cpu className="h-4 w-4 text-[#D9940A]" />
              <h2 className="font-display font-bold text-sm">AI Plan Assistant (Server-Validated)</h2>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#D9940A] text-white ml-6'
                      : 'bg-[#FAF7EE] text-[#1C1C1A] border border-[#1C1C1A]/10 mr-4'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-2 border-t border-[#1C1C1A]/12">
              <div className="flex flex-wrap gap-1.5">
                {['Expand living room by 0.6m', 'Add bedroom', 'Switch to Variant B', 'Switch to 2 storeys'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={aiBusy}
                    onClick={() => void handleAiEdit(chip)}
                    className="rounded bg-[#FAF7EE] border border-[#1C1C1A]/15 px-2 py-1 text-[11px] font-medium hover:bg-[#F4B41A] transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAiEdit(aiPrompt);
                }}
                className="flex gap-2"
              >
                <Input
                  aria-label="Ask AI plan assistant to modify layout"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Expand master bedroom by 0.5m"
                />
                <Button type="submit" size="sm" loading={aiBusy}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </PortalShell>
  );
};
