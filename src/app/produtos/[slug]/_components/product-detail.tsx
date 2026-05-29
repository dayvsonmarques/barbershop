"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/contexts/cart-context";

type ProductImage = { id: number; url: string; position: number; isPrimary: boolean };

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  stock: number;
  category: { id: number; name: string };
  images: ProductImage[];
};

type RelatedProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: { url: string; isPrimary: boolean }[];
};

type Props = { product: Product; related: RelatedProduct[] };

export function ProductDetail({ product, related }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(
    product.images.find((i) => i.isPrimary) ?? product.images[0] ?? null
  );
  const [qty, setQty] = useState(1);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const effectivePrice = product.discountPrice ?? product.price;
  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : null;

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.discountPrice ?? product.price,
        imageUrl: product.images.find((img) => img.isPrimary)?.url ?? product.images[0]?.url ?? "",
      });
    }
  }

  function handleBuyNow() {
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.discountPrice ?? product.price,
        imageUrl: product.images.find((img) => img.isPrimary)?.url ?? product.images[0]?.url ?? "",
      });
    }
    router.push("/checkout");
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-secondary mb-8">
        <Link href="/" className="hover:text-gold">Início</Link>
        {" / "}
        <Link href="/produtos" className="hover:text-gold">Produtos</Link>
        {" / "}
        <span className="text-text-primary">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden bg-background-tertiary border border-border mb-3">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-opacity duration-200"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-border">Sem imagem</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden border-2 transition-colors ${activeImage?.id === img.id ? "border-gold" : "border-border hover:border-gold/50"}`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="text-gold text-xs tracking-widest uppercase mb-2">{product.category.name}</p>
          <h1 className="font-heading text-text-primary mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            {discountPct ? (
              <>
                <span className="text-gold font-semibold text-3xl">R$ {fmt(effectivePrice)}</span>
                <span className="text-text-secondary text-lg line-through">R$ {fmt(product.price)}</span>
                <span className="bg-gold text-background-primary text-xs font-bold px-2 py-0.5">-{discountPct}%</span>
              </>
            ) : (
              <span className="text-gold font-semibold text-3xl">R$ {fmt(effectivePrice)}</span>
            )}
          </div>

          {product.description && (
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{product.description}</p>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-text-secondary text-sm">Quantidade:</span>
            <div className="flex items-center border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-text-primary hover:text-gold transition-colors"
              >
                −
              </button>
              <span className="px-4 py-2 text-text-primary min-w-[3rem] text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 text-text-primary hover:text-gold transition-colors"
                disabled={qty >= product.stock}
              >
                +
              </button>
            </div>
            <span className="text-text-secondary text-xs">{product.stock} em estoque</span>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            {product.stock === 0 ? (
              <div className="flex-1 border border-border px-6 py-3 text-sm text-text-secondary text-center">
                Produto esgotado
              </div>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gold text-background-primary px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Adicionar ao Carrinho
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 border border-gold text-gold px-6 py-3 text-sm font-medium hover:bg-gold hover:text-background-primary transition-colors"
                >
                  Comprar Agora
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="font-heading text-text-primary text-2xl mb-8">Produtos Relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.price)}
                discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                primaryImageUrl={p.images[0]?.url ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
