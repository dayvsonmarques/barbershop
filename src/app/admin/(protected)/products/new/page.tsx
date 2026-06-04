import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductForm } from "../_components/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
        <p className="mt-1 text-sm text-gray-600">Preencha os dados do produto</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <ProductForm />
      </div>
    </div>
  );
}
