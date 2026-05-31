"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { ProductCard } from "@/components/product-card";

const AUTO_MS = 3500;
const TRANSITION_MS = 450;

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: { url: string; isPrimary: boolean }[];
};

function usePerPage() {
  const [perPage, setPerPage] = useState(4);
  useEffect(() => {
    const update = () =>
      setPerPage(window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 3 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return perPage;
}

export function ProductsCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pos, setPos] = useState(0);
  const [animated, setAnimated] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const perPage = usePerPage();

  useEffect(() => {
    fetch("/api/public/products?limit=6")
      .then((r) => r.json())
      .then((json) => {
        const list: Product[] = json.data ?? [];
        setProducts(list);
        setPos(list.length); // start at middle copy
      });
  }, []);

  const count = products.length;

  // Wrap detection: after animation ends, silently jump to equivalent position in middle copy
  useEffect(() => {
    if (count === 0) return;
    if (pos >= count * 2) {
      const t = setTimeout(() => {
        setAnimated(false);
        setPos((p) => p - count);
      }, TRANSITION_MS + 20);
      return () => clearTimeout(t);
    }
    if (pos < count) {
      const t = setTimeout(() => {
        setAnimated(false);
        setPos((p) => p + count);
      }, TRANSITION_MS + 20);
      return () => clearTimeout(t);
    }
  }, [pos, count]);

  // Re-enable animation right after a non-animated jump
  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => setAnimated(true), 30);
      return () => clearTimeout(t);
    }
  }, [animated]);

  const advance = useCallback(() => {
    setAnimated(true);
    setPos((p) => p + 1);
  }, []);

  const retreat = useCallback(() => {
    setAnimated(true);
    setPos((p) => p - 1);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(advance, AUTO_MS);
  }, [advance]);

  useEffect(() => {
    if (count === 0) return;
    timerRef.current = setInterval(advance, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, advance]);

  if (count === 0) return null;

  const allItems = [...products, ...products, ...products];
  const trackPct = (allItems.length / perPage) * 100;
  const itemPct = 100 / allItems.length;
  const translatePct = -(pos / allItems.length) * 100;

  return (
    <section className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <SectionLabel label="Loja" />
        <h2
          className="font-heading text-text-primary"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Produtos em destaque
        </h2>
      </div>

      <div className="relative px-10">
        {/* Prev arrow */}
        <button
          onClick={() => { retreat(); resetTimer(); }}
          aria-label="Anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center bg-background-primary border border-border text-text-primary hover:border-gold hover:text-gold transition-colors text-xl"
        >
          ‹
        </button>

        <div className="overflow-hidden">
          <div
            className="flex"
            style={{
              width: `${trackPct}%`,
              transform: `translateX(${translatePct}%)`,
              transition: animated ? `transform ${TRANSITION_MS}ms ease-in-out` : "none",
            }}
          >
            {allItems.map((p, i) => (
              <div key={i} style={{ width: `${itemPct}%` }} className="px-2">
                <ProductCard
                  name={p.name}
                  slug={p.slug}
                  price={p.price}
                  discountPrice={p.discountPrice}
                  primaryImageUrl={p.images[0]?.url ?? null}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow */}
        <button
          onClick={() => { advance(); resetTimer(); }}
          aria-label="Próximo"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center bg-background-primary border border-border text-text-primary hover:border-gold hover:text-gold transition-colors text-xl"
        >
          ›
        </button>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/produtos"
          className="inline-block border border-gold text-gold px-8 py-3 text-sm tracking-widest uppercase hover:bg-gold hover:text-background-primary transition-colors"
        >
          Ver mais produtos
        </Link>
      </div>
    </section>
  );
}
