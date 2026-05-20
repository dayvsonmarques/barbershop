// src/components/team-section.tsx
import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";

type TeamMember = {
  name: string;
  role: string;
  imageSrc: string;
  imageAlt: string;
};

const team: TeamMember[] = [
  {
    name: "Edmílson",
    role: "Fundador & Barbeiro",
    imageSrc: "https://gendo-storage.s3.sa-east-1.amazonaws.com/vomo825/public/profile_63.jpeg",
    imageAlt: "Edmílson — Fundador da ED Barbearia",
  },
  {
    name: "Daniel",
    role: "Barbeiro",
    imageSrc: "",
    imageAlt: "Daniel",
  },
  {
    name: "Erywerton (Vevel)",
    role: "Barbeiro",
    imageSrc: "",
    imageAlt: "Erywerton (Vevel)",
  },
  {
    name: "Ronald Vinicius",
    role: "Barbeiro",
    imageSrc: "https://gendo-storage.s3.sa-east-1.amazonaws.com/vomo825/public/profile_149.jpeg",
    imageAlt: "Ronald Vinicius",
  },
];

function TeamCard({ name, role, imageSrc, imageAlt }: TeamMember) {
  return (
    <div className="group">
      <div className="relative aspect-3/4 overflow-hidden mb-4 bg-background-tertiary border border-border">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="font-heading text-text-primary text-xl">{name}</h3>
      <p className="text-gold text-xs tracking-wide uppercase mt-1">{role}</p>
    </div>
  );
}

export function TeamSection() {
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {team.map((member) => (
            <TeamCard key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  );
}
