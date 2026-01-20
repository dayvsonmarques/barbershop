"use client";

import Link from "next/link";

export function AgendarHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-wide text-white">
          ED <span className="text-yellow-500">Barbearia</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
          <Link href="/#sobre" className="text-sm font-medium text-white/90 hover:text-yellow-500">
            Sobre
          </Link>
          <Link
            href="/#diferenciais"
            className="text-sm font-medium text-white/90 hover:text-yellow-500"
          >
            Diferenciais
          </Link>
          <Link
            href="/#instagram"
            className="text-sm font-medium text-white/90 hover:text-yellow-500"
          >
            Instagram
          </Link>
          <Link href="/#local" className="text-sm font-medium text-white/90 hover:text-yellow-500">
            Local
          </Link>
        </nav>

        <Link
          href="/agendar"
          aria-current="page"
          className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-600"
        >
          Agendar
        </Link>
      </div>
    </header>
  );
}
