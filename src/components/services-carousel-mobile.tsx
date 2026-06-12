"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { categoryIcons, fallbackIcon } from "@/lib/category-icons";

const AUTO_MS = 2800;

type Category = { id: number; name: string };

export function ServicesCarouselMobile({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = categories.length;

  const goTo = useCallback((index: number) => {
    trackRef.current?.scrollTo({ left: index * trackRef.current.offsetWidth, behavior: "smooth" });
  }, []);

  const advance = useCallback(() => {
    setActive((prev) => {
      const next = (prev + 1) % count;
      trackRef.current?.scrollTo({ left: next * trackRef.current.offsetWidth, behavior: "smooth" });
      return next;
    });
  }, [count]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTO_MS);
  }, [advance]);

  useEffect(() => {
    if (count === 0) return;
    timerRef.current = setInterval(advance, AUTO_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, advance]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / el.offsetWidth);
      setActive(index);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="md:hidden">
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((category) => (
          <div
            key={category.id}
            className="w-full shrink-0 snap-start aspect-square bg-background-secondary flex flex-col items-center justify-center gap-5 p-6"
          >
            <span className="text-gold [&>svg]:w-14 [&>svg]:h-14">
              {categoryIcons[category.name] ?? fallbackIcon}
            </span>
            <span className="font-heading text-text-primary text-base uppercase tracking-widest text-center leading-tight">
              {category.name}
            </span>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {categories.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Ir para ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-gold" : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
