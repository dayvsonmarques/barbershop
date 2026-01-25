"use client";

import Image from "next/image";
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
      <div
        className={
          "container mx-auto relative flex items-center justify-between px-4 " +
          (isFixed ? "h-20" : "h-16")
        }
      >
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-wide text-white md:hidden">
            ED <span className="text-yellow-500">Barbearia</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Menu principal">
            <a
              href="#sobre"
              className={
                (isFixed ? "text-base" : "text-sm") +
                " font-medium text-white/90 hover:text-yellow-500"
              }
            >
              SOBRE
            </a>
            <a
              href="#servicos"
              className={
                (isFixed ? "text-base" : "text-sm") +
                " font-medium text-white/90 hover:text-yellow-500"
              }
            >
              SERVIÇOS
            </a>
            <a
              href="#local"
              className={
                (isFixed ? "text-base" : "text-sm") +
                " font-medium text-white/90 hover:text-yellow-500"
              }
            >
              LOCALIZAÇÃO
            </a>
            <a
              href="#contato"
              className={
                (isFixed ? "text-base" : "text-sm") +
                " font-medium text-white/90 hover:text-yellow-500"
              }
            >
              CONTATO
            </a>
          </nav>
        </div>

        <Link
          href="/"
          aria-label="Página inicial"
          className={
            "hidden md:flex absolute left-1/2 -translate-x-1/2 items-center z-50 top-full -translate-y-1/2 " +
            (isFixed ? "" : "mt-8")
          }
        >
          <span className="px-4 py-2">
            <Image
              src="/barbershop-logo.png"
              alt="ED Barbearia"
              width={160}
              height={160}
              priority
              className={isFixed ? "h-32 w-32" : "h-40 w-40"}
            />
          </span>
        </Link>

        <Link
          href="/agendar"
          className={
            "inline-flex items-center gap-2 rounded-lg bg-yellow-500 font-semibold text-black hover:bg-yellow-600 " +
            (isFixed ? "px-5 py-3 text-base" : "px-4 py-2 text-sm")
          }
        >
          <svg
            className={isFixed ? "h-6 w-6" : "h-5 w-5"}
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
