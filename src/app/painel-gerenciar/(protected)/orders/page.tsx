"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";
import { SortHeader, useSort, sortData } from "@/components/admin/sort-header";

const PAGE_SIZE = 15;
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type OrderItem = { id: number; quantity: number; unitPrice: number; product: { name: string } };
type OrderStatus = "PENDING" | "PAID" | "CANCELLED";
type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_LABELS: Record<OrderStatus, string> = { PENDING: "Pendente", PAID: "Pago", CANCELLED: "Cancelado" };
const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};
const PIE_COLORS: Record<OrderStatus, string> = { PAID: "#16a34a", PENDING: "#ca8a04", CANCELLED: "#9ca3af" };

const fmt = (n: number) =>
  Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function q(v: string | number) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function exportCSV(orders: Order[]) {
  const header = ["#", "Cliente", "Telefone", "Itens", "Total (R$)", "Status", "Data"];
  const rows = orders.map((o) => [
    o.id,
    q(o.customerName),
    o.customerPhone,
    q(o.items.map((i) => `${i.product.name} x${i.quantity}`).join("; ")),
    Number(o.total).toFixed(2),
    STATUS_LABELS[o.status],
    new Date(o.createdAt).toLocaleDateString("pt-BR"),
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(orders: Order[]) {
  const win = window.open("", "_blank");
  if (!win) return;

  const rows = orders.map((o) => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customerName}<br><span style="color:#9ca3af;font-size:10px">${o.customerPhone}</span></td>
      <td>${o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}</td>
      <td>R$ ${fmt(o.total)}</td>
      <td><span class="${o.status}">${STATUS_LABELS[o.status]}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString("pt-BR")}</td>
    </tr>`).join("");

  win.document.write(`
    <html><head><title>Pedidos</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      p { color: #666; margin-bottom: 16px; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f4f4f5; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #71717a; border-bottom: 1px solid #e5e7eb; }
      td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; font-size: 11px; }
      span.PAID { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 9999px; font-weight: 600; }
      span.PENDING { background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 9999px; font-weight: 600; }
      span.CANCELLED { background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 9999px; font-weight: 600; }
    </style>
    </head><body>
    <h1>Pedidos</h1>
    <p>Exportado em ${new Date().toLocaleString("pt-BR")} — ${orders.length} pedido(s)</p>
    <table>
      <thead><tr>
        <th>#</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Status</th><th>Data</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`);
  win.document.close();
  win.print();
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: OrderStatus) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  const summary = useMemo(() => {
    const paid = orders.filter((o) => o.status === "PAID");
    const pending = orders.filter((o) => o.status === "PENDING");
    const cancelled = orders.filter((o) => o.status === "CANCELLED");
    const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
    return { total: orders.length, paid: paid.length, pending: pending.length, cancelled: cancelled.length, revenue };
  }, [orders]);

  const pieData = useMemo(() => [
    { name: "Pago", value: summary.paid, status: "PAID" as OrderStatus },
    { name: "Pendente", value: summary.pending, status: "PENDING" as OrderStatus },
    { name: "Cancelado", value: summary.cancelled, status: "CANCELLED" as OrderStatus },
  ].filter((d) => d.value > 0), [summary]);

  const { sort, toggle } = useSort("createdAt", "desc");
  const sortedOrders = useMemo(() => sortData(orders.map(o => ({ ...o, total: Number(o.total) })), sort), [orders, sort]);
  const paginatedOrders = useMemo(() => sortedOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedOrders, page]);

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    orders
      .filter((o) => o.status === "PAID")
      .forEach((o) => {
        const day = new Date(o.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        map[day] = (map[day] ?? 0) + Number(o.total);
      });
    return Object.entries(map)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => {
        const [da, ma] = a.date.split("/").map(Number);
        const [db, mb] = b.date.split("/").map(Number);
        return ma !== mb ? ma - mb : da - db;
      })
      .slice(-14);
  }, [orders]);

  const hasFilters = statusFilter || fromDate || toDate || search;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="mt-1 text-sm text-gray-600">{summary.total} pedido(s) encontrado(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCSV(orders)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => exportPDF(orders)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary.total, sub: "pedidos", color: "text-gray-900" },
          { label: "Receita (pagos)", value: `R$ ${fmt(summary.revenue)}`, sub: `${summary.paid} pedidos`, color: "text-green-700" },
          { label: "Pendentes", value: summary.pending, sub: "aguardando", color: "text-yellow-700" },
          { label: "Cancelados", value: summary.cancelled, sub: "pedidos", color: "text-gray-500" },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Receita por dia (pagos)</p>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(v) => [`R$ ${fmt(Number(v))}`, "Receita"]}
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="value" fill="#C9A84C" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-45 flex items-center justify-center text-gray-400 text-sm">Sem pedidos pagos no período</div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Pedidos por status</p>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.status} fill={PIE_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                    iconSize={8}
                  />
                  <Tooltip
                    formatter={(v, name) => [v, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-45 flex items-center justify-center text-gray-400 text-sm">Sem dados</div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <input
          type="text"
          placeholder="Buscar cliente ou telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-45 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          <option value="PAID">Pago</option>
          <option value="PENDING">Pendente</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        {hasFilters && (
          <button
            onClick={() => { setStatusFilter(""); setFromDate(""); setToDate(""); setSearch(""); }}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-400 text-sm">Carregando…</div>
        ) : paginatedOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum pedido encontrado</div>
        ) : (
          <>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader label="#"       field="id"           sort={sort} onSort={toggle} />
                <SortHeader label="Cliente" field="customerName" sort={sort} onSort={toggle} />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Itens</th>
                <SortHeader label="Total"   field="total"        sort={sort} onSort={toggle} />
                <SortHeader label="Status"  field="status"       sort={sort} onSort={toggle} />
                <SortHeader label="Data"    field="createdAt"    sort={sort} onSort={toggle} />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">#{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{o.customerName}</div>
                    <div className="text-xs text-gray-400">{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-50">
                    <span className="line-clamp-2">{o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">R$ {fmt(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "PENDING" && (
                      <div className="flex items-center gap-1">
                        <IconButton tooltip="Confirmar pagamento" variant="success" onClick={() => updateStatus(o.id, "PAID")}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                        </IconButton>
                        <IconButton tooltip="Cancelar pedido" variant="danger" onClick={() => updateStatus(o.id, "CANCELLED")}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </IconButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={Math.ceil(sortedOrders.length / PAGE_SIZE)} total={sortedOrders.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
