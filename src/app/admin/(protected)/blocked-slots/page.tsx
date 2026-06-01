"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Barber = { id: number; name: string };
type BlockedSlot = { id: number; time: string; reason: string | null };

function dateToStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number) {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

export default function BlockedSlotsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = addDays(today, 13);

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState(dateToStr(today));
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/barbers")
      .then((r) => r.json())
      .then((d) => setBarbers(d.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!barberId || !date) return;
    setLoadingSlots(true);
    Promise.all([
      fetch(`/api/public/availability?barberId=${barberId}&serviceId=1&date=${date}`)
        .then((r) => r.json())
        .catch(() => ({ slots: [] })),
      fetch(`/api/admin/blocked-slots?barberId=${barberId}&date=${date}`)
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ]).then(([avail, blockedData]) => {
      const available: string[] = avail.slots ?? [];
      const blockedList: BlockedSlot[] = blockedData.data ?? [];
      const blockedTimes = new Set(blockedList.map((b: BlockedSlot) => b.time));
      setAllSlots([...available, ...blockedList.map((b) => b.time)].filter((v, i, a) => a.indexOf(v) === i).sort());
      setBlocked(blockedList);
      setLoadingSlots(false);
    });
  }, [barberId, date]);

  const isBlocked = (time: string) => blocked.some((b) => b.time === time);

  const toggle = async (time: string) => {
    if (!barberId) return;
    setToggling(time);
    if (isBlocked(time)) {
      await fetch(`/api/admin/blocked-slots?barberId=${barberId}&date=${date}&time=${time}`, { method: "DELETE" });
      setBlocked((prev) => prev.filter((b) => b.time !== time));
    } else {
      const res = await fetch("/api/admin/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barberId: parseInt(barberId), date, time, reason: reasonInputs[time] || null }),
      });
      const data = await res.json() as { data: BlockedSlot };
      setBlocked((prev) => [...prev, data.data]);
    }
    setToggling(null);
  };

  const minDate = dateToStr(today);
  const maxDateStr = dateToStr(maxDate);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Horários Bloqueados</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bloqueie horários específicos para impedir novos agendamentos.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barbeiro</label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Selecione um barbeiro</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              value={date}
              min={minDate}
              max={maxDateStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {!barberId && (
          <p className="text-sm text-gray-400">Selecione um barbeiro para ver os horários.</p>
        )}

        {barberId && loadingSlots && (
          <p className="text-sm text-gray-400">Carregando horários...</p>
        )}

        {barberId && !loadingSlots && allSlots.length === 0 && (
          <p className="text-sm text-gray-400">Nenhum horário encontrado para esta data.</p>
        )}

        {barberId && !loadingSlots && allSlots.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Clique para bloquear / desbloquear
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {allSlots.map((time) => {
                const blocked_ = isBlocked(time);
                const loading_ = toggling === time;
                return (
                  <div key={time} className="space-y-1">
                    <button
                      onClick={() => toggle(time)}
                      disabled={loading_}
                      className={`w-full py-2 px-1 text-sm font-medium border rounded transition-colors duration-150 ${
                        blocked_
                          ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                          : "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                      } disabled:opacity-50`}
                    >
                      {loading_ ? "..." : time}
                      <span className="block text-[10px] font-normal opacity-70">
                        {blocked_ ? "Bloqueado" : "Disponível"}
                      </span>
                    </button>
                    {!blocked_ && (
                      <input
                        type="text"
                        value={reasonInputs[time] ?? ""}
                        onChange={(e) => setReasonInputs((prev) => ({ ...prev, [time]: e.target.value }))}
                        placeholder="Motivo (opcional)"
                        className="w-full text-[10px] border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-400"
                      />
                    )}
                    {blocked_ && blocked.find((b) => b.time === time)?.reason && (
                      <p className="text-[10px] text-red-500 text-center truncate">
                        {blocked.find((b) => b.time === time)?.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
