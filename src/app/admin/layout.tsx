export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">ED Barbearia</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <NavLink href="/admin" icon="📊">
              Dashboard
            </NavLink>
            
            <div className="pt-4 text-xs font-semibold uppercase text-gray-500">
              Agendamentos
            </div>
            <NavLink href="/admin/bookings" icon="📅">
              Agendamentos
            </NavLink>
            <NavLink href="/admin/barbers" icon="💈">
              Barbeiros
            </NavLink>
            <NavLink href="/admin/availability" icon="🕐">
              Disponibilidade
            </NavLink>

            <div className="pt-4 text-xs font-semibold uppercase text-gray-500">
              Cadastros
            </div>
            <NavLink href="/admin/services" icon="✂️">
              Serviços
            </NavLink>
            <NavLink href="/admin/products" icon="🛍️">
              Produtos
            </NavLink>
            <NavLink href="/admin/courses" icon="🎓">
              Cursos
            </NavLink>

            <div className="pt-4 text-xs font-semibold uppercase text-gray-500">
              Administração
            </div>
            <NavLink href="/admin/users" icon="👥">
              Usuários
            </NavLink>
            <NavLink href="/admin/groups" icon="🔐">
              Grupos
            </NavLink>
            <NavLink href="/admin/settings" icon="⚙️">
              Configurações
            </NavLink>
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                <span className="text-sm font-medium">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">admin@edbarbearia.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Painel Administrativo</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="rounded-lg p-2 hover:bg-gray-100">
              <span className="text-gray-600">🔔</span>
            </button>
            <button className="rounded-lg p-2 hover:bg-gray-100">
              <span className="text-gray-600">🚪</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    >
      <span className="text-lg">{icon}</span>
      <span>{children}</span>
    </a>
  );
}
