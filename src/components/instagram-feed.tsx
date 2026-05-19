// src/components/instagram-feed.tsx
import { SectionLabel } from "@/components/ui/section-label";

export function InstagramFeed() {
  return (
    <section id="instagram" className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Instagram" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          @edbarbearia
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-background-tertiary border border-border hover:border-gold/50 transition-colors duration-300"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
