"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";
import { SortHeader, useSort, sortData } from "@/components/admin/sort-header";

const PAGE_SIZE = 15;
import { ConfirmDialog } from "@/components/confirm-dialog";

type Group = { id: number; name: string };

type User = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  groups: { group: Group }[];
};

type FormState = {
  name: string;
  email: string;
  password: string;
  groupId: number | "";
  isActive: boolean;
};

const emptyForm: FormState = { name: "", email: "", password: "", groupId: "", isActive: true };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const { sort, toggle } = useSort("name");
  const sorted = useMemo(() => sortData(users.map(u => ({ ...u, "group.name": u.groups[0]?.group.name ?? "" })), sort), [users, sort]);
  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [usersRes, groupsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/groups"),
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (groupsRes.ok) setGroups(await groupsRes.json());
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      groupId: u.groups[0]?.group.id ?? "",
      isActive: u.isActive,
    });
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
        email: form.email,
        password: form.password || undefined,
        groupId: form.groupId || null,
        isActive: form.isActive,
      };
      const url = editing ? `/api/admin/users/${editing.id}` : "/api/admin/users";
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

  function handleDelete(id: string, name: string) {
    setConfirmDelete({ id, name });
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/users/${confirmDelete.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
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
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-1 text-sm text-gray-600">{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Usuário
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Nome"   field="name"       sort={sort} onSort={toggle} />
              <SortHeader label="E-mail" field="email"      sort={sort} onSort={toggle} />
              <SortHeader label="Grupo"  field="group.name" sort={sort} onSort={toggle} />
              <SortHeader label="Status" field="isActive"   sort={sort} onSort={toggle} />
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginated.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {u.groups[0]?.group.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${u.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {u.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton tooltip="Editar" onClick={() => openEdit(u)}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </IconButton>
                    <IconButton tooltip="Excluir" variant="danger" onClick={() => handleDelete(u.id, u.name)}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum usuário cadastrado</div>
        )}
        <Pagination page={page} totalPages={Math.ceil(users.length / PAGE_SIZE)} total={users.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir usuário"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name}"? O registro será ocultado mas não apagado permanentemente.`}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editing ? "(deixe em branco para não alterar)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editing}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  placeholder={editing ? "••••••••" : ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <select
                  value={form.groupId}
                  onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value ? Number(e.target.value) : "" }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                >
                  <option value="">Sem grupo</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
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
