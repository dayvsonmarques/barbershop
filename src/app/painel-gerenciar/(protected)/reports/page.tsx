"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PERIODS = [
  { key: "4w",  label: "4 semanas" },
  { key: "3m",  label: "3 meses" },
  { key: "6m",  label: "6 meses" },
  { key: "12m", label: "12 meses" },
];

type ReportsData = {
  stats: {
    total: number;
    confirmed: number;
    cancelled: number;
    cancelRate: number;
    uniqueClients: number;
    newClients: number;
    returningClients: number;
  };
  volume: { label: string; total: number; confirmed: number }[];
  byDayOfWeek: { label: string; count: number }[];
  byHour: { hour: number; count: number }[];
  topServices: { name: string; count: number }[];
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("3m");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports?period=${period}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [period]);

  const s = data?.stats;
  const maxDay  = data ? Math.max(...data.byDayOfWeek.map((d) => d.count), 1) : 1;
  const maxSvc  = data ? Math.max(...data.topServices.map((s) => s.count), 1) : 1;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-1 text-sm text-gray-500">Desempenho e análise dos seus agendamentos.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === p.key
                  ? "bg-white text-[#C9A84C] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarIcon />}
          label="Total de agendamentos"
          value={s?.total ?? 0}
          sub="no período"
          loading={loading}
        />
        <StatCard
          icon={<CheckIcon />}
          label="Confirmados"
          value={s?.confirmed ?? 0}
          sub={`${s && s.total > 0 ? Math.round((s.confirmed / s.total) * 100) : 0}% do total`}
          loading={loading}
          green
        />
        <StatCard
          icon={<XIcon />}
          label="Taxa de cancelamento"
          value={`${s?.cancelRate ?? 0}%`}
          sub={`${s?.cancelled ?? 0} cancelados`}
          loading={loading}
        />
        <StatCard
          icon={<UsersIcon />}
          label="Clientes únicos"
          value={s?.uniqueClients ?? 0}
          sub={`${s?.returningClients ?? 0} recorrentes`}
          loading={loading}
        />
      </div>

      {/* Volume chart */}
      <div className="bg-white border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-4">Volume de agendamentos</p>
        {!loading && data && data.volume.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.volume} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 0, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="confirmed" name="Confirmados" stroke="#C9A84C" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="total" name="Total" stroke="#E5E5E5" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty loading={loading} height={240} />
        )}
      </div>

      {/* Busiest days + Peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dias mais movimentados */}
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <p className="text-sm font-semibold text-gray-900">Dias mais movimentados</p>
          </div>
          {!loading && data ? (
            <div className="space-y-2">
              {data.byDayOfWeek.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className={`text-xs w-8 shrink-0 ${d.count === maxDay && d.count > 0 ? "font-bold text-[#C9A84C]" : "text-gray-500"}`}>
                    {d.label}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${d.count === maxDay && d.count > 0 ? "bg-[#C9A84C]" : "bg-gray-300"}`}
                      style={{ width: maxDay > 0 ? `${(d.count / maxDay) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className={`text-xs w-4 text-right shrink-0 ${d.count === maxDay && d.count > 0 ? "font-bold text-[#C9A84C]" : "text-gray-400"}`}>
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          ) : <Empty loading={loading} height={160} />}
        </div>

        {/* Horários de pico */}
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            <p className="text-sm font-semibold text-gray-900">Horários de pico</p>
          </div>
          {!loading && data && data.byHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={data.byHour.map((h) => ({ label: `${h.hour}h`, count: h.count }))}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 0, fontSize: 12 }}
                  formatter={(v: number) => [v, "Agendamentos"]}
                />
                <Bar dataKey="count" name="Agendamentos" fill="#C9A84C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty loading={loading} height={160} />}
        </div>
      </div>

      {/* Top services + Client profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Serviços mais solicitados */}
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <p className="text-sm font-semibold text-gray-900">Serviços mais solicitados</p>
          </div>
          {!loading && data && data.topServices.length > 0 ? (
            <div className="space-y-3">
              {data.topServices.map((svc, i) => (
                <div key={svc.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#C9A84C] w-5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate">{svc.name}</span>
                      <span className="text-xs font-semibold text-gray-500 ml-2 shrink-0">{svc.count}x</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C9A84C] rounded-full"
                        style={{ width: `${(svc.count / maxSvc) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty loading={loading} height={160} />}
        </div>

        {/* Perfil de clientes */}
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <p className="text-sm font-semibold text-gray-900">Perfil de clientes</p>
          </div>
          {!loading && s ? (
            <>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Novos vs. Recorrentes</span>
                <span>{s.uniqueClients} únicos</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-gray-100 flex mb-2">
                {s.uniqueClients > 0 && (
                  <>
                    <div
                      className="h-full bg-[#C9A84C]"
                      style={{ width: `${(s.newClients / s.uniqueClients) * 100}%` }}
                    />
                    <div
                      className="h-full bg-[#A07830]"
                      style={{ width: `${(s.returningClients / s.uniqueClients) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
                  Novos ({s.newClients})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A07830]" />
                  Recorrentes ({s.returningClients})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-[#FDF8EE] p-3 text-center">
                  <p className="text-xl font-bold text-[#C9A84C]">{s.newClients}</p>
                  <p className="text-xs font-semibold text-[#C9A84C] mt-0.5">Novos clientes</p>
                  <p className="text-xs text-gray-400">1ª visita</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">{s.returningClients}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">Recorrentes</p>
                  <p className="text-xs text-gray-400">
                    {s.uniqueClients > 0 ? Math.round((s.returningClients / s.uniqueClients) * 100) : 0}% de retenção
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 text-center">
                <div>
                  <p className="text-base font-bold text-[#C9A84C]">{s.total - s.confirmed - s.cancelled}</p>
                  <p className="text-xs text-gray-400">Pendentes</p>
                </div>
                <div>
                  <p className="text-base font-bold text-green-600">{s.confirmed}</p>
                  <p className="text-xs text-gray-400">Confirmados</p>
                </div>
                <div>
                  <p className="text-base font-bold text-red-500">{s.cancelled}</p>
                  <p className="text-xs text-gray-400">Cancelados</p>
                </div>
              </div>
            </>
          ) : <Empty loading={loading} height={200} />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, loading, green }: {
  icon: React.ReactNode; label: string; value: number | string; sub: string; loading: boolean; green?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${green ? "bg-green-50" : "bg-[#FDF8EE]"}`}>
          <span className={green ? "text-green-600" : "text-[#C9A84C]"}>{icon}</span>
        </div>
      </div>
      <p className={`text-2xl font-bold leading-none ${loading ? "opacity-30" : ""} ${green ? "text-green-600" : "text-gray-900"}`}>
        {loading ? "—" : value}
      </p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function Empty({ loading, height }: { loading: boolean; height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
      {loading ? "Carregando..." : "Sem dados no período"}
    </div>
  );
}

function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
}
function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
