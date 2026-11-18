import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from '../components/ui/BrandLogo';
import { AuthProvider } from '../stores/authContext';
import { ProjectProvider } from '../stores/projectContext';
import { AppRoutes } from '../App';

describe('Haus & Co Frontend Brand & Public Routes', () => {
  it('renders the unmodified official Haus & Co logo asset', () => {
    render(<BrandLogo />);
    const img = screen.getByAltText('Haus & Co logo') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('/assets/haus-co-logo.png');
  });

  it('renders the Home Page hero headline, core CTAs, and 7-step journey', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ProjectProvider>
            <AppRoutes />
          </ProjectProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Your dream home\./i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Start Building/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Explore the Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Draw plot/i)).toBeInTheDocument();
    expect(screen.getByText(/^BOQ audit$/i)).toBeInTheDocument();
  });

  it('hides Platform Administrator from public Role Selection cards', () => {
    render(
      <MemoryRouter initialEntries={['/auth/role-selection']}>
        <AuthProvider>
          <ProjectProvider>
            <AppRoutes />
          </ProjectProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Home Builder')).toBeInTheDocument();
    expect(screen.getByText('General Contractor')).toBeInTheDocument();
    expect(screen.getByText('Civil Engineer')).toBeInTheDocument();
    expect(screen.getByText('Hardware & Furniture Shop')).toBeInTheDocument();
    expect(screen.getByText('Skilled Worker')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Platform Administrator' })).not.toBeInTheDocument();
  });
});
