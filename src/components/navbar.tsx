// src/components/navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#sobre", label: "Sobre" },
  { href: "#equipe", label: "Equipe" },
  { href: "#local", label: "Localização" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;

    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const isCompact = !isHome || scrolled;

  return (
    <nav
      className={[
        "z-50 w-full bg-background-primary/95 backdrop-blur-sm",
        "transition-[height,border-color] duration-300 ease-in-out",
        isCompact ? "border-b border-border" : "border-b border-transparent",
        isHome ? "fixed top-0" : "sticky top-0",
        isCompact ? "h-16" : "h-28",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">
        {/* Desktop: nav links left */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-gold transition-colors duration-300 text-sm"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Logo centralizada — flutua para fora quando o nav encolhe */}
        <Link
          href="/"
          aria-label="ED Barbearia — Página inicial"
          className="absolute left-1/2 -translate-x-1/2 top-0 z-10"
        >
          <Image
            src="/barbershop-logo.png"
            alt="ED Barbearia"
            width={128}
            height={128}
            priority
            className={[
              "w-auto object-contain drop-shadow-lg transition-[height] duration-300 ease-in-out",
              isCompact ? "h-24" : "h-32",
            ].join(" ")}
          />
        </Link>

        {/* Right: CTA desktop + theme toggle + hamburger mobile */}
        <div className="flex items-center gap-4">
          <Link href="/agendar" className="hidden md:block">
            <Button variant="primary" size="sm">
              Agendar
            </Button>
          </Link>

          <ThemeToggle />

          <button
            className="md:hidden text-text-primary p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background-primary flex flex-col items-center justify-center gap-10 md:hidden">
          <Link href="/" onClick={() => setOpen(false)}>
            <Image
              src="/barbershop-logo.png"
              alt="ED Barbearia"
              width={120}
              height={120}
              className="object-contain"
            />
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-heading text-2xl text-text-primary hover:text-gold transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link href="/agendar" onClick={() => setOpen(false)}>
            <Button variant="primary" size="lg">
              Agendar Horário
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
