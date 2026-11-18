import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, MessageSquareReply, Send } from 'lucide-react';
import type { BoqAuditResult, BoqItemInput, BoqQuoteMode, ConstructionStageKey } from '@hausco/shared';
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
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects } from '../../stores/projectContext';

interface BoqRecord {
  id: string;
  projectId: string;
  quoteMode: BoqQuoteMode;
  versionNumber: number;
  items: BoqItemInput[];
  audit: BoqAuditResult;
  status: string;
}

const DEFAULT_SAMPLE_BOQ_ITEMS: BoqItemInput[] = [
  { id: 'c1', stageKey: 'FOUNDATION', itemCode: 'FND_EXCAVATION', description: 'Foundation excavation & rubble', unit: 'm3', quantity: 120, unitRateLkr: 14500, labourMarkupPct: 18 },
  { id: 'c2', stageKey: 'SUPERSTRUCTURE', itemCode: 'SUP_MASONRY', description: 'Cement blockwork & RCC columns', unit: 'm2', quantity: 260, unitRateLkr: 6800, labourMarkupPct: 20 },
  { id: 'c3', stageKey: 'ROOFING', itemCode: 'ROOF_TRUSS', description: 'Timber/steel roof truss & sheets', unit: 'm2', quantity: 140, unitRateLkr: 7200, labourMarkupPct: 18 },
  // Intentionally omits ROOF_WATERPROOF or lets contractor test custom rates!
  { id: 'c4', stageKey: 'MEP', itemCode: 'MEP_WIRING_PLUMB', description: 'Electrical & plumbing rough-in', unit: 'lot', quantity: 1, unitRateLkr: 4800, labourMarkupPct: 22 },
  { id: 'c5', stageKey: 'FINISHES', itemCode: 'FIN_TILING', description: 'Floor tiling & interior finishes', unit: 'm2', quantity: 115, unitRateLkr: 5800, labourMarkupPct: 20 },
];

