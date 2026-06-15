"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSidebarContext } from "./sidebar-context";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; exact?: boolean; icon: React.ReactNode };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      {
        href: "/painel-gerenciar",
        label: "Painel Geral",
        exact: true,
        icon: (

          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/bookings",
        label: "Agendamentos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/queue",
        label: "Fila de Espera",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><circle cx="19" cy="5" r="3" fill="currentColor" fillOpacity=".15"/>
            <path d="M19 3v4M17 5h4" strokeWidth="1.5"/>
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/atendimentos",
        label: "Atendimentos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/revenue",
        label: "Faturamento",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/reports",
        label: "Relatórios",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        href: "/painel-gerenciar/customers",
        label: "Clientes",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
            <path d="M16 3.13a4 4 0 010 7.75" strokeDasharray="2 2"/>
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/barbers",
        label: "Profissionais",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/services",
        label: "Serviços",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M14.5 3.5c0 0-1 1-1 4s1 4 1 4m-5-8s1 1 1 4-1 4-1 4M5 14l2.5 5.5L10 17l2 2.5 2-2.5 2.5 2.5L19 14" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/availability",
        label: "Disponibilidade",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/products",
        label: "Produtos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/orders",
        label: "Pedidos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/courses",
        label: "Cursos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/testimonials",
        label: "Depoimentos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Acesso",
    items: [
      {
        href: "/painel-gerenciar/groups",
        label: "Grupos",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        ),
      },
      {
        href: "/painel-gerenciar/users",
        label: "Usuários",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/painel-gerenciar/settings",
        label: "Configurações",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchCount = () =>
      fetch("/api/admin/queue")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setPendingCount(d.count); })
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "shrink-0 overflow-hidden bg-white border-r border-[#E5E5E5] transition-[width] duration-200 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-60" : "w-0",
        )}
        aria-label="Navegação principal"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[#E5E5E5]">
            <Link
              href="/"
              onClick={() => isMobile && toggleSidebar()}
              className="flex items-center gap-3"
            >
              <Image
                src="/barbershop-logo.png"
                alt="ED Barbearia"
                width={34}
                height={34}
                className="object-contain rounded-full"
              />
              <div>
                <p className="text-sm font-bold text-[#18181B] leading-tight tracking-tight">ED Barbearia</p>
                <p className="text-[11px] text-[#A1A1AA] leading-tight font-medium tracking-wide uppercase">Painel Admin</p>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => isMobile && setIsOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 border-l-2",
                          isActive
                            ? "bg-[#FDF8EE] text-[#C9A84C] border-[#C9A84C]"
                            : "text-[#52525B] border-transparent hover:bg-[#FDF8EE] hover:text-[#C9A84C] hover:translate-x-0.5",
                        )}
                      >
                        <span className={cn(
                          "transition-all duration-200",
                          isActive ? "text-[#C9A84C]" : "text-[#A1A1AA] group-hover:text-[#C9A84C] group-hover:scale-110",
                        )}>
                          {item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {item.href === "/painel-gerenciar/queue" && pendingCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {pendingCount > 99 ? "99+" : pendingCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-[#E5E5E5]">
            <a
              href="/api/auth/logout"
              className="group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold text-[#52525B] hover:bg-red-50 hover:text-red-600 transition-all duration-200 border-l-2 border-transparent hover:border-red-400 hover:translate-x-0.5"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                className="text-[#A1A1AA] group-hover:text-red-500 transition-colors duration-200 group-hover:scale-110">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sair
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
