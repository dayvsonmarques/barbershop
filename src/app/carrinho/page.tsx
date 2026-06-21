"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function CartPage() {
  const { items, totalPrice, totalItems, updateQuantity, removeItem } = useCart();
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const confirmingItem = items.find((i) => i.productId === confirmingId);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <Navbar />
      <main>
        {totalItems === 0 ? (
          <div className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
            <svg className="mx-auto mb-6 text-border" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <h1 className="font-heading text-text-primary text-3xl mb-4">Carrinho vazio</h1>
            <p className="text-text-secondary mb-8">Adicione produtos antes de finalizar o pedido.</p>
            <Link href="/produtos" className="inline-block bg-gold text-background-primary px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="font-heading text-text-primary text-2xl sm:text-4xl mb-8 sm:mb-12">Meu Carrinho</h1>

            <ul className="space-y-5 mb-8">
              {items.map((item) => {
                const total = fmt(item.price * item.quantity);
                return (
                  <li key={item.productId} className="flex gap-3 pb-5 border-b border-border last:border-0">
                    {item.imageUrl ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-background-tertiary border border-border">
                        <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-20 w-20 shrink-0 bg-background-tertiary border border-border" />
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
                          <p className="text-text-secondary text-xs mt-0.5">R$ {fmt(item.price)} / un.</p>
                        </div>
                        <button
                          onClick={() => setConfirmingId(item.productId)}
                          className="text-text-secondary hover:text-red-500 transition-colors shrink-0 mt-0.5"
                          aria-label="Remover"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-3 py-1.5 text-text-primary hover:text-gold transition-colors text-sm"
                          >−</button>
                          <span className="px-4 py-1.5 text-text-primary text-sm min-w-10 text-center border-x border-border">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-3 py-1.5 text-text-primary hover:text-gold transition-colors text-sm"
                          >+</button>
                        </div>
                        <p className="text-gold font-semibold text-sm">R$ {total}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-between items-center py-4 border-t border-border mb-8">
              <span className="text-text-secondary">Total</span>
              <span className="text-gold font-semibold text-xl">R$ {fmt(totalPrice)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Link
                href="/produtos"
                className="text-text-secondary text-sm hover:text-gold transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Continuar comprando
              </Link>
              <button
                onClick={() => router.push("/checkout")}
                className="bg-gold text-background-primary px-8 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Finalizar Pedido →
              </button>
            </div>
          </div>
        )}
      </main>
      {confirmingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmingId(null)} />
          <div className="relative bg-background-primary border border-border w-full max-w-xs p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <p className="text-text-primary font-heading text-lg mb-1">Remover item</p>
            <p className="text-text-secondary text-sm mb-6">
              Tem certeza que deseja remover <span className="text-text-primary font-medium">{confirmingItem.name}</span> do carrinho?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingId(null)}
                className="flex-1 border border-border text-text-secondary text-sm py-2.5 hover:border-gold hover:text-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { removeItem(confirmingItem.productId); setConfirmingId(null); }}
                className="flex-1 bg-red-600 text-white text-sm py-2.5 hover:bg-red-700 transition-colors font-medium"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
