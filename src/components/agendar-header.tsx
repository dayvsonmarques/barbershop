"use client";

import Image from "next/image";
import Link from "next/link";

export function AgendarHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="container mx-auto relative flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-wide text-white md:hidden">
            ED <span className="text-yellow-500">Barbearia</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
            <Link
              href="/#sobre"
              className="text-base font-medium text-white/90 hover:text-yellow-500"
            >
              SOBRE
            </Link>
            <Link
              href="/#servicos"
              className="text-base font-medium text-white/90 hover:text-yellow-500"
            >
              SERVIÇOS
            </Link>
            <Link
              href="/#local"
              className="text-base font-medium text-white/90 hover:text-yellow-500"
            >
              LOCALIZAÇÃO
            </Link>
            <Link
              href="/#contato"
              className="text-base font-medium text-white/90 hover:text-yellow-500"
            >
              CONTATO
            </Link>
          </nav>
        </div>

        <Link
          href="/"
          aria-label="Página inicial"
          className="hidden md:flex absolute left-1/2 top-full mt-4 -translate-x-1/2 -translate-y-1/2 items-center z-50"
        >
          <span className="px-4 py-2">
            <Image
              src="/barbershop-logo.png"
              alt="ED Barbearia"
              width={160}
              height={160}
              priority
              className="h-32 w-32"
            />
          </span>
        </Link>

        <Link
          href="/agendar"
          aria-current="page"
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-3 text-base font-semibold text-black hover:bg-yellow-600"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
          </svg>
          Agendar
        </Link>
      </div>
    </header>
  );
}
