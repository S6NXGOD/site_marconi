import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma, type NewsCategory } from "@prisma/client";
import {
  autorDe,
  categoryBadgeClasses,
  categoryLabels,
  categoryHeaderGradient,
} from "@/lib/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCover from "@/components/NewsCover";
import ShareButton from "@/components/ShareButton";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getWhatsappContacts } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { formatarData } from "@/lib/datas";
import { comLinks } from "@/lib/texto-rico";
import { resumoExibicao, resumoRepeteCorpo } from "@/lib/resumo";

export const dynamic = "force-dynamic";

async function getNews(slug: string) {
  return prisma.news.findFirst({
    where: { slug, isPublished: true },
  });
}

const QUANTAS_RELACIONADAS = 3;

const selectCard = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
  category: true,
  publishedAt: true,
} as const;

const maisRecentes: Prisma.NewsOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { createdAt: "desc" },
];

/**
 * Notícias do fim da matéria.
 *
 * Prioriza a mesma vertente — quem leu sobre gestão pública tende a querer
 * mais gestão pública. Mas completa com as outras quando não há três do mesmo
 * segmento: exigir a mesma categoria fazia a seção sumir por completo, já que
 * é comum haver poucas notícias de cada vertente.
 */
async function getRelacionadas(id: string, category: NewsCategory) {
  const mesmoSegmento = await prisma.news.findMany({
    where: { isPublished: true, category, NOT: { id } },
    orderBy: maisRecentes,
    take: QUANTAS_RELACIONADAS,
    select: selectCard,
  });

  if (mesmoSegmento.length >= QUANTAS_RELACIONADAS) return mesmoSegmento;

  const completar = await prisma.news.findMany({
    where: {
      isPublished: true,
      id: { notIn: [id, ...mesmoSegmento.map((n) => n.id)] },
    },
    orderBy: maisRecentes,
    take: QUANTAS_RELACIONADAS - mesmoSegmento.length,
    select: selectCard,
  });

  return [...mesmoSegmento, ...completar];
}

/**
 * Resumo do preview (WhatsApp, Google) e do texto compartilhado.
 *
 * Frase completa, nunca cortada no meio da palavra. Resumo com "…" (o corte
 * cru antigo) é descartado em favor do corpo — ver `resumoExibicao`.
 */
function resumoDe(news: { excerpt: string | null; content: string }) {
  return resumoExibicao(news.excerpt, news.content, 220);
}

/**
 * Imagem do preview (WhatsApp, Facebook, LinkedIn…).
 * Usa a capa da notícia; sem capa, cai no logo do Grupo — assim o link
 * compartilhado nunca aparece sem imagem.
 */
