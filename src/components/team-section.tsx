// src/components/team-section.tsx
import { SectionLabel } from "@/components/ui/section-label";
import { TeamCard } from "@/components/team-card";
import { TeamCarousel } from "@/components/team-carousel";
import { prisma } from "@/lib/prisma";

async function getBarbers() {
  return prisma.barber.findMany({
    where: { isActive: true },
    select: { id: true, name: true, bio: true, photoUrl: true },
    orderBy: { id: "asc" },
  });
}

const colsClass: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

export async function TeamSection() {
  const barbers = await getBarbers();
  const gridCols = colsClass[barbers.length] ?? "grid-cols-4";

  return (
    <section id="equipe" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Equipe" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Nossos barbeiros
        </h2>

        {/* Mobile — carousel com dots e arrows */}
        <div className="md:hidden">
          <TeamCarousel barbers={barbers} />
        </div>

        {/* Desktop — grid */}
        <div className={`hidden md:grid ${gridCols} gap-8`}>
          {barbers.map((barber) => (
            <TeamCard key={barber.id} {...barber} />
          ))}
        </div>
      </div>
    </section>
  );
}
