"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";
import { SortHeader, useSort, sortData } from "@/components/admin/sort-header";

const PAGE_SIZE = 15;

type ProductImage = { url: string; isPrimary: boolean };

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  isActive: boolean;
  category: { id: number; name: string };
  images: ProductImage[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { sort, toggle } = useSort("name");
  const sorted = useMemo(() => sortData(products.map(p => ({ ...p, "category.name": p.category.name, effectivePrice: p.discountPrice ?? p.price })), sort), [products, sort]);
  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Desativar "${name}"?`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="mt-1 text-sm text-gray-600">{products.length} produtos cadastrados</p>
        </div>
        <Link
          href="/painel-gerenciar/products/new"
          className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-[#A07830]"
        >
          + Novo Produto
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Produto"   field="name"           sort={sort} onSort={toggle} />
              <SortHeader label="Categoria" field="category.name"  sort={sort} onSort={toggle} />
              <SortHeader label="Preço"     field="effectivePrice" sort={sort} onSort={toggle} />
              <SortHeader label="Estoque"   field="stock"          sort={sort} onSort={toggle} />
              <SortHeader label="Status"    field="isActive"       sort={sort} onSort={toggle} />
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginated.map((p) => {
              const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
              const discount = p.discountPrice
                ? Math.round((1 - p.discountPrice / p.price) * 100)
                : null;
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
                        {primary ? (
                          <Image src={primary.url} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300 text-xs">—</div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.category.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        R$ {Number(p.discountPrice ?? p.price).toFixed(2).replace(".", ",")}
                      </span>
                      {discount && (
                        <span className="rounded bg-[#FDF8EE] px-1.5 py-0.5 text-xs font-semibold text-[#C9A84C]">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton tooltip="Editar" href={`/painel-gerenciar/products/${p.id}/edit`}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconButton>
                      <IconButton tooltip="Desativar" variant="danger" onClick={() => handleDelete(p.id, p.name)}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-12 text-center text-gray-500">Nenhum produto cadastrado</div>
        )}
        <Pagination page={page} totalPages={Math.ceil(products.length / PAGE_SIZE)} total={products.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
