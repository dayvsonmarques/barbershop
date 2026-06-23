"use client";

import { useEffect, useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Testimonial = {
  id: number;
  author: string;
  quote: string;
  avatarUrl: string | null;
  rating: number;
  position: number;
  isActive: boolean;
};

type FormState = {
  author: string;
  quote: string;
  avatarUrl: string;
  rating: number;
  isActive: boolean;
};

const emptyForm: FormState = { author: "", quote: "", avatarUrl: "", rating: 5, isActive: true };

function Stars({ rating, onChange }: { rating: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={n <= rating ? "#C9A84C" : "none"} stroke="#C9A84C" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) setTestimonials(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setAvatarPreview("");
    setShowModal(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({ author: t.author, quote: t.quote, avatarUrl: t.avatarUrl ?? "", rating: t.rating, isActive: t.isActive });
    setAvatarPreview(t.avatarUrl ?? "");
    setShowModal(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload/testimonial-avatar", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setForm((f) => ({ ...f, avatarUrl: url }));
      setAvatarPreview(url);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/testimonials/${editing.id}` : "/api/admin/testimonials";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, avatarUrl: form.avatarUrl || null }),
      });
      if (res.ok) {
        await load();
        setShowModal(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number, author: string) {
    setConfirmDelete({ id, name: author });
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/testimonials/${confirmDelete.id}`, { method: "DELETE" });
    if (res.ok) {
      setTestimonials((prev) => prev.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } else {
      setConfirmDelete(null);
    }
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || result.destination.index === result.source.index) return;
    const items = Array.from(testimonials);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setTestimonials(items);
    await fetch("/api/admin/testimonials/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items.map((t, i) => ({ id: t.id, position: i }))),
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depoimentos</h1>
          <p className="mt-1 text-sm text-gray-600">{testimonials.length} depoimentos cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Depoimento
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["", "Avatar", "Autor", "Depoimento", "Rating", "Status", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <Droppable droppableId="testimonials">
              {(provided) => (
                <tbody
                  className="divide-y divide-gray-200 bg-white"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {testimonials.map((t, index) => (
                    <Draggable key={t.id} draggableId={String(t.id)} index={index}>
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "bg-[#FDF8EE] shadow-md" : ""}
                        >
                          <td className="px-3 py-3 w-8" {...provided.dragHandleProps}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
                              <circle cx="9" cy="5" r="1" fill="#A1A1AA" /><circle cx="15" cy="5" r="1" fill="#A1A1AA" />
                              <circle cx="9" cy="12" r="1" fill="#A1A1AA" /><circle cx="15" cy="12" r="1" fill="#A1A1AA" />
                              <circle cx="9" cy="19" r="1" fill="#A1A1AA" /><circle cx="15" cy="19" r="1" fill="#A1A1AA" />
                            </svg>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                              {t.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={t.avatarUrl} alt={t.author} className="w-full h-full object-cover object-center" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-gray-400 text-xs font-semibold">
                                  {t.author.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{t.author}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                            <span className="line-clamp-2">{t.quote}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Stars rating={t.rating} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${t.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {t.isActive ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                            <button onClick={() => openEdit(t)} className="text-[#C9A84C] hover:text-[#A07830] mr-4">
                              Editar
                            </button>
                            <button onClick={() => handleDelete(t.id, t.author)} className="text-red-600 hover:text-red-900">
                              Excluir
                            </button>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
        {testimonials.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum depoimento cadastrado</div>
        )}
      </div>

      {/* Modal */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir depoimento"
        message={`Tem certeza que deseja excluir o depoimento de "${confirmDelete?.name}"? O registro será ocultado mas não apagado permanentemente.`}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Depoimento" : "Novo Depoimento"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover object-center" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-xl font-semibold">
                        {form.author.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Escolher imagem
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Autor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
                <input
                  type="text"
                  required
                  value={form.author}
                  onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  placeholder="Nome do cliente"
                />
              </div>

              {/* Depoimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depoimento *</label>
                <textarea
                  required
                  rows={4}
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none"
                  placeholder="O que o cliente disse..."
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação</label>
                <Stars rating={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Exibir no site</label>
              </div>

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
