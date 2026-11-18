import React, { useCallback, useEffect, useState } from 'react';
import { Hammer, Star } from 'lucide-react';
import { SRI_LANKAN_DISTRICTS, type TradeCategory } from '@hausco/shared';
import { PortalShell } from '../../components/ui/PortalShell';
import {
  Badge,
  Button,
  DisclaimerBanner,
  FieldLabel,
  Input,
  Modal,
  SampleDataPill,
  Select,
  SurfaceCard,
  Textarea,
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects } from '../../stores/projectContext';

interface WorkerRecord {
  userId: string;
  fullName: string;
  tradeCategory: TradeCategory;
  district: string;
  certifications: string[];
  availabilityNote: string;
  dailyRateHintLkr: number;
  verificationStatus: string;
  reviews: { rating: number; comment: string; createdAt: string }[];
}

interface WorkerJobRecord {
  id: string;
  workerUserId: string;
  workerName: string;
  title: string;
  scopeDescription: string;
  agreedAmountLkr: number;
  status: string;
  review?: { rating: number; comment: string };
}

export const WorkersPage: React.FC = () => {
  const { activeProject } = useProjects();
  const [tradeFilter, setTradeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [jobs, setJobs] = useState<WorkerJobRecord[]>([]);

  const [bookWorker, setBookWorker] = useState<WorkerRecord | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobScope, setJobScope] = useState('');
  const [jobAmount, setJobAmount] = useState(12000);

  const [reviewJob, setReviewJob] = useState<WorkerJobRecord | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const q = new URLSearchParams();
    if (tradeFilter) q.set('trade', tradeFilter);
    if (districtFilter) q.set('district', districtFilter);
    const [wRes, jRes] = await Promise.all([
      apiFetch<{ workers: WorkerRecord[] }>(`/workers?${q.toString()}`),
      apiFetch<{ jobs: WorkerJobRecord[] }>('/worker-jobs'),
    ]);
    setWorkers(wRes.workers);
    setJobs(jRes.jobs);
  }, [tradeFilter, districtFilter]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handlePostTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !bookWorker) return;
    setError(null);
    try {
      await apiFetch('/worker-jobs', {
        method: 'POST',
        body: JSON.stringify({
          projectId: activeProject.id,
          workerUserId: bookWorker.userId,
          title: jobTitle,
          scopeDescription: jobScope,
          agreedAmountLkr: jobAmount,
        }),
      });
      setBookWorker(null);
      setJobTitle('');
      setJobScope('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not book worker.');
    }
  };

  const markPaidCompleted = async (jobId: string) => {
    await apiFetch(`/worker-jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED_PAID' }),
    });
    await loadAll();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewJob) return;
    setError(null);
    try {
      await apiFetch(`/worker-jobs/${reviewJob.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      setReviewJob(null);
      setComment('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit review.');
    }
  };

  return (
    <PortalShell
      title="7. Skilled Worker Marketplace"
      subtitle="Verified electricians, plumbers, masons, painters & carpenters · Payment-gated reviews"
      activeStage="HIRE_WORKERS"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Select aria-label="Filter by trade" value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)} className="w-44">
              <option value="">All Trades</option>
              <option value="ELECTRICIAN">Electrician</option>
              <option value="PLUMBER">Plumber</option>
              <option value="MASON">Mason</option>
              <option value="PAINTER">Painter</option>
              <option value="CARPENTER">Carpenter</option>
            </Select>
            <Select aria-label="Filter by district" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="w-44">
              <option value="">All Districts</option>
              {SRI_LANKAN_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
          <SampleDataPill />
        </div>

        {error ? <DisclaimerBanner title="Notice" body={error} tone="warning" /> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((w) => (
            <SurfaceCard key={w.userId} tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge tone="amber">{w.tradeCategory}</Badge>
                  <Badge tone="ok">{w.verificationStatus}</Badge>
                </div>
                <h2 className="font-display font-bold text-lg">{w.fullName}</h2>
                <p className="text-xs font-medium text-[#D9940A]">{w.district} · Est. Day Rate {formatLkr(w.dailyRateHintLkr)}</p>
                <p className="text-xs text-[#1C1C1A]/80">{w.availabilityNote}</p>
                <ul className="text-xs text-[#1C1C1A]/75 list-disc pl-4 space-y-0.5">
                  {w.certifications.map((c) => <li key={c}>{c}</li>)}
                </ul>
                {w.reviews.length > 0 ? (
                  <div className="pt-2 border-t border-[#1C1C1A]/10 text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#D9940A]">
                      <Star className="h-3.5 w-3.5 fill-[#F4B41A]" /> {w.reviews[0]!.rating}/5
                    </span>{' '}
                    — {w.reviews[0]!.comment}
                  </div>
                ) : null}
              </div>
              <Button size="sm" onClick={() => setBookWorker(w)}>
                <Hammer className="h-3.5 w-3.5" />
                Post Micro-Task & Book
              </Button>
            </SurfaceCard>
          ))}
        </div>

        {/* Posted Micro-Tasks */}
        <SurfaceCard tone="pale" className="p-5 space-y-3">
          <h3 className="font-display font-bold text-base">Your Worker Bookings & Verified Reviews</h3>
          {jobs.length === 0 ? (
            <p className="text-xs text-[#1C1C1A]/70">No worker micro-tasks posted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {jobs.map((j) => (
                <div key={j.id} className="rounded bg-[#FAF7EE] border border-[#1C1C1A]/12 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{j.title}</span>
                      <Badge tone={j.status === 'COMPLETED_PAID' ? 'ok' : 'yellow'}>{j.status}</Badge>
                    </div>
                    <p className="text-[#1C1C1A]/75 mt-0.5">{j.workerName} · {j.scopeDescription}</p>
                    <p className="font-mono-num font-semibold mt-1">{formatLkr(j.agreedAmountLkr)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {j.status !== 'COMPLETED_PAID' ? (
                      <Button size="sm" variant="secondary" onClick={() => void markPaidCompleted(j.id)}>
                        Mark Completed & Paid
                      </Button>
                    ) : !j.review ? (
                      <Button size="sm" onClick={() => setReviewJob(j)}>
                        Leave Verified Review
                      </Button>
                    ) : (
                      <Badge tone="ok">Reviewed ({j.review.rating}★)</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>

      <Modal open={Boolean(bookWorker)} onClose={() => setBookWorker(null)} title={`Book ${bookWorker?.fullName ?? ''}`}>
        <form onSubmit={handlePostTask} className="space-y-4">
          <div>
            <FieldLabel htmlFor="wk-title">Micro-Task Title</FieldLabel>
            <Input id="wk-title" required value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Main DB board & earthing rod installation" />
          </div>
          <div>
            <FieldLabel htmlFor="wk-scope">Clear Scope Description</FieldLabel>
            <Textarea id="wk-scope" rows={3} required value={jobScope} onChange={(e) => setJobScope(e.target.value)} placeholder="Specify room count, fittings, materials supplied..." />
          </div>
          <div>
            <FieldLabel htmlFor="wk-amt">Agreed Amount (LKR)</FieldLabel>
            <Input id="wk-amt" type="number" min={1000} required value={jobAmount} onChange={(e) => setJobAmount(Number(e.target.value))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setBookWorker(null)}>Cancel</Button>
            <Button type="submit">Send Job Request</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(reviewJob)} onClose={() => setReviewJob(null)} title="Submit Verified Review">
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <FieldLabel htmlFor="rev-rating">Rating (1–5)</FieldLabel>
            <Select id="rev-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="rev-comment">Review Comment</FieldLabel>
            <Textarea id="rev-comment" rows={3} required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment on workmanship, timeliness & safety..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setReviewJob(null)}>Cancel</Button>
            <Button type="submit">Publish Verified Review</Button>
          </div>
        </form>
      </Modal>
    </PortalShell>
  );
};
