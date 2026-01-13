export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 text-sm text-gray-500">
          <li className="inline-flex items-center">
            <span className="font-medium">Dashboard</span>
          </li>
        </ol>
      </nav>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Visão geral do sistema
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Agendamentos Hoje"
          value="12"
          icon="📅"
          trend="+20%"
          trendUp={true}
        />
        <StatCard
          title="Novos Clientes"
          value="8"
          icon="👤"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Receita do Mês"
          value="R$ 8.450"
          icon="💰"
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Taxa de Ocupação"
          value="85%"
          icon="📊"
          trend="-3%"
          trendUp={false}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Próximos Agendamentos
          </h3>
          <div className="mt-4 space-y-4">
            <AppointmentItem
              time="09:00"
              client="João Silva"
              service="Corte + Barba"
              barber="Eduardo"
            />
            <AppointmentItem
              time="10:00"
              client="Pedro Santos"
              service="Corte Simples"
              barber="Carlos"
            />
            <AppointmentItem
              time="11:00"
              client="Lucas Oliveira"
              service="Barba Completa"
              barber="Eduardo"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Atividades Recentes
          </h3>
          <div className="mt-4 space-y-4">
            <ActivityItem
              action="Novo agendamento"
              description="João Silva agendou Corte + Barba"
              time="5 min atrás"
            />
            <ActivityItem
              action="Agendamento confirmado"
              description="Pedro Santos confirmado para 10:00"
              time="15 min atrás"
            />
            <ActivityItem
              action="Novo cliente"
              description="Lucas Oliveira cadastrado no sistema"
              time="1 hora atrás"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-sm font-medium ${
            trendUp ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AppointmentItem({
  time,
  client,
  service,
  barber,
}: {
  time: string;
  client: string;
  service: string;
  barber: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <span className="font-semibold text-blue-600">{time}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{client}</p>
          <p className="text-sm text-gray-500">
            {service} • {barber}
          </p>
        </div>
      </div>
      <button className="rounded-lg px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50">
        Ver
      </button>
    </div>
  );
}

function ActivityItem({
  action,
  description,
  time,
}: {
  action: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
        <span className="text-sm">📝</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{action}</p>
        <p className="text-sm text-gray-500">{description}</p>
        <p className="mt-1 text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}
