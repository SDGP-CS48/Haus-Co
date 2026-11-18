import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Save, Trash2 } from 'lucide-react';
import { evaluatePlotMetrics, type Point2D, type SetbackRuleSet } from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  Select,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch } from '../../services/api';
import { useProjects, type ProjectRecord } from '../../stores/projectContext';

const PX_PER_METRE = 18;
const CANVAS_PAD = 36;

export const PlotDrawerPage: React.FC = () => {
  const { activeProject, setbackRules, updateActiveProject } = useProjects();
  const navigate = useNavigate();

  const [vertices, setVertices] = useState<Point2D[]>(
    activeProject?.plot.vertices ?? [
      { x: 0, y: 0 },
      { x: 15, y: 0 },
      { x: 15, y: 17 },
      { x: 0, y: 17 },
    ]
  );
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    activeProject?.setbackRuleId ?? setbackRules[0]?.id ?? ''
  );
  const [customFront, setCustomFront] = useState<number>(2.3);
  const [customRear, setCustomRear] = useState<number>(1.5);
  const [customLeft, setCustomLeft] = useState<number>(1.2);
  const [customRight, setCustomRight] = useState<number>(1.2);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!activeProject) return;
    setVertices(activeProject.plot.vertices);
    setSelectedRuleId(activeProject.setbackRuleId);
    const rule = setbackRules.find((r) => r.id === activeProject.setbackRuleId);
    if (rule) {
      setCustomFront(rule.frontSetbackM);
      setCustomRear(rule.rearSetbackM);
      setCustomLeft(rule.leftSetbackM);
      setCustomRight(rule.rightSetbackM);
    }
  }, [activeProject, setbackRules]);

  const activeRule: SetbackRuleSet | undefined = setbackRules.find((r) => r.id === selectedRuleId);

  const liveMetrics = useMemo(
    () =>
      evaluatePlotMetrics(vertices, {
        frontSetbackM: customFront,
        rearSetbackM: customRear,
        leftSetbackM: customLeft,
        rightSetbackM: customRight,
      }),
    [vertices, customFront, customRear, customLeft, customRight]
  );

  const handleRuleChange = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    const rule = setbackRules.find((r) => r.id === ruleId);
    if (rule) {
      setCustomFront(rule.frontSetbackM);
      setCustomRear(rule.rearSetbackM);
      setCustomLeft(rule.leftSetbackM);
      setCustomRight(rule.rightSetbackM);
    }
  };

  const applyPreset = (kind: 'RECT_10P' | 'IRREGULAR_L' | 'TAPERED') => {
    if (kind === 'RECT_10P') {
      setVertices([
        { x: 0, y: 0 },
        { x: 15, y: 0 },
        { x: 15, y: 17 },
        { x: 0, y: 17 },
      ]);
    } else if (kind === 'IRREGULAR_L') {
      setVertices([
        { x: 0, y: 0 },
        { x: 18, y: 0 },
        { x: 18, y: 10 },
        { x: 12, y: 10 },
        { x: 12, y: 18 },
        { x: 0, y: 18 },
      ]);
    } else {
      setVertices([
        { x: 1, y: 0 },
        { x: 16, y: 1 },
        { x: 14, y: 18 },
        { x: 0, y: 16 },
      ]);
    }
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragIdx === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPx = ((e.clientX - rect.left) / rect.width) * 460;
    const yPx = ((e.clientY - rect.top) / rect.height) * 400;
    const xm = Math.max(0, Math.min(22, Math.round(((xPx - CANVAS_PAD) / PX_PER_METRE) * 2) / 2));
    const ym = Math.max(0, Math.min(20, Math.round(((yPx - CANVAS_PAD) / PX_PER_METRE) * 2) / 2));
    setVertices((prev) => prev.map((v, idx) => (idx === dragIdx ? { x: xm, y: ym } : v)));
  };

  const addVertex = () => {
    const last = vertices[vertices.length - 1] ?? { x: 0, y: 0 };
    const first = vertices[0] ?? { x: 10, y: 0 };
    setVertices((prev) => [
      ...prev,
      {
        x: Math.round(((last.x + first.x) / 2) * 2) / 2,
        y: Math.round(((last.y + first.y) / 2) * 2) / 2,
      },
    ]);
  };

  const removeVertex = (idx: number) => {
    if (vertices.length <= 3) return;
    setVertices((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSavePlot = async () => {
    if (!activeProject) return;
    setError(null);
    setSaveMsg(null);
    setSaving(true);
    try {
      const res = await apiFetch<{ plot: ProjectRecord['plot'] }>(`/projects/${activeProject.id}/plot`, {
        method: 'PUT',
        body: JSON.stringify({
          vertices,
          setbackRuleId: selectedRuleId,
          customSetbacks: {
            frontSetbackM: customFront,
            rearSetbackM: customRear,
            leftSetbackM: customLeft,
            rightSetbackM: customRight,
          },
        }),
      });
      updateActiveProject({
        ...activeProject,
        plot: res.plot,
        setbackRuleId: selectedRuleId,
      });
      setSaveMsg('Plot boundaries and buildable setback zone saved to project.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save plot.');
    } finally {
      setSaving(false);
    }
  };

  const toSvg = (p: Point2D) => `${CANVAS_PAD + p.x * PX_PER_METRE},${CANVAS_PAD + p.y * PX_PER_METRE}`;

  return (
    <PortalShell
      title="1. Interactive Land & Plot Drawer"
      subtitle="Drag vertices or enter exact coordinates in metres · 1 perch = 25.29 m²"
      activeStage="DRAW_PLOT"
    >
      <div className="space-y-6">
        {activeRule && !activeRule.isConfirmed ? (
          <DisclaimerBanner
            title={`Setback Rule Warning — ${activeRule.authorityName} (${activeRule.versionLabel})`}
            body={activeRule.ruleSourceNote}
            tone="warning"
          />
        ) : null}

        {error ? <DisclaimerBanner title="Geometry Validation Error" body={error} tone="warning" /> : null}
        {saveMsg ? <DisclaimerBanner title="Saved" body={saveMsg} /> : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Polygon Grid */}
          <SurfaceCard tone="canvas" className="lg:col-span-7 p-4 space-y-3" data-arch-cursor="true">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => applyPreset('RECT_10P')}>
                  10 Perch Rect
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyPreset('IRREGULAR_L')}>
                  Irregular L-Plot
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyPreset('TAPERED')}>
                  Tapered Plot
                </Button>
              </div>
              <Button size="sm" variant="secondary" onClick={addVertex}>
                <Plus className="h-3.5 w-3.5" /> Add Vertex
              </Button>
            </div>

            <div className="rounded-lg border border-[#1C1C1A]/15 bg-[#FAF7EE] arch-grid-fine overflow-hidden">
              <svg
                ref={svgRef}
                viewBox="0 0 460 400"
                className="w-full h-auto touch-none select-none"
                onPointerMove={handleSvgPointerMove}
                onPointerUp={() => setDragIdx(null)}
                onPointerLeave={() => setDragIdx(null)}
                role="img"
                aria-label="Interactive land plot polygon canvas"
              >
                {/* Plot polygon */}
                {vertices.length >= 3 ? (
                  <polygon
                    points={vertices.map(toSvg).join(' ')}
                    fill="#FDE8A5"
                    fillOpacity="0.35"
                    stroke="#1C1C1A"
                    strokeWidth="2"
                  />
                ) : null}

                {/* Buildable Zone after Setbacks */}
                {liveMetrics.buildablePolygon.length >= 3 ? (
                  <polygon
                    points={liveMetrics.buildablePolygon.map(toSvg).join(' ')}
                    fill="#F4B41A"
                    fillOpacity="0.35"
                    stroke="#D9940A"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                ) : null}

                {/* Edge length labels */}
                {vertices.map((a, idx) => {
                  const b = vertices[(idx + 1) % vertices.length]!;
                  const len = Math.hypot(b.x - a.x, b.y - a.y).toFixed(1);
                  const mx = CANVAS_PAD + ((a.x + b.x) / 2) * PX_PER_METRE;
                  const my = CANVAS_PAD + ((a.y + b.y) / 2) * PX_PER_METRE;
                  return (
                    <text
                      key={`len-${idx}`}
                      x={mx}
                      y={my - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      fill="#1C1C1A"
                      fontWeight="600"
                    >
                      {len}m
                    </text>
                  );
                })}

                {/* Draggable Vertices */}
                {vertices.map((v, idx) => (
                  <g
                    key={`v-${idx}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setDragIdx(idx);
                    }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <circle
                      cx={CANVAS_PAD + v.x * PX_PER_METRE}
                      cy={CANVAS_PAD + v.y * PX_PER_METRE}
                      r="8"
                      fill="#D9940A"
                      stroke="#FAF7EE"
                      strokeWidth="2"
                    />
                    <text
                      x={CANVAS_PAD + v.x * PX_PER_METRE}
                      y={CANVAS_PAD + v.y * PX_PER_METRE + 3.5}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#FFFFFF"
                      fontWeight="700"
                    >
                      {idx + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#1C1C1A]/75">
              <span>Drag numbered amber points (0.5m snap) or edit exact coordinates on the right.</span>
              <Badge tone={liveMetrics.isValid ? 'ok' : 'critical'}>
                {liveMetrics.isValid ? 'Valid Buildable Plot' : 'Invalid Plot'}
              </Badge>
            </div>
          </SurfaceCard>

          {/* Metrics, Municipal Setbacks & Keyboard Coordinate Editor */}
          <div className="lg:col-span-5 space-y-4">
            <SurfaceCard tone="pale" className="p-5 space-y-3">
              <h2 className="font-display font-bold text-base">Real-Time Land & Buildable Metrics</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10">
                  <span className="text-[11px] uppercase text-[#1C1C1A]/65">Total Land Area</span>
                  <p className="font-mono-num font-bold text-[#D9940A] text-lg">{liveMetrics.areaPerches} perches</p>
                  <p className="font-mono-num text-xs text-[#1C1C1A]/75">{liveMetrics.areaSqm} m²</p>
                </div>
                <div className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10">
                  <span className="text-[11px] uppercase text-[#1C1C1A]/65">Buildable Zone</span>
                  <p className="font-mono-num font-bold text-[#1C1C1A] text-lg">{liveMetrics.buildableAreaPerches} perches</p>
                  <p className="font-mono-num text-xs text-[#1C1C1A]/75">{liveMetrics.buildableAreaSqm} m²</p>
                </div>
              </div>
              <p className="font-mono-num text-xs text-[#1C1C1A]/80">
                Boundary Perimeter: <strong>{liveMetrics.perimeterM} m</strong>
              </p>
              {!liveMetrics.isValid ? (
                <p className="text-xs font-semibold text-[#B91C1C]">
                  {liveMetrics.validationErrors.join(' ')}
                </p>
              ) : null}
            </SurfaceCard>

            <SurfaceCard tone="canvas" className="p-5 space-y-3">
              <FieldLabel htmlFor="setback-rule-select">Authority Setback Rule</FieldLabel>
              <Select
                id="setback-rule-select"
                value={selectedRuleId}
                onChange={(e) => handleRuleChange(e.target.value)}
              >
                {setbackRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.authorityName} ({r.versionLabel})
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <FieldLabel htmlFor="sb-front">Front (m)</FieldLabel>
                  <Input id="sb-front" type="number" step="0.1" min={0} max={10} value={customFront} onChange={(e) => setCustomFront(Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel htmlFor="sb-rear">Rear (m)</FieldLabel>
                  <Input id="sb-rear" type="number" step="0.1" min={0} max={10} value={customRear} onChange={(e) => setCustomRear(Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel htmlFor="sb-left">Left (m)</FieldLabel>
                  <Input id="sb-left" type="number" step="0.1" min={0} max={10} value={customLeft} onChange={(e) => setCustomLeft(Number(e.target.value))} />
                </div>
                <div>
                  <FieldLabel htmlFor="sb-right">Right (m)</FieldLabel>
                  <Input id="sb-right" type="number" step="0.1" min={0} max={10} value={customRight} onChange={(e) => setCustomRight(Number(e.target.value))} />
                </div>
              </div>
            </SurfaceCard>

            {/* Keyboard-accessible Manual Coordinate Table */}
            <SurfaceCard tone="canvas" className="p-5 space-y-3">
              <h3 className="font-display font-bold text-sm">Manual Vertex Coordinates (Keyboard Alternative)</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {vertices.map((v, idx) => (
                  <div key={`coord-${idx}`} className="flex items-center gap-2">
                    <span className="font-mono-num text-xs font-bold w-6">#{idx + 1}</span>
                    <Input
                      aria-label={`Vertex ${idx + 1} X in metres`}
                      type="number"
                      step="0.5"
                      value={v.x}
                      onChange={(e) =>
                        setVertices((prev) =>
                          prev.map((pt, i) => (i === idx ? { ...pt, x: Number(e.target.value) } : pt))
                        )
                      }
                    />
                    <Input
                      aria-label={`Vertex ${idx + 1} Y in metres`}
                      type="number"
                      step="0.5"
                      value={v.y}
                      onChange={(e) =>
                        setVertices((prev) =>
                          prev.map((pt, i) => (i === idx ? { ...pt, y: Number(e.target.value) } : pt))
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={vertices.length <= 3}
                      aria-label={`Remove vertex ${idx + 1}`}
                      onClick={() => removeVertex(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSavePlot} loading={saving} disabled={!liveMetrics.isValid} className="flex-1">
                  <Save className="h-4 w-4" />
                  Save Plot Geometry
                </Button>
                <Button variant="secondary" onClick={() => navigate('/builder/planner')}>
                  Next: 2D Plan <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </PortalShell>
  );
};
