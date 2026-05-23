"use client";

import { useState, useEffect, useCallback } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Booking = {
  id: string;
  scheduledAt: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  service: {
    id: number;
    name: string;
    duration: number;
    price: number;
  };
  barber: {
    id: number;
    name: string;
  };
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(localDateStr);

  const [editing, setEditing] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings?date=${selectedDate}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erro ${res.status}`);
      }
      setBookings(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar agendamentos");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // Close modal on Esc
  useEffect(() => {
    if (!editing) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing]);

  function openModal(booking: Booking) {
    setEditing(booking);
    setEditStatus(booking.status);
    setEditTime(toLocalTime(booking.scheduledAt));
    setSaveError(null);
  }

  function closeModal() {
    setEditing(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          scheduledAt: rebuildScheduledAt(editing.scheduledAt, editTime),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erro ${res.status}`);
      }
      closeModal();
      loadBookings();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelBooking() {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erro ${res.status}`);
      }
      closeModal();
      loadBookings();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao cancelar");
    } finally {
      setSaving(false);
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#71717A]">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <p className="mt-1 text-sm text-gray-600">Gerenciamento de agendamentos de serviços</p>
      </div>

      {error && (
        <div className="border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Total: {bookings.length} agendamento{bookings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Novo Agendamento
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Horário", "Cliente", "Serviço", "Barbeiro", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => openModal(booking)}
                  className="cursor-pointer hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{formatTime(booking.scheduledAt)}</div>
                    <div className="text-xs text-gray-500">{booking.service.duration} min</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                    {booking.customerPhone && (
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{booking.service.name}</div>
                    <div className="text-sm text-gray-500">
                      R$ {Number(booking.service.price).toFixed(2)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {booking.barber.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum agendamento para esta data</p>
          </div>
        )}
      </div>

      {/* ── Modal de edição ── */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-10"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-2xl shadow-xl overflow-y-auto max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
              <h2 className="text-sm font-semibold text-[#18181B]">Editar Agendamento</h2>
              <button
                onClick={closeModal}
                className="text-[#A1A1AA] hover:text-[#18181B] transition-colors p-1"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Info (somente leitura) */}
            <div className="px-6 py-4 bg-[#F7F7F8] border-b border-[#E5E5E5] space-y-3">
              <div>
                <p className="text-xs text-[#71717A] uppercase tracking-widest font-medium">Cliente</p>
                <p className="text-sm font-semibold text-[#18181B] mt-0.5">{editing.customerName}</p>
                {editing.customerPhone && (
                  <p className="text-xs text-[#71717A]">{editing.customerPhone}</p>
                )}
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

            {/* Campos editáveis */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>Status</label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div>
                <label className={labelClass}>Horário</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className={inputClass}
                />
              </div>

              {saveError && (
                <div className="border-l-2 border-red-400 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {saveError}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E5E5]">
              <button
                onClick={handleCancelBooking}
                disabled={saving || editing.status === "CANCELLED"}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar agendamento
              </button>
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
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#B8963C] text-white text-xs font-medium transition-colors disabled:opacity-60"
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
