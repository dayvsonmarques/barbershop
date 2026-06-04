"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductForm } from "../../_components/product-form";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct({
          name: data.name,
          slug: data.slug,
          categoryId: String(data.categoryId),
          description: data.description ?? "",
          price: String(data.price),
          discountPrice: data.discountPrice ? String(data.discountPrice) : "",
          stock: String(data.stock),
          isActive: data.isActive,
          images: data.images,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;
  if (!product) return <div className="p-6 text-red-600">Produto não encontrado</div>;

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
        <p className="mt-1 text-sm text-gray-600">Altere os dados do produto</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm productId={parseInt(id, 10)} initialData={product} />
      </div>
    </div>
  );
}
