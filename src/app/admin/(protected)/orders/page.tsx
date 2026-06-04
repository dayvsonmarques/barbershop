"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type OrderItem = { id: number; quantity: number; unitPrice: number; product: { name: string } };
type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  items: OrderItem[];
};

const STATUS_LABELS: Record<Order["status"], string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: Order["status"]) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  }

  const fmt = (n: number) =>
    Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="mt-1 text-sm text-gray-600">{orders.length} pedidos no total</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["#", "Cliente", "Itens", "Total", "Status", "Data", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3 text-sm text-gray-500">#{o.id}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{o.customerName}</div>
                  <div className="text-xs text-gray-500">{o.customerPhone}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">R$ {fmt(o.total)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[o.status]}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {o.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(o.id, "PAID")}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateStatus(o.id, "CANCELLED")}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum pedido ainda</div>
        )}
      </div>
    </div>
  );
}
