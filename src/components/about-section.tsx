// src/components/about-section.tsx
import { SectionLabel } from "@/components/ui/section-label";

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel label="Sobre nós" />
            <h2
              className="font-heading text-text-primary mb-6"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                lineHeight: "1.1",
              }}
            >
              Tradição desde 2010
            </h2>
            <p className="text-text-secondary text-lg mb-4 leading-relaxed">
              Fundada por Edmilson Rodrigues, a ED Barbearia nasceu do amor
              pelo ofício. Anos cuidando do visual de homens que valorizam
              estilo e precisão em Recife.
            </p>
            <p className="text-text-secondary text-lg leading-relaxed">
              Nossos barbeiros são artistas. Cada corte, barba e penteado é
              uma obra — executada com técnica, respeito e os melhores
              equipamentos do mercado.
            </p>
          </div>
          <div className="border border-gold/30 p-12 flex items-center justify-center min-h-70">
            <p className="font-heading text-gold text-2xl text-center italic leading-snug">
              "A arte do <br /> corte perfeito."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
