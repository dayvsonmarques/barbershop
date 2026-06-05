import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";

export function AboutSection() {
  return (
    <section id="sobre" className="bg-background-secondary relative overflow-hidden py-24">
      {/* Texto alinhado com o container padrão */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="lg:w-1/2 lg:pr-12">
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

      {/* Imagem mobile: abaixo do texto */}
      <div className="relative mt-12 aspect-square lg:hidden">
        <Image
          src="/images/barbearia-logo_croped.jpeg"
          alt="ED Barbearia"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Imagem desktop: full-bleed na metade direita */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
        <Image
          src="/images/barbearia-logo_croped.jpeg"
          alt="ED Barbearia"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}
