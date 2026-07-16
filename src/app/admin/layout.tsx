import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import RegisterSW from "@/components/admin/RegisterSW";

export const metadata: Metadata = {
  title: "Painel | Grupo Dr. Marconi Nunes",
  robots: { index: false, follow: false },
  // PWA — arquivo estático em public/, linkado SÓ aqui.
  // (app/manifest.ts não serve: o Next injeta o <link rel="manifest"> em
  //  todas as páginas, e o site público passaria a oferecer instalação.)
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Painel MN",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A192F",
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
      <RegisterSW />
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
