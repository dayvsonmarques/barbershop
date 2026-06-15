import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Providers } from "./_components/Layouts/providers";
import { Sidebar } from "./_components/Layouts/sidebar";
import { Header } from "./_components/Layouts/header";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/painel-gerenciar/login");
  }

  return (
    <Providers>
      <div className="flex min-h-screen bg-[#F7F7F8]">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 p-3 sm:p-6 max-w-screen-2xl w-full mx-auto">
            {children}
          </main>
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
    </Providers>
  );
}
