"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Settings = {
  name: string;
  openingHours: string;
  address: string;
  latitude: number;
  longitude: number;
  instagramUsername: string | null;
  instagramUserId: string | null;
  instagramAccessToken: string | null;
  instagramTokenRefreshedAt: string | null;
  phone: string | null;
  email: string | null;
  pixKey: string | null;
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<Settings>({
    name: "",
    openingHours: "",
    address: "",
    latitude: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? -23.55052),
    longitude: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? -46.633308),
    instagramUsername: null,
    instagramUserId: null,
    instagramAccessToken: null,
    instagramTokenRefreshedAt: null,
    phone: null,
    email: null,
    pixKey: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = (await res.json()) as Settings;
        setForm({
          name: data.name ?? "",
          openingHours: typeof data.openingHours === "string" ? data.openingHours : "",
          address: data.address ?? "",
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          instagramUsername: data.instagramUsername ?? null,
          instagramUserId: data.instagramUserId ?? null,
          instagramAccessToken: data.instagramAccessToken ?? null,
          instagramTokenRefreshedAt: data.instagramTokenRefreshedAt ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
          pixKey: data.pixKey ?? null,
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
            <label className="block text-sm font-medium text-gray-700">Instagram (usuário)</label>
            <div className="mt-1 flex rounded-lg border border-gray-300 focus-within:border-blue-500 overflow-hidden">
              <span className="flex items-center px-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-300 select-none">
                instagram.com/
              </span>
              <input
                value={form.instagramUsername ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, instagramUsername: e.target.value || null }))}
                className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                placeholder="edbarbearia"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
            <input
              value={form.pixKey ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, pixKey: e.target.value || null }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
          <label className="block text-sm font-medium text-gray-700">Horário de funcionamento</label>
          <input
            value={form.openingHours}
            onChange={(e) => setForm((s) => ({ ...s, openingHours: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Segunda a Sábado das 9h às 19h"
            required
          />
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
