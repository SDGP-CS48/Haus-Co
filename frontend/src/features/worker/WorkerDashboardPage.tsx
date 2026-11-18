import React, { useEffect, useState } from 'react';
import { Hammer } from 'lucide-react';
import { PortalShell } from '../../components/ui/PortalShell';
import { Badge, Button, SurfaceCard } from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';

interface JobRow {
  id: string;
  title: string;
  scopeDescription: string;
  agreedAmountLkr: number;
  platformCommissionLkr: number;
  status: string;
  review?: { rating: number; comment: string };
}

export const WorkerDashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobRow[]>([]);

  const loadJobs = async () => {
    const res = await apiFetch<{ jobs: JobRow[] }>('/worker-jobs');
    setJobs(res.jobs);
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const updateStatus = async (id: string, status: 'ACCEPTED' | 'IN_PROGRESS') => {
    await apiFetch(`/worker-jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadJobs();
  };

  return (
    <PortalShell
      title="Skilled Worker Workspace"
      subtitle="Distinct tradesperson portal · Micro-task inbox · Verified review history"
    >
      <div className="space-y-6">
        <SurfaceCard tone="pale" className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hammer className="h-5 w-5 text-[#D9940A]" />
            <div>
              <h2 className="font-display font-bold text-base">Active Job Request Inbox</h2>
              <p className="text-xs text-[#1C1C1A]/75">
                Accept scoped tasks, track work status, and earn verified reviews upon completion & payment.
              </p>
            </div>
          </div>
          <Badge tone="yellow">{jobs.length} Jobs</Badge>
        </SurfaceCard>

        <div className="space-y-3">
          {jobs.length === 0 ? (
            <SurfaceCard tone="canvas" className="p-8 text-center text-xs text-[#1C1C1A]/70">
              No job requests assigned yet. Home builders can post scoped micro-tasks in Step 7 (Skilled Workers).
            </SurfaceCard>
          ) : (
            jobs.map((j) => (
              <SurfaceCard key={j.id} tone="canvas" className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm">{j.title}</h3>
                    <Badge tone={j.status === 'COMPLETED_PAID' ? 'ok' : 'yellow'}>{j.status}</Badge>
                  </div>
                  <p className="text-[#1C1C1A]/80">{j.scopeDescription}</p>
                  <p className="font-mono-num">
                    Agreed Payout: <strong>{formatLkr(j.agreedAmountLkr)}</strong> (Platform commission: {formatLkr(j.platformCommissionLkr)})
                  </p>
                  {j.review ? (
                    <p className="text-[#15803D] font-semibold">Verified Review ({j.review.rating}★): {j.review.comment}</p>
                  ) : null}
                </div>

                <div className="flex gap-2 shrink-0">
                  {j.status === 'REQUESTED' ? (
                    <Button size="sm" onClick={() => void updateStatus(j.id, 'ACCEPTED')}>Accept Job</Button>
                  ) : null}
                  {j.status === 'ACCEPTED' ? (
                    <Button size="sm" variant="secondary" onClick={() => void updateStatus(j.id, 'IN_PROGRESS')}>Start Work</Button>
                  ) : null}
                </div>
              </SurfaceCard>
            ))
          )}
        </div>
      </div>
    </PortalShell>
  );
};
