"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Professional = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  isActive: boolean;
  _count?: { availability: number; bookings: number };
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  bio: string;
  isActive: boolean;
};

const emptyForm: FormState = { name: "", email: "", phone: "", bio: "", isActive: true };

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/barbers");
      if (res.ok) setProfessionals(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  function openEdit(p: Professional) {
    setEditing(p);
    setForm({ name: p.name, email: p.email ?? "", phone: p.phone ?? "", bio: p.bio ?? "", isActive: p.isActive });
    setError(null);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        bio: form.bio || null,
        isActive: form.isActive,
      };
      const url = editing ? `/api/admin/barbers/${editing.id}` : "/api/admin/barbers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await load();
        setShowModal(false);
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number, name: string) {
    setConfirmDelete({ id, name });
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/barbers/${confirmDelete.id}`, { method: "DELETE" });
    if (res.ok) {
      setProfessionals((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      setConfirmDelete(null);
    } else {
      const data = await res.json();
      alert(data.error ?? "Erro ao excluir");
      setConfirmDelete(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="mt-1 text-sm text-gray-600">{professionals.length} profissional(is) cadastrado(s)</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Profissional
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Nome", "E-mail", "Telefone", "Agendamentos", "Status", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {professionals.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDF8EE]">
                      <span className="text-sm font-semibold text-[#C9A84C]">{p.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.email ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.phone ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p._count?.bookings ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {p.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="text-[#C9A84C] hover:text-[#A07830] mr-4">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:text-red-900">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {professionals.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum profissional cadastrado</div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir profissional"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name}"? O registro será ocultado mas não apagado permanentemente.`}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Profissional" : "Novo Profissional"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    placeholder="(81) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none"
                  placeholder="Descrição breve..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Ativo</label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
