import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/datas";
import { resumoExibicao } from "@/lib/resumo";
import type { NewsCategory } from "@prisma/client";
import { categoryLabels, categoryBadgeClasses } from "@/lib/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCover from "@/components/NewsCover";
import NewsSearch from "@/components/NewsSearch";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getWhatsappContacts } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notícias | Grupo Dr. Marconi Nunes",
  description:
    "Todas as notícias do Grupo Dr. Marconi Nunes — gestão pública, setor privado e conteúdos gerais.",
};

const tabs: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "publico", label: "Gestão Pública" },
  { value: "privado", label: "Setor Privado" },
  { value: "geral", label: "Geral" },
];

// Filtro por querystring (?cat=publico) — funciona sem JavaScript.
const catMap: Record<string, NewsCategory> = {
  publico: "PUBLICO",
  privado: "PRIVADO",
  geral: "GERAL",
};

/** Link da aba preservando o termo buscado. */
function linkDaAba(value: string, q: string): string {
  const params = new URLSearchParams();
  if (value !== "todas") params.set("cat", value);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/noticias?${qs}` : "/noticias";
}

/**
 * Busca por título, resumo e corpo.
 *
 * `insensitive` é o que faz "TCE" achar "tce" — sem isso o Postgres compara
 * com case sensitivity e a busca só funcionaria digitando exatamente igual.
 */
function filtroDaBusca(q: string) {
  if (!q) return {};
  return {
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { excerpt: { contains: q, mode: "insensitive" as const } },
      { content: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string; tag?: string };
}) {
  const active = searchParams.cat && catMap[searchParams.cat] ? searchParams.cat : "todas";
  const category = catMap[active];
  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const tagSlug = (searchParams.tag ?? "").trim().slice(0, 60);

  const [news, whatsapp, tagAtual] = await Promise.all([
    prisma.news.findMany({
      where: {
        isPublished: true,
        ...(category ? { category } : {}),
        ...(tagSlug ? { tags: { some: { slug: tagSlug } } } : {}),
        ...filtroDaBusca(q),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
    }),
    getWhatsappContacts(),
    tagSlug ? prisma.tag.findUnique({ where: { slug: tagSlug }, select: { name: true } }) : null,
  ]);

  return (
    <>
      <Header />

      <main>
        {/* Cabeçalho da seção */}
        <section className="bg-conplan pt-24 pb-10 sm:pt-28 sm:pb-12">
          <div className="section-shell">
            <span className="kicker text-marconi-light">
              <span className="h-px w-6 bg-marconi-light/50" />
              Portal do Grupo
            </span>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Notícias
            </h1>
            <p className="mt-3 max-w-xl text-slate-400">
              Gestão pública, setor privado e as atualizações que impactam o seu
              dia a dia.
            </p>

            <NewsSearch defaultValue={q} cat={category ? active : undefined} />

            {/* Filtrando por assunto (tag): mostra qual e um jeito de limpar. */}
            {tagAtual && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-marconi/15 py-1.5 pl-4 pr-2 text-sm text-white ring-1 ring-marconi/30">
                <span className="text-marconi-light">Assunto:</span>
                <strong className="font-semibold">{tagAtual.name}</strong>
                <Link
                  href="/noticias"
                  aria-label="Limpar filtro de assunto"
                  className="flex h-5 w-5 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Filtros (links reais — sem JS) */}
            <div className="-mx-6 mt-4 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
              <div className="flex w-max gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5">
                {tabs.map((t) => (
                  <Link
                    key={t.value}
                    // O termo buscado sobrevive à troca de categoria — trocar
                    // de aba é refinar a busca, não recomeçar.
                    href={linkDaAba(t.value, q)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                      active === t.value
                        ? "bg-marconi text-white shadow-gold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Grade */}
        <section className="bg-cloud py-12 sm:py-16">
          <div className="section-shell">
            {/* Contagem — a pessoa precisa saber que a busca respondeu, mesmo
                quando o resultado é curto. */}
            {(q || category) && news.length > 0 && (
              <p className="mb-6 text-sm text-slate-500">
                {news.length === 1 ? "1 notícia encontrada" : `${news.length} notícias encontradas`}
                {q && (
                  <>
                    {" para "}
                    <strong className="font-semibold text-conplan">“{q}”</strong>
                  </>
                )}
              </p>
            )}

            {news.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <p className="mt-4 font-serif text-xl text-conplan">
                  {q ? "Nada encontrado para essa busca" : "Nenhuma notícia nesta categoria"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  {q
                    ? "Tente outras palavras, ou procure em todas as categorias."
                    : "Experimente outra categoria para ver mais publicações."}
                </p>
                {/* Saída óbvia do beco sem saída — nunca deixar só o vazio. */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {q && category && (
                    <Link
                      href={`/noticias?q=${encodeURIComponent(q)}`}
                      className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-conplan transition-colors hover:bg-slate-50"
                    >
                      Buscar em todas as categorias
                    </Link>
                  )}
                  <Link
                    href="/noticias"
                    className="rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-colors hover:bg-marconi-dark"
                  >
                    Ver todas as notícias
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-elegant"
                  >
                    <Link href={`/noticias/${item.slug}`} className="block">
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <NewsCover
                          src={item.coverImage}
                          alt={item.title}
                          category={item.category}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <span
                          className={`absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${categoryBadgeClasses[item.category]}`}
                        >
                          {categoryLabels[item.category]}
                        </span>
                      </div>

                      <div className="p-5">
                        <h2 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-conplan transition-colors group-hover:text-marconi">
                          {item.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                          {resumoExibicao(item.excerpt, item.content, 180)}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <time className="text-xs text-slate-400">
                            {formatarData(item.publishedAt)}
                          </time>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-marconi">
                            Ler mais
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <WhatsAppFloat contacts={whatsapp} />
      <Footer />
    </>
  );
}
