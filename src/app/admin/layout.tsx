import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
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
  // Não trava o zoom: bloquear o pinch prejudica quem precisa ampliar.
  // O zoom indesejado do iOS é resolvido pela fonte de 16px nos campos.
  width: "device-width",
  initialScale: 1,
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
    <>
      <RegisterSW />
      <AdminShell userName={session.user?.name}>{children}</AdminShell>
    </>
  );
}
