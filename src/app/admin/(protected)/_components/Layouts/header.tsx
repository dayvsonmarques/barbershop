"use client";

import { usePathname } from "next/navigation";
import { useSidebarContext } from "./sidebar/sidebar-context";

const pageTitles: Record<string, string> = {
  "/admin": "Painel Geral",
  "/admin/bookings":     "Agendamentos",
  "/admin/atendimentos": "Atendimentos",
  "/admin/customers":    "Clientes",
  "/admin/queue":    "Fila de Espera",
  "/admin/revenue":  "Faturamento",
  "/admin/reports":  "Relatórios",
  "/admin/barbers": "Profissionais",
  "/admin/services": "Serviços",
  "/admin/availability": "Disponibilidade",
  "/admin/products": "Produtos",
  "/admin/orders": "Pedidos",
  "/admin/courses": "Cursos",
  "/admin/testimonials": "Depoimentos",
  "/admin/groups": "Grupos",
  "/admin/users": "Usuários",
  "/admin/settings": "Configurações",
};

export function Header() {
  const { toggleSidebar } = useSidebarContext();
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Admin";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 bg-white border-b border-[#E5E5E5] px-6 py-0 h-14">
      <button
        type="button"
        onClick={toggleSidebar}
        className="p-1.5 rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors"
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className="text-sm font-semibold text-[#18181B]">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <a
          href="/"
          className="text-xs text-[#71717A] hover:text-[#18181B] transition-colors px-2 py-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver site ↗
        </a>
        <div className="w-px h-4 bg-[#E5E5E5]" />
        <a
          href="/api/auth/logout"
          className="text-xs font-medium text-[#71717A] hover:text-[#18181B] transition-colors px-2 py-1"
        >
          Sair
        </a>
      </div>
    </header>
  );
}
