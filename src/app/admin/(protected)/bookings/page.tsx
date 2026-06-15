"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Booking = {
  id: string;
  scheduledAt: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  service: { id: number; name: string; duration: number; price: number };
  barber: { id: number; name: string };
};

type ServiceOption = { id: number; name: string };
type BarberOption  = { id: number; name: string };

const statusLabels: Record<string, string> = {
  PENDING:   "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const statusColors: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 20;

function localDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toLocalTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function rebuildScheduledAt(iso: string, newTime: string) {
  const d = new Date(iso);
  const [h, m] = newTime.split(":").map(Number);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m).toISOString();
}

const labelClass = "block text-xs font-medium tracking-widest uppercase text-[#71717A] mb-1";
const inputClass =
  "w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#18181B] focus:border-[#C9A84C] focus:outline-none transition-colors";

export default function BookingsPage() {
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [loading,  setLoading]          = useState(true);
  const [error,    setError]            = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(localDateStr);

  const [filterSearch,  setFilterSearch]  = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterBarber,  setFilterBarber]  = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");
  const [page, setPage]                   = useState(0);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers,  setBarbers]  = useState<BarberOption[]>([]);

  const [editing,    setEditing]    = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTime,   setEditTime]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/services").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/admin/barbers").then(r => r.json()).then(d => setBarbers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings?date=${selectedDate}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`);
      setBookings(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => { setPage(0); }, [selectedDate, filterSearch, filterService, filterBarber, filterStatus]);

  useEffect(() => {
    if (!editing) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [editing]);

  // Bookings filtered by barber only (for stats)
  const barberFiltered = useMemo(
    () => filterBarber ? bookings.filter(b => String(b.barber.id) === filterBarber) : bookings,
    [bookings, filterBarber]
  );

  // Full filter
  const filtered = useMemo(() => barberFiltered.filter(b => {
    if (filterSearch  && !b.customerName.toLowerCase().includes(filterSearch.toLowerCase()) &&
                         !b.service.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    if (filterService && String(b.service.id) !== filterService) return false;
    if (filterStatus  && b.status !== filterStatus) return false;
    return true;
  }), [barberFiltered, filterSearch, filterService, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Stats (over barber-filtered, ignoring status/search filter so they're always visible)
  const stats = useMemo(() => ({
    pending:   barberFiltered.filter(b => b.status === "PENDING").length,
    confirmed: barberFiltered.filter(b => b.status === "CONFIRMED").length,
    cancelled: barberFiltered.filter(b => b.status === "CANCELLED").length,
    completed: barberFiltered.filter(b => b.status === "COMPLETED").length,
  }), [barberFiltered]);

  // Unique barbers present in loaded bookings
  const presentBarbers = useMemo(() => {
    const map = new Map<number, string>();
    bookings.forEach(b => map.set(b.barber.id, b.barber.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  function openModal(b: Booking) {
    setEditing(b);
    setEditStatus(b.status);
    setEditTime(toLocalTime(b.scheduledAt));
    setSaveError(null);
  }

  function closeModal() { setEditing(null); setSaveError(null); }

  async function handleSave() {
    if (!editing) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, scheduledAt: rebuildScheduledAt(editing.scheduledAt, editTime) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`);
      closeModal(); loadBookings();
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function handleCancelBooking() {
    if (!editing) return;
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`);
      closeModal(); loadBookings();
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Erro ao cancelar"); }
    finally { setSaving(false); }
  }

  function exportCSV() {
    const rows = [
      ["Horário", "Cliente", "Telefone", "Serviço", "Barbeiro", "Valor", "Status"],
      ...filtered.map(b => [
        formatTime(b.scheduledAt), b.customerName, b.customerPhone ?? "",
        b.service.name, b.barber.name,
        Number(b.service.price).toFixed(2), statusLabels[b.status],
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })),
      download: `agendamentos-${selectedDate}.csv`,
    });
    a.click();
  }

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const STATUS_TABS = [
    { key: "",          label: "Todos",      count: barberFiltered.length },
    { key: "PENDING",   label: "Pendentes",  count: stats.pending },
    { key: "CONFIRMED", label: "Confirmados",count: stats.confirmed },
    { key: "COMPLETED", label: "Concluídos", count: stats.completed },
    { key: "CANCELLED", label: "Cancelados", count: stats.cancelled },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumbs />

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie e confirme os agendamentos dos seus clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            onClick={e => (e.target as HTMLInputElement).showPicker?.()}
            className="h-9 border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[#C9A84C] focus:outline-none transition-colors rounded-lg"
          />
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
      </div>

      {error && (
        <div className="border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Barber pills ── */}
      <div className="flex flex-wrap gap-2">
        <BarberPill
          label="Todos"
          count={bookings.length}
          active={filterBarber === ""}
          onClick={() => setFilterBarber("")}
          allIcon
        />
        {presentBarbers.map(b => (
          <BarberPill
            key={b.id}
            label={b.name}
            count={bookings.filter(bk => bk.barber.id === b.id).length}
            active={filterBarber === String(b.id)}
            onClick={() => setFilterBarber(filterBarber === String(b.id) ? "" : String(b.id))}
          />
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Pendentes"   value={stats.pending}   color="yellow" />
        <StatCard label="Confirmados" value={stats.confirmed} color="green"  />
        <StatCard label="Cancelados"  value={stats.cancelled} color="red"    />
      </div>

      {/* ── Filters row ── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          {/* Status tabs */}
          <div className="flex items-center gap-1">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setFilterStatus(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === t.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    filterStatus === t.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + service */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar por cliente, serviço..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-[#C9A84C] focus:outline-none w-56 transition-colors"
              />
            </div>
            {services.length > 0 && (
              <div className="relative">
                <select
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                  className="h-9 pl-3 pr-7 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:border-[#C9A84C] focus:outline-none appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Todos os serviços</option>
                  {services.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* ── Table / cards ── */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <p className="text-sm text-gray-400">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    {["Horário", "Cliente", "Serviço", "Profissional", "Valor", "Status"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {paginated.map(b => (
                    <tr
                      key={b.id}
                      onClick={() => openModal(b)}
                      className="cursor-pointer hover:bg-[#FAFAFA] transition-colors group"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#C9A84C]">{formatTime(b.scheduledAt)}</span>
                        <span className="ml-2 text-xs text-gray-400">{b.service.duration}min</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                        {b.customerPhone && <p className="text-xs text-gray-400">{b.customerPhone}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">{b.service.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{b.barber.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                        R$ {Number(b.service.price).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[b.status]}`}>
                          {statusLabels[b.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.map(b => (
                <button
                  key={b.id}
                  onClick={() => openModal(b)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#C9A84C]">{formatTime(b.scheduledAt)}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[b.status]}`}>
                      {statusLabels[b.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                  {b.customerPhone && <p className="text-xs text-gray-400">{b.customerPhone}</p>}
                  <div className="flex gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="bg-gray-100 rounded px-2 py-0.5">{b.service.name}</span>
                    <span>· {b.barber.name}</span>
                    <span>· R$ {Number(b.service.price).toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{filtered.length}</span> agendamento{filtered.length !== 1 ? "s" : ""}
                {filtered.length !== bookings.length && <span className="text-gray-400"> (de {bookings.length})</span>}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-400 min-w-24 text-center">Página {page + 1} de {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-10"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-2xl shadow-xl overflow-y-auto max-h-full rounded-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
              <h2 className="text-sm font-semibold text-[#18181B]">Editar Agendamento</h2>
              <button onClick={closeModal} className="text-[#A1A1AA] hover:text-[#18181B] transition-colors p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 bg-[#F7F7F8] border-b border-[#E5E5E5] space-y-3">
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-widest font-medium">Cliente</p>
                <p className="text-sm font-semibold text-[#18181B] mt-0.5">{editing.customerName}</p>
                {editing.customerPhone && <p className="text-xs text-[#71717A]">{editing.customerPhone}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#71717A] uppercase tracking-widest font-medium">Serviço</p>
                  <p className="text-sm text-[#18181B] mt-0.5">{editing.service.name}</p>
                  <p className="text-xs text-[#A1A1AA]">{editing.service.duration} min · R$ {Number(editing.service.price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#71717A] uppercase tracking-widest font-medium">Barbeiro</p>
                  <p className="text-sm text-[#18181B] mt-0.5">{editing.barber.name}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>Horário</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              {saveError && (
                <div className="border-l-2 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E5E5]">
              {editing.status !== "CANCELLED" ? (
                <button
                  onClick={handleCancelBooking}
                  disabled={saving}
                  className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-40 transition-colors"
                >
                  Cancelar agendamento
                </button>
              ) : <span />}
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-[#52525B] hover:text-[#18181B] transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#B8963C] text-white text-xs font-medium transition-colors disabled:opacity-60 rounded-lg"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BarberPill({ label, count, active, onClick, allIcon }: {
  label: string; count: number; active: boolean; onClick: () => void; allIcon?: boolean;
}) {
  const initial = label.charAt(0).toUpperCase();
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {allIcon ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ) : (
        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
        }`}>
          {initial}
        </span>
      )}
      {label}
      {count > 0 && (
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-[#C9A84C]/15 text-[#C9A84C]"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, color }: {
  label: string; value: number; color: "yellow" | "green" | "red";
}) {
  const styles = {
    yellow: { wrap: "bg-yellow-50 border-yellow-100", num: "text-yellow-600", lbl: "text-yellow-700" },
    green:  { wrap: "bg-green-50 border-green-100",   num: "text-green-600",  lbl: "text-green-700"  },
    red:    { wrap: "bg-red-50 border-red-100",        num: "text-red-500",    lbl: "text-red-600"    },
  }[color];
  return (
    <div className={`rounded-xl border p-4 text-center ${styles.wrap}`}>
      <p className={`text-3xl font-bold leading-none ${styles.num}`}>{value}</p>
      <p className={`text-xs font-semibold mt-1.5 ${styles.lbl}`}>{label}</p>
    </div>
  );
}
