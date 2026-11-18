import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, Compass, FileUp, FolderPlus, Ruler, Sofa, Users } from 'lucide-react';
import { SRI_LANKAN_DISTRICTS } from '@hausco/shared';
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
} from '../../components/ui/Primitives';
import { apiFetch, formatLkr } from '../../services/api';
import { useProjects, type ProjectRecord } from '../../stores/projectContext';

export const BuilderDashboardPage: React.FC = () => {
  const { projects, activeProject, selectProject, refreshProjects } = useProjects();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [onboardingPath, setOnboardingPath] = useState<'START_FROM_SCRATCH' | 'UPLOAD_EXISTING_PLAN'>('START_FROM_SCRATCH');
  const [blueprintName, setBlueprintName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestEstimate = activeProject?.estimates[0];
  const activePlan = activeProject?.planVersions.find((v) => v.id === activeProject.activePlanVersionId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await apiFetch<{ project: ProjectRecord }>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title,
          district,
          onboardingPath,
          uploadedBlueprintName:
            onboardingPath === 'UPLOAD_EXISTING_PLAN'
              ? blueprintName || 'architect_blueprint.pdf'
              : undefined,
        }),
      });
      await refreshProjects();
      selectProject(res.project.id);
      setCreateOpen(false);
      setTitle('');
      navigate(onboardingPath === 'UPLOAD_EXISTING_PLAN' ? '/builder/estimator' : '/builder/plot');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PortalShell
      title="Home Builder Workspace"
      subtitle={activeProject ? `${activeProject.title} · ${activeProject.district}` : 'Create or select a project'}
      activeStage={activeProject?.activeStage ?? 'DRAW_PLOT'}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="active-proj-select" className="text-xs font-semibold uppercase tracking-wider text-[#1C1C1A]/70">
              Active Project:
            </label>
            <Select
              id="active-proj-select"
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
            <SampleDataPill />
          </div>

          <Button onClick={() => setCreateOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            New Home Project
          </Button>
        </div>

        {/* Summary KPI Cards */}
        {activeProject ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SurfaceCard tone="pale" className="p-4 space-y-1">
              <span className="text-xs font-semibold uppercase text-[#1C1C1A]/70">Plot Size</span>
              <p className="font-mono-num text-2xl font-bold text-[#D9940A]">
                {activeProject.plot.areaPerches} perches
              </p>
              <p className="text-xs text-[#1C1C1A]/75">
                {activeProject.plot.areaSqm} m² total · {activeProject.plot.buildableAreaSqm} m² buildable
              </p>
            </SurfaceCard>

            <SurfaceCard tone="pale" className="p-4 space-y-1">
              <span className="text-xs font-semibold uppercase text-[#1C1C1A]/70">Active Concept Plan</span>
              <p className="font-display text-lg font-bold truncate">
                {activePlan ? `v${activePlan.versionNumber} · ${activePlan.snapshot.storeys}-Storey` : 'Not Generated'}
              </p>
              <p className="text-xs text-[#1C1C1A]/75">
                {activePlan ? `${activePlan.snapshot.totalRoomAreaSqm} m² room area · ${activePlan.snapshot.rooms.length} zones` : 'Open Plot or Planner'}
              </p>
            </SurfaceCard>

            <SurfaceCard tone="pale" className="p-4 space-y-1">
              <span className="text-xs font-semibold uppercase text-[#1C1C1A]/70">Rough Estimate (Method A)</span>
              <p className="font-mono-num text-xl font-bold text-[#D9940A]">
                {latestEstimate ? formatLkr(latestEstimate.methodATotalLkr) : 'Pending'}
              </p>
              <p className="text-xs text-[#1C1C1A]/75">
                {latestEstimate ? `${latestEstimate.finishGrade.replace('_', ' ')} · Sample rates` : 'Compute in Estimator'}
              </p>
            </SurfaceCard>

            <SurfaceCard tone="pale" className="p-4 space-y-1">
              <span className="text-xs font-semibold uppercase text-[#1C1C1A]/70">Documents & Surveys</span>
              <p className="font-mono-num text-2xl font-bold">{activeProject.documents.length}</p>
              <p className="text-xs text-[#1C1C1A]/75">Stored in private project vault</p>
            </SurfaceCard>
          </div>
        ) : null}

        {/* Dual Onboarding Paths + 7-Module Launchpad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SurfaceCard tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Badge tone="yellow">Step 1 · Land & Setbacks</Badge>
              <h2 className="font-display font-bold text-lg">Interactive Plot Drawer</h2>
              <p className="text-xs text-[#1C1C1A]/80">
                Drag or enter polygon vertices, convert to perches (25.29 m²), and verify authority setback buffers.
              </p>
            </div>
            <Link to="/builder/plot">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5"><Ruler className="h-4 w-4 text-[#D9940A]" /> Open Plot Canvas</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Badge tone="yellow">Step 2 · 2D & Paid 3D</Badge>
              <h2 className="font-display font-bold text-lg">AI Plan Generator & 3D</h2>
              <p className="text-xs text-[#1C1C1A]/80">
                Compare Variant A & Variant B, edit rooms with setback validation, and unlock Three.js 3D view.
              </p>
            </div>
            <Link to="/builder/planner">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5"><Compass className="h-4 w-4 text-[#D9940A]" /> Open Plan Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Badge tone="yellow">Step 3 · Method A & B</Badge>
              <h2 className="font-display font-bold text-lg">Rough Cost Estimator</h2>
              <p className="text-xs text-[#1C1C1A]/80">
                Inspect Method A total, Method B material list, and 5-stage LKR breakdown with what-if controls.
              </p>
            </div>
            <Link to="/builder/estimator">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5"><Calculator className="h-4 w-4 text-[#D9940A]" /> Open Estimator</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Badge tone="yellow">Steps 4–5 · Pros & BOQ</Badge>
              <h2 className="font-display font-bold text-lg">Engineers, Contractors & BOQ Audit</h2>
              <p className="text-xs text-[#1C1C1A]/80">
                Book free WebRTC calls or paid civil engineer visits and audit contractor BOQs against baseline rates.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/builder/professionals"><Button variant="outline" size="sm" className="w-full"><Users className="h-3.5 w-3.5" /> Pros</Button></Link>
              <Link to="/builder/boq"><Button variant="outline" size="sm" className="w-full">BOQ Audit</Button></Link>
            </div>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Badge tone="yellow">Step 6 · Interior Fit</Badge>
              <h2 className="font-display font-bold text-lg">Furnish & Where to Buy</h2>
              <p className="text-xs text-[#1C1C1A]/80">
                Place dimensioned furniture inside rooms, check door-swing clearance, and unlock store prices.
              </p>
            </div>
            <Link to="/builder/interior">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5"><Sofa className="h-4 w-4 text-[#D9940A]" /> Open Interior Studio</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </SurfaceCard>

          <SurfaceCard tone="canvas" className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Badge tone="yellow">Path B · Upload Plan</Badge>
              <h2 className="font-display font-bold text-lg">Upload External Blueprint</h2>
              <p className="text-xs text-[#1C1C1A]/80">
                Already have an architect’s PDF/image plan? Start a project via Upload Existing Plan to jump straight to estimation & BOQ bidding.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                setOnboardingPath('UPLOAD_EXISTING_PLAN');
                setCreateOpen(true);
              }}
            >
              <FileUp className="h-4 w-4" />
              Start With Existing Blueprint
            </Button>
          </SurfaceCard>
        </div>

        <DisclaimerBanner
          title="Concept Plan & Professional Validation Notice"
          body="Generated concept plans and rough cost figures are early planning aids. Always obtain structural validation from a chartered civil engineer and confirm local authority setbacks before construction."
        />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Home Building Project">
        <form onSubmit={handleCreate} className="space-y-4">
          {error ? <DisclaimerBanner title="Error" body={error} tone="warning" /> : null}
          <div>
            <FieldLabel htmlFor="new-proj-title">Project Name</FieldLabel>
            <Input
              id="new-proj-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Maharagama 8-Perch Two-Storey Home"
            />
          </div>
          <div>
            <FieldLabel htmlFor="new-proj-dist">District</FieldLabel>
            <Select id="new-proj-dist" value={district} onChange={(e) => setDistrict(e.target.value)}>
              {SRI_LANKAN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Onboarding Path</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOnboardingPath('START_FROM_SCRATCH')}
                className={`rounded-md border p-3 text-left text-xs ${
                  onboardingPath === 'START_FROM_SCRATCH'
                    ? 'border-[#D9940A] bg-[#FDE8A5]'
                    : 'border-[#1C1C1A]/15 bg-[#FAF7EE]'
                }`}
              >
                <p className="font-bold">A. Start from Scratch</p>
                <p className="text-[#1C1C1A]/75 mt-0.5">Draw plot & generate 2D concept plans</p>
              </button>
              <button
                type="button"
                onClick={() => setOnboardingPath('UPLOAD_EXISTING_PLAN')}
                className={`rounded-md border p-3 text-left text-xs ${
                  onboardingPath === 'UPLOAD_EXISTING_PLAN'
                    ? 'border-[#D9940A] bg-[#FDE8A5]'
                    : 'border-[#1C1C1A]/15 bg-[#FAF7EE]'
                }`}
              >
                <p className="font-bold">B. Upload Existing Plan</p>
                <p className="text-[#1C1C1A]/75 mt-0.5">Import PDF/image & jump to estimator/BOQ</p>
              </button>
            </div>
          </div>

          {onboardingPath === 'UPLOAD_EXISTING_PLAN' ? (
            <div>
              <FieldLabel htmlFor="bp-upload">Select Blueprint File (PDF / PNG / JPG)</FieldLabel>
              <Input
                id="bp-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setBlueprintName(e.target.files?.[0]?.name ?? 'existing_plan.pdf')}
              />
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </PortalShell>
  );
};
