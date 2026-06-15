"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((res) => {
      if (res.ok) router.replace("/painel-gerenciar");
    });
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Não foi possível entrar. Verifique suas credenciais.");
        return;
      }

      router.replace("/painel-gerenciar");
    } catch {
      setError("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1 block w-full border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#18181B] placeholder-[#A1A1AA] focus:border-[#C9A84C] focus:outline-none transition-colors";

  return (
    <main className="min-h-screen bg-[#F7F7F8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/barbershop-logo.png"
            alt="ED Barbearia"
            width={96}
            height={96}
            className="object-contain rounded-full"
          />
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E5E5] p-6">
          {error && (
            <div className="mb-4 border-l-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#71717A] font-medium mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="email@edbarbearia.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-[#71717A] font-medium mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#B8963C] text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

      </div>

      {/* Assinatura flutuante */}
      <div className="group fixed bottom-4 right-4 z-50">
        <span className="pointer-events-none absolute bottom-full right-0 mb-4 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Desenvolvido por Web Dev Studio
        </span>
        <a
          href="https://webdev.recife.br/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Desenvolvido por webdev.recife.br"
          className="flex items-center justify-center w-8 h-8 rotate-45 border border-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors duration-200"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="-rotate-45 w-4 h-4 text-[#C9A84C] transition-colors duration-200"
          >
            <path d="M8 6L3 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.5 4.5L9.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 6L21 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </main>
  );
}
