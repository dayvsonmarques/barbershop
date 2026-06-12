"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";

const RESOURCES = [
  { key: "users",        label: "Usuários" },
  { key: "groups",       label: "Grupos" },
  { key: "barbers",      label: "Profissionais" },
  { key: "services",     label: "Serviços" },
  { key: "bookings",     label: "Agendamentos" },
  { key: "products",     label: "Produtos" },
  { key: "courses",      label: "Cursos" },
  { key: "testimonials", label: "Depoimentos" },
  { key: "settings",     label: "Configurações" },
];

const ACTIONS = [
  { key: "view",   label: "Ver" },
  { key: "create", label: "Criar" },
  { key: "update", label: "Editar" },
  { key: "delete", label: "Excluir" },
];

type Permission = { id: number; resource: string; action: string };

type Group = {
  id: number;
  name: string;
  description: string | null;
  _count: { users: number; permissions: number };
};

type FormState = { name: string; description: string; permissionIds: number[] };

const emptyForm: FormState = { name: "", description: "", permissionIds: [] };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [groupsRes, permsRes] = await Promise.all([
      fetch("/api/admin/groups"),
      fetch("/api/admin/permissions"),
    ]);
    if (groupsRes.ok) setGroups(await groupsRes.json());
    if (permsRes.ok) setAllPermissions(await permsRes.json());
    setLoading(false);
  }

  function permId(resource: string, action: string) {
    return allPermissions.find((p) => p.resource === resource && p.action === action)?.id;
  }

  function togglePerm(id: number) {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(id)
        ? f.permissionIds.filter((x) => x !== id)
        : [...f.permissionIds, id],
    }));
  }

  function toggleAllResource(resource: string) {
    const ids = ACTIONS.map((a) => permId(resource, a.key)).filter(Boolean) as number[];
    const allChecked = ids.every((id) => form.permissionIds.includes(id));
    setForm((f) => ({
      ...f,
      permissionIds: allChecked
        ? f.permissionIds.filter((id) => !ids.includes(id))
        : [...new Set([...f.permissionIds, ...ids])],
    }));
  }

  async function openEdit(group: Group) {
    setEditing(group);
    setError(null);
    const res = await fetch(`/api/admin/groups/${group.id}`);
    if (res.ok) {
      const data = await res.json();
      setForm({
        name: data.name,
        description: data.description ?? "",
        permissionIds: data.permissions.map((p: { permissionId: number }) => p.permissionId),
      });
    }
    setShowModal(true);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/admin/groups/${editing.id}` : "/api/admin/groups";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir grupo "${name}"?`)) return;
    const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "Erro ao excluir");
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
          <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
          <p className="mt-1 text-sm text-gray-600">{groups.length} grupo(s) cadastrado(s)</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Grupo
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Nome", "Descrição", "Usuários", "Permissões", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {groups.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{g.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{g.description ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{g._count.users}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{g._count.permissions}</td>
                <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                  <button onClick={() => openEdit(g)} className="text-[#C9A84C] hover:text-[#A07830] mr-4">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(g.id, g.name)} className="text-red-600 hover:text-red-900">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum grupo cadastrado</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Grupo" : "Novo Grupo"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    placeholder="Ex: Administrador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                    placeholder="Descrição do grupo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissões</label>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Recurso</th>
                          {ACTIONS.map((a) => (
                            <th key={a.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {a.label}
                            </th>
                          ))}
                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Todos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {RESOURCES.map((r) => {
                          const ids = ACTIONS.map((a) => permId(r.key, a.key)).filter(Boolean) as number[];
                          const allChecked = ids.length > 0 && ids.every((id) => form.permissionIds.includes(id));
                          return (
                            <tr key={r.key} className="hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                              {ACTIONS.map((a) => {
                                const id = permId(r.key, a.key);
                                return (
                                  <td key={a.key} className="px-2 py-2 text-center">
                                    {id ? (
                                      <input
                                        type="checkbox"
                                        checked={form.permissionIds.includes(id)}
                                        onChange={() => togglePerm(id)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C] cursor-pointer"
                                      />
                                    ) : <span className="text-gray-300">—</span>}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={allChecked}
                                  onChange={() => toggleAllResource(r.key)}
                                  className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C] cursor-pointer"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
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
