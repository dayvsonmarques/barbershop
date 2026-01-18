"use client";

import { useEffect, useMemo, useState } from "react";

type Barber = {
  id: number;
  name: string;
};

type DayOfWeek =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

type AvailabilityRule = {
  id: number;
  barberId: number;
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY";
  dayOfWeek:
    | DayOfWeek
    | null;
  dayOfMonth: number | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

type AvailabilityException = {
  id: number;
  barberId: number;
  date: string;
  type: "BLOCKED" | "SPECIAL";
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

const dayOfWeekLabels: Record<string, string> = {
  SUNDAY: "Domingo",
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
};

function toDateInputValue(dateValue: string) {
  // Prisma Date comes as ISO; keep only yyyy-mm-dd
  return dateValue.slice(0, 10);
}

export default function AdminAvailabilityPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberId, setBarberId] = useState<number | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newRuleDay, setNewRuleDay] = useState<AvailabilityRule["dayOfWeek"]>(
    "MONDAY"
  );
  const [newRuleStart, setNewRuleStart] = useState("09:00");
  const [newRuleEnd, setNewRuleEnd] = useState("18:00");

  const [exDate, setExDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [exType, setExType] = useState<AvailabilityException["type"]>(
    "BLOCKED"
  );
  const [exStart, setExStart] = useState("09:00");
  const [exEnd, setExEnd] = useState("18:00");
  const [exReason, setExReason] = useState("");

  const selectedBarber = useMemo(
    () => barbers.find((b) => b.id === barberId) ?? null,
    [barbers, barberId]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/barbers");
        if (!res.ok) {
          throw new Error("Falha ao carregar barbeiros");
        }

        const list = (await res.json()) as Barber[];
        setBarbers(list);
        setBarberId(list[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!barberId) return;
      try {
        setError(null);
        const res = await fetch(`/api/admin/availability?barberId=${barberId}`);
        if (!res.ok) {
          throw new Error("Falha ao carregar disponibilidade");
        }
        const json = (await res.json()) as {
          availability: AvailabilityRule[];
          exceptions: AvailabilityException[];
        };
        setRules(json.availability);
        setExceptions(json.exceptions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar dados");
      }
    };

    loadAvailability();
  }, [barberId]);

  const reload = async () => {
    if (!barberId) return;
    const res = await fetch(`/api/admin/availability?barberId=${barberId}`);
    if (!res.ok) return;
    const json = (await res.json()) as {
      availability: AvailabilityRule[];
      exceptions: AvailabilityException[];
    };
    setRules(json.availability);
    setExceptions(json.exceptions);
  };

  const addRule = async () => {
    if (!barberId) return;
    setError(null);

    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "rule",
        data: {
          barberId,
          recurrenceType: "WEEKLY",
          dayOfWeek: newRuleDay,
          startTime: newRuleStart,
          endTime: newRuleEnd,
          serviceId: null,
          isActive: true,
        },
      }),
    });

    if (!res.ok) {
      const msg = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(msg?.error ?? "Não foi possível criar a regra");
      return;
    }

    await reload();
  };

  const removeRule = async (id: number) => {
    const res = await fetch(`/api/admin/availability?kind=rule&id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Não foi possível remover a regra");
      return;
    }
    await reload();
  };

  const addException = async () => {
    if (!barberId) return;
    setError(null);

    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "exception",
        data: {
          barberId,
          date: exDate,
          type: exType,
          startTime: exType === "SPECIAL" ? exStart : null,
          endTime: exType === "SPECIAL" ? exEnd : null,
          reason: exReason ? exReason : null,
        },
      }),
    });

    if (!res.ok) {
      const msg = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(msg?.error ?? "Não foi possível criar a exceção");
      return;
    }

    await reload();
  };

  const removeException = async (id: number) => {
    const res = await fetch(`/api/admin/availability?kind=exception&id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Não foi possível remover a exceção");
      return;
    }
    await reload();
  };

  if (loading) {
    return <div className="text-sm text-gray-600">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidade</h1>
          <p className="text-sm text-gray-600">
            Configure horários recorrentes e exceções por barbeiro.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Barbeiro</h2>
            <p className="text-sm text-gray-600">
              Selecione para editar horários e exceções.
            </p>
          </div>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:w-80"
            value={barberId ?? ""}
            onChange={(e) => setBarberId(Number(e.target.value))}
          >
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBarber ? (
          <div className="mt-4 text-sm text-gray-700">
            Editando: <span className="font-medium">{selectedBarber.name}</span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Horários (semanal)</h2>
          <p className="text-sm text-gray-600">
            Regras recorrentes semanais (ex.: Seg-Sex 09:00-18:00).
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-2 pr-4">Dia</th>
                  <th className="py-2 pr-4">Início</th>
                  <th className="py-2 pr-4">Fim</th>
                  <th className="py-2 pr-4">Ativo</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rules
                  .filter((r) => r.recurrenceType === "WEEKLY")
                  .map((r) => (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        {r.dayOfWeek ? dayOfWeekLabels[r.dayOfWeek] : "-"}
                      </td>
                      <td className="py-2 pr-4">{r.startTime}</td>
                      <td className="py-2 pr-4">{r.endTime}</td>
                      <td className="py-2 pr-4">{r.isActive ? "Sim" : "Não"}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => removeRule(r.id)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}

                {rules.filter((r) => r.recurrenceType === "WEEKLY").length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-gray-500" colSpan={5}>
                      Nenhuma regra cadastrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Adicionar regra</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={newRuleDay ?? ""}
                onChange={(e) => setNewRuleDay(e.target.value as DayOfWeek)}
              >
                {Object.keys(dayOfWeekLabels).map((key) => (
                  <option key={key} value={key}>
                    {dayOfWeekLabels[key]}
                  </option>
                ))}
              </select>

              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                type="time"
                value={newRuleStart}
                onChange={(e) => setNewRuleStart(e.target.value)}
              />

              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                type="time"
                value={newRuleEnd}
                onChange={(e) => setNewRuleEnd(e.target.value)}
              />

              <button
                onClick={addRule}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Exceções</h2>
          <p className="text-sm text-gray-600">
            Bloqueios (férias) ou horários especiais em datas específicas.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Início</th>
                  <th className="py-2 pr-4">Fim</th>
                  <th className="py-2 pr-4">Motivo</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((ex) => (
                  <tr key={ex.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{toDateInputValue(ex.date)}</td>
                    <td className="py-2 pr-4">
                      {ex.type === "BLOCKED" ? "Bloqueado" : "Especial"}
                    </td>
                    <td className="py-2 pr-4">{ex.startTime ?? "-"}</td>
                    <td className="py-2 pr-4">{ex.endTime ?? "-"}</td>
                    <td className="py-2 pr-4">{ex.reason ?? "-"}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeException(ex.id)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}

                {exceptions.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-gray-500" colSpan={6}>
                      Nenhuma exceção cadastrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Adicionar exceção</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                type="date"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
              />

              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={exType}
                onChange={(e) => setExType(e.target.value as AvailabilityException["type"])}
              >
                <option value="BLOCKED">Bloqueado</option>
                <option value="SPECIAL">Especial</option>
              </select>

              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Motivo (opcional)"
                value={exReason}
                onChange={(e) => setExReason(e.target.value)}
              />

              {exType === "SPECIAL" ? (
                <>
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    type="time"
                    value={exStart}
                    onChange={(e) => setExStart(e.target.value)}
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    type="time"
                    value={exEnd}
                    onChange={(e) => setExEnd(e.target.value)}
                  />
                </>
              ) : null}

              <button
                onClick={addException}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
