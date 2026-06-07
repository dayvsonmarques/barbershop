"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type TestimonialData = {
  id: number;
  author: string;
  quote: string;
  avatarUrl: string | null;
  rating: number;
};

const AUTO_MS = 5000;
const TRANSITION_MS = 450;
const DRAG_THRESHOLD = 50;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rating ? "#C9A84C" : "none"} stroke="#C9A84C" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ quote, author, avatarUrl, rating }: TestimonialData) {
  return (
    <div className="bg-background-secondary p-6 md:p-8 relative flex flex-col justify-between min-h-55 select-none h-full">
      <span className="absolute top-4 left-6 text-gold opacity-20 font-heading text-7xl leading-none select-none" aria-hidden="true">
        &#8220;
      </span>
      <blockquote className="text-base md:text-lg text-text-primary pt-8 leading-snug">
        {quote}
      </blockquote>
      <footer className="mt-6 flex items-center gap-3">
        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0 border border-gold/30 flex items-center justify-center ${avatarUrl ? "" : "bg-background-primary"}`}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={author} className="w-full h-full object-cover object-center" />
          ) : (
            <span className="text-text-secondary text-sm font-semibold">
              {author.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <Stars rating={rating} />
          <p className="text-text-secondary text-sm">{author}</p>
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

export function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialData[] }) {
  const count = testimonials.length;
  const [pos, setPos] = useState(count);
  const [animated, setAnimated] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef<number | null>(null);
  const visibleCount = useVisibleCount();

  // Wrap detection: after animation ends, silently jump to equivalent position in middle copy
  useEffect(() => {
    if (count === 0) return;
    if (pos >= count * 2) {
      const t = setTimeout(() => {
        setAnimated(false);
        setPos((p) => p - count);
      }, TRANSITION_MS + 20);
      return () => clearTimeout(t);
    }
    if (pos < count) {
      const t = setTimeout(() => {
        setAnimated(false);
        setPos((p) => p + count);
      }, TRANSITION_MS + 20);
      return () => clearTimeout(t);
    }
  }, [pos, count]);

  // Re-enable animation right after a non-animated jump
  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => setAnimated(true), 30);
      return () => clearTimeout(t);
    }
  }, [animated]);

  const advance = useCallback(() => {
    setAnimated(true);
    setPos((p) => p + 1);
  }, []);

  const retreat = useCallback(() => {
    setAnimated(true);
    setPos((p) => p - 1);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTO_MS);
  }, [advance]);

  useEffect(() => {
    if (count === 0) return;
    timerRef.current = setInterval(advance, AUTO_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, advance]);

  const onDragStart = (clientX: number) => { dragStartX.current = clientX; };
  const onDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - clientX;
    if (Math.abs(diff) > DRAG_THRESHOLD) {
      diff > 0 ? advance() : retreat();
      resetTimer();
    }
    dragStartX.current = null;
  };

  const goTo = (index: number) => {
    setAnimated(false);
    setPos(count + index);
    resetTimer();
  };

  if (count === 0) return null;

  const allItems = [...testimonials, ...testimonials, ...testimonials];
  const trackPct = (allItems.length / visibleCount) * 100;
  const itemPct = 100 / allItems.length;
  const translatePct = -(pos / allItems.length) * 100;
  const currentDot = ((pos % count) + count) % count;

  return (
    <>
      <div className="relative px-10">
        <button
          onClick={() => { retreat(); resetTimer(); }}
          aria-label="Anterior"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background-secondary text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
        >
          <ChevronLeft />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex cursor-grab active:cursor-grabbing"
            style={{
              width: `${trackPct}%`,
              transform: `translateX(${translatePct}%)`,
              transition: animated ? `transform ${TRANSITION_MS}ms ease-in-out` : "none",
            }}
            onMouseDown={(e) => onDragStart(e.clientX)}
            onMouseUp={(e) => onDragEnd(e.clientX)}
            onMouseLeave={() => { dragStartX.current = null; }}
            onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
            onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
          >
            {allItems.map((t, i) => (
              <div key={i} style={{ width: `${itemPct}%` }} className="px-2 md:px-3">
                <TestimonialCard {...t} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { advance(); resetTimer(); }}
          aria-label="Próximo"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background-secondary text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
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
              i === currentDot ? "w-6 h-2 bg-gold" : "w-2 h-2 bg-text-secondary/30 hover:bg-text-secondary/60"
            }`}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <a
          href="https://share.google/xdHNXs84SjNMb2jJt"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-6 py-2.5 text-sm font-medium text-text-secondary hover:text-gold hover:border-gold transition-colors duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Deixar uma avaliação no Google
        </a>
      </div>
    </>
  );
}
