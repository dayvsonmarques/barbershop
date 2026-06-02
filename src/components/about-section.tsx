import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background-secondary grid grid-cols-1 md:grid-cols-2">
      {/* Texto */}
      <div className="flex items-center py-24">
        <div className="max-w-xl ml-auto px-8 md:px-12 lg:px-16">
          <SectionLabel label="Sobre nós" />
          <h2
            className="font-heading text-text-primary mb-6"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
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
      </div>

      {/* Imagem — full, sem padding */}
      <div className="relative min-h-72 md:min-h-0">
        <Image
          src="/images/about-photo.jpg"
          alt="ED Barbearia"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}