function imagemDe(coverImage: string | null) {
  const src = coverImage || "/favicon.jpg";
  return src.startsWith("http") ? src : `${SITE_URL}${src}`;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const news = await getNews(params.slug);
  if (!news) return { title: "Notícia não encontrada" };

  const descricao = resumoDe(news);
  const url = `${SITE_URL}/noticias/${news.slug}`;

  return {
    title: news.title,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      title: news.title,
      description: descricao,
      url,
      type: "article",
      publishedTime: news.publishedAt.toISOString(),
      modifiedTime: news.updatedAt.toISOString(),
      authors: [autorDe(news.category)],
      siteName: "Grupo Dr. Marconi Nunes",
      locale: "pt_BR",
      images: [
        {
          url: imagemDe(news.coverImage),
          alt: news.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: descricao,
      images: [imagemDe(news.coverImage)],
    },
  };
}

export default async function NoticiaPage({
  params,
}: {
  params: { slug: string };
}) {
  const news = await getNews(params.slug);
  if (!news) notFound();

  const [related, whatsapp] = await Promise.all([
    getRelacionadas(news.id, news.category),
    getWhatsappContacts(),
  ]);

  // Conteúdo em texto simples -> parágrafos.
  //
  // O `\r?` não é decoração: o <textarea> do painel devolve CRLF na submissão
  // (é a especificação do HTML), então uma notícia editada chega aqui com
  // \r\n\r\n entre os parágrafos. Procurar dois \n grudados não casa — tem um
  // \r no meio — e a matéria inteira virava um bloco único. A gravação agora
  // normaliza, mas isto cobre o que já está gravado assim.
  const paragraphs = news.content
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <Header />

      <main>
        {/* ——— Faixa de destaque da matéria ——— */}
        <header
          className={`relative overflow-hidden pt-24 pb-14 sm:pt-28 sm:pb-20 ${categoryHeaderGradient[news.category]}`}
        >
          {/* textura sutil */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* reforça o contraste do texto sobre a parte mais clara do gradiente */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25" />

          <div className="section-shell relative">
            {/* Voltar / Compartilhar — com fundo próprio para serem visíveis */}
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/noticias"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
                <span className="hidden sm:inline">Voltar para Notícias</span>
                <span className="sm:hidden">Voltar</span>
              </Link>

              <ShareButton title={news.title} summary={resumoDe(news)} />
            </div>

            {/* Chip + título + meta */}
            <div className="mx-auto mt-10 max-w-3xl">
              <span className="inline-block rounded-full bg-marconi px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-gold">
                {categoryLabels[news.category]}
              </span>

              <h1 className="mt-5 font-serif text-[1.7rem] font-bold leading-[1.2] text-white drop-shadow-sm sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                {news.title}
              </h1>

              {/* O resumo só entra aqui quando é um chamariz de verdade. Numa
                  notícia importada ele sai do próprio corpo, e repeti-lo logo
                  acima do primeiro parágrafo seria ler a mesma coisa duas
                  vezes — então some. */}
              {news.excerpt && !resumoRepeteCorpo(news.excerpt, news.content) && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                  {news.excerpt}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 11h18" />
                  </svg>
                  {formatarData(news.publishedAt)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {autorDe(news.category)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ——— Corpo da matéria ——— */}
        <article className="bg-white pb-16 pt-10 sm:pb-20 sm:pt-14">
          <div className="section-shell">
            {/* Capa — só quando existe foto real.
                Sem foto, um bloco 16:9 vazio só empurraria o texto para baixo. */}
            {news.coverImage && (
              <figure className="group relative mx-auto aspect-[16/9] max-w-3xl overflow-hidden rounded-2xl shadow-elegant">
                <NewsCover
                  src={news.coverImage}
                  alt={news.title}
                  category={news.category}
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </figure>
            )}

            {/* Texto */}
            <div className={`mx-auto max-w-3xl ${news.coverImage ? "mt-10" : ""}`}>
              {/* primeiro parágrafo em destaque (lide) */}
              <div className="space-y-5">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? "text-lg leading-[1.8] text-conplan sm:text-xl"
                        : "text-base leading-[1.85] text-slate-700 sm:text-[17px]"
                    }
                  >
                    {comLinks(p, `p${i}`)}
                  </p>
                ))}
              </div>

              {/* ——— Crédito da fonte ———
                  Fica em campo próprio (sourceUrl/sourceName) e é montado aqui,
                  em vez de ser HTML colado no fim do texto. Dois motivos: o
                  `content` é renderizado escapado logo acima, então uma tag <p>
                  gravada nele apareceria literal na tela; e como o texto vem de
                  terceiros, interpretá-lo como HTML abriria XSS. De quebra, o
                  crédito não some se alguém apagar demais ao editar. */}
              {news.sourceUrl && (
                <aside className="mt-10 rounded-2xl border border-slate-200 bg-cloud p-5">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-conplan">
                      {news.sourceName ? `Fonte: ${news.sourceName}` : "Fonte"}
                    </span>
                    . Conteúdo publicado originalmente pela assessoria do órgão.
                  </p>
                  <a
                    href={news.sourceUrl}
                    target="_blank"
                    // nofollow: é link de crédito, não recomendação editorial.
                    rel="noopener noreferrer nofollow"
                    className="mt-2 inline-flex items-center gap-1.5 break-all text-sm font-semibold text-marconi transition-colors hover:text-marconi-dark"
                  >
                    Ler a matéria completa na origem
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M7 17L17 7M9 7h8v8" />
                    </svg>
                  </a>
                </aside>
              )}

              {/* Rodapé da matéria */}
              <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Publicado em {formatarData(news.publishedAt)}
                  {` · ${autorDe(news.category)}`}
                </p>
                <Link
                  href="/#contato"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
                >
                  Falar com um especialista
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* ——— Relacionadas ——— */}
        {related.length > 0 && (
          <section className="bg-cloud py-14 sm:py-20">
            <div className="section-shell">
              <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="kicker text-marconi">
                    <span className="h-px w-6 bg-marconi/40" />
                    Continue lendo
                  </span>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-conplan sm:text-3xl">
                    Confira também
                  </h2>
                </div>
                <Link
                  href="/noticias"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-marconi transition-colors hover:text-marconi-dark"
                >
                  <span className="hidden sm:inline">Ver todas</span>
                  <span className="sm:hidden">Todas</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/noticias/${item.slug}`}
                    className="group relative overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-elegant"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <NewsCover
                        src={item.coverImage}
                        alt={item.title}
                        category={item.category}
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* A vertente fica visível: a lista completa com outras
                          categorias quando falta matéria do mesmo segmento. */}
                      <span
                        className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryBadgeClasses[item.category]}`}
                      >
                        {categoryLabels[item.category]}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="line-clamp-3 font-serif text-base font-semibold leading-snug text-white drop-shadow-lg">
                          {item.title}
                        </h3>
                        <time className="mt-1.5 block text-[11px] font-medium uppercase tracking-wider text-marconi-light">
                          {formatarData(item.publishedAt)}
                        </time>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <WhatsAppFloat contacts={whatsapp} />
      <Footer />
    </>
  );
}
