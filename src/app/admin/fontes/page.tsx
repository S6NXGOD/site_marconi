import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarDataCurta } from "@/lib/datas";
import { categoryLabels, categoryBadgeClasses } from "@/lib/news";
import {
  DeleteSourceButton,
  ToggleSourceActiveButton,
} from "@/components/admin/SourceRowActions";

const okMessages: Record<string, string> = {
  created: "Fonte criada com sucesso.",
  updated: "Fonte atualizada com sucesso.",
};

export default async function FontesPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const fontes = await prisma.scrapeSource.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Fontes de notícias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sites de onde o painel busca matérias para importar como rascunho.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {fontes.some((f) => f.isActive) && (
            <Link
              href="/admin/importar"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-semibold text-conplan transition-colors hover:border-marconi hover:text-marconi sm:w-auto"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              Buscar notícias
            </Link>
          )}
          <Link
            href="/admin/fontes/nova"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nova fonte
          </Link>
        </div>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {fontes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" />
              </svg>
            </span>
            <p className="mt-4 font-serif text-lg text-conplan">Nenhuma fonte cadastrada</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              O formulário tem um atalho que já preenche tudo para o TCE-PI.
            </p>
            <Link
              href="/admin/fontes/nova"
              className="mt-5 inline-flex rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-colors hover:bg-marconi-dark"
            >
              Cadastrar a primeira
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {fontes.map((f) => (
              <li key={f.id} className="p-4 transition-colors hover:bg-cloud/60 sm:p-5">
                <div className="lg:flex lg:items-center lg:gap-6">
                  <div className="min-w-0 lg:flex-1">
                    <Link
                      href={`/admin/fontes/${f.id}/editar`}
                      className="block text-sm font-semibold leading-snug text-conplan hover:text-marconi sm:text-base"
                    >
                      {f.name}
                    </Link>
                    <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                      {f.url}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryBadgeClasses[f.category]}`}
                      >
                        {categoryLabels[f.category]}
                      </span>
                      {f.lastRunAt && (
                        <span className="text-xs text-slate-400">
                          última busca em {formatarDataCurta(f.lastRunAt)}
                        </span>
                      )}
                      {!f.contentSelector && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                          sem seletor de corpo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 lg:mt-0 lg:shrink-0 lg:justify-end lg:border-0 lg:pt-0">
                    <ToggleSourceActiveButton id={f.id} isActive={f.isActive} />
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/fontes/${f.id}/editar`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                        Editar
                      </Link>
                      <DeleteSourceButton id={f.id} name={f.name} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
