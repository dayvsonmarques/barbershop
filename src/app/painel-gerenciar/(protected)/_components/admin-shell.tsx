"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "./painel-gerenciar-header";
import { AdminSidebar, type AdminNavSection } from "./painel-gerenciar-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nav: AdminNavSection[] = useMemo(
    () => [
      {
        label: "Principal",
        items: [{ href: "/painel-gerenciar", label: "Dashboard", icon: "📊" }],
      },
      {
        label: "Agendamentos",
        items: [
          { href: "/painel-gerenciar/bookings", label: "Agendamentos", icon: "📅" },
          { href: "/painel-gerenciar/professionals", label: "Barbeiros", icon: "💈" },
          { href: "/painel-gerenciar/availability", label: "Disponibilidade", icon: "⏰" },
        ],
      },
      {
        label: "Cadastros",
        items: [
          { href: "/painel-gerenciar/services", label: "Serviços", icon: "✂️" },
          { href: "/painel-gerenciar/products", label: "Produtos", icon: "🛍️" },
          { href: "/painel-gerenciar/orders", label: "Pedidos", icon: "📦" },
          { href: "/painel-gerenciar/courses", label: "Cursos", icon: "🎓" },
        ],
      },
      {
        label: "Administração",
        items: [
          { href: "/painel-gerenciar/users", label: "Usuários", icon: "👥" },
          { href: "/painel-gerenciar/settings", label: "Configurações", icon: "⚙️" },
        ],
      },
    ],
    [],
  );

  const pageTitle = useMemo(() => getAdminTitleFromPath(pathname), [pathname]);

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(
    () => setIsSidebarOpen((prev) => !prev),
    [],
  );

  return (
    <div className="flex min-h-screen bg-gray-2 text-dark-5">
      <AdminSidebar
        nav={nav}
        pathname={pathname}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="w-full">
        <AdminHeader title={pageTitle} onToggleSidebar={toggleSidebar} />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function getAdminTitleFromPath(pathname: string): string {
  const normalized = pathname.replace(/\/$/, "");
  if (normalized === "/painel-gerenciar") return "Dashboard";

  const titles: Record<string, string> = {
    "/painel-gerenciar/bookings": "Agendamentos",
    "/painel-gerenciar/professionals": "Barbeiros",
    "/painel-gerenciar/availability": "Disponibilidade",
    "/painel-gerenciar/services": "Serviços",
    "/painel-gerenciar/products": "Produtos",
    "/painel-gerenciar/orders": "Pedidos",
    "/painel-gerenciar/courses": "Cursos",
    "/painel-gerenciar/users": "Usuários",
    "/painel-gerenciar/settings": "Configurações",
  };

  return titles[normalized] ?? "Painel Administrativo";
}
