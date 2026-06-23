"use client";

import { useState, useEffect, useMemo } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";
import { SortHeader, useSort, sortData } from "@/components/admin/sort-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

const PAGE_SIZE = 15;

type Category = { id: number; name: string; description: string | null; _count?: { services: number } };
type Service = {
  id: number; name: string; description: string | null;
  duration: number; price: number; isActive: boolean;
  categoryId: number; category: { id: number; name: string };
};

type CategoryForm = { name: string; description: string };
type ServiceForm = { name: string; description: string; duration: number; price: number; categoryId: number; isActive: boolean };

const emptyCatForm: CategoryForm = { name: "", description: "" };
const emptySvcForm: ServiceForm = { name: "", description: "", duration: 30, price: 0, categoryId: 0, isActive: true };

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCatForm);
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<{ id: number; name: string } | null>(null);

  // Service modal
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [editingSvc, setEditingSvc] = useState<Service | null>(null);
  const [svcForm, setSvcForm] = useState<ServiceForm>(emptySvcForm);
  const [svcSaving, setSvcSaving] = useState(false);
  const [svcError, setSvcError] = useState<string | null>(null);
  const [confirmDeleteSvc, setConfirmDeleteSvc] = useState<{ id: number; name: string } | null>(null);

  const [page, setPage] = useState(1);
  const { sort, toggle } = useSort("name");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [catRes, svcRes] = await Promise.all([fetch("/api/admin/categories"), fetch("/api/admin/services")]);
      if (catRes.ok) setCategories(await catRes.json());
      if (svcRes.ok) setServices(await svcRes.json());
    } finally {
      setLoading(false);
    }
  }

  const filteredServices = selectedCategory ? services.filter((s) => s.categoryId === selectedCategory) : services;
  const sortedServices = useMemo(() => sortData(filteredServices.map(s => ({ ...s, "category.name": s.category.name })), sort), [filteredServices, sort]);
  const paginatedServices = useMemo(() => sortedServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedServices, page]);

  // -- Category CRUD --
  function openNewCat() { setEditingCat(null); setCatForm(emptyCatForm); setCatError(null); setShowCatModal(true); }
  function openEditCat(c: Category) { setEditingCat(c); setCatForm({ name: c.name, description: c.description ?? "" }); setCatError(null); setShowCatModal(true); }

  async function handleSaveCat(e: React.FormEvent) {
    e.preventDefault();
    setCatSaving(true); setCatError(null);
    try {
      const url = editingCat ? `/api/admin/categories/${editingCat.id}` : "/api/admin/categories";
      const res = await fetch(url, { method: editingCat ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...catForm, description: catForm.description || null }) });
      if (res.ok) { await loadData(); setShowCatModal(false); }
      else { const d = await res.json(); setCatError(d.error ?? "Erro ao salvar"); }
    } finally { setCatSaving(false); }
  }

  async function doDeleteCat() {
    if (!confirmDeleteCat) return;
    const res = await fetch(`/api/admin/categories/${confirmDeleteCat.id}`, { method: "DELETE" });
    if (res.ok) { setCategories((p) => p.filter((c) => c.id !== confirmDeleteCat.id)); if (selectedCategory === confirmDeleteCat.id) setSelectedCategory(null); }
    else { const d = await res.json(); alert(d.error ?? "Erro ao excluir"); }
    setConfirmDeleteCat(null);
  }

  // -- Service CRUD --
  function openNewSvc() {
    setEditingSvc(null);
    setSvcForm({ ...emptySvcForm, categoryId: selectedCategory ?? (categories[0]?.id ?? 0) });
    setSvcError(null); setShowSvcModal(true);
  }
  function openEditSvc(s: Service) {
    setEditingSvc(s);
    setSvcForm({ name: s.name, description: s.description ?? "", duration: s.duration, price: s.price, categoryId: s.categoryId, isActive: s.isActive });
    setSvcError(null); setShowSvcModal(true);
  }

  async function handleSaveSvc(e: React.FormEvent) {
    e.preventDefault();
    setSvcSaving(true); setSvcError(null);
    try {
      const url = editingSvc ? `/api/admin/services/${editingSvc.id}` : "/api/admin/services";
      const res = await fetch(url, { method: editingSvc ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...svcForm, description: svcForm.description || null }) });
      if (res.ok) { await loadData(); setShowSvcModal(false); }
      else { const d = await res.json(); setSvcError(d.error ?? "Erro ao salvar"); }
    } finally { setSvcSaving(false); }
  }

  async function doDeleteSvc() {
    if (!confirmDeleteSvc) return;
    await fetch(`/api/admin/services/${confirmDeleteSvc.id}`, { method: "DELETE" });
    setServices((p) => p.filter((s) => s.id !== confirmDeleteSvc.id));
    setConfirmDeleteSvc(null);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <p className="mt-1 text-sm text-gray-600">Gerenciamento de categorias e serviços</p>
      </div>

      {/* Categories */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
            <p className="text-sm text-gray-600">{categories.length} categorias</p>
          </div>
          <button onClick={openNewCat} className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]">
            + Nova Categoria
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id}
              className={`group rounded-lg border-2 p-4 cursor-pointer transition-colors relative ${selectedCategory === cat.id ? "border-[#C9A84C] bg-[#FDF8EE]" : "border-gray-200 hover:border-gray-300"}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <div className="pr-12">
                <h3 className="font-semibold text-gray-900 truncate">{cat.name}</h3>
                {cat.description && <p className="mt-0.5 text-sm text-gray-500 truncate">{cat.description}</p>}
                <p className="mt-1 text-xs text-gray-400">{cat._count?.services ?? 0} serviços</p>
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <IconButton tooltip="Editar" onClick={() => openEditCat(cat)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </IconButton>
                <IconButton tooltip="Excluir" variant="danger" onClick={() => setConfirmDeleteCat({ id: cat.id, name: cat.name })}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </IconButton>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-gray-400 col-span-3">Nenhuma categoria cadastrada</p>}
        </div>
      </div>

      {/* Services */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Serviços</h2>
            <p className="text-sm text-gray-600">{filteredServices.length} serviços{selectedCategory && " nesta categoria"}</p>
          </div>
          <button onClick={openNewSvc} className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]">
            + Novo Serviço
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader label="Serviço"   field="name"          sort={sort} onSort={toggle} className="px-6" />
                <SortHeader label="Categoria" field="category.name" sort={sort} onSort={toggle} className="px-6" />
                <SortHeader label="Duração"   field="duration"      sort={sort} onSort={toggle} className="px-6" />
                <SortHeader label="Preço"     field="price"         sort={sort} onSort={toggle} className="px-6" />
                <SortHeader label="Status"    field="isActive"      sort={sort} onSort={toggle} className="px-6" />
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedServices.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    {s.description && <div className="text-sm text-gray-500 truncate max-w-xs">{s.description}</div>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{s.category.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{s.duration} min</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">R$ {Number(s.price).toFixed(2)}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {s.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton tooltip="Editar" onClick={() => openEditSvc(s)}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconButton>
                      <IconButton tooltip="Excluir" variant="danger" onClick={() => setConfirmDeleteSvc({ id: s.id, name: s.name })}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredServices.length === 0 && <div className="py-12 text-center text-gray-500">Nenhum serviço{selectedCategory && " nesta categoria"}</div>}
          <Pagination page={page} totalPages={Math.ceil(filteredServices.length / PAGE_SIZE)} total={filteredServices.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog open={confirmDeleteCat !== null} title="Excluir categoria"
        message={`Tem certeza que deseja excluir "${confirmDeleteCat?.name}"? Os serviços associados não serão excluídos.`}
        onConfirm={doDeleteCat} onCancel={() => setConfirmDeleteCat(null)} />
      <ConfirmDialog open={confirmDeleteSvc !== null} title="Excluir serviço"
        message={`Tem certeza que deseja excluir "${confirmDeleteSvc?.name}"?`}
        onConfirm={doDeleteSvc} onCancel={() => setConfirmDeleteSvc(null)} />

      {/* Category modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{editingCat ? "Editar Categoria" : "Nova Categoria"}</h2>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveCat} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input required value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" placeholder="Ex: Corte de Cabelo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={2} value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none" />
              </div>
              {catError && <p className="text-sm text-red-600">{catError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={catSaving} className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50">
                  {catSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service modal */}
      {showSvcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{editingSvc ? "Editar Serviço" : "Novo Serviço"}</h2>
              <button onClick={() => setShowSvcModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveSvc} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input required value={svcForm.name} onChange={(e) => setSvcForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea rows={2} value={svcForm.description} onChange={(e) => setSvcForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select required value={svcForm.categoryId} onChange={(e) => setSvcForm((f) => ({ ...f, categoryId: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]">
                  <option value={0} disabled>Selecione...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min) *</label>
                  <input type="number" min={5} required value={svcForm.duration} onChange={(e) => setSvcForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                  <input type="number" min={0} step={0.01} required value={svcForm.price} onChange={(e) => setSvcForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="svcActive" type="checkbox" checked={svcForm.isActive} onChange={(e) => setSvcForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]" />
                <label htmlFor="svcActive" className="text-sm text-gray-700">Ativo</label>
              </div>
              {svcError && <p className="text-sm text-red-600">{svcError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSvcModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={svcSaving} className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50">
                  {svcSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
