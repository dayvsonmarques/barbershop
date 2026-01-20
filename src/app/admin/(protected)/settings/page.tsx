"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type OpeningHours = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};

type Settings = {
  name: string;
  openingHours: OpeningHours;
  address: string;
  latitude: number;
  longitude: number;
  instagramUrl: string | null;
  instagramUsername: string | null;
  phone: string | null;
  email: string | null;
};

const defaultHours: OpeningHours = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "09:00-14:00",
  sunday: "Fechado",
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<Settings>({
    name: "",
    openingHours: defaultHours,
    address: "",
    latitude: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? -23.55052),
    longitude: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? -46.633308),
    instagramUrl: null,
    instagramUsername: null,
    phone: null,
    email: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = (await res.json()) as Settings;
        setForm({
          name: data.name ?? "",
          openingHours: {
            ...defaultHours,
            ...(data.openingHours ?? {}),
          },
          address: data.address ?? "",
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          instagramUrl: data.instagramUrl ?? null,
          instagramUsername: data.instagramUsername ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Não foi possível salvar.");
        return;
      }

      setSuccess("Configurações salvas com sucesso.");
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-600">
          Informações do estabelecimento
        </p>
      </div>

      <form onSubmit={onSave} className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="ED Barbearia"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Endereço</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Rua Exemplo, 123 - Cidade, UF"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              step="0.0000001"
              value={form.latitude}
              onChange={(e) => setForm((s) => ({ ...s, latitude: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              step="0.0000001"
              value={form.longitude}
              onChange={(e) => setForm((s) => ({ ...s, longitude: Number(e.target.value) }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram (URL)</label>
            <input
              value={form.instagramUrl ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, instagramUrl: e.target.value || null }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="https://www.instagram.com/edbarbearia/"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram (usuário)</label>
            <input
              value={form.instagramUsername ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, instagramUsername: e.target.value || null }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="edbarbearia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              value={form.phone ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value || null }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value || null }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="contato@edbarbearia.com"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900">Horário de funcionamento</h2>
          <p className="mt-1 text-sm text-gray-600">Preencha no formato 09:00-18:00 ou “Fechado”.</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DayField label="Segunda" value={form.openingHours.monday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, monday: v } }))} />
            <DayField label="Terça" value={form.openingHours.tuesday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, tuesday: v } }))} />
            <DayField label="Quarta" value={form.openingHours.wednesday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, wednesday: v } }))} />
            <DayField label="Quinta" value={form.openingHours.thursday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, thursday: v } }))} />
            <DayField label="Sexta" value={form.openingHours.friday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, friday: v } }))} />
            <DayField label="Sábado" value={form.openingHours.saturday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, saturday: v } }))} />
            <DayField label="Domingo" value={form.openingHours.sunday} onChange={(v) => setForm((s) => ({ ...s, openingHours: { ...s.openingHours, sunday: v } }))} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DayField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        required
      />
    </div>
  );
}
