"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";

type Testimonial = {
  quote: string;
  author: string;
  avatar: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    quote: "Muito agradável, um ótimo ambiente com ótimos profissionais.",
    author: "Ronald Vinicius",
    avatar: "/images/testimonials/avatar-01.png",
    rating: 5,
  },
  {
    quote: "Profissionais sensacionais, excelente ambiente climatizado, cortes agendados sem necessidade de espera. Recomendo e sou cliente há anos!",
    author: "Vinícius Lopes",
    avatar: "/images/testimonials/avatar-02.png",
    rating: 5,
  },
  {
    quote: "Atendimento muito bom, os rapazes são muito educados e prestativos. Fazem aquilo que você pede, nada mais nada menos — eles até sugerem caso você peça. Muito bom o resultado do corte de cabelo.",
    author: "Marcos Egito",
    avatar: "/images/testimonials/avatar-03.png",
    rating: 5,
  },
  {
    quote: "Amei demais o meu corte de cabelo, foi realmente como eu esperava. Aconselho demais vocês fazerem nessa barbearia, todos são um amor de pessoa, top!",
    author: "Adricia Rodrigues",
    avatar: "/images/testimonials/avatar-04.png",
    rating: 5,
  },
  {
    quote: "Ambiente profissional, bastante organizado com barbeiros impecáveis. Preço acessível e tem até cafezinho. Nota 1000.",
    author: "Mateus Willis",
    avatar: "/images/testimonials/avatar-05.png",
    rating: 5,
  },
  {
    quote: "Ótima barbearia. Atendimento excelente, profissionais muito bons, ambiente aconchegante. Estou frequentando há mais de um ano, só tenho a agradecer.",
    author: "Pato Marques",
    avatar: "/images/testimonials/avatar-06.png",
    rating: 5,
  },
];

function Stars() {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (index: number) => {
    setCurrent((index + testimonials.length) % testimonials.length);
  };

  const resetTimer = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    setCurrent(index);
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current]);

  const t = testimonials[current];

  return (
    <section className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Depoimentos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que dizem nossos clientes
        </h2>

        <div className="relative max-w-2xl mx-auto">
          <div className="bg-background-secondary p-8 md:p-12 relative min-h-55 flex flex-col justify-between">
            <span
              className="absolute top-4 left-6 text-gold opacity-20 font-heading text-8xl leading-none select-none"
              aria-hidden="true"
            >
              &#8220;
            </span>

            <blockquote
              key={current}
              className="font-heading italic text-lg md:text-xl text-text-primary pt-8 leading-snug animate-fade-in"
            >
              {t.quote}
            </blockquote>

            <footer className="mt-6 flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gold/30">
                <Image
                  src={t.avatar}
                  alt={t.author}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <Stars />
                <p className="text-text-secondary text-sm font-medium">{t.author}</p>
              </div>
            </footer>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => resetTimer(i)}
                aria-label={`Depoimento ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-6 h-2 bg-gold"
                    : "w-2 h-2 bg-text-secondary/30 hover:bg-text-secondary/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