export const ContractorDashboardPage: React.FC = () => {
  const { projects, activeProject, selectProject } = useProjects();
  const [boqs, setBoqs] = useState<BoqRecord[]>([]);
  const [quoteMode, setQuoteMode] = useState<BoqQuoteMode>('WITH_MATERIALS');
  const [items, setItems] = useState<BoqItemInput[]>(DEFAULT_SAMPLE_BOQ_ITEMS);
  const [rebuttalText, setRebuttalText] = useState<Record<string, string>>({});
  const [revisedRates, setRevisedRates] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadBoqs = useCallback(async () => {
    if (!activeProject) return;
    const res = await apiFetch<{ boqs: BoqRecord[] }>(`/projects/${activeProject.id}/boqs`);
    setBoqs(res.boqs);
  }, [activeProject]);

  useEffect(() => {
    void loadBoqs();
  }, [loadBoqs]);

  const handleSubmitBoq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await apiFetch<{ boq: BoqRecord }>(`/projects/${activeProject.id}/boqs`, {
        method: 'POST',
        body: JSON.stringify({ quoteMode, items }),
      });
      setMsg(
        `BOQ v${res.boq.versionNumber} submitted. Automated Auditor flagged ${res.boq.audit.flags.length} item(s).`
      );
      await loadBoqs();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRebut = async (boqId: string, flagId: string) => {
    const justification = rebuttalText[flagId]?.trim();
    if (!justification) return;
    const revRate = revisedRates[flagId] ? Number(revisedRates[flagId]) : undefined;
    await apiFetch(`/boqs/${boqId}/rebuttal`, {
      method: 'POST',
      body: JSON.stringify({ flagId, justification, revisedUnitRateLkr: revRate }),
    });
    setMsg('Rebuttal & revised rate saved to audit history.');
    await loadBoqs();
  };

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        stageKey: 'ROOFING' as ConstructionStageKey,
        itemCode: 'ROOF_WATERPROOF',
        description: 'Roof & wet-area waterproofing',
        unit: 'm2',
        quantity: 60,
        unitRateLkr: 2900,
        labourMarkupPct: 15,
      },
    ]);
  };

  return (
    <PortalShell
      title="General Contractor Workspace"
      subtitle="Verified project leads · 5-stage BOQ builder (Turnkey / Labour-only) · Audit rebuttals"
    >
      <div className="space-y-6">
        {msg ? <DisclaimerBanner title="BOQ Update" body={msg} /> : null}

        {/* Lead Inbox & Project Overview */}
        <SurfaceCard tone="pale" className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base">Incoming Project Leads ({projects.length})</h2>
            <Select
              aria-label="Select project lead"
              value={activeProject?.id ?? ''}
              onChange={(e) => selectProject(e.target.value)}
              className="w-auto min-w-[260px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.district})
                </option>
              ))}
            </Select>
          </div>

          {activeProject ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10">
                <span className="text-[#1C1C1A]/65">Plot Area</span>
                <p className="font-mono-num font-bold mt-0.5">{activeProject.plot.areaPerches} perches ({activeProject.plot.areaSqm} m²)</p>
              </div>
              <div className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10">
                <span className="text-[#1C1C1A]/65">Survey / Docs</span>
                <p className="font-semibold mt-0.5">{activeProject.documents[0]?.fileName ?? 'Pending survey PDF'}</p>
              </div>
              <div className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10">
                <span className="text-[#1C1C1A]/65">Rough Cost Benchmark</span>
                <p className="font-mono-num font-bold text-[#D9940A] mt-0.5">
                  {formatLkr(activeProject.estimates[0]?.methodATotalLkr)}
                </p>
              </div>
              <div className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10">
                <span className="text-[#1C1C1A]/65">Confirmed Plan Rooms</span>
                <p className="font-mono-num font-bold mt-0.5">
                  {activeProject.planVersions[0]?.snapshot.totalRoomAreaSqm ?? 0} m²
                </p>
              </div>
            </div>
          ) : null}
        </SurfaceCard>

        {/* 5-Stage BOQ Builder */}
        <SurfaceCard tone="canvas" className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#D9940A]" />
              5-Stage BOQ Quotation Builder
            </h2>
            <div className="flex items-center gap-2">
              <Select
                aria-label="BOQ Quote Mode"
                value={quoteMode}
                onChange={(e) => setQuoteMode(e.target.value as BoqQuoteMode)}
                className="w-56 text-xs"
              >
                <option value="WITH_MATERIALS">With Materials (Turnkey)</option>
                <option value="WITHOUT_MATERIALS">Without Materials (Labour Only)</option>
              </Select>
              <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                + Add Waterproofing Item
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmitBoq} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#D9940A] text-white">
                    <th className="p-2">Stage</th>
                    <th className="p-2">Code & Description</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit Rate (LKR)</th>
                    <th className="p-2">Markup %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1A]/10">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-2 font-semibold">{item.stageKey}</td>
                      <td className="p-2">
                        <span className="font-mono-num text-[11px] text-[#D9940A]">{item.itemCode}</span> · {item.description}
                      </td>
                      <td className="p-2 w-24">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity: Number(e.target.value) } : it)))
                          }
                          className="py-1 text-xs font-mono-num"
                        />
                      </td>
                      <td className="p-2 w-32">
                        <Input
                          type="number"
                          value={item.unitRateLkr}
                          onChange={(e) =>
                            setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, unitRateLkr: Number(e.target.value) } : it)))
                          }
                          className="py-1 text-xs font-mono-num"
                        />
                      </td>
                      <td className="p-2 w-24">
                        <Input
                          type="number"
                          value={item.labourMarkupPct}
                          onChange={(e) =>
                            setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, labourMarkupPct: Number(e.target.value) } : it)))
                          }
                          className="py-1 text-xs font-mono-num"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="submit" loading={submitting}>
              <Send className="h-4 w-4" /> Submit BOQ & Run Audit
            </Button>
          </form>
        </SurfaceCard>

        {/* Audit Findings & Contractor Rebuttal Panel */}
        {boqs.map((boq) => (
          <SurfaceCard key={boq.id} tone="pale" className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-base">
                Submitted BOQ v{boq.versionNumber} · {boq.quoteMode.replace('_', ' ')}
              </h3>
              <Badge tone={boq.audit.flags.length > 0 ? 'warning' : 'ok'}>
                {formatLkr(boq.audit.quoteTotalLkr)} · {boq.status}
              </Badge>
            </div>

            {boq.audit.flags.map((flag) => (
              <div key={flag.id} className="rounded bg-[#FAF7EE] border border-[#B45309]/35 p-3 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#B91C1C]">{flag.flagType} · {flag.itemCode}</span>
                  <Badge tone={flag.severity === 'CRITICAL' ? 'critical' : 'warning'}>{flag.severity}</Badge>
                </div>
                <p>{flag.explanation}</p>
                {flag.contractorRebuttal ? (
                  <p className="font-semibold text-[#15803D]">Submitted Reply: {flag.contractorRebuttal}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    <div className="sm:col-span-7">
                      <FieldLabel htmlFor={`reb-${flag.id}`}>Official Justification</FieldLabel>
                      <Input
                        id={`reb-${flag.id}`}
                        value={rebuttalText[flag.id] ?? ''}
                        onChange={(e) => setRebuttalText((prev) => ({ ...prev, [flag.id]: e.target.value }))}
                        placeholder="Explain site conditions or specification..."
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <FieldLabel htmlFor={`rev-${flag.id}`}>Revised Rate (Optional)</FieldLabel>
                      <Input
                        id={`rev-${flag.id}`}
                        type="number"
                        value={revisedRates[flag.id] ?? ''}
                        onChange={(e) => setRevisedRates((prev) => ({ ...prev, [flag.id]: e.target.value }))}
                        placeholder="LKR"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <Button size="sm" className="w-full" onClick={() => void handleRebut(boq.id, flag.id)}>
                        <MessageSquareReply className="h-3.5 w-3.5" /> Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </SurfaceCard>
        ))}
      </div>
    </PortalShell>
  );
};
