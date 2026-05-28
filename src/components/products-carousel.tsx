"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { ProductCard } from "@/components/product-card";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: { url: string; isPrimary: boolean }[];
};

export function ProductsCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/public/products?limit=8")
      .then((r) => r.json())
      .then((json) => setProducts(json.data ?? []));
  }, []);

  function scroll(dir: "left" | "right") {
    if (!trackRef.current) return;
    const w = trackRef.current.offsetWidth;
    trackRef.current.scrollBy({ left: dir === "right" ? w * 0.75 : -w * 0.75, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Loja" />
        <div className="flex items-end justify-between mb-12">
          <h2
            className="font-heading text-text-primary"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
          >
            Produtos em destaque
          </h2>
          <Link href="/produtos" className="text-gold text-sm hover:underline hidden md:block">
            Ver todos →
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:flex h-10 w-10 items-center justify-center bg-background-primary border border-border text-text-primary hover:text-gold transition-colors"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:flex h-10 w-10 items-center justify-center bg-background-primary border border-border text-text-primary hover:text-gold transition-colors"
            aria-label="Próximo"
          >
            ›
          </button>

          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 md:grid md:grid-cols-4 md:overflow-visible"
            style={{ scrollbarWidth: "none" }}
          >
            {products.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[calc(50%-8px)] md:w-auto">
                <ProductCard
                  name={p.name}
                  slug={p.slug}
                  price={Number(p.price)}
                  discountPrice={p.discountPrice ? Number(p.discountPrice) : null}
                  primaryImageUrl={p.images[0]?.url ?? null}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/produtos" className="text-gold text-sm hover:underline">Ver todos →</Link>
        </div>
      </div>
    </section>
  );
}
