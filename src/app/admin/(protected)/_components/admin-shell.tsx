"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "./admin-header";
import { AdminSidebar, type AdminNavSection } from "./admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nav: AdminNavSection[] = useMemo(
    () => [
      {
        label: "Principal",
        items: [{ href: "/admin", label: "Dashboard", icon: "📊" }],
      },
      {
        label: "Agendamentos",
        items: [
          { href: "/admin/bookings", label: "Agendamentos", icon: "📅" },
          { href: "/admin/barbers", label: "Barbeiros", icon: "💈" },
          { href: "/admin/availability", label: "Disponibilidade", icon: "⏰" },
        ],
      },
      {
        label: "Cadastros",
        items: [
          { href: "/admin/services", label: "Serviços", icon: "✂️" },
          { href: "/admin/products", label: "Produtos", icon: "🛍️" },
          { href: "/admin/orders", label: "Pedidos", icon: "📦" },
          { href: "/admin/courses", label: "Cursos", icon: "🎓" },
        ],
      },
      {
        label: "Administração",
        items: [
          { href: "/admin/users", label: "Usuários", icon: "👥" },
          { href: "/admin/settings", label: "Configurações", icon: "⚙️" },
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
  if (normalized === "/admin") return "Dashboard";

  const titles: Record<string, string> = {
    "/admin/bookings": "Agendamentos",
    "/admin/barbers": "Barbeiros",
    "/admin/availability": "Disponibilidade",
    "/admin/services": "Serviços",
    "/admin/products": "Produtos",
    "/admin/orders": "Pedidos",
    "/admin/courses": "Cursos",
    "/admin/users": "Usuários",
    "/admin/settings": "Configurações",
  };

  return titles[normalized] ?? "Painel Administrativo";
}
