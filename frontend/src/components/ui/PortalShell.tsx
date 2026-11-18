import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calculator,
  ClipboardCheck,
  Compass,
  FileText,
  Hammer,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Ruler,
  Settings,
  ShieldAlert,
  Sofa,
  Store,
  Users,
  X,
} from 'lucide-react';
import { JOURNEY_STAGES, type JourneyStage, type SystemRole } from '@hausco/shared';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../stores/authContext';
import { BrandLogo } from './BrandLogo';
import { Badge, Button, SampleDataPill } from './Primitives';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

function getNavForRole(role: SystemRole): NavItem[] {
  switch (role) {
    case 'HOME_BUILDER':
      return [
        { to: '/builder/dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: '/builder/projects', label: 'Projects & Docs', icon: <FileText className="h-4 w-4" /> },
        { to: '/builder/plot', label: '1. Plot Drawer', icon: <Ruler className="h-4 w-4" /> },
        { to: '/builder/planner', label: '2. AI House Plan', icon: <Compass className="h-4 w-4" /> },
        { to: '/builder/estimator', label: '3. Cost Estimator', icon: <Calculator className="h-4 w-4" /> },
        { to: '/builder/professionals', label: '4. Pros & Visits', icon: <Users className="h-4 w-4" /> },
        { to: '/builder/boq', label: '5. BOQ Auditor', icon: <ClipboardCheck className="h-4 w-4" /> },
        { to: '/builder/interior', label: '6. Furnish & Shop', icon: <Sofa className="h-4 w-4" /> },
        { to: '/builder/workers', label: '7. Skilled Workers', icon: <Hammer className="h-4 w-4" /> },
        { to: '/builder/settings', label: 'Account & Unlocks', icon: <Settings className="h-4 w-4" /> },
      ];
    case 'GENERAL_CONTRACTOR':
      return [
        { to: '/contractor/dashboard', label: 'Contractor Leads & BOQs', icon: <Building2 className="h-4 w-4" /> },
      ];
    case 'CIVIL_ENGINEER':
      return [
        { to: '/engineer/dashboard', label: 'Site Visits & Reports', icon: <HardHat className="h-4 w-4" /> },
      ];
    case 'SHOP_OWNER':
      return [
        { to: '/shop/dashboard', label: 'Store & Inventory', icon: <Store className="h-4 w-4" /> },
        { to: '/shop/dashboard?tab=campaigns', label: 'Stage Ads & Leads', icon: <Package className="h-4 w-4" /> },
      ];
    case 'SKILLED_WORKER':
      return [
        { to: '/worker/dashboard', label: 'Trade Jobs & Reviews', icon: <Hammer className="h-4 w-4" /> },
      ];
    case 'PLATFORM_ADMIN':
      return [
        { to: '/admin/dashboard', label: 'Operations Console', icon: <ShieldAlert className="h-4 w-4" /> },
      ];
  }
}

interface PortalShellProps {
  title: string;
  subtitle?: string;
  activeStage?: JourneyStage;
  children: React.ReactNode;
}

export const PortalShell: React.FC<PortalShellProps> = ({
  title,
  subtitle,
  activeStage,
  children,
}) => {
  const { user, demoNotice, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stageAd, setStageAd] = useState<{ id: string; title: string; shopName: string } | null>(null);

  useEffect(() => {
    if (!activeStage || user?.role !== 'HOME_BUILDER') return;
    apiFetch<{ campaigns: { id: string; title: string; shopName: string }[] }>(
      `/campaigns/active?stage=${activeStage}`
    )
      .then((res) => setStageAd(res.campaigns[0] ?? null))
      .catch(() => setStageAd(null));
  }, [activeStage, user?.role]);

  if (!user) return null;
  const navItems = getNavForRole(user.role);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-[#FAF7EE] text-[#1C1C1A]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-[#1C1C1A]/12 bg-[#FAF7EE] shrink-0">
        <div className="h-16 px-4 border-b border-[#1C1C1A]/10 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <BrandLogo size="sm" />
          </Link>
        </div>

        <div className="p-3 border-b border-[#1C1C1A]/10 bg-[#FDE8A5]/45">
          <p className="text-xs font-semibold truncate">{user.fullName}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge tone="yellow">{user.role.replace('_', ' ')}</Badge>
            <Badge tone={user.verificationStatus === 'VERIFIED' ? 'ok' : 'warning'}>
              {user.verificationStatus}
            </Badge>
          </div>
        </div>

        <nav aria-label="Portal Navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#D9940A] text-white'
                    : 'text-[#1C1C1A]/85 hover:bg-[#FDE8A5]/70'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {stageAd ? (
          <div className="m-3 rounded-lg border border-[#D9940A]/30 bg-[#FDE8A5]/65 p-3 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[#D9940A]">
              Sponsored · Stage Tip
            </span>
            <p className="font-medium text-[#1C1C1A] mt-1">{stageAd.title}</p>
            <p className="text-[#1C1C1A]/70 mt-0.5">{stageAd.shopName}</p>
          </div>
        ) : null}

        <div className="p-3 border-t border-[#1C1C1A]/10">
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#1C1C1A]/10 bg-[#FAF7EE]/95 backdrop-blur-xs px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open workspace navigation"
              className="lg:hidden rounded-md p-2 hover:bg-[#FDE8A5]/70"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold text-[#1C1C1A] truncate">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-xs text-[#1C1C1A]/70 truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {demoNotice ? <SampleDataPill label="Demo Mode Active" /> : null}
            <Link to="/" className="hidden sm:inline-block text-xs font-medium text-[#D9940A] hover:underline">
              Public Site
            </Link>
          </div>
        </header>

        {activeStage ? (
          <div className="border-b border-[#1C1C1A]/10 bg-[#FDE8A5]/35 px-4 sm:px-6 py-2 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {JOURNEY_STAGES.map((s) => {
                const isCurrent = s.key === activeStage;
                return (
                  <span
                    key={s.key}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
                      isCurrent
                        ? 'bg-[#F4B41A] text-[#1C1C1A] font-semibold'
                        : 'text-[#1C1C1A]/65'
                    }`}
                  >
                    <span className="font-mono-num text-[11px]">{s.step}.</span>
                    {s.shortLabel}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-[#1C1C1A]/40" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-[#FAF7EE] h-full border-r border-[#1C1C1A]/15 flex flex-col p-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1A]/10">
              <BrandLogo size="sm" />
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-[#D9940A] text-white' : 'text-[#1C1C1A]'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
