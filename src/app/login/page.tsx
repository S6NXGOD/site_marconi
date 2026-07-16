import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Login | Portal do Grupo Dr. Marconi Nunes",
  description: "Acesso à área administrativa do Grupo Dr. Marconi Nunes.",
};

export default async function LoginPage() {
  // Já autenticado? Vai direto ao painel.
  const session = await getServerSession(authOptions);
  if (session) redirect("/admin");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-conplan px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_45%)]" />

      <div className="relative flex w-full flex-col items-center">
        <Suspense fallback={<div className="text-slate-300">Carregando...</div>}>
          <LoginForm />
        </Suspense>

        <Link
          href="/"
          className="mt-8 text-sm font-medium text-slate-300 transition-colors hover:text-marconi-light"
        >
          ← Voltar ao site
        </Link>
      </div>
    </main>
  );
}
