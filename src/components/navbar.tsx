"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/components/ui/calendar-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/contexts/cart-context";
import { useCustomerAuth } from "@/contexts/customer-auth-context";
import { CustomerLoginModal } from "@/components/customer-login-modal";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "#sobre", label: "Sobre Nós" },
  { href: "#servicos", label: "Serviços" },
  { href: "#loja", label: "Loja" },
  { href: "#equipe", label: "Equipe" },
  { href: "#local", label: "Localização" },
  { href: "#depoimentos", label: "Depoimentos" },
];

const CLOSE_DURATION = 280;

export function Navbar() {
  const { totalItems } = useCart();
  const { customer, logout } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isCompact = !isHome || scrolled;

  const closeMenu = (afterClose?: () => void) => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      afterClose?.();
    }, CLOSE_DURATION);
  };

  const handleNavClick = (href: string) => {
    if (!href.startsWith("#")) {
      closeMenu(() => router.push(href));
      return;
    }
    closeMenu(() => {
      if (pathname !== "/") {
        router.push("/" + href);
        return;
      }
      const el = document.getElementById(href.slice(1));
      if (el) {
        const offset = 72; // altura da navbar compact
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  };

  return (
    <>
    <nav
      className={[
        "z-50 w-full transition-[height,border-color,background-color] duration-300 ease-in-out",
        isCompact ? "bg-background-primary/95 backdrop-blur-sm" : "bg-transparent",
        isCompact ? "border-b border-border" : "border-b border-transparent",
        isHome ? (isCompact ? "fixed top-0" : "absolute top-0") : "sticky top-0",
        isCompact ? "h-16" : "h-28",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center relative">
        {/* Esquerda: hamburger + theme toggle */}
        <div className="flex items-center gap-1">
          <button
            className={`p-2 -ml-2 hover:text-gold transition-colors duration-200 ${isCompact ? "text-text-primary" : "text-white"}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <ThemeToggle className={isCompact ? "text-text-secondary" : "text-white"} />
        </div>

        {/* Logo centrada */}
        <Link
          href="/"
          aria-label="ED Barbearia — Página inicial"
          className={[
            "absolute left-1/2 -translate-x-1/2 top-0 z-20",
            "transition-all duration-300 ease-in-out",
            isCompact ? "translate-y-4 bg-background-primary rounded-full overflow-hidden" : "",
          ].join(" ")}
        >
          <Image
            src="/barbershop-logo.png"
            alt="ED Barbearia"
            width={128}
            height={128}
            priority
            className={[
              "w-auto object-contain drop-shadow-lg transition-[height] duration-300 ease-in-out",
              isCompact ? "rounded-full" : "mix-blend-screen p-3.5",
              isCompact ? "h-24" : "h-44",
            ].join(" ")}
          />
        </Link>

        {/* Direita: Agendar (desktop) + ThemeToggle + Carrinho */}
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/agendar" className="hidden sm:block">
            <Button variant="primary" size="sm" className="font-bold">
              <CalendarIcon size={13} />
              Agendar
            </Button>
          </Link>

          {customer ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                title={customer.name}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-background-primary text-xs font-bold hover:opacity-80 transition-opacity"
              >
                {customer.name.charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-44 bg-background-primary border border-border shadow-lg py-1">
                    <p className="px-4 py-2 text-xs text-text-secondary truncate border-b border-border">{customer.name}</p>
                    <Link
                      href="/meus-pedidos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:text-gold hover:bg-background-secondary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                        <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
                      </svg>
                      Pedidos
                    </Link>
                    <div className="border-t border-border mt-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-red-500 hover:bg-background-secondary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              aria-label="Entrar"
              className={`hover:text-gold transition-colors ${isCompact ? "text-text-primary" : "text-white"}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
              </svg>
            </button>
          )}

          <Link href="/carrinho" className={`relative flex items-center hover:text-gold transition-colors ${isCompact ? "text-text-primary" : "text-white"}`} aria-label="Carrinho">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex min-w-[1.1rem] h-[1.1rem] px-0.5 items-center justify-center rounded-full bg-gold text-background-primary text-[10px] font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

    </nav>

    {/* Overlay fullscreen */}
    {mounted && open && createPortal(
      <div
        className={[
          "fixed inset-0 z-50 w-screen h-screen bg-background-primary flex flex-col items-center justify-center",
          "transition-[opacity,transform] ease-in-out",
          closing
            ? `opacity-0 scale-[0.98] duration-[${CLOSE_DURATION}ms]`
            : "opacity-100 scale-100 duration-200",
        ].join(" ")}
        style={{ transitionDuration: closing ? `${CLOSE_DURATION}ms` : "200ms" }}
      >
        {/* Barra superior espelhando exatamente a navbar para alinhar o botão fechar com o hamburger */}
        <div className="absolute top-0 left-0 right-0 h-16 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <button
              className="text-text-primary p-2 -ml-2 hover:text-gold transition-colors duration-200"
              onClick={() => closeMenu()}
              aria-label="Fechar menu"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex flex-col items-center gap-5 mb-8">
          {navLinks.map((link, i) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="font-heading uppercase tracking-widest text-text-primary hover:text-gold transition-colors duration-200 animate-fade-in"
              style={{
                fontSize: "clamp(1.25rem, 4vw, 2rem)",
                animationDelay: `${i * 50}ms`,
                animationFillMode: "both",
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="w-10 h-px bg-border mb-6" />

        <div className="flex items-center gap-6 mb-6">
          <a
            href="https://instagram.com/edbarbearia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-gold transition-colors duration-200"
            aria-label="Instagram"
          >
            <svg width="44" height="44" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>

          <a
            href="https://wa.me/5581999623374"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-gold transition-colors duration-200"
            aria-label="WhatsApp"
          >
            <svg width="44" height="44" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
        </div>

        <Link href="/agendar" onClick={() => closeMenu()}>
          <Button variant="primary" size="lg">
            <CalendarIcon size={16} />
            Agendar Horário
          </Button>
        </Link>

        <div className="mt-6">
          {customer ? (
            <button
              onClick={() => { logout(); closeMenu(); }}
              className="text-text-secondary text-sm hover:text-gold transition-colors"
            >
              Sair ({customer.name})
            </button>
          ) : (
            <button
              onClick={() => { closeMenu(() => setShowLogin(true)); }}
              className="text-text-secondary text-sm hover:text-gold transition-colors"
            >
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </div>,
      document.body
    )}

    {showLogin && <CustomerLoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
