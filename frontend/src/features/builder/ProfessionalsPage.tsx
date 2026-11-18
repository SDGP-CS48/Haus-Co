import React, { useEffect, useState } from 'react';
import { Building2, Calendar, HardHat, PhoneCall, ShieldCheck } from 'lucide-react';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  Modal,
  SampleDataPill,
  SurfaceCard,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects } from '../../stores/projectContext';

interface ProRecord {
  userId: string;
  kind: 'CONTRACTOR' | 'ENGINEER';
  fullName: string;
  companyOrTitle: string;
  registrationNo: string;
  gradeOrQualification: string;
  serviceDistricts: string[];
  siteVisitFeeLkr: number;
  yearsExperience: number;
  bio: string;
  verificationStatus: string;
  isSampleData: boolean;
}

interface BookingRecord {
  id: string;
  providerUserId: string;
  bookingType: string;
  status: string;
  scheduledFor?: string;
  amountLkr: number;
  roomToken?: string;
}

interface ReportRecord {
  id: string;
  projectId: string;
  landQualitySummary: string;
  soilBearingKpa: number;
  recommendedFoundationDepthM: number;
  structuralLoadNotes: string;
  planTechnicallyVerified: boolean;
  createdAt: string;
}

export const ProfessionalsPage: React.FC = () => {
  const { activeProject } = useProjects();
  const [tab, setTab] = useState<'CONTRACTOR' | 'ENGINEER'>('ENGINEER');
  const [pros, setPros] = useState<ProRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);

  const [webrtcSession, setWebrtcSession] = useState<{ roomToken: string; providerName: string; note: string } | null>(null);
  const [visitModalPro, setVisitModalPro] = useState<ProRecord | null>(null);
  const [visitDate, setVisitDate] = useState('2026-11-22T10:00');
  const [visitNotes, setVisitNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    const [pRes, bRes] = await Promise.all([
      apiFetch<{ professionals: ProRecord[] }>('/professionals'),
      apiFetch<{ bookings: BookingRecord[]; engineerReports: ReportRecord[] }>('/bookings'),
    ]);
    setPros(pRes.professionals);
    setBookings(bRes.bookings);
    setReports(bRes.engineerReports);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleVoiceConsult = async (pro: ProRecord) => {
    if (!activeProject) return;
    setBusy(true);
    try {
      const res = await apiFetch<{
        booking: BookingRecord;
        webrtc: { note: string };
      }>('/bookings/voice-consult', {
        method: 'POST',
        body: JSON.stringify({ projectId: activeProject.id, providerUserId: pro.userId }),
      });
      setWebrtcSession({
        roomToken: res.booking.roomToken ?? 'webrtc-room',
        providerName: pro.fullName,
        note: res.webrtc.note,
      });
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const handleBookSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !visitModalPro) return;
    setBusy(true);
    try {
      const visitRes = await apiFetch<{ booking: BookingRecord }>('/bookings/site-visit', {
        method: 'POST',
        body: JSON.stringify({
          projectId: activeProject.id,
          engineerUserId: visitModalPro.userId,
          scheduledFor: visitDate,
          notes: visitNotes,
        }),
      });
      // Complete PayHere / Demo checkout confirmation
      const payRes = await apiFetch<{ payment: { externalOrderId: string } }>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({
          entitlementType: 'ENGINEER_SITE_VISIT',
          resourceId: visitRes.booking.id,
        }),
      });
      await apiFetch('/payments/payhere/notify', {
        method: 'POST',
        body: JSON.stringify({ orderId: payRes.payment.externalOrderId, statusCode: '2' }),
      });
      setStatusMsg(`Site visit confirmed with ${visitModalPro.fullName} for ${visitDate}.`);
      setVisitModalPro(null);
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const visiblePros = pros.filter((p) => p.kind === tab);

  return (
    <PortalShell
      title="4. Professional Service Booking"
      subtitle="Browse CIDA contractors & chartered civil engineers · Free WebRTC calls · Paid site visits"
      activeStage="ENGINEER_AND_CONTRACTOR"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-lg border border-[#1C1C1A]/15 bg-[#FDE8A5]/50 p-1">
            <button
              type="button"
              onClick={() => setTab('ENGINEER')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                tab === 'ENGINEER' ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
              }`}
            >
              <HardHat className="h-4 w-4" />
              Chartered Civil Engineers
            </button>
            <button
              type="button"
              onClick={() => setTab('CONTRACTOR')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                tab === 'CONTRACTOR' ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
              }`}
            >
              <Building2 className="h-4 w-4" />
              CIDA Contractors
            </button>
          </div>
          <SampleDataPill />
        </div>

        {statusMsg ? <DisclaimerBanner title="Booking Confirmed" body={statusMsg} /> : null}
        {webrtcSession ? (
          <SurfaceCard tone="pale" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Badge tone="ok">WebRTC Audio Room Ready · {webrtcSession.roomToken}</Badge>
              <p className="text-sm font-bold mt-1">In-App Voice Consultation with {webrtcSession.providerName}</p>
              <p className="text-xs text-[#1C1C1A]/75">{webrtcSession.note}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setWebrtcSession(null)}>
              End Audio Bridge
            </Button>
          </SurfaceCard>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visiblePros.map((pro) => (
            <SurfaceCard key={pro.userId} tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="ok">
                    <ShieldCheck className="h-3 w-3" /> {pro.verificationStatus}
                  </Badge>
                  <span className="font-mono-num text-xs text-[#1C1C1A]/70">{pro.registrationNo}</span>
                </div>
                <h2 className="font-display text-lg font-bold">{pro.fullName}</h2>
                <p className="text-sm font-semibold text-[#D9940A]">{pro.companyOrTitle}</p>
                <p className="text-xs text-[#1C1C1A]/80">{pro.gradeOrQualification} · {pro.yearsExperience} yrs</p>
                <p className="text-xs text-[#1C1C1A]/75 leading-relaxed">{pro.bio}</p>
                <p className="text-xs font-medium">Districts: {pro.serviceDistricts.join(', ')}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#1C1C1A]/10">
                <Button size="sm" variant="outline" loading={busy} onClick={() => void handleVoiceConsult(pro)}>
                  <PhoneCall className="h-3.5 w-3.5" />
                  Free WebRTC Voice Call
                </Button>
                {pro.kind === 'ENGINEER' ? (
                  <Button size="sm" onClick={() => setVisitModalPro(pro)}>
                    <Calendar className="h-3.5 w-3.5" />
                    Book Site Visit ({formatLkr(pro.siteVisitFeeLkr)})
                  </Button>
                ) : null}
              </div>
            </SurfaceCard>
          ))}
        </div>

        {/* Published Engineer Reports & Bookings */}
        {reports.length > 0 || bookings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SurfaceCard tone="pale" className="p-5 space-y-3">
              <h3 className="font-display font-bold text-base">Your Consultation & Site Visit Bookings</h3>
              {bookings.length === 0 ? (
                <p className="text-xs text-[#1C1C1A]/70">No bookings yet.</p>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div key={b.id} className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold">{b.bookingType.replace(/_/g, ' ')}</p>
                        <p className="text-[#1C1C1A]/70">{b.scheduledFor ?? b.roomToken ?? 'Instant'}</p>
                      </div>
                      <div className="text-right">
                        <Badge tone={b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'ok' : 'warning'}>{b.status}</Badge>
                        {b.amountLkr > 0 ? <p className="font-mono-num mt-1">{formatLkr(b.amountLkr)}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>

            <SurfaceCard tone="pale" className="p-5 space-y-3">
              <h3 className="font-display font-bold text-base">Published Engineering Reports</h3>
              {reports.length === 0 ? (
                <p className="text-xs text-[#1C1C1A]/70">No structural or soil inspection reports published yet.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((r) => (
                    <div key={r.id} className="rounded bg-[#FAF7EE] p-3 border border-[#1C1C1A]/10 text-xs space-y-1">
                      <div className="flex justify-between">
                        <Badge tone={r.planTechnicallyVerified ? 'ok' : 'warning'}>
                          {r.planTechnicallyVerified ? 'Plan Technically Verified' : 'Structural Advisory'}
                        </Badge>
                        <span className="font-mono-num">Foundation: {r.recommendedFoundationDepthM}m · {r.soilBearingKpa} kPa</span>
                      </div>
                      <p className="font-semibold pt-1">{r.landQualitySummary}</p>
                      <p className="text-[#1C1C1A]/80">{r.structuralLoadNotes}</p>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(visitModalPro)}
        onClose={() => setVisitModalPro(null)}
        title={`Schedule Site Visit · ${visitModalPro?.fullName ?? ''}`}
      >
        <form onSubmit={handleBookSiteVisit} className="space-y-4">
          <DisclaimerBanner
            title="PayHere / Demo Checkout"
            body={`Site visit fee: ${formatLkr(visitModalPro?.siteVisitFeeLkr)} (includes platform commission split). In demo mode this simulates PayHere callback verification.`}
          />
          <div>
            <FieldLabel htmlFor="visit-dt">Preferred Date & Time</FieldLabel>
            <Input id="visit-dt" type="datetime-local" required value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="visit-notes">Site Access / Soil Inspection Notes</FieldLabel>
            <Input id="visit-notes" value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="e.g., Check water table depth and boundary pegs" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setVisitModalPro(null)}>Cancel</Button>
            <Button type="submit" loading={busy}>Confirm & Pay Site Visit</Button>
          </div>
        </form>
      </Modal>
    </PortalShell>
  );
};
