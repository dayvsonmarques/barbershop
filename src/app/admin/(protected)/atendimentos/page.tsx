"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Atendimento = {
  id: string;
  scheduledAt: string;
  customerName: string;
  customerPhone: string | null;
  service: { id: number; name: string; duration: number; price?: number };
  barber:  { id: number; name: string };
};

type ServiceOption = { id: number; name: string };
type BarberOption  = { id: number; name: string };
type Preset = "today" | "3days" | "7days" | "15days" | "30days" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today",  label: "Hoje" },
  { key: "3days",  label: "3 dias" },
  { key: "7days",  label: "7 dias" },
  { key: "15days", label: "Quinzena" },
  { key: "30days", label: "Mês" },
  { key: "custom", label: "Personalizado" },
];

function localDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function presetDates(preset: Preset, customStart: string, customEnd: string) {
  const today = localDateStr();
  switch (preset) {
    case "today":  return { startDate: today,      endDate: today };
    case "3days":  return { startDate: daysAgo(2), endDate: today };
    case "7days":  return { startDate: daysAgo(6), endDate: today };
    case "15days": return { startDate: daysAgo(14), endDate: today };
    case "30days": return { startDate: daysAgo(29), endDate: today };
    case "custom": return { startDate: customStart, endDate: customEnd };
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const PAGE_SIZE = 50;

export default function AtendimentosPage() {
  const [items,          setItems]          = useState<Atendimento[]>([]);
  const [total,          setTotal]          = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [page,           setPage]           = useState(0);
  const [canViewRevenue, setCanViewRevenue] = useState(false);

  const [search,      setSearch]      = useState("");
  const [barberId,    setBarberId]    = useState("");
  const [serviceId,   setServiceId]   = useState("");
  const [preset,      setPreset]      = useState<Preset>("today");
  const [customStart, setCustomStart] = useState(localDateStr());
  const [customEnd,   setCustomEnd]   = useState(localDateStr());

  const { startDate, endDate } = useMemo(
    () => presetDates(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers,  setBarbers]  = useState<BarberOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/services").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/admin/barbers").then(r => r.json()).then(d => setBarbers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_SIZE),
        ...(search    && { search }),
        ...(barberId  && { barberId }),
        ...(serviceId && { serviceId }),
        ...(startDate && { startDate }),
        ...(endDate   && { endDate }),
      });
      const res = await fetch(`/api/admin/atendimentos?${params}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
      setCanViewRevenue(data.canViewRevenue ?? false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, barberId, serviceId, startDate, endDate]);

  useEffect(() => { load(0); }, [load]);

  const totalRevenue = useMemo(
    () => canViewRevenue ? items.reduce((sum, a) => sum + Number(a.service.price ?? 0), 0) : 0,
    [items, canViewRevenue]
  );

  const avgTicket = items.length > 0 ? totalRevenue / items.length : 0;

  function exportCSV() {
    const headers = ["Data", "Horário", "Cliente", "Telefone", "Serviço", "Profissional", "Duração"];
    if (canViewRevenue) headers.push("Valor");
    const rows = [
      headers,
      ...items.map(a => {
        const row = [
          fmtDate(a.scheduledAt), fmtTime(a.scheduledAt),
          a.customerName, a.customerPhone ?? "",
          a.service.name, a.barber.name,
          `${a.service.duration} min`,
        ];
        if (canViewRevenue) row.push(Number(a.service.price ?? 0).toFixed(2));
        return row;
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `atendimentos-${startDate}_${endDate}.csv`,
    });
    a.click();
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atendimentos</h1>
          <p className="mt-1 text-sm text-gray-500">Histórico de todos os atendimentos concluídos.</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Stats */}
      <div className={`grid gap-3 ${canViewRevenue ? "grid-cols-3" : "grid-cols-1 max-w-xs"}`}>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-3xl font-bold text-green-600 leading-none">{total}</p>
          <p className="text-xs font-semibold text-green-700 mt-1.5">Atendimentos</p>
        </div>
        {canViewRevenue && (
          <>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600 leading-none">
                R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs font-semibold text-blue-700 mt-1.5">Faturamento</p>
            </div>
            <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600 leading-none">
                R$ {avgTicket.toFixed(0)}
              </p>
              <p className="text-xs font-semibold text-yellow-700 mt-1.5">Ticket Médio</p>
            </div>
          </>
        )}
      </div>

      {/* Filter block */}
      <div className="bg-[#F4F4F5] border border-gray-200 rounded-xl p-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Filtros</p>

        {/* Linha 1 — Cliente, Profissional, Serviço */}
        <div className="flex items-end gap-3">
          {/* Search */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Cliente</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 w-full pl-8 pr-3 border border-gray-200 rounded-lg text-sm bg-white placeholder-gray-400 focus:border-[#C9A84C] focus:outline-none transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Barber */}
          {barbers.length > 0 && (
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Profissional</label>
              <div className="relative">
                <select
                  value={barberId}
                  onChange={e => setBarberId(e.target.value)}
                  className="h-9 w-full pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm"
                >
                  <option value="">Todos</option>
                  {barbers.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}

          {/* Service */}
          {services.length > 0 && (
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Serviço</label>
              <div className="relative">
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className="h-9 w-full pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm"
                >
                  <option value="">Todos</option>
                  {services.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}
        </div>

        {/* Linha 2 — Período */}
        <div className="mt-3 pt-3 border-t border-gray-200/70">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Período</label>
              <div className="flex gap-1">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPreset(p.key)}
                    className={`h-9 flex-1 px-3 text-sm rounded-lg border font-medium transition-colors ${
                      preset === p.key
                        ? "bg-[#C9A84C] text-white border-[#C9A84C] shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#C9A84C] hover:text-gray-900 shadow-sm"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date inputs */}
            {preset === "custom" && (
              <>
                <div className="flex flex-col gap-1 shrink-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">De</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                    className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-gray-700 bg-white focus:border-[#C9A84C] focus:outline-none transition-colors shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Até</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                    className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-gray-700 bg-white focus:border-[#C9A84C] focus:outline-none transition-colors shadow-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-sm text-gray-400">Nenhum atendimento encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    {["Data", "Horário", "Cliente", "Serviço", "Profissional", "Duração", ...(canViewRevenue ? ["Valor"] : [])].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {items.map(a => (
                    <tr key={a.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700">{fmtDate(a.scheduledAt)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#C9A84C]">{fmtTime(a.scheduledAt)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{a.customerName}</p>
                        {a.customerPhone && <p className="text-xs text-gray-400">{a.customerPhone}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{a.service.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{a.barber.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap">{a.service.duration} min</td>
                      {canViewRevenue && (
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-700 whitespace-nowrap">
                          R$ {Number(a.service.price ?? 0).toFixed(2)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map(a => (
                <div key={a.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#C9A84C]">{fmtTime(a.scheduledAt)}</span>
                    <span className="text-xs text-gray-400">{fmtDate(a.scheduledAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{a.customerName}</p>
                  {a.customerPhone && <p className="text-xs text-gray-400">{a.customerPhone}</p>}
                  <div className="flex gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="bg-gray-100 rounded px-2 py-0.5">{a.service.name}</span>
                    <span>· {a.barber.name}</span>
                    {canViewRevenue && <span>· R$ {Number(a.service.price ?? 0).toFixed(2)}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{total}</span> atendimento{total !== 1 ? "s" : ""} no período
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 0 || loading}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-400 min-w-28 text-center">Página {page + 1} de {totalPages}</span>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </div>
          </>
        )}
      </div> {/* end Results */}
    </div>
  );
}
