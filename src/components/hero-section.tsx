// src/components/hero-section.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="min-h-screen bg-background-primary flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-3xl">
          <h1
            className="font-heading text-text-primary mb-6"
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              lineHeight: "1.05",
              letterSpacing: "-0.02em",
            }}
          >
            The Art of{" "}
            <span className="text-gold">The Cut</span>
          </h1>
          <p className="text-text-secondary text-lg mb-10 max-w-xl leading-relaxed">
            Tradição, estilo e precisão. Em Recife, a barbearia que transforma
            cada visita em experiência.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/agendar">
              <Button variant="primary" size="lg">
                Agendar Horário
              </Button>
            </Link>
            <a href="#servicos">
              <Button variant="outline" size="lg">
                Ver Serviços
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
