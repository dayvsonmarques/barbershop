"use client";

import { useState, useEffect, useMemo } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/admin/pagination";
import { IconButton } from "@/components/admin/icon-button";
import { SortHeader, useSort, sortData } from "@/components/admin/sort-header";

const PAGE_SIZE = 15;

type Category = {
  id: number;
  name: string;
  description: string | null;
  _count?: { services: number };
};

type Service = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  categoryId: number;
  category: { id: number; name: string };
};

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, servicesRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/services"),
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory
    ? services.filter((s) => s.categoryId === selectedCategory)
    : services;
  const [page, setPage] = useState(1);
  const { sort, toggle } = useSort("name");
  const sortedServices = useMemo(() => sortData(filteredServices.map(s => ({ ...s, "category.name": s.category.name })), sort), [filteredServices, sort]);
  const paginatedServices = useMemo(() => sortedServices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sortedServices, page]);

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
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerenciamento de categorias e serviços
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
            <p className="text-sm text-gray-600">
              {categories.length} categorias cadastradas
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            + Nova Categoria
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                selectedCategory === category.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )
              }
            >
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {category.description}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {category._count?.services || 0} serviços
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Serviços</h2>
            <p className="text-sm text-gray-600">
              {filteredServices.length} serviços
              {selectedCategory && " nesta categoria"}
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
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
              {paginatedServices.map((service) => (
                <tr key={service.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {service.name}
                    </div>
                    {service.description && (
                      <div className="text-sm text-gray-500">
                        {service.description.substring(0, 50)}
                        {service.description.length > 50 && "..."}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {service.category.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {service.duration} min
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                    R$ {Number(service.price).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        service.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton tooltip="Editar">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </IconButton>
                      <IconButton tooltip="Excluir" variant="danger">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={Math.ceil(filteredServices.length / PAGE_SIZE)} total={filteredServices.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </div>
  );
}
