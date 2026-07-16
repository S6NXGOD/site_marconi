import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Área Administrativa | Portal do Grupo",
  robots: { index: false, follow: false },
};

// Sempre renderiza sob demanda (dados dinâmicos + sessão).
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proteção adicional no servidor (além do middleware).
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-cloud lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar fixa em telas grandes */}
      <div className="hidden lg:block lg:h-screen lg:sticky lg:top-0">
        <AdminSidebar userName={session.user?.name} />
      </div>

      {/* Sidebar compacta no topo em telas pequenas */}
      <div className="lg:hidden">
        <AdminSidebar userName={session.user?.name} />
      </div>

      <main className="px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
