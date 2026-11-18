import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { getDefaultRouteForRole } from '@hausco/shared';
import { useAuth } from '../../stores/authContext';
import { BrandLogo } from './BrandLogo';
import { Button } from './Primitives';

const NAV_LINKS = [
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/house-planner', label: 'House Planner' },
  { to: '/cost-estimator', label: 'Cost Estimator' },
  { to: '/professionals', label: 'Professionals' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/workers', label: 'Skilled Workers' },
];

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7EE] text-[#1C1C1A]">
      <header className="sticky top-0 z-40 border-b border-[#1C1C1A]/10 bg-[#FAF7EE]/95 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9940A]">
            <BrandLogo size="md" />
          </Link>

          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#D9940A] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-[#D9940A]'
                      : 'text-[#1C1C1A]/80 hover:text-[#D9940A]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link to={getDefaultRouteForRole(user.role)}>
                <Button size="sm">Open Workspace</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/role-selection">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/role-selection?intent=start-building">
                  <Button size="sm">Start Building</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden rounded-md p-2 text-[#1C1C1A] hover:bg-[#FDE8A5]/60"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="lg:hidden border-t border-[#1C1C1A]/10 bg-[#FAF7EE] px-4 py-4 space-y-2">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-[#FDE8A5] text-[#D9940A]' : 'text-[#1C1C1A]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/about" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 text-sm">
                About
              </Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-1.5 text-sm">
                Contact
              </Link>
              <Link to="/auth/role-selection" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">{user ? 'Open Workspace' : 'Start Building'}</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1C1C1A]/12 bg-[#FAF7EE] mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-3">
              <BrandLogo size="sm" />
              <p className="text-xs text-[#1C1C1A]/75 leading-relaxed">
                From floor plan to finished home. One digital construction platform built for the Sri Lankan home-building ecosystem.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#D9940A] mb-3">
                Platform Modules
              </h4>
              <ul className="space-y-2 text-sm text-[#1C1C1A]/80">
                <li><Link to="/house-planner" className="hover:text-[#D9940A]">House Planner & 3D View</Link></li>
                <li><Link to="/cost-estimator" className="hover:text-[#D9940A]">Rough Cost Estimator</Link></li>
                <li><Link to="/professionals" className="hover:text-[#D9940A]">Engineers & Contractors</Link></li>
                <li><Link to="/marketplace" className="hover:text-[#D9940A]">Dimensioned Marketplace</Link></li>
                <li><Link to="/workers" className="hover:text-[#D9940A]">Skilled Workers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#D9940A] mb-3">
                Company & Partners
              </h4>
              <ul className="space-y-2 text-sm text-[#1C1C1A]/80">
                <li><Link to="/how-it-works" className="hover:text-[#D9940A]">7-Step Journey</Link></li>
                <li><Link to="/about" className="hover:text-[#D9940A]">About Haus & Co</Link></li>
                <li><Link to="/contact" className="hover:text-[#D9940A]">Contact & Enquiries</Link></li>
                <li><Link to="/auth/role-selection?intent=partner" className="hover:text-[#D9940A]">Register as Partner</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#D9940A] mb-3">
                Transparency Notice
              </h4>
              <p className="text-xs text-[#1C1C1A]/75 leading-relaxed">
                Sample rates, supplier listings, and professional profiles displayed in demo mode are illustrative placeholders only. Always confirm municipal setbacks, soil bearing, and BOQ quotations with verified professionals.
              </p>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-[#1C1C1A]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#1C1C1A]/65">
            <span>© 2026 Haus & Co Platform. Currency: LKR · Metric units (1 perch = 25.29 m²).</span>
            <span>All-in-one Sri Lankan digital home construction platform.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
