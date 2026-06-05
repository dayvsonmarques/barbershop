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

const INTERVAL = 5000;
const DRAG_THRESHOLD = 50;
const FADE_MS = 280;

function Stars() {
  return (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ quote, author, avatar }: Testimonial) {
  return (
    <div className="bg-background-secondary p-6 md:p-8 relative flex flex-col justify-between min-h-55 select-none">
      <span
        className="absolute top-4 left-6 text-gold opacity-20 font-heading text-7xl leading-none select-none"
        aria-hidden="true"
      >
        &#8220;
      </span>
      <blockquote className="font-heading italic text-base md:text-lg text-text-primary pt-8 leading-snug">
        {quote}
      </blockquote>
      <footer className="mt-6 flex items-center gap-3">
        <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-gold/30">
          <Image src={avatar} alt={author} fill sizes="44px" className="object-cover" />
        </div>
        <div>
          <Stars />
          <p className="text-text-secondary text-sm font-medium">{author}</p>
        </div>
      </footer>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function useVisibleCount() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) setCount(3);
      else if (window.innerWidth >= 768) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return count;
}

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number | null>(null);
  const visibleCount = useVisibleCount();

  const goTo = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setFading(true);
    fadeTimerRef.current = setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, FADE_MS);
  };

  const prev = () => goTo((current - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((current + 1) % testimonials.length);

  useEffect(() => {
    timerRef.current = setTimeout(next, INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const onDragStart = (clientX: number) => { dragStartX.current = clientX; };

  const onDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - clientX;
    if (Math.abs(diff) > DRAG_THRESHOLD) diff > 0 ? next() : prev();
    dragStartX.current = null;
  };

  const visibleCards = Array.from(
    { length: visibleCount },
    (_, i) => testimonials[(current + i) % testimonials.length]
  );

  const gridCols =
    visibleCount === 3 ? "grid-cols-3" :
    visibleCount === 2 ? "grid-cols-2" :
    "grid-cols-1";

  return (
    <section id="depoimentos" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Depoimentos" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          O que dizem nossos clientes
        </h2>

        <div className="relative">
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background-secondary text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
          >
            <ChevronLeft />
          </button>

          <div
            className={`grid gap-4 md:gap-6 ${gridCols} cursor-grab active:cursor-grabbing transition-opacity ease-in-out ${fading ? "opacity-0" : "opacity-100"}`}
            style={{ transitionDuration: `${FADE_MS}ms` }}
            onMouseDown={(e) => onDragStart(e.clientX)}
            onMouseUp={(e) => onDragEnd(e.clientX)}
            onMouseLeave={() => { dragStartX.current = null; }}
            onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
            onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
          >
            {visibleCards.map((t, i) => (
              <TestimonialCard key={`${current}-${i}`} {...t} />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Próximo"
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background-secondary text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
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
    </section>
  );
}
