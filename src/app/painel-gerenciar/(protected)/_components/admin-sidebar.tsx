"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  href: string;
  label: string;
  icon?: string;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export function AdminSidebar({
  nav,
  pathname,
  isOpen,
  onClose,
}: {
  nav: AdminNavSection[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        className={cn(
          "z-50 w-72 overflow-hidden border-r border-stroke bg-white shadow-card-2 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          isOpen ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full",
        )}
        aria-label="Navegação do admin"
      >
        <div className="flex h-full flex-col py-8 pl-6 pr-3">
          <div className="flex items-center justify-between pr-2">
            <Link href="/painel-gerenciar" className="text-lg font-bold text-dark">
              ED Barbearia
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stroke px-2 py-1 text-sm text-dark hover:bg-gray-2 lg:hidden"
            >
              Fechar
            </button>
          </div>

          <div className="custom-scrollbar mt-8 flex-1 overflow-y-auto pr-2">
            {nav.map((section) => (
              <div key={section.label} className="mb-8">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-dark-6">
                  {section.label}
                </h2>

                <ul className="space-y-2">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/painel-gerenciar" && pathname.startsWith(item.href));

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-white"
                              : "text-dark hover:bg-gray-2",
                          )}
                          onClick={onClose}
                        >
                          {item.icon ? (
                            <span className="text-lg" aria-hidden="true">
                              {item.icon}
                            </span>
                          ) : null}
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-stroke pt-4">
            <a
              href="/api/auth/logout"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2"
            >
              <span>Sair</span>
              <span aria-hidden="true">🚪</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
