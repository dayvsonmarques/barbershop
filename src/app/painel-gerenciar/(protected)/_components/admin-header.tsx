"use client";

export function AdminHeader({
  title,
  onToggleSidebar,
}: {
  title: string;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-4 shadow-1 md:px-6 2xl:px-10">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg border border-stroke px-2 py-1.5 text-sm text-dark hover:bg-gray-2 lg:hidden"
        aria-label="Abrir menu"
      >
        Menu
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-dark md:text-heading-6">
          {title}
        </h1>
        <p className="hidden text-sm font-medium text-dark-6 md:block">
          Painel administrativo
        </p>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/api/auth/logout"
          className="rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2"
        >
          Sair
        </a>
      </div>
    </header>
  );
}
