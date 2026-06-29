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
          aria-label="Página inicial"
          className={[
            "absolute inset-x-0 mx-auto w-fit top-0 z-20",
            "transition-all duration-300 ease-in-out",
            isCompact ? "translate-y-2 bg-background-primary rounded-full overflow-hidden" : "",
          ].join(" ")}
        >
          <Image
            src="/barbershop-logo.png"
            alt="Logo"
            width={128}
            height={128}
            priority
            className={[
              "w-auto object-contain drop-shadow-lg transition-[height] duration-300 ease-in-out",
              isCompact ? "rounded-full scale-110" : "mix-blend-screen",
              isCompact ? "h-20" : "h-40",
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
