"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/components/ui/calendar-icon";

export function HeroSection() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${window.scrollY * 0.4}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative w-screen overflow-hidden flex items-center h-[75vh] md:h-[90vh]">
      <div
        ref={imgRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: "url('/barbershop.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          top: "-20%",
          bottom: "-20%",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          <h1
            className="font-heading text-white mb-6"
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              lineHeight: "1.05",
              letterSpacing: "-0.02em",
            }}
          >
            A Arte{" "}
            <span className="text-gold">do Corte</span>
          </h1>
          <p className="text-white/80 text-2xl mb-10 max-w-xl leading-relaxed">
            Tradição, estilo e precisão. Em Recife, a barbearia que transforma
            cada visita em experiência.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/agendar">
              <Button variant="primary" size="lg">
                <CalendarIcon size={16} />
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
