import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { autorDe, categoryLabels, categoryHeaderGradient } from "@/lib/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCover from "@/components/NewsCover";
import ShareButton from "@/components/ShareButton";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getWhatsappContacts } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

async function getNews(slug: string) {
  return prisma.news.findFirst({
    where: { slug, isPublished: true },
  });
}

/** Resumo curto para o preview; cai no início do texto se não houver excerpt. */
function resumoDe(news: { excerpt: string | null; content: string }) {
  const base = news.excerpt?.trim() || news.content.replace(/\s+/g, " ").trim();
  return base.length > 160 ? `${base.slice(0, 157)}…` : base;
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
      publishedTime: news.createdAt.toISOString(),
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
    prisma.news.findMany({
      where: {
        isPublished: true,
        category: news.category,
        NOT: { id: news.id },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        category: true,
        createdAt: true,
      },
    }),
    getWhatsappContacts(),
  ]);

  // Conteúdo em texto simples -> parágrafos.
  const paragraphs = news.content
    .split(/\n{2,}/)
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

              {news.excerpt && (
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
                  {dateFmt.format(news.createdAt)}
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
                    {p}
                  </p>
                ))}
              </div>

              {/* Rodapé da matéria */}
              <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Publicado em {dateFmt.format(news.createdAt)}
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
              <h2 className="font-serif text-2xl font-semibold text-conplan sm:text-3xl">
                Leia também
              </h2>

              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/noticias/${item.slug}`}
                    className="group relative overflow-hidden rounded-2xl"
                  >
                    <div className="relative aspect-[16/10] w-full">
                      <NewsCover
                        src={item.coverImage}
                        alt={item.title}
                        category={item.category}
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="line-clamp-3 font-serif text-base font-semibold leading-snug text-white drop-shadow-lg">
                          {item.title}
                        </h3>
                        <time className="mt-1.5 block text-[11px] font-medium uppercase tracking-wider text-marconi-light">
                          {dateFmt.format(item.createdAt)}
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
