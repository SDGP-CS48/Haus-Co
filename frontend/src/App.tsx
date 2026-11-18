import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getDefaultRouteForRole, type SystemRole } from '@hausco/shared';
import { ArchitecturalCursor } from './components/motion/ArchitecturalCursor';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { BoqAuditorPage } from './features/builder/BoqAuditorPage';
import { BuilderDashboardPage } from './features/builder/BuilderDashboardPage';
import { BuilderProjectsPage, BuilderSettingsPage } from './features/builder/BuilderProjectsAndSettingsPage';
import { CostEstimatorPage } from './features/builder/CostEstimatorPage';
import { HousePlannerPage } from './features/builder/HousePlannerPage';
import { InteriorDesignerPage } from './features/builder/InteriorDesignerPage';
import { PlotDrawerPage } from './features/builder/PlotDrawerPage';
import { ProfessionalsPage } from './features/builder/ProfessionalsPage';
import { WorkersPage } from './features/builder/WorkersPage';
import { ContractorDashboardPage } from './features/contractor/ContractorDashboardPage';
import { EngineerDashboardPage } from './features/engineer/EngineerDashboardPage';
import { ShopDashboardPage } from './features/shop/ShopDashboardPage';
import { WorkerDashboardPage } from './features/worker/WorkerDashboardPage';
import { LoginPage, RegisterPage, RoleSelectionPage, VerifyOtpPage } from './pages/auth/AuthPages';
import { HomePage } from './pages/public/HomePage';
import {
  AboutPage,
  ContactPage,
  CostEstimatorMarketingPage,
  HousePlannerMarketingPage,
  HowItWorksPage,
  MarketplaceMarketingPage,
  ProfessionalsMarketingPage,
  WorkersMarketingPage,
} from './pages/public/PublicSubPages';
import { AuthProvider, useAuth } from './stores/authContext';
import { ProjectProvider } from './stores/projectContext';

const RequireRole: React.FC<{ allowed: SystemRole[]; children: React.ReactNode }> = ({
  allowed,
  children,
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7EE] text-sm font-medium text-[#1C1C1A]/75">
        Loading workspace...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth/role-selection" replace />;
  }
  if (!allowed.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => (
  <>
    <ArchitecturalCursor />
    <Routes>
      {/* Public Marketing Website */}
      <Route path="/" element={<HomePage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/house-planner" element={<HousePlannerMarketingPage />} />
      <Route path="/cost-estimator" element={<CostEstimatorMarketingPage />} />
      <Route path="/professionals" element={<ProfessionalsMarketingPage />} />
      <Route path="/marketplace" element={<MarketplaceMarketingPage />} />
      <Route path="/workers" element={<WorkersMarketingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Authentication & Onboarding */}
      <Route path="/auth/role-selection" element={<RoleSelectionPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />

      {/* Home Builder Portal (Core 7 Modules) */}
      <Route path="/builder/dashboard" element={<RequireRole allowed={['HOME_BUILDER']}><BuilderDashboardPage /></RequireRole>} />
      <Route path="/builder/projects" element={<RequireRole allowed={['HOME_BUILDER']}><BuilderProjectsPage /></RequireRole>} />
      <Route path="/builder/plot" element={<RequireRole allowed={['HOME_BUILDER']}><PlotDrawerPage /></RequireRole>} />
      <Route path="/builder/planner" element={<RequireRole allowed={['HOME_BUILDER']}><HousePlannerPage /></RequireRole>} />
      <Route path="/builder/estimator" element={<RequireRole allowed={['HOME_BUILDER']}><CostEstimatorPage /></RequireRole>} />
      <Route path="/builder/professionals" element={<RequireRole allowed={['HOME_BUILDER']}><ProfessionalsPage /></RequireRole>} />
      <Route path="/builder/boq" element={<RequireRole allowed={['HOME_BUILDER']}><BoqAuditorPage /></RequireRole>} />
      <Route path="/builder/interior" element={<RequireRole allowed={['HOME_BUILDER']}><InteriorDesignerPage /></RequireRole>} />
      <Route path="/builder/workers" element={<RequireRole allowed={['HOME_BUILDER']}><WorkersPage /></RequireRole>} />
      <Route path="/builder/settings" element={<RequireRole allowed={['HOME_BUILDER']}><BuilderSettingsPage /></RequireRole>} />

      {/* Contractor, Civil Engineer, Shop, Worker & Admin Portals */}
      <Route path="/contractor/*" element={<RequireRole allowed={['GENERAL_CONTRACTOR']}><ContractorDashboardPage /></RequireRole>} />
      <Route path="/engineer/*" element={<RequireRole allowed={['CIVIL_ENGINEER']}><EngineerDashboardPage /></RequireRole>} />
      <Route path="/shop/*" element={<RequireRole allowed={['SHOP_OWNER']}><ShopDashboardPage /></RequireRole>} />
      <Route path="/worker/*" element={<RequireRole allowed={['SKILLED_WORKER']}><WorkerDashboardPage /></RequireRole>} />
      <Route path="/admin/*" element={<RequireRole allowed={['PLATFORM_ADMIN']}><AdminDashboardPage /></RequireRole>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <ProjectProvider>
        <AppRoutes />
      </ProjectProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
