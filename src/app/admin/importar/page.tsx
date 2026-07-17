import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ScrapeRunner from "@/components/admin/ScrapeRunner";

export default async function ImportarNoticiasPage() {
  const fontes = await prisma.scrapeSource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-conplan">Buscar notícias</h1>
        <p className="mt-1 text-sm text-slate-500">
          Busque nas fontes cadastradas e escolha o que virar rascunho.
        </p>
      </div>

      {fontes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
            </svg>
          </span>
          <p className="mt-4 font-serif text-lg text-conplan">
            Nenhuma fonte ativa
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Cadastre de onde as notícias devem vir. O formulário tem um atalho
            que já preenche tudo para o TCE-PI.
          </p>
          <Link
            href="/admin/fontes/nova"
            className="mt-5 inline-flex rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-colors hover:bg-marconi-dark"
          >
            Cadastrar fonte
          </Link>
        </div>
      ) : (
        <ScrapeRunner fontes={fontes} />
      )}
    </div>
  );
}
