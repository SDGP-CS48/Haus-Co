import React, { useEffect, useState } from 'react';
import { HardHat, ShieldCheck } from 'lucide-react';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  Select,
  SurfaceCard,
  Textarea,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects } from '../../stores/projectContext';

interface BookingRow {
  id: string;
  projectId: string;
  bookingType: string;
  status: string;
  scheduledFor?: string;
  amountLkr: number;
}

export const EngineerDashboardPage: React.FC = () => {
  const { projects } = useProjects();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [projectId, setProjectId] = useState('proj-sample-1');
  const [bookingId, setBookingId] = useState('manual-inspection');
  const [landQualitySummary, setLandQualitySummary] = useState('');
  const [soilBearingKpa, setSoilBearingKpa] = useState(145);
  const [foundationDepthM, setFoundationDepthM] = useState(1.5);
  const [structuralLoadNotes, setStructuralLoadNotes] = useState('');
  const [planVerified, setPlanVerified] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const loadBookings = async () => {
    const res = await apiFetch<{ bookings: BookingRow[] }>('/bookings');
    setBookings(res.bookings);
    if (res.bookings[0]) {
      setBookingId(res.bookings[0].id);
      setProjectId(res.bookings[0].projectId);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    await apiFetch('/engineer/reports', {
      method: 'POST',
      body: JSON.stringify({
        bookingId,
        projectId,
        landQualitySummary,
        soilBearingKpa,
        recommendedFoundationDepthM: foundationDepthM,
        structuralLoadNotes,
        planTechnicallyVerified: planVerified,
      }),
    });
    setMsg('Site inspection & structural verification report published to homeowner project.');
    setLandQualitySummary('');
    setStructuralLoadNotes('');
    await loadBookings();
  };

  return (
    <PortalShell
      title="Civil Engineer Workspace"
      subtitle="Site inspection calendar · Soil & land suitability reports · Structural plan verification"
    >
      <div className="space-y-6">
        {msg ? <DisclaimerBanner title="Report Published" body={msg} /> : null}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard tone="pale" className="lg:col-span-5 p-5 space-y-3">
            <h2 className="font-display font-bold text-base flex items-center gap-2">
              <HardHat className="h-5 w-5 text-[#D9940A]" />
              Inspection Calendar & Visits ({bookings.length})
            </h2>
            {bookings.length === 0 ? (
              <p className="text-xs text-[#1C1C1A]/75">No scheduled site visits yet. Select a project on the right to publish an advisory report.</p>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="rounded bg-[#FAF7EE] border border-[#1C1C1A]/12 p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold">{b.bookingType.replace(/_/g, ' ')}</span>
                    <Badge tone={b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'ok' : 'warning'}>{b.status}</Badge>
                  </div>
                  <p>{b.scheduledFor ?? 'Instant voice consult'} · {formatLkr(b.amountLkr)}</p>
                </div>
              ))
            )}
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="lg:col-span-7 p-5">
            <h2 className="font-display font-bold text-base mb-4">Publish Land Suitability & Structural Report</h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="eng-proj">Project</FieldLabel>
                  <Select id="eng-proj" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="eng-depth">Foundation Depth (m)</FieldLabel>
                  <Input id="eng-depth" type="number" step="0.1" value={foundationDepthM} onChange={(e) => setFoundationDepthM(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="eng-kpa">Safe Soil Bearing (kPa)</FieldLabel>
                  <Input id="eng-kpa" type="number" value={soilBearingKpa} onChange={(e) => setSoilBearingKpa(Number(e.target.value))} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" checked={planVerified} onChange={(e) => setPlanVerified(e.target.checked)} className="accent-[#D9940A]" />
                    <ShieldCheck className="h-4 w-4 text-[#D9940A]" />
                    Mark 2D Concept Plan Technically Verified
                  </label>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="eng-soil">Land Quality & Water Table Summary</FieldLabel>
                <Textarea id="eng-soil" rows={3} required value={landQualitySummary} onChange={(e) => setLandQualitySummary(e.target.value)} placeholder="Describe laterite/clay strata, drainage, and setback compliance..." />
              </div>

              <div>
                <FieldLabel htmlFor="eng-load">Structural Load & Column/Footing Notes</FieldLabel>
                <Textarea id="eng-load" rows={3} required value={structuralLoadNotes} onChange={(e) => setStructuralLoadNotes(e.target.value)} placeholder="Specify pad footing sizing, plinth beam reinforcement, and slab span notes..." />
              </div>

              <Button type="submit">Publish Engineering Report</Button>
            </form>
          </SurfaceCard>
        </div>
      </div>
    </PortalShell>
  );
};
