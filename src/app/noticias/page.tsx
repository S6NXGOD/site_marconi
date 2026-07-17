import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/datas";
import type { NewsCategory } from "@prisma/client";
import { categoryLabels, categoryBadgeClasses } from "@/lib/news";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCover from "@/components/NewsCover";
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

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const active = searchParams.cat && catMap[searchParams.cat] ? searchParams.cat : "todas";
  const category = catMap[active];

  const [news, whatsapp] = await Promise.all([
    prisma.news.findMany({
      where: { isPublished: true, ...(category ? { category } : {}) },
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

            {/* Filtros (links reais — sem JS) */}
            <div className="-mx-6 mt-7 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
              <div className="flex w-max gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5">
                {tabs.map((t) => (
                  <Link
                    key={t.value}
                    href={t.value === "todas" ? "/noticias" : `/noticias?cat=${t.value}`}
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
            {news.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                Nenhuma notícia publicada nesta categoria.
              </p>
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
                          {item.excerpt ?? item.content}
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
