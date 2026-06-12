"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const GOLD = "#C9A84C";
const PERIODS = [
  { key: "this_month", label: "Este mês" },
  { key: "last_month", label: "Mês passado" },
  { key: "this_year",  label: "Este ano" },
  { key: "all",        label: "Todo período" },
];

type RevenueData = {
  label: string;
  total: number;
  count: number;
  avg: number;
  byBarber:  { name: string; revenue: number; count: number }[];
  byService: { name: string; revenue: number; count: number }[];
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RevenuePage() {
  const [period, setPeriod] = useState("this_month");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?period=${period}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `Período: ${data.label}` : "Carregando..."}
          </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Faturamento total" value={`R$ ${fmt(data?.total ?? 0)}`} sub="no período" loading={loading} highlight />
        <KpiCard label="Agendamentos" value={String(data?.count ?? 0)} sub="realizados" loading={loading} />
        <KpiCard label="Ticket médio" value={`R$ ${fmt(data?.avg ?? 0)}`} sub="por atendimento" loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* By barber */}
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Por profissional</p>
          {!loading && data && data.byBarber.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byBarber} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#52525B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 0, fontSize: 12 }}
                    formatter={(v: number) => [`R$ ${fmt(v)}`, "Faturamento"]}
                  />
                  <Bar dataKey="revenue" fill={GOLD} radius={0} />
                </BarChart>
              </ResponsiveContainer>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="text-left pb-2">Profissional</th>
                    <th className="text-right pb-2">Atendimentos</th>
                    <th className="text-right pb-2">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.byBarber.map((row) => (
                    <tr key={row.name}>
                      <td className="py-2 text-gray-700 font-medium">{row.name}</td>
                      <td className="py-2 text-right text-gray-500">{row.count}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">R$ {fmt(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <Empty loading={loading} />
          )}
        </div>

        {/* By service */}
        <div className="bg-white border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Por serviço</p>
          {!loading && data && data.byService.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byService} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: "#A1A1AA" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#52525B" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 0, fontSize: 12 }}
                    formatter={(v: number) => [`R$ ${fmt(v)}`, "Faturamento"]}
                  />
                  <Bar dataKey="revenue" fill="#E2C068" radius={0} />
                </BarChart>
              </ResponsiveContainer>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="text-left pb-2">Serviço</th>
                    <th className="text-right pb-2">Qtd.</th>
                    <th className="text-right pb-2">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.byService.map((row) => (
                    <tr key={row.name}>
                      <td className="py-2 text-gray-700 font-medium">{row.name}</td>
                      <td className="py-2 text-right text-gray-500">{row.count}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">R$ {fmt(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <Empty loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, loading, highlight }: {
  label: string; value: string; sub: string; loading: boolean; highlight?: boolean;
}) {
  return (
    <div className={`bg-white border p-5 ${highlight ? "border-[#C9A84C]/40" : "border-gray-200"}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-2xl font-bold leading-none ${highlight ? "text-[#C9A84C]" : "text-gray-900"} ${loading ? "opacity-40" : ""}`}>
        {loading ? "—" : value}
      </p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
      {loading ? "Carregando..." : "Sem dados no período"}
    </div>
  );
}
