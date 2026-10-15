import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-6 py-24">
        {/* Brilho dourado de fundo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] max-w-[120vw] rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative text-center animate-fade-in">
          <p
            className="font-heading font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-gold-light to-gold-dark select-none"
            style={{ fontSize: "clamp(8rem, 28vw, 16rem)" }}
          >
            404
          </p>

          <div className="mx-auto my-8 h-px w-16 bg-gold/50" />

          <h1
            className="font-heading text-text-primary mb-4"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", lineHeight: "1.1" }}
          >
            Página não encontrada
          </h1>

          <p className="text-text-secondary text-lg max-w-md mx-auto mb-10">
            O endereço que você acessou não existe ou foi removido.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-3 bg-gold text-text-inverse px-8 py-4 font-heading uppercase tracking-widest hover:bg-gold-light transition-colors duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar para a página inicial
          </Link>
        </div>
      </main>
    </div>
  );
}
