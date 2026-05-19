// src/components/navbar.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "#servicos", label: "Serviços" },
  { href: "#sobre", label: "Sobre" },
  { href: "#equipe", label: "Equipe" },
  { href: "#local", label: "Localização" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background-primary/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
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

        {/* Logo centralizada (absoluta) */}
        <Link
          href="/"
          aria-label="ED Barbearia — Página inicial"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <Image
            src="/barbershop-logo.png"
            alt="ED Barbearia"
            width={48}
            height={48}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Right: CTA desktop + hamburger mobile */}
        <div className="flex items-center gap-4">
          <Link href="/agendar" className="hidden md:block">
            <Button variant="primary" size="sm">
              Agendar
            </Button>
          </Link>

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
