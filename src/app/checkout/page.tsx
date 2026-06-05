"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCart } from "@/contexts/cart-context";
import { generatePixCode } from "@/lib/pix";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

type OrderResult = {
  orderId: number;
  total: number;
  pixKey: string | null;
  storeName: string;
  merchantCity: string;
};

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  useEffect(() => {
    if (totalItems === 0 && !order) {
      router.replace("/carrinho");
    }
  }, [totalItems, order, router]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      const data = await res.json() as {
        error?: string;
        orderId?: number;
        total?: number;
        pixKey?: string | null;
        storeName?: string;
        merchantCity?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar pedido");
        setLoading(false);
        return;
      }

      setOrder({
        orderId: data.orderId!,
        total: data.total!,
        pixKey: data.pixKey ?? null,
        storeName: data.storeName ?? "ED Barbearia",
        merchantCity: data.merchantCity ?? "Recife",
      });
      clearCart();
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const pixCode = order?.pixKey
    ? generatePixCode({
        pixKey: order.pixKey,
        amount: order.total,
        merchantName: order.storeName,
        merchantCity: order.merchantCity,
        txId: String(order.orderId),
      })
    : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen">

        {/* PIX screen after order placed */}
        {order && (
          <div className="max-w-lg mx-auto px-6 py-16 text-center">
            <div className="mb-6">
              <svg className="mx-auto text-gold mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h1 className="font-heading text-text-primary text-3xl mb-2">Pedido #{order.orderId}</h1>
              <p className="text-text-secondary">Pague via PIX para confirmar seu pedido.</p>
            </div>
            <div className="border border-border p-6 mb-6 bg-background-secondary">
              <p className="text-gold font-semibold text-2xl mb-4">R$ {fmt(order.total)}</p>
              {pixCode ? (
                <>
                  <div className="flex justify-center mb-4 bg-white p-4 mx-auto">
                    <QRCodeSVG value={pixCode} size={200} />
                  </div>
                  <p className="text-text-secondary text-xs mb-3">Ou copie o código PIX:</p>
                  <div className="relative">
                    <input
                      readOnly
                      value={pixCode}
                      className="w-full bg-background-tertiary border border-border text-text-secondary text-xs px-3 py-2 pr-20 truncate"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(pixCode)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gold text-xs font-medium hover:underline"
                    >
                      Copiar
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-text-secondary text-sm">Entre em contato via WhatsApp para receber a chave PIX.</p>
              )}
            </div>
            <button
              onClick={() => { clearCart(); window.location.href = "/"; }}
              className="text-text-secondary text-sm hover:text-gold transition-colors"
            >
              Voltar para o início
            </button>
          </div>
        )}

        {/* Checkout review + form */}
        {!order && totalItems > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="flex items-center gap-3 mb-8 sm:mb-12">
              <Link href="/carrinho" className="text-text-secondary hover:text-gold transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <h1 className="font-heading text-text-primary text-2xl sm:text-4xl">Finalizar Pedido</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* Order review — read-only */}
              <section>
                <h2 className="font-heading text-text-primary text-xl mb-6 pb-3 border-b border-border">Revisão do Pedido</h2>
                <ul className="space-y-4 mb-6">
                  {items.map((item) => (
                    <li key={item.productId} className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-background-tertiary border border-border">
                          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 shrink-0 bg-background-tertiary border border-border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
                        <p className="text-text-secondary text-xs mt-0.5">
                          {item.quantity} × R$ {fmt(item.price)}
                        </p>
                      </div>
                      <p className="text-text-primary text-sm font-medium shrink-0">
                        R$ {fmt(item.price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between items-center py-4 border-t border-border">
                  <span className="text-text-secondary">Total</span>
                  <span className="text-gold font-semibold text-xl">R$ {fmt(totalPrice)}</span>
                </div>
              </section>

              {/* Customer data + confirm */}
              <section>
                <h2 className="font-heading text-text-primary text-xl mb-6 pb-3 border-b border-border">Seus Dados</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-text-secondary text-sm mb-1.5" htmlFor="customerName">
                      Nome completo
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                      className="w-full bg-background-secondary border border-border text-text-primary px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-1.5" htmlFor="customerPhone">
                      Telefone / WhatsApp
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                      required
                      minLength={14}
                      maxLength={15}
                      inputMode="numeric"
                      autoComplete="tel"
                      className="w-full bg-background-secondary border border-border text-text-primary px-4 py-3 focus:outline-none focus:border-gold transition-colors"
                      placeholder="(81) 99999-0000"
                    />
                  </div>
                  {error && (
                    <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold text-background-primary px-6 py-4 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processando..." : `Confirmar e Pagar R$ ${fmt(totalPrice)} via PIX`}
                  </button>
                </form>
              </section>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
