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
    redirect("/admin/login");
  }

  return (
    <Providers>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <Header />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
