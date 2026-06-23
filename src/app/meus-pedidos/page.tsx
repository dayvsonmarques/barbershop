"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CustomerLoginModal } from "@/components/customer-login-modal";
import { useCustomerAuth } from "@/contexts/customer-auth-context";

type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: string;
  product: { name: string; imageUrl: string | null; slug: string };
};

type Order = {
  id: number;
  total: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  items: OrderItem[];
};

const STATUS_LABEL: Record<Order["status"], string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

const STATUS_CLASS: Record<Order["status"], string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  PAID: "bg-green-500/10 text-green-400 border border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const fmt = (n: string | number) =>
  Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default function MeusPedidosPage() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!customer) { setLoading(false); return; }

    fetch("/api/public/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [customer, authLoading]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background-primary pt-28 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="font-heading text-3xl font-bold text-gold mb-8">Meus Pedidos</h1>

          {/* Não logado */}
          {!authLoading && !customer && (
            <div className="rounded-xl border border-border bg-background-secondary p-10 text-center">
              <p className="text-text-secondary mb-6">
                Faça login para visualizar seus pedidos.
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black hover:bg-gold/90 transition-colors"
              >
                Entrar
              </button>
              {showLogin && <CustomerLoginModal onClose={() => setShowLogin(false)} />}
            </div>
          )}

          {/* Carregando */}
          {(authLoading || (customer && loading)) && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-background-secondary p-5 animate-pulse h-32" />
              ))}
            </div>
          )}

          {/* Sem pedidos */}
          {customer && !loading && orders.length === 0 && (
            <div className="rounded-xl border border-border bg-background-secondary p-10 text-center">
              <p className="text-text-secondary mb-6">Você ainda não fez nenhum pedido.</p>
              <Link
                href="/produtos"
                className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-black hover:bg-gold/90 transition-colors"
              >
                Ver produtos
              </Link>
            </div>
          )}

          {/* Lista de pedidos */}
          {customer && !loading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border bg-background-secondary overflow-hidden">
                  {/* Cabeçalho do pedido */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-widest">Pedido</span>
                      <p className="text-white font-semibold">#{order.id}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-text-secondary">{fmtDate(order.createdAt)}</span>
                      <p className="text-gold font-semibold">R$ {fmt(order.total)}</p>
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="px-5 py-4 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background-primary overflow-hidden shrink-0 border border-border">
                          {item.product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{item.product.name}</p>
                          <p className="text-xs text-text-secondary">
                            {item.quantity}× R$ {fmt(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm text-white font-medium shrink-0">
                          R$ {fmt(Number(item.unitPrice) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Rodapé com status */}
                  <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_CLASS[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                    {order.status === "PENDING" && (
                      <Link
                        href={`/checkout`}
                        className="text-xs text-gold hover:underline"
                      >
                        Pagar agora
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
