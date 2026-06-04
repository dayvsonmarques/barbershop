"use client";

import { useState, useRef } from "react";
import { TeamCard } from "@/components/team-card";

type Barber = {
  id: number;
  name: string;
  bio: string | null;
  photoUrl: string | null;
};

const THRESHOLD = 50;

export function TeamCarousel({ barbers }: { barbers: Barber[] }) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const prev = () => setCurrent((c) => (c - 1 + barbers.length) % barbers.length);
  const next = () => setCurrent((c) => (c + 1) % barbers.length);

  const onStart = (clientX: number) => {
    startX.current = clientX;
    setDragging(true);
    setDragOffset(0);
  };

  const onMove = (clientX: number) => {
    if (!dragging) return;
    setDragOffset(clientX - startX.current);
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragOffset < -THRESHOLD) next();
    else if (dragOffset > THRESHOLD) prev();
    setDragOffset(0);
  };

  return (
    <div>
      <div className="relative">
        {/* Track */}
        <div
          className="overflow-hidden select-none"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={(e) => onStart(e.clientX)}
          onMouseMove={(e) => onMove(e.clientX)}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={(e) => onStart(e.touches[0].clientX)}
          onTouchMove={(e) => onMove(e.touches[0].clientX)}
          onTouchEnd={onEnd}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
              transition: dragging ? "none" : "transform 300ms ease-in-out",
            }}
          >
            {barbers.map((barber) => (
              <div key={barber.id} className="shrink-0 w-full px-10">
                <TeamCard {...barber} />
              </div>
            ))}
          </div>
        </div>

        {/* Seta esquerda */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-0 top-1/3 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-text-primary hover:text-gold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Seta direita */}
        <button
          onClick={next}
          aria-label="Próximo"
          className="absolute right-0 top-1/3 -translate-y-1/2 flex items-center justify-center w-8 h-8 text-text-primary hover:text-gold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Dots */}
      {barbers.length > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {barbers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Ir para barbeiro ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === current ? "bg-gold" : "bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
