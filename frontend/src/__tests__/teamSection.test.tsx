import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeamSection } from '../components/ui/TeamSection';
import { AboutPage } from '../pages/public/PublicSubPages';
import { AuthProvider } from '../stores/authContext';

describe('TeamSection Component', () => {
  it('renders all 5 team members with their exact roles and image paths', () => {
    render(<TeamSection />);

    const members = [
      { name: 'Thenuja', role: 'Agile Project Manager', src: '/assets/image1.png' },
      { name: 'Kaveesha', role: 'UX/UI & Ethics Specialist', src: '/assets/image2.png' },
      { name: 'Manishka', role: 'Project & Business Analyst', src: '/assets/image5.png' },
      { name: 'Thenuk', role: 'Requirements Analyst', src: '/assets/image3.png' },
      { name: 'Dinel', role: 'System Architect', src: '/assets/image4.png' },
    ];

    members.forEach(({ name, role, src }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(role)).toBeInTheDocument();
      const img = screen.getByAltText(name) as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe(src);
    });

    expect(screen.getByText(/Leadership & Core Team/i)).toBeInTheDocument();
  });

  it('renders within AboutPage correctly', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AboutPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByText(/About Haus & Co/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Leadership & Core Team/i)).toBeInTheDocument();
    expect(screen.getByText('Thenuja')).toBeInTheDocument();
    expect(screen.getByText('Dinel')).toBeInTheDocument();
  });
});
