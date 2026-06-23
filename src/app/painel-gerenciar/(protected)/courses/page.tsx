"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";
import { ConfirmDialog } from "@/components/confirm-dialog";

const PAGE_SIZE = 12;

type Course = {
  id: number;
  name: string;
  description: string | null;
  type: "PRESENCIAL" | "ONLINE";
  durationHours: number;
  price: number;
  isActive: boolean;
};

type FormState = {
  name: string;
  description: string;
  type: "PRESENCIAL" | "ONLINE";
  durationHours: number;
  price: number;
  isActive: boolean;
};

const emptyForm: FormState = { name: "", description: "", type: "PRESENCIAL", durationHours: 1, price: 0, isActive: true };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const paginated = useMemo(() => courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [courses, page]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/courses");
      if (res.ok) setCourses(await res.json());
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

  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      type: c.type,
      durationHours: c.durationHours,
      price: c.price,
      isActive: c.isActive,
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/admin/courses/${editing.id}` : "/api/admin/courses";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: form.description || undefined }),
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

  async function doDelete() {
    if (!confirmDelete) return;
    await fetch(`/api/admin/courses/${confirmDelete.id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    setConfirmDelete(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
          <p className="mt-1 text-sm text-gray-600">{courses.length} cursos cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Curso
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((course) => (
            <div key={course.id} className="rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{course.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{course.type === "PRESENCIAL" ? "Presencial" : "Online"}</p>
                </div>
                <span className={`ml-2 shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${course.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {course.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
              {course.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">{course.description}</p>
              )}
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-gray-500">{course.durationHours}h</span>
                <span className="font-semibold text-gray-900">R$ {Number(course.price).toFixed(2)}</span>
              </div>
              <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
                <IconButton tooltip="Editar" onClick={() => openEdit(course)}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </IconButton>
                <IconButton tooltip="Excluir" variant="danger" onClick={() => setConfirmDelete({ id: course.id, name: course.name })}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        {courses.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum curso cadastrado</div>
        )}
        <div className="mt-4">
          <Pagination page={page} totalPages={Math.ceil(courses.length / PAGE_SIZE)} total={courses.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir curso"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name}"?`}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? "Editar Curso" : "Novo Curso"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PRESENCIAL" | "ONLINE" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duração (horas) *</label>
                  <input type="number" min={1} required value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                <input type="number" min={0} step={0.01} required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" />
              </div>
              <div className="flex items-center gap-2">
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Ativo</label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50">
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
