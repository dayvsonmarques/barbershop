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

    </Providers>
  );
}
