import React from 'react';
import { Badge, SurfaceCard } from './Primitives';

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  focus: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Thenuja',
    role: 'Agile Project Manager',
    image: '/assets/image1.png',
    focus: 'Cross-functional agile delivery & milestone velocity',
  },
  {
    name: 'Kaveesha',
    role: 'UX/UI & Ethics Specialist',
    image: '/assets/image2.png',
    focus: 'Human-centred design, user ethics & accessibility',
  },
  {
    name: 'Manishka',
    role: 'Project & Business Analyst',
    image: '/assets/image5.png',
    focus: 'Sri Lankan market analysis & business requirements',
  },
  {
    name: 'Thenuk',
    role: 'Requirements Analyst',
    image: '/assets/image3.png',
    focus: 'Stakeholder discovery & technical requirement specifications',
  },
  {
    name: 'Dinel',
    role: 'System Architect',
    image: '/assets/image4.png',
    focus: 'Platform architecture, modular scalability & data integrity',
  },
];

export const TeamSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <section aria-labelledby="team-heading" className={`py-12 sm:py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 space-y-3">
          <Badge tone="yellow">Leadership & Core Team</Badge>
          <h2 id="team-heading" className="font-display text-2xl sm:text-3xl font-bold text-[#1C1C1A]">
            Meet the Team Behind Haus & Co
          </h2>
          <p className="text-sm sm:text-base text-[#1C1C1A]/80 leading-relaxed">
            A multidisciplinary engineering and product team bringing transparency, architectural rigor,
            and digital coordination to Sri Lanka's home construction landscape.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <SurfaceCard
              key={member.name}
              tone="canvas"
              className="p-4 flex flex-col justify-between border border-[#1C1C1A]/12 hover:border-[#D9940A] transition-all duration-200 group rounded-lg"
            >
              <div>
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-md bg-[#FDE8A5]/35 border border-[#1C1C1A]/10">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-1.5 left-1.5 h-1.5 w-1.5 border-t border-l border-[#1C1C1A]/30 pointer-events-none" />
                  <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 border-t border-r border-[#1C1C1A]/30 pointer-events-none" />
                  <div className="absolute bottom-1.5 left-1.5 h-1.5 w-1.5 border-b border-l border-[#1C1C1A]/30 pointer-events-none" />
                  <div className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 border-b border-r border-[#1C1C1A]/30 pointer-events-none" />
                </div>

                <div className="mt-3.5 space-y-1.5">
                  <h3 className="font-display font-bold text-base text-[#1C1C1A] group-hover:text-[#D9940A] transition-colors">
                    {member.name}
                  </h3>
                  <div>
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FDE8A5] text-[#8C5D00] border border-[#D9940A]/30">
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#1C1C1A]/70 leading-relaxed border-t border-[#1C1C1A]/8 pt-2.5">
                {member.focus}
              </p>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </section>
  );
};
