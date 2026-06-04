"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardData = {
  stats: {
    bookingsToday: number;
    bookingsThisMonth: number;
    revenueThisMonth: number;
    activeBarbers: number;
  };
  charts: {
    bookingsByDay: { day: number; agendamentos: number }[];
    bookingsByBarber: { name: string; agendamentos: number }[];
  };
  upcomingBookings: {
    id: string;
    scheduledAt: string;
    customerName: string;
    service: { name: string; duration: number };
    barber: { name: string };
  }[];
};

const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E2C068";

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          window.location.href = "/admin/login";
          return;
        }
        if (!r.ok) throw new Error("Falha ao carregar dados");
        return r.json() as Promise<DashboardData>;
      })
      .then((data) => { if (data) setData(data); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const monthName = new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#71717A] text-sm">
        Carregando…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? "Erro desconhecido"}
      </div>
    );
  }

  const { stats, charts, upcomingBookings } = data;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hoje" value={String(stats.bookingsToday)} sub="agendamentos" />
        <StatCard
          label={monthName}
          value={String(stats.bookingsThisMonth)}
          sub="agendamentos"
        />
        <StatCard
          label="Receita do mês"
          value={`R$ ${stats.revenueThisMonth.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
          sub="confirmados"
        />
        <StatCard label="Barbeiros ativos" value={String(stats.activeBarbers)} sub="na equipe" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Bookings by day — larger */}
        <div className="xl:col-span-3 bg-white border border-[#E5E5E5] p-5">
          <p className="text-sm font-semibold text-[#18181B] mb-1">
            Agendamentos por dia
          </p>
          <p className="text-xs text-[#71717A] mb-4 capitalize">{monthName}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts.bookingsByDay} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#A1A1AA" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#A1A1AA" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #E5E5E5",
                  borderRadius: 0,
                  fontSize: 12,
                }}
                labelFormatter={(v) => `Dia ${v}`}
                formatter={(v) => [v, "Agendamentos"]}
              />
              <Line
                type="monotone"
                dataKey="agendamentos"
                stroke={GOLD}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: GOLD }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by barber */}
        <div className="xl:col-span-2 bg-white border border-[#E5E5E5] p-5">
          <p className="text-sm font-semibold text-[#18181B] mb-1">
            Agendamentos por barbeiro
          </p>
          <p className="text-xs text-[#71717A] mb-4 capitalize">{monthName}</p>
          {charts.bookingsByBarber.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-[#A1A1AA]">
              Nenhum agendamento ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={charts.bookingsByBarber}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#A1A1AA" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 11, fill: "#52525B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E5E5",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                  formatter={(v) => [v, "Agendamentos"]}
                />
                <Bar dataKey="agendamentos" fill={GOLD_LIGHT} radius={0} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-white border border-[#E5E5E5] p-5">
        <p className="text-sm font-semibold text-[#18181B] mb-4">
          Próximos agendamentos
        </p>
        {upcomingBookings.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">Nenhum agendamento futuro</p>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {upcomingBookings.map((b) => {
              const dt = new Date(b.scheduledAt);
              const date = dt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              });
              const time = dt.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div key={b.id} className="flex items-center gap-4 py-3">
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-[#C9A84C]">{time}</p>
                    <p className="text-xs text-[#A1A1AA]">{date}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#18181B] truncate">
                      {b.customerName}
                    </p>
                    <p className="text-xs text-[#71717A] truncate">
                      {b.service.name} · {b.barber.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-[#A1A1AA]">
                    {b.service.duration} min
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white border border-[#E5E5E5] p-5">
      <p className="text-xs text-[#71717A] uppercase tracking-wide truncate">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#18181B] leading-none">{value}</p>
      <p className="mt-1 text-xs text-[#A1A1AA]">{sub}</p>
    </div>
  );
}
