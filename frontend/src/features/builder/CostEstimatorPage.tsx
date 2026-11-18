import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import {
  computeCostEstimate,
  DEFAULT_STAGE_SHARES,
  getDefaultSampleRateSet,
  SRI_LANKAN_DISTRICTS,
  validateStageShares,
  type FinishGrade,
  type RateSet,
  type StageShareConfig,
} from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  SampleDataPill,
  Select,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects } from '../../stores/projectContext';

export const CostEstimatorPage: React.FC = () => {
  const { activeProject, updateActiveProject } = useProjects();
  const activePlan = activeProject?.planVersions.find((v) => v.id === activeProject.activePlanVersionId);

  const [rateSet, setRateSet] = useState<RateSet>(getDefaultSampleRateSet());
  const [finishGrade, setFinishGrade] = useState<FinishGrade>('MID_RANGE');
  const [district, setDistrict] = useState<string>(activeProject?.district ?? 'Colombo');
  const [storeysOverride, setStoreysOverride] = useState<1 | 2>(activePlan?.snapshot.storeys ?? 1);
  const [contingencyPct, setContingencyPct] = useState<number>(0.1);
  const [stageShares, setStageShares] = useState<StageShareConfig[]>(DEFAULT_STAGE_SHARES);
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, { coeffK: number; wastePct: number }>>({});
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ rateSet: RateSet }>('/rates/active')
      .then((res) => setRateSet(res.rateSet))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activePlan) setStoreysOverride(activePlan.snapshot.storeys);
    if (activeProject) setDistrict(activeProject.district);
  }, [activePlan, activeProject]);

  const sharesValid = validateStageShares(stageShares);

  const liveEstimate = useMemo(() => {
    const snap = activePlan?.snapshot ?? {
      totalRoomAreaSqm: 100,
      totalWallLengthM: 54,
      slabAreaSqm: 115,
      roofAreaSqm: 140,
      storeys: storeysOverride,
    };
    return computeCostEstimate({
      planSnapshot: { ...snap, storeys: storeysOverride },
      finishGrade,
      district,
      contingencyPct,
      stageSharesOverride: sharesValid ? stageShares : undefined,
      materialOverrides: Object.entries(materialOverrides).map(([materialCode, v]) => ({
        materialCode,
        coeffK: v.coeffK,
        wastePct: v.wastePct,
      })),
      rateSet,
    });
  }, [activePlan, storeysOverride, finishGrade, district, contingencyPct, stageShares, sharesValid, materialOverrides, rateSet]);

  const handleSaveSnapshot = async () => {
    if (!activeProject) return;
    setSaving(true);
    setSavedBanner(null);
    try {
      const res = await apiFetch<{ estimate: typeof activeProject.estimates[number] }>(
        `/projects/${activeProject.id}/estimates`,
        {
          method: 'POST',
          body: JSON.stringify({
            planVersionId: activePlan?.id,
            finishGrade,
            district,
            contingencyPct,
            stageSharesOverride: sharesValid ? stageShares : undefined,
            materialOverrides: Object.entries(materialOverrides).map(([materialCode, v]) => ({
              materialCode,
              coeffK: v.coeffK,
              wastePct: v.wastePct,
            })),
          }),
        }
      );
      updateActiveProject({
        ...activeProject,
        estimates: [res.estimate, ...activeProject.estimates],
      });
      setSavedBanner(`Snapshot saved against Rate Version ${res.estimate.rateVersionLabel}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell
      title="3. Rough Cost Estimator (Method A & Method B)"
      subtitle="Transparent area-based & material-quantity estimates linked to your active concept plan"
      activeStage="ROUGH_COST_ESTIMATE"
    >
      <div className="space-y-6">
        <DisclaimerBanner
          title="Important Rough Estimate Disclaimer"
          body={liveEstimate.disclaimer}
          tone="warning"
        />

        {savedBanner ? <DisclaimerBanner title="Estimate Snapshot Saved" body={savedBanner} /> : null}

        {/* What-If Controls */}
        <SurfaceCard tone="pale" className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-bold text-base">What-If Controls & Plan Inputs</h2>
            <div className="flex items-center gap-2">
              {rateSet.isDemoSample ? <SampleDataPill label={`Demo Sample Rates (${rateSet.versionLabel})`} /> : null}
              <Button size="sm" onClick={handleSaveSnapshot} loading={saving}>
                <Save className="h-3.5 w-3.5" />
                Save Estimate Snapshot
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <FieldLabel htmlFor="est-grade">Finish Grade (F)</FieldLabel>
              <Select
                id="est-grade"
                value={finishGrade}
                onChange={(e) => setFinishGrade(e.target.value as FinishGrade)}
              >
                <option value="STANDARD">Standard (F = 1.00)</option>
                <option value="MID_RANGE">Mid-range (F = 1.20)</option>
                <option value="PREMIUM">Premium (F = 1.45)</option>
              </Select>
            </div>

            <div>
              <FieldLabel htmlFor="est-district">District (L = {liveEstimate.locationFactorL.toFixed(2)})</FieldLabel>
              <Select id="est-district" value={district} onChange={(e) => setDistrict(e.target.value)}>
                {SRI_LANKAN_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel htmlFor="est-storeys">Storeys (S)</FieldLabel>
              <Select
                id="est-storeys"
                value={storeysOverride}
                onChange={(e) => setStoreysOverride(Number(e.target.value) as 1 | 2)}
              >
                <option value={1}>Single Storey (S = 1.00)</option>
                <option value={2}>Two Storey (S = 1.10)</option>
              </Select>
            </div>

            <div>
              <div className="flex justify-between">
                <FieldLabel htmlFor="est-cont">Contingency (C)</FieldLabel>
                <span className="font-mono-num text-xs font-bold text-[#D9940A]">
                  {Math.round(contingencyPct * 100)}%
                </span>
              </div>
              <input
                id="est-cont"
                type="range"
                min={0}
                max={0.25}
                step={0.01}
                value={contingencyPct}
                onChange={(e) => setContingencyPct(Number(e.target.value))}
                className="w-full accent-[#D9940A] mt-2"
              />
            </div>
          </div>
        </SurfaceCard>

        {/* Side-by-Side Method A & Method B */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard tone="canvas" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone="amber">Method A · Area-Based Quick Estimate</Badge>
              <span className="font-mono-num text-xs text-[#1C1C1A]/75">
                A = {liveEstimate.totalRoomAreaSqm} × (1 + {liveEstimate.wallAllowanceW}) = {liveEstimate.estimatedBuiltUpAreaSqm} m²
              </span>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-[#1C1C1A]/65">Estimated Construction Total</p>
              <p className="font-mono-num text-3xl font-extrabold text-[#D9940A] mt-1">
                {formatLkr(liveEstimate.methodATotalLkr)}
              </p>
              <p className="font-mono-num text-xs text-[#1C1C1A]/80 mt-1">
                ±10% Range: {formatLkr(liveEstimate.methodALowLkr)} to {formatLkr(liveEstimate.methodAHighLkr)} ·{' '}
                {formatLkr(liveEstimate.methodACostPerSqmLkr)}/m²
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1C1C1A]/10">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">5-Stage Cost Allocation (Editable Shares)</h3>
                <span className={`font-mono-num text-xs font-bold ${sharesValid ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                  Sum: {stageShares.reduce((s, x) => s + x.sharePct, 0)}%
                </span>
              </div>

              {liveEstimate.stageAllocations.map((stage, idx) => (
                <div key={stage.key} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="col-span-6 font-medium">{stage.label}</span>
                  <div className="col-span-2">
                    <Input
                      aria-label={`${stage.label} percentage`}
                      type="number"
                      min={0}
                      max={100}
                      value={stageShares[idx]?.sharePct ?? stage.sharePct}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStageShares((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, sharePct: val } : item))
                        );
                      }}
                      className="py-1 px-2 text-xs font-mono-num"
                    />
                  </div>
                  <span className="col-span-4 text-right font-mono-num font-semibold">
                    {formatLkr(stage.costLkr)}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Badge tone="yellow">Method B · Quantity-Based Material Breakdown</Badge>
              <span className="font-mono-num text-xs text-[#1C1C1A]/75">
                Qty = PlanQty × k × (1 + waste)
              </span>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-[#1C1C1A]/65">Base Raw Materials Total</p>
              <p className="font-mono-num text-3xl font-extrabold text-[#1C1C1A] mt-1">
                {formatLkr(liveEstimate.methodBMaterialTotalLkr)}
              </p>
              <p className="text-xs text-[#1C1C1A]/75 mt-1">
                Materials-only baseline derived from plan wall/slab/roof quantities (excludes labour, finishes overhead & MEP fittings).
              </p>
            </div>

            <div className="overflow-x-auto border-t border-[#1C1C1A]/10 pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#D9940A] text-white">
                    <th className="p-2">Material</th>
                    <th className="p-2">k</th>
                    <th className="p-2">Waste</th>
                    <th className="p-2">Est. Qty</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1A]/10">
                  {liveEstimate.materialLines.map((line) => (
                    <tr key={line.materialCode}>
                      <td className="p-2 font-medium">{line.name}</td>
                      <td className="p-2 w-16">
                        <input
                          type="number"
                          step="0.05"
                          aria-label={`${line.name} coefficient k`}
                          value={materialOverrides[line.materialCode]?.coeffK ?? line.coeffK}
                          onChange={(e) =>
                            setMaterialOverrides((prev) => ({
                              ...prev,
                              [line.materialCode]: {
                                coeffK: Number(e.target.value),
                                wastePct: prev[line.materialCode]?.wastePct ?? line.wastePct,
                              },
                            }))
                          }
                          className="w-14 rounded border border-[#1C1C1A]/20 bg-[#FAF7EE] px-1 py-0.5 font-mono-num"
                        />
                      </td>
                      <td className="p-2 font-mono-num">{Math.round(line.wastePct * 100)}%</td>
                      <td className="p-2 font-mono-num">
                        {line.estimatedQty} {line.unit}
                      </td>
                      <td className="p-2 text-right font-mono-num font-semibold">
                        {formatLkr(line.totalCostLkr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </PortalShell>
  );
};
