"use client";

import { formatarData } from "@/lib/datas";
import { semMarcacao } from "@/lib/texto-rico";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { NewsCategory } from "@prisma/client";
import { categoryLabels, categoryBadgeClasses } from "@/lib/news";
import NewsCover from "./NewsCover";
import NewsCarousel from "./NewsCarousel";
import AlertsPanel, { type AlertItem } from "./AlertsPanel";

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: NewsCategory;
  publishedAt: Date | string;
};

type Filter = "ALL" | NewsCategory;

const filters: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "PUBLICO", label: "Gestão Pública" },
  { value: "PRIVADO", label: "Setor Privado" },
  { value: "GERAL", label: "Geral" },
];

function summary(item: NewsItem) {
  // Marcação de link não faz sentido no card e apareceria crua.
  return semMarcacao(item.excerpt ?? item.content);
}

function Badge({ category }: { category: NewsCategory }) {
  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${categoryBadgeClasses[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}

export default function NewsPortal({
  news,
  alerts,
  encerrados,
}: {
  news: NewsItem[];
  alerts: AlertItem[];
  encerrados: AlertItem[];
}) {
  const [filter, setFilter] = useState<Filter>("ALL");

  const visible = useMemo(
    () => (filter === "ALL" ? news : news.filter((n) => n.category === filter)),
    [news, filter]
  );

  const featured = visible[0];
  const side = visible.slice(1, 3);
  // Tudo que sobrou dos destaques — o carrossel rola, não precisa cortar em 6.
  const latest = visible.slice(3);

  // Site sem nenhuma notícia publicada (ex.: recém no ar). Nesse caso os
  // filtros não fazem sentido e a seção "Mais notícias" some — nada de
  // caixas vazias empilhadas.
  const semNoticias = news.length === 0;

  return (
    <>
      {/* ——— MANCHETES (fundo escuro, imagens cheias) ——— */}
      <section id="noticias" className="bg-conplan pt-24 pb-14 sm:pt-28 sm:pb-16">
        <div className="section-shell">
          {/* Cabeçalho + filtros */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="kicker text-marconi-light">
                <span className="h-px w-6 bg-marconi-light/50" />
                Portal do Grupo
              </span>
              <h1 className="mt-3 font-serif text-3xl font-semibold text-white sm:text-4xl">
                Últimas Notícias
              </h1>
            </div>

            {/* filtros — roláveis no mobile */}
            {!semNoticias && (
              <div className="-mx-6 overflow-x-auto px-6 pb-1 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
                <div className="flex w-max gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 md:w-auto">
                  {filters.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilter(f.value)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                        filter === f.value
                          ? "bg-marconi text-white shadow-gold"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grade editorial */}
          {!featured ? (
            <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-marconi-light">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              </span>
              <p className="mt-4 font-serif text-xl text-white">
                {semNoticias
                  ? "Nossas notícias chegam em breve"
                  : "Nenhuma notícia nesta categoria"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                {semNoticias
                  ? "Estamos preparando os primeiros conteúdos sobre gestão pública e setor privado. Enquanto isso, conheça as áreas de atuação do Grupo."
                  : "Experimente outra categoria para ver mais publicações."}
              </p>
              {semNoticias && (
                <a
                  href="#areas-de-atuacao"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-light"
                >
                  Ver áreas de atuação
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-5">
              {/* Manchete principal */}
              <motion.article
                key={featured.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group relative overflow-hidden rounded-2xl lg:col-span-2 lg:row-span-2"
              >
                <Link href={`/noticias/${featured.slug}`} className="block h-full">
                  {/* overflow-hidden aqui, e não só no article: no hover a foto
                      cresce 105% e precisa ser cortada na MESMA caixa que o
                      gradiente cobre. Sem isso ela vaza e aparece um trecho de
                      imagem sem o fade. */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[16/11]">
                    <NewsCover
                      src={featured.coverImage}
                      alt={featured.title}
                      category={featured.category}
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority
                    />
                    {/* gradiente para legibilidade do texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

                    <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
                      <Badge category={featured.category} />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <h2 className="font-serif text-xl font-bold leading-tight text-white drop-shadow-lg sm:text-3xl lg:text-4xl">
                        {featured.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 hidden text-sm text-slate-200 sm:block sm:text-base">
                        {summary(featured)}
                      </p>
                      <time className="mt-3 block text-xs font-medium uppercase tracking-wider text-marconi-light">
                        {formatarData(featured.publishedAt)}
                      </time>
                    </div>
                  </div>
                </Link>
              </motion.article>

              {/* Duas manchetes laterais */}
              {side.map((item, i) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.08 * (i + 1) }}
                  className="group relative overflow-hidden rounded-2xl"
                >
                  <Link href={`/noticias/${item.slug}`} className="block h-full">
                    {/* No lg estes cards preenchem a altura da linha do grid
                        (`h-full`) em vez de manter proporção fixa. A proporção
                        deixava uma sobra transparente no fim do card — invisível
                        parada, mas era por ali que a foto ampliada no hover
                        escapava, sem gradiente por cima. De quebra, agora o
                        conjunto fecha alinhado com a manchete ao lado. */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto lg:h-full">
                      <NewsCover
                        src={item.coverImage}
                        alt={item.title}
                        category={item.category}
                        sizes="(max-width: 1024px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      <div className="absolute left-4 top-4">
                        <Badge category={item.category} />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                        <h3 className="line-clamp-3 font-serif text-base font-semibold leading-snug text-white drop-shadow-lg sm:text-lg">
                          {item.title}
                        </h3>
                        <time className="mt-2 block text-[11px] font-medium uppercase tracking-wider text-marconi-light">
                          {formatarData(item.publishedAt)}
                        </time>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ——— MAIS NOTÍCIAS + ALERTAS ———
          Sem "mais notícias" a coluna some e os alertas ocupam a seção,
          em vez de deixar uma caixa vazia ao lado. */}
      <section className="bg-cloud py-14 sm:py-20">
        <div
          className={`section-shell grid gap-10 lg:gap-12 ${
            latest.length > 0 ? "lg:grid-cols-[1fr_360px]" : "lg:max-w-3xl"
          }`}
        >
          {/* Carrossel — os itens já entram sem os destaques acima. */}
          {latest.length > 0 && <NewsCarousel items={latest} />}

          {/* Alertas */}
          <AlertsPanel alerts={alerts} encerrados={encerrados} />
        </div>
      </section>
    </>
  );
}
