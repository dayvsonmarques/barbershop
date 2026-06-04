"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { generateSlug } from "@/lib/slug";

type ProductImage = { url: string; title?: string | null; description?: string | null; position: number; isPrimary: boolean };

type FormState = {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  isActive: boolean;
  images: ProductImage[];
};

type Category = { id: number; name: string };

type Props = {
  productId?: number;
  initialData?: Partial<FormState & { images: ProductImage[] }>;
};

export function ProductForm({ productId, initialData }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    categoryId: initialData?.categoryId ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price ?? "",
    discountPrice: initialData?.discountPrice ?? "",
    stock: initialData?.stock ?? "0",
    isActive: initialData?.isActive ?? true,
    images: initialData?.images ?? [],
  });

  useEffect(() => {
    fetch("/api/admin/product-categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.data ?? []));
  }, []);

  function set(field: keyof FormState, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleNameChange(value: string) {
    set("name", value);
    if (!productId) set("slug", generateSlug(value));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload/product-image", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Upload failed");
          continue;
        }
        const { url } = await res.json();
        setForm((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            { url, title: null, description: null, position: prev.images.length, isPrimary: prev.images.length === 0 },
          ],
        }));
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveImage(url: string) {
    await fetch(`/api/admin/upload/product-image?file=${encodeURIComponent(url)}`, { method: "DELETE" });
    setForm((prev) => {
      const remaining = prev.images
        .filter((i) => i.url !== url)
        .map((i, idx) => ({ ...i, position: idx }));
      if (remaining.length > 0 && !remaining.some((i) => i.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      return { ...prev, images: remaining };
    });
  }

  function setPrimary(url: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((i) => ({ ...i, isPrimary: i.url === url })),
    }));
  }

  function setImageTitle(url: string, title: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((i) => (i.url === url ? { ...i, title: title || null } : i)),
    }));
  }

  function setImageDescription(url: string, desc: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((i) => (i.url === url ? { ...i, description: desc || null } : i)),
    }));
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(form.images);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setForm((prev) => ({ ...prev, images: items.map((i, idx) => ({ ...i, position: idx })) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        categoryId: parseInt(form.categoryId, 10),
        description: form.description || null,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        stock: parseInt(form.stock, 10),
        isActive: form.isActive,
        images: form.images,
      };

      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar");
        return;
      }

      router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Nome + Slug */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome *</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            className={inputClass}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            pattern="[a-z0-9-]+"
            title="Apenas letras minúsculas, números e hífens"
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label className={labelClass}>Categoria *</label>
        <select
          className={inputClass}
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
          required
        >
          <option value="">Selecione...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div>
        <label className={labelClass}>Descrição</label>
        <textarea
          className={inputClass}
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={5000}
        />
      </div>

      {/* Preço + Desconto + Estoque */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Preço (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Preço c/ desconto (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={form.discountPrice}
            onChange={(e) => set("discountPrice", e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className={labelClass}>Estoque</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={form.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#C9A84C]"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">Produto ativo (visível na loja)</label>
      </div>

      {/* Imagens */}
      <div>
        <label className={labelClass}>Imagens</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mb-3 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "+ Adicionar imagens"}
        </button>
        <p className="text-xs text-gray-500 mb-3">JPEG, PNG ou WebP · máx 5 MB · arraste para reordenar · ★ = imagem principal</p>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-3"
              >
                {form.images.map((img, idx) => (
                  <Draggable key={img.url} draggableId={img.url} index={idx}>
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className="relative group flex flex-col gap-1"
                      >
                        <div className={`relative h-24 w-24 overflow-hidden rounded border-2 ${img.isPrimary ? "border-[#C9A84C]" : "border-gray-200"}`}>
                          <Image src={img.url} alt={img.title ?? ""} fill className="object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPrimary(img.url)}
                          title="Marcar como principal"
                          className={`absolute top-1 left-1 text-xs ${img.isPrimary ? "text-[#C9A84C]" : "text-white opacity-0 group-hover:opacity-100"}`}
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.url)}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                        <input
                          type="text"
                          value={img.title ?? ""}
                          onChange={(e) => setImageTitle(img.url, e.target.value)}
                          placeholder="Título"
                          maxLength={200}
                          className="w-24 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 focus:border-[#C9A84C] focus:outline-none"
                        />
                        <textarea
                          value={img.description ?? ""}
                          onChange={(e) => setImageDescription(img.url, e.target.value)}
                          placeholder="Descrição"
                          maxLength={1000}
                          rows={2}
                          className="w-24 rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-600 focus:border-[#C9A84C] focus:outline-none resize-none"
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#C9A84C] px-6 py-2 text-sm font-medium text-white hover:bg-[#A07830] disabled:opacity-50"
        >
          {saving ? "Salvando..." : productId ? "Salvar alterações" : "Criar produto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
