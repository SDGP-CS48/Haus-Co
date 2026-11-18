import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import type { BoqAuditResult, BoqItemInput, BoqQuoteMode } from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects } from '../../stores/projectContext';

interface BoqRecord {
  id: string;
  projectId: string;
  contractorName: string;
  quoteMode: BoqQuoteMode;
  versionNumber: number;
  items: BoqItemInput[];
  audit: BoqAuditResult;
  status: string;
  createdAt: string;
}

export const BoqAuditorPage: React.FC = () => {
  const { activeProject } = useProjects();
  const [boqs, setBoqs] = useState<BoqRecord[]>([]);
  const [modeFilter, setModeFilter] = useState<'ALL' | BoqQuoteMode>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeProject) return;
    setLoading(true);
    apiFetch<{ boqs: BoqRecord[] }>(`/projects/${activeProject.id}/boqs`)
      .then((res) => setBoqs(res.boqs))
      .catch(() => setBoqs([]))
      .finally(() => setLoading(false));
  }, [activeProject]);

  const roughEst = activeProject?.estimates[0];
  const filtered = boqs.filter((b) => modeFilter === 'ALL' || b.quoteMode === modeFilter);

  return (
    <PortalShell
      title="5. Multi-Stage BOQ Quotation Auditor"
      subtitle="Compare Turnkey vs Labour-Only contractor quotes against your rough estimate & plan baseline"
      activeStage="BOQ_AUDIT"
    >
      <div className="space-y-6">
        <DisclaimerBanner
          title="About Automated BOQ Audit Flags"
          body="Audit flags highlight omitted baseline items, unusually low regional material rates, or high labour markups as review signals—not proof of fraud. Contractors can submit justifications or revised unit rates in their rebuttal panel."
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-md border border-[#1C1C1A]/15 bg-[#FDE8A5]/50 p-1 text-xs">
            {(['ALL', 'WITH_MATERIALS', 'WITHOUT_MATERIALS'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModeFilter(m)}
                className={`rounded px-3 py-1.5 font-semibold ${
                  modeFilter === m ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
                }`}
              >
                {m === 'ALL' ? 'All Quotes' : m === 'WITH_MATERIALS' ? 'With Materials (Turnkey)' : 'Without Materials (Labour Only)'}
              </button>
            ))}
          </div>

          {roughEst ? (
            <div className="text-xs font-mono-num bg-[#FDE8A5]/70 px-3 py-1.5 rounded border border-[#D9940A]/30">
              Rough Estimate Baseline: <strong>{formatLkr(roughEst.methodATotalLkr)}</strong>
            </div>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-[#1C1C1A]/70">Loading BOQ quotations...</p>
        ) : filtered.length === 0 ? (
          <SurfaceCard tone="pale" className="p-8 text-center space-y-2">
            <ClipboardCheck className="h-8 w-8 text-[#D9940A] mx-auto" />
            <h2 className="font-display font-bold text-lg">No Contractor BOQs Submitted Yet</h2>
            <p className="text-xs text-[#1C1C1A]/75 max-w-md mx-auto">
              Switch to the General Contractor demo role from the Role Selection gateway to submit a 5-stage
              turnkey or labour-only BOQ for this project and watch the automated auditor flag anomalies in real time.
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-6">
            {filtered.map((boq) => (
              <SurfaceCard key={boq.id} tone="canvas" className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-[#1C1C1A]/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="amber">v{boq.versionNumber}</Badge>
                      <Badge tone="yellow">
                        {boq.quoteMode === 'WITH_MATERIALS' ? 'With Materials (Turnkey)' : 'Labour / Machinery Only'}
                      </Badge>
                      <Badge tone={boq.audit.flags.length > 0 ? 'warning' : 'ok'}>
                        {boq.status}
                      </Badge>
                    </div>
                    <h3 className="font-display font-bold text-lg mt-2">{boq.contractorName}</h3>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase text-[#1C1C1A]/65">Quoted Total</p>
                    <p className="font-mono-num text-2xl font-extrabold text-[#D9940A]">
                      {formatLkr(boq.audit.quoteTotalLkr)}
                    </p>
                    <p className="font-mono-num text-xs text-[#1C1C1A]/75">
                      Variance vs Rough Estimate: {boq.audit.variancePct > 0 ? '+' : ''}{boq.audit.variancePct}%
                    </p>
                  </div>
                </div>

                {/* Audit Flags */}
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-sm flex items-center gap-1.5">
                    {boq.audit.flags.length > 0 ? (
                      <ShieldAlert className="h-4 w-4 text-[#B91C1C]" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                    )}
                    Audit Findings ({boq.audit.flags.length})
                  </h4>

                  {boq.audit.flags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`rounded-md border p-3 text-xs space-y-1.5 ${
                        flag.severity === 'CRITICAL'
                          ? 'border-[#B91C1C]/40 bg-[#FEE2E2]/55'
                          : 'border-[#B45309]/40 bg-[#FEF3C7]/65'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-bold">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {flag.flagType.replace(/_/g, ' ')} · {flag.stageKey} ({flag.itemCode})
                        </span>
                        <Badge tone={flag.severity === 'CRITICAL' ? 'critical' : 'warning'}>{flag.severity}</Badge>
                      </div>
                      <p className="text-[#1C1C1A]/85">{flag.explanation}</p>
                      {flag.contractorRebuttal ? (
                        <div className="rounded bg-[#FAF7EE] border border-[#1C1C1A]/15 p-2 mt-1">
                          <span className="font-semibold text-[#D9940A]">Contractor Rebuttal:</span>{' '}
                          {flag.contractorRebuttal}
                          {flag.revisedUnitRateLkr ? (
                            <span className="font-mono-num ml-2 font-semibold">
                              (Revised Rate: {formatLkr(flag.revisedUnitRateLkr)})
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Itemised 5-Stage Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-[#D9940A] text-white">
                        <th className="p-2">Stage</th>
                        <th className="p-2">Item</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2">Unit Rate</th>
                        <th className="p-2">Markup %</th>
                        <th className="p-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C1A]/10">
                      {boq.items.map((item) => {
                        const lineTotal = Math.round(item.quantity * item.unitRateLkr * (1 + item.labourMarkupPct / 100));
                        return (
                          <tr key={item.id}>
                            <td className="p-2 font-semibold">{item.stageKey}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 font-mono-num">{item.quantity} {item.unit}</td>
                            <td className="p-2 font-mono-num">{formatLkr(item.unitRateLkr)}</td>
                            <td className="p-2 font-mono-num">{item.labourMarkupPct}%</td>
                            <td className="p-2 text-right font-mono-num font-semibold">{formatLkr(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
};
