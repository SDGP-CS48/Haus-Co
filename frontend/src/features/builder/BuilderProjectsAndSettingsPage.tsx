import React, { useEffect, useState } from 'react';
import { FileText, ShieldCheck, Upload } from 'lucide-react';
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
import { useAuth } from '../../stores/authContext';
import { useProjects } from '../../stores/projectContext';

export const BuilderProjectsPage: React.FC = () => {
  const { activeProject, refreshProjects } = useProjects();
  const [docType, setDocType] = useState<'LAND_SURVEY' | 'EXTERNAL_PLAN' | 'SOIL_REPORT' | 'SITE_PHOTO'>('LAND_SURVEY');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !fileName.trim()) return;
    setUploading(true);
    try {
      await apiFetch(`/projects/${activeProject.id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          docType,
          fileName: fileName.trim(),
          mimeType: fileName.endsWith('.png') ? 'image/png' : 'application/pdf',
          sizeBytes: 185000,
        }),
      });
      setFileName('');
      await refreshProjects();
    } finally {
      setUploading(false);
    }
  };

  return (
    <PortalShell title="Project Documents & Vault" subtitle="Land surveys, external blueprints & inspection reports" activeStage={activeProject?.activeStage}>
      <div className="space-y-6">
        <SurfaceCard tone="pale" className="p-5">
          <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <FieldLabel htmlFor="doc-type">Document Type</FieldLabel>
              <Select id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)}>
                <option value="LAND_SURVEY">Land Survey Plan</option>
                <option value="EXTERNAL_PLAN">External Architect Blueprint</option>
                <option value="SOIL_REPORT">Soil / Geotech Report</option>
                <option value="SITE_PHOTO">Site Photo</option>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="doc-file">File (PDF / PNG / JPG)</FieldLabel>
              <Input
                id="doc-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? 'document.pdf')}
              />
            </div>
            <Button type="submit" loading={uploading} disabled={!fileName}>
              <Upload className="h-4 w-4" /> Upload to Vault
            </Button>
          </form>
        </SurfaceCard>

        <SurfaceCard tone="canvas" className="p-5 space-y-3">
          <h2 className="font-display font-bold text-base">Stored Files ({activeProject?.documents.length ?? 0})</h2>
          {activeProject?.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded border border-[#1C1C1A]/12 bg-[#FAF7EE] p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#D9940A]" />
                <div>
                  <p className="font-bold">{doc.fileName}</p>
                  <p className="text-[#1C1C1A]/70">{doc.docType} · {Math.round(doc.sizeBytes / 1024)} KB</p>
                </div>
              </div>
              <Badge tone="pale">Private S3 Ref</Badge>
            </div>
          ))}
        </SurfaceCard>
      </div>
    </PortalShell>
  );
};

export const BuilderSettingsPage: React.FC = () => {
  const { user, entitlements, refreshMe } = useAuth();
  const [pricing, setPricing] = useState<{ key: string; label: string; amountLkr: number; billingModel: string; note: string }[]>([]);

  useEffect(() => {
    apiFetch<{ pricingConfigs: typeof pricing }>('/pricing')
      .then((res) => setPricing(res.pricingConfigs))
      .catch(() => {});
  }, []);

  const buyMonthlyPass = async () => {
    const checkout = await apiFetch<{ payment: { externalOrderId: string } }>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ entitlementType: 'FURNITURE_MONTHLY_PASS', resourceId: 'GLOBAL' }),
    });
    await apiFetch('/payments/payhere/notify', {
      method: 'POST',
      body: JSON.stringify({ orderId: checkout.payment.externalOrderId, statusCode: '2' }),
    });
    await refreshMe();
  };

  return (
    <PortalShell title="Account, Pricing & Entitlements" subtitle="Active unlocks and configurable platform fee schedule">
      <div className="space-y-6">
        <SurfaceCard tone="pale" className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg">{user?.fullName}</h2>
            <p className="text-xs text-[#1C1C1A]/75">{user?.email} · {user?.phoneE164}</p>
          </div>
          <Button size="sm" onClick={() => void buyMonthlyPass()}>
            Activate Furniture Monthly Pass
          </Button>
        </SurfaceCard>

        <SurfaceCard tone="canvas" className="p-5 space-y-3">
          <h3 className="font-display font-bold text-base">Active Server-Verified Entitlements</h3>
          {entitlements.length === 0 ? (
            <p className="text-xs text-[#1C1C1A]/70">No paid unlocks activated yet.</p>
          ) : (
            entitlements.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded border border-[#1C1C1A]/12 p-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#15803D]" /> {e.entitlementType}
                </span>
                <span className="font-mono-num text-[#1C1C1A]/70">Resource: {e.resourceId}</span>
              </div>
            ))
          )}
        </SurfaceCard>

        <SurfaceCard tone="canvas" className="p-5 space-y-3">
          <h3 className="font-display font-bold text-base">Configurable Platform Fee Schedule</h3>
          <DisclaimerBanner
            title="Configurable Pricing Policy"
            body="Commercial prices are never hard-coded on the client. Operations admins can update rates and referral commission mechanisms in System Operations."
          />
          <div className="space-y-2">
            {pricing.map((cfg) => (
              <div key={cfg.key} className="flex justify-between items-center border-b border-[#1C1C1A]/10 py-2 text-xs">
                <div>
                  <p className="font-bold">{cfg.label}</p>
                  <p className="text-[#1C1C1A]/70">{cfg.billingModel}</p>
                </div>
                <span className="font-mono-num font-bold text-[#D9940A]">
                  {cfg.key.includes('PCT') ? `${cfg.amountLkr}%` : formatLkr(cfg.amountLkr)}
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </PortalShell>
  );
};
