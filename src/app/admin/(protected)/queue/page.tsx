"use client";

import { useEffect, useState, useCallback } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Booking = {
  id: string;
  scheduledAt: string;
  customerName: string;
  customerPhone: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  service: { name: string; duration: number; price: number };
  barber: { name: string };
};

const statusLabel: Record<string, string> = {
  PENDING:   "Aguardando",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
};

const statusClass: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-600",
};

export default function QueuePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/bookings?status=PENDING");
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatus(id: string, status: "CONFIRMED" | "CANCELLED") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      }
    } finally {
      setUpdating(null);
    }
  }

  const pending = bookings.filter((b) => b.status === "PENDING");

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fila de Espera</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pending.length > 0
              ? `${pending.length} agendamento(s) aguardando confirmação`
              : "Nenhum agendamento pendente"}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Atualizar
        </button>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Carregando...</div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
            </svg>
            <p className="text-sm text-gray-400">Fila vazia — nenhum agendamento pendente</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Horário", "Cliente", "Serviço", "Profissional", "Duração", "Status", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pending.map((b) => {
                const dt = new Date(b.scheduledAt);
                const isUpdating = updating === b.id;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-semibold text-[#C9A84C]">
                        {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                      {b.customerPhone && (
                        <p className="text-xs text-gray-400">{b.customerPhone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.service.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.barber.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.service.duration} min</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass[b.status]}`}>
                        {statusLabel[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button
                        onClick={() => updateStatus(b.id, "CONFIRMED")}
                        disabled={isUpdating}
                        className="text-green-600 hover:text-green-800 font-medium mr-4 disabled:opacity-40"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "CANCELLED")}
                        disabled={isUpdating}
                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">Atualização automática a cada 30 segundos</p>
    </div>
  );
}
