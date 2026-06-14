"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Booking = {
  id: string;
  scheduledAt: string;
  customerName: string;
  customerPhone: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  service: { id: number; name: string; duration: number; price: number };
  barber: { id: number; name: string };
};

const statusLabel: Record<string, string> = {
  PENDING:   "Aguardando",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
};

const statusClass: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100  text-green-800",
  CANCELLED: "bg-red-100    text-red-800",
  COMPLETED: "bg-gray-100   text-gray-600",
};

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

type Period = "next7" | "specific";

export default function QueuePage() {
  const today      = useMemo(() => localDateStr(), []);
  const todayPlus6 = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 6); return localDateStr(d); }, []);

  const [bookings,      setBookings]      = useState<Booking[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [updating,      setUpdating]      = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<{ id: string; name: string } | null>(null);

  // Filters
  const [period,       setPeriod]       = useState<Period>("next7");
  const [specificDate, setSpecificDate] = useState(today);
  const [barberId,     setBarberId]     = useState("");
  const [serviceId,    setServiceId]    = useState("");
  const [status,       setStatus]       = useState("");

  const [barbers,  setBarbers]  = useState<{ id: number; name: string }[]>([]);
  const [services, setServices] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/barbers").then(r => r.json()).then(d => setBarbers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/admin/services").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (period === "next7") {
      params.set("startDate", today);
      params.set("endDate", todayPlus6);
    } else {
      params.set("date", specificDate);
    }
    if (barberId)  params.set("barberId", barberId);
    if (serviceId) params.set("serviceId", serviceId);
    if (status)    params.set("status", status);

    try {
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period, specificDate, barberId, serviceId, status, today, todayPlus6]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatus(id: string, newStatus: "CONFIRMED" | "CANCELLED") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await load();
    } finally {
      setUpdating(null);
    }
  }

  const pendingCount = bookings.filter(b => b.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <Breadcrumbs />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fila de Espera</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pendingCount > 0
              ? `${pendingCount} agendamento(s) aguardando confirmação`
              : "Nenhum agendamento pendente"}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Atualizar
        </button>
      </div>

      {/* Filter block */}
      <div className="bg-[#F4F4F5] border border-gray-200 rounded-xl p-4 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Filtros</p>
        <div className="flex flex-wrap gap-3 items-end">

          {/* Período */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Período</label>
            <div className="relative">
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as Period)}
                className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm"
              >
                <option value="next7">Próximos 7 dias</option>
                <option value="specific">Data específica</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {period === "specific" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Data</label>
              <input
                type="date"
                value={specificDate}
                onChange={e => setSpecificDate(e.target.value)}
                className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-gray-700 bg-white focus:border-[#C9A84C] focus:outline-none transition-colors shadow-sm"
              />
            </div>
          )}

          {/* Profissional */}
          {barbers.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Profissional</label>
              <div className="relative">
                <select
                  value={barberId}
                  onChange={e => setBarberId(e.target.value)}
                  className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm"
                >
                  <option value="">Todos</option>
                  {barbers.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}

          {/* Serviço */}
          {services.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Serviço</label>
              <div className="relative">
                <select
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm"
                >
                  <option value="">Todos</option>
                  {services.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors shadow-sm"
              >
                <option value="">Todos</option>
                <option value="PENDING">Aguardando</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="COMPLETED">Concluído</option>
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Carregando...</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            <p className="text-sm text-gray-400">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    {["Horário", "Cliente", "Serviço", "Profissional", "Duração", "Status", "Ações"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {bookings.map(b => {
                    const isUpdating = updating === b.id;
                    return (
                      <tr key={b.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-semibold text-[#C9A84C]">{fmtTime(b.scheduledAt)}</p>
                          <p className="text-xs text-gray-400">{fmtDate(b.scheduledAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                          {b.customerPhone && <p className="text-xs text-gray-400">{b.customerPhone}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{b.service.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{b.barber.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{b.service.duration} min</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[b.status]}`}>
                            {statusLabel[b.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {b.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, "CONFIRMED")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-800 font-medium mr-4 disabled:opacity-40"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setConfirmCancel({ id: b.id, name: b.customerName })}
                                disabled={isUpdating}
                                className="text-red-500 hover:text-red-700 disabled:opacity-40"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {b.status === "CONFIRMED" && (
                            <button
                              onClick={() => setConfirmCancel({ id: b.id, name: b.customerName })}
                              disabled={isUpdating}
                              className="text-red-500 hover:text-red-700 disabled:opacity-40"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {bookings.map(b => (
                <div key={b.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="text-sm font-semibold text-[#C9A84C]">{fmtTime(b.scheduledAt)}</span>
                      <span className="text-xs text-gray-400 ml-2">{fmtDate(b.scheduledAt)}</span>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                  {b.customerPhone && <p className="text-xs text-gray-400">{b.customerPhone}</p>}
                  <div className="flex gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
                    <span>{b.service.name}</span>
                    <span>· {b.barber.name}</span>
                    <span>· {b.service.duration} min</span>
                  </div>
                  {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <div className="flex gap-3 mt-3">
                      {b.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(b.id, "CONFIRMED")}
                          disabled={updating === b.id}
                          className="text-xs text-green-600 hover:text-green-800 font-medium disabled:opacity-40"
                        >
                          Confirmar
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmCancel({ id: b.id, name: b.customerName })}
                        disabled={updating === b.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                {bookings.length} agendamento(s) · Atualização automática a cada 30 segundos
              </p>
            </div>
          </>
        )}
      </div> {/* end Results */}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Cancelar agendamento"
        message={`Tem certeza que deseja cancelar o agendamento de "${confirmCancel?.name}"?`}
        confirmLabel="Cancelar agendamento"
        onConfirm={async () => {
          if (!confirmCancel) return;
          await updateStatus(confirmCancel.id, "CANCELLED");
          setConfirmCancel(null);
        }}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
}
