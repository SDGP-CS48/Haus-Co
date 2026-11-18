import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { RateSet } from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';

interface AdminOverview {
  metrics: {
    usersCount: number;
    projectsCount: number;
    pendingKycCount: number;
    boqsCount: number;
    verifiedRevenueLkr: number;
  };
  kycSubmissions: { id: string; userId: string; nicMasked: string; credentialCode: string; status: string }[];
  rateSets: RateSet[];
  pricingConfigs: { key: string; label: string; amountLkr: number; billingModel: string }[];
  campaigns: { id: string; shopName: string; title: string; targetStage: string; status: string }[];
  disputes: { id: string; subject: string; status: string }[];
  auditLogs: { id: string; action: string; targetType: string; targetId: string; createdAt: string }[];
}

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [newVersionLabel, setNewVersionLabel] = useState('2026.12-MARKET-REV1');
  const [newBaseRate, setNewBaseRate] = useState(215000);
  const [msg, setMsg] = useState<string | null>(null);

  const loadAdmin = async () => {
    const res = await apiFetch<AdminOverview>('/admin/overview');
    setData(res);
  };

  useEffect(() => {
    void loadAdmin();
  }, []);

  const decideKyc = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    await apiFetch(`/admin/kyc/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
    setMsg(`KYC submission ${decision.toLowerCase()}.`);
    await loadAdmin();
  };

  const publishRateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/admin/rates', {
      method: 'POST',
      body: JSON.stringify({
        versionLabel: newVersionLabel,
        baseRateLkrPerSqm: newBaseRate,
        isDemoSample: false,
      }),
    });
    setMsg(`Published effective-dated RateSet '${newVersionLabel}'. Historical estimates preserve prior rates.`);
    await loadAdmin();
  };

  const decideCampaign = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    await apiFetch(`/admin/campaigns/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    await loadAdmin();
  };

  return (
    <PortalShell
      title="Platform Operations & Governance (Internal)"
      subtitle="KYC verification · Effective-dated rate versioning · Sponsored ads · Audit trail"
    >
      <div className="space-y-6">
        {msg ? <DisclaimerBanner title="Operations Action Logged" body={msg} /> : null}

        {data ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <SurfaceCard tone="pale" className="p-4">
                <p className="text-xs uppercase text-[#1C1C1A]/65">Users</p>
                <p className="font-mono-num text-2xl font-bold">{data.metrics.usersCount}</p>
              </SurfaceCard>
              <SurfaceCard tone="pale" className="p-4">
                <p className="text-xs uppercase text-[#1C1C1A]/65">Projects</p>
                <p className="font-mono-num text-2xl font-bold">{data.metrics.projectsCount}</p>
              </SurfaceCard>
              <SurfaceCard tone="pale" className="p-4">
                <p className="text-xs uppercase text-[#1C1C1A]/65">Pending KYC</p>
                <p className="font-mono-num text-2xl font-bold text-[#D9940A]">{data.metrics.pendingKycCount}</p>
              </SurfaceCard>
              <SurfaceCard tone="pale" className="p-4">
                <p className="text-xs uppercase text-[#1C1C1A]/65">BOQs</p>
                <p className="font-mono-num text-2xl font-bold">{data.metrics.boqsCount}</p>
              </SurfaceCard>
              <SurfaceCard tone="pale" className="p-4 col-span-2 lg:col-span-1">
                <p className="text-xs uppercase text-[#1C1C1A]/65">Verified Revenue</p>
                <p className="font-mono-num text-xl font-bold text-[#D9940A]">{formatLkr(data.metrics.verifiedRevenueLkr)}</p>
              </SurfaceCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Effective-Dated Cost Estimator Rate Editor */}
              <SurfaceCard tone="canvas" className="p-5 space-y-4">
                <h2 className="font-display font-bold text-base">Effective-Dated Rate Editor</h2>
                <form onSubmit={publishRateSet} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <FieldLabel htmlFor="adm-ver">Version Label</FieldLabel>
                    <Input id="adm-ver" required value={newVersionLabel} onChange={(e) => setNewVersionLabel(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor="adm-rate">Base Rate (LKR/m²)</FieldLabel>
                    <Input id="adm-rate" type="number" required value={newBaseRate} onChange={(e) => setNewBaseRate(Number(e.target.value))} />
                  </div>
                  <Button type="submit" size="sm">Publish Version</Button>
                </form>

                <div className="space-y-2 text-xs pt-2 border-t border-[#1C1C1A]/10">
                  {data.rateSets.map((rs, idx) => (
                    <div key={rs.id} className="flex justify-between items-center rounded bg-[#FAF7EE] p-2.5 border border-[#1C1C1A]/10">
                      <span>
                        <strong>{rs.versionLabel}</strong> · {formatLkr(rs.baseRateLkrPerSqm)}/m²
                      </span>
                      <Badge tone={idx === 0 ? 'amber' : 'pale'}>{idx === 0 ? 'ACTIVE' : 'HISTORICAL'}</Badge>
                    </div>
                  ))}
                </div>
              </SurfaceCard>

              {/* KYC Verification & Campaign Approvals */}
              <SurfaceCard tone="canvas" className="p-5 space-y-4">
                <h2 className="font-display font-bold text-base">KYC Verification & Ad Approvals</h2>
                {data.kycSubmissions.length === 0 ? (
                  <p className="text-xs text-[#1C1C1A]/70">No pending KYC submissions.</p>
                ) : (
                  data.kycSubmissions.map((k) => (
                    <div key={k.id} className="rounded border border-[#1C1C1A]/12 p-3 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold">NIC: {k.nicMasked} · {k.credentialCode}</p>
                        <Badge tone={k.status === 'APPROVED' ? 'ok' : 'warning'}>{k.status}</Badge>
                      </div>
                      {k.status === 'PENDING' ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => void decideKyc(k.id, 'APPROVED')}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => void decideKyc(k.id, 'REJECTED')}>Reject</Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}

                <div className="space-y-2 pt-2 border-t border-[#1C1C1A]/10">
                  {data.campaigns.map((c) => (
                    <div key={c.id} className="rounded border border-[#1C1C1A]/12 p-2.5 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold">{c.title}</p>
                        <p className="text-[#1C1C1A]/70">{c.shopName} · {c.targetStage}</p>
                      </div>
                      {c.status === 'PENDING_APPROVAL' ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => void decideCampaign(c.id, 'ACTIVE')}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => void decideCampaign(c.id, 'REJECTED')}>Reject</Button>
                        </div>
                      ) : (
                        <Badge tone={c.status === 'ACTIVE' ? 'ok' : 'warning'}>{c.status}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            </div>

            {/* Privileged Audit Log */}
            <SurfaceCard tone="pale" className="p-5 space-y-3">
              <h2 className="font-display font-bold text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#D9940A]" />
                Privileged Action Audit Log
              </h2>
              <div className="space-y-1.5 max-h-60 overflow-y-auto text-xs font-mono-num">
                {data.auditLogs.map((log) => (
                  <div key={log.id} className="rounded bg-[#FAF7EE] px-3 py-2 border border-[#1C1C1A]/10 flex justify-between gap-4">
                    <span>{log.action} · {log.targetType} ({log.targetId})</span>
                    <span className="text-[#1C1C1A]/65">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </>
        ) : (
          <p className="text-sm text-[#1C1C1A]/70">Loading operations console...</p>
        )}
      </div>
    </PortalShell>
  );
};
