import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  CostEstimateResult,
  JourneyStage,
  PlanVersion,
  PlotMetrics,
  SetbackRuleSet,
} from '@hausco/shared';
import { apiFetch } from '../services/api';
import { useAuth } from './authContext';

export interface ProjectRecord {
  id: string;
  ownerUserId: string;
  title: string;
  district: string;
  localAuthority: string;
  onboardingPath: 'START_FROM_SCRATCH' | 'UPLOAD_EXISTING_PLAN';
  activeStage: JourneyStage;
  setbackRuleId: string;
  plot: PlotMetrics;
  planVersions: PlanVersion[];
  activePlanVersionId: string;
  estimates: (CostEstimateResult & {
    id: string;
    planVersionId: string;
    finishGrade: string;
    district: string;
    createdAt: string;
  })[];
  documents: {
    id: string;
    docType: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextValue {
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  setbackRules: SetbackRuleSet[];
  loading: boolean;
  selectProject: (id: string) => void;
  refreshProjects: () => Promise<void>;
  updateActiveProject: (updated: ProjectRecord) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [setbackRules, setSetbackRules] = useState<SetbackRuleSet[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    try {
      const [projRes, ruleRes] = await Promise.all([
        apiFetch<{ projects: ProjectRecord[] }>('/projects'),
        apiFetch<{ rules: SetbackRuleSet[] }>('/setback-rules'),
      ]);
      setProjects(projRes.projects);
      setSetbackRules(ruleRes.rules);
      setActiveId((prev) => {
        if (prev && projRes.projects.some((p) => p.id === prev)) return prev;
        return projRes.projects[0]?.id ?? '';
      });
    } catch {
      // Role like SHOP_OWNER / SKILLED_WORKER does not query /projects
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const activeProject = projects.find((p) => p.id === activeId) ?? projects[0] ?? null;

  const updateActiveProject = (updated: ProjectRecord) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setActiveId(updated.id);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setbackRules,
        loading,
        selectProject: setActiveId,
        refreshProjects,
        updateActiveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProjects(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used inside ProjectProvider');
  return ctx;
}
