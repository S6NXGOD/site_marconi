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
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      isPublished: true,
      createdAt: true,
    },
  });

  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Notícias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crie, edite e gerencie as publicações do portal.
          </p>
        </div>
        <Link
          href="/admin/noticias/nova"
          className="inline-flex items-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {news.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">
            Nenhuma notícia cadastrada.{" "}
            <Link href="/admin/noticias/nova" className="font-semibold text-marconi hover:underline">
              Criar a primeira
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-cloud text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Título</th>
                  <th className="px-6 py-3 font-semibold">Categoria</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Data</th>
                  <th className="px-6 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {news.map((n) => (
                  <tr key={n.id} className="hover:bg-cloud/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/noticias/${n.id}/editar`}
                        className="font-medium text-conplan hover:text-marconi"
                      >
                        {n.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryBadgeClasses[n.category]}`}
                      >
                        {categoryLabels[n.category]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PublishToggleButton id={n.id} isPublished={n.isPublished} />
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {dateFmt.format(n.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/noticias/${n.id}/editar`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                          </svg>
                          Editar
                        </Link>
                        <DeleteNewsButton id={n.id} title={n.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
