"use client";

import { useState, useEffect, useCallback } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";

type Customer = {
  customerPhone:   string;
  customerName:    string;
  totalVisits:     number;
  completedVisits: number;
  firstVisit:      string;
  lastVisit:       string;
  totalSpent:      number;
};

type HistoryItem = {
  id: string;
  scheduledAt: string;
  status: string;
  service: { name: string; price: number; duration: number };
  barber:  { name: string };
};

const statusLabel: Record<string, string> = {
  PENDING:   "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const statusColor: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100  text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100   text-red-800",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const PAGE_SIZE = 50;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [page,      setPage]      = useState(0);
  const [search,    setSearch]    = useState("");

  // Detail drawer
  const [selected,    setSelected]    = useState<Customer | null>(null);
  const [history,     setHistory]     = useState<HistoryItem[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(PAGE_SIZE),
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Erro ${res.status}`);
      const data = await res.json();
      setCustomers(data.customers ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(0); }, [load]);

  async function openCustomer(c: Customer) {
    setSelected(c);
    setHistLoading(true);
    try {
      const params = new URLSearchParams({ search: c.customerPhone, limit: "200" });
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (res.ok) {
        const data = await res.json();
        // filter by phone since API searches by name/service only — do client filter
        const filtered = (Array.isArray(data) ? data : []).filter(
          (b: any) => b.customerPhone === c.customerPhone
        );
        setHistory(filtered.sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()));
      }
    } finally {
      setHistLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <Breadcrumbs />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">Clientes cadastrados a partir dos agendamentos.</p>
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Search bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-full border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:border-[#C9A84C] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Carregando...</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
            <p className="text-sm text-gray-400">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/60">
                  <tr>
                    {["Cliente", "Telefone", "Visitas", "Concluídos", "Última visita", "Primeira visita", "Total gasto"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {customers.map(c => (
                    <tr
                      key={c.customerPhone}
                      onClick={() => openCustomer(c)}
                      className="cursor-pointer hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-sm font-bold text-[#C9A84C] shrink-0">
                            {c.customerName.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{c.customerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{c.customerPhone}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{c.totalVisits}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          {c.completedVisits}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{fmtDate(c.lastVisit)}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 whitespace-nowrap">{fmtDate(c.firstVisit)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        R$ {c.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-100">
              {customers.map(c => (
                <button
                  key={c.customerPhone}
                  onClick={() => openCustomer(c)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-8 h-8 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-sm font-bold text-[#C9A84C] shrink-0">
                      {c.customerName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.customerName}</p>
                      <p className="text-xs text-gray-400">{c.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mt-1">
                    <span>{c.totalVisits} visitas</span>
                    <span>· {c.completedVisits} concluídos</span>
                    <span>· R$ {c.totalSpent.toFixed(0)}</span>
                  </div>
                </button>
              ))}
            </div>

            <Pagination
              page={page + 1}
              totalPages={totalPages}
              total={total}
              pageSize={PAGE_SIZE}
              onPage={(p) => load(p - 1)}
            />
          </>
        )}
      </div>

      {/* Customer history drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white w-full sm:max-w-xl max-h-[80vh] rounded-xl shadow-xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#C9A84C]/15 flex items-center justify-center text-base font-bold text-[#C9A84C]">
                  {selected.customerName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selected.customerName}</p>
                  <p className="text-xs text-gray-400">{selected.customerPhone}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100">
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{selected.totalVisits}</p>
                <p className="text-xs text-gray-400">Visitas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{selected.completedVisits}</p>
                <p className="text-xs text-gray-400">Concluídos</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#C9A84C]">R$ {selected.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-gray-400">Total gasto</p>
              </div>
            </div>

            {/* History */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Histórico</p>
              {histLoading ? (
                <div className="flex items-center justify-center h-20 text-sm text-gray-400">Carregando...</div>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum histórico encontrado</p>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{h.service.name}</p>
                        <p className="text-xs text-gray-400">{fmtDate(h.scheduledAt)} · {h.barber.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-gray-700">R$ {Number(h.service.price).toFixed(2)}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[h.status]}`}>
                          {statusLabel[h.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
