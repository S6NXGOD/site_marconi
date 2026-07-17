import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { categoryLabels, categoryBadgeClasses } from "@/lib/news";
import DeleteNewsButton from "@/components/admin/DeleteNewsButton";
import PublishToggleButton from "@/components/admin/PublishToggleButton";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const okMessages: Record<string, string> = {
  created: "Notícia criada com sucesso.",
  updated: "Notícia atualizada com sucesso.",
};

export default async function NoticiasAdminPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const news = await prisma.news.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      isPublished: true,
      publishedAt: true,
    },
  });

  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Notícias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crie, edite e gerencie as publicações do portal.
          </p>
        </div>
        <Link
          href="/admin/noticias/nova"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nova notícia
        </Link>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      {news.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400 shadow-sm">
          Nenhuma notícia cadastrada.{" "}
          <Link href="/admin/noticias/nova" className="font-semibold text-marconi hover:underline">
            Criar a primeira
          </Link>
          .
        </p>
      ) : (
        /* Lista em cards — sem tabela e sem scroll horizontal no celular.
           A partir de lg, os campos se alinham em colunas. */
        <ul className="space-y-3">
          {news.map((n) => (
            <li
              key={n.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
            >
              <div className="lg:flex lg:items-center lg:gap-6">
                {/* Título + meta */}
                <div className="min-w-0 lg:flex-1">
                  <Link
                    href={`/admin/noticias/${n.id}/editar`}
                    className="block text-sm font-semibold leading-snug text-conplan hover:text-marconi sm:text-base"
                  >
                    {n.title}
                  </Link>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryBadgeClasses[n.category]}`}
                    >
                      {categoryLabels[n.category]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {dateFmt.format(n.publishedAt)}
                    </span>
                  </div>
                </div>

                {/* Status + ações */}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 lg:mt-0 lg:shrink-0 lg:justify-end lg:border-0 lg:pt-0">
                  <PublishToggleButton id={n.id} isPublished={n.isPublished} />

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/noticias/${n.id}/editar`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                      Editar
                    </Link>
                    <DeleteNewsButton id={n.id} title={n.title} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
