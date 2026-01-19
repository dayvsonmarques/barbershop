"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function HomeHeader() {
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = Math.max(80, window.innerHeight - 80);
      setIsFixed(window.scrollY >= threshold);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        isFixed
          ? "fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur"
          : "absolute top-0 left-0 right-0 z-50 bg-transparent"
      }
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-wide text-white">
          ED <span className="text-yellow-500">Barbearia</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
          <a href="#sobre" className="text-sm font-medium text-white/90 hover:text-yellow-500">
            Sobre
          </a>
          <a
            href="#diferenciais"
            className="text-sm font-medium text-white/90 hover:text-yellow-500"
          >
            Diferenciais
          </a>
          <a href="#instagram" className="text-sm font-medium text-white/90 hover:text-yellow-500">
            Instagram
          </a>
          <a href="#local" className="text-sm font-medium text-white/90 hover:text-yellow-500">
            Local
          </a>
        </nav>

        <Link
          href="/agendar"
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-600"
        >
          Agendar
        </Link>
      </div>
    </header>
  );
}
