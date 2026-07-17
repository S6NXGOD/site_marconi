"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatarData } from "@/lib/datas";
import { categoryBadgeClasses, categoryLabels } from "@/lib/news";
import NewsCover from "./NewsCover";
import type { NewsItem } from "./NewsPortal";

/**
 * Carrossel das notícias que não couberam nos destaques.
 *
 * É scroll nativo com `scroll-snap`, não um slider em JavaScript: no celular
 * já é o gesto que a pessoa espera, funciona sem JS e respeita o "arrastar
 * para rolar" do sistema. As setas são um atalho de desktop, onde não há
 * gesto — por isso ficam escondidas do leitor de tela.
 */
export default function NewsCarousel({ items }: { items: NewsItem[] }) {
  const trilhoRef = useRef<HTMLUListElement>(null);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);

  const medir = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    // 4px de tolerância: a rolagem não bate exato no fim em telas fracionárias.
    setNoInicio(el.scrollLeft <= 4);
    setNoFim(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    medir();
    const el = trilhoRef.current;
    if (!el) return;
    // Sem itens suficientes para rolar, as setas nascem desativadas.
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [medir, items.length]);

  function rolar(direcao: 1 | -1) {
    const el = trilhoRef.current;
    if (!el) return;
    // Avança quase uma tela — sobra um card à vista para não perder o contexto.
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  const setaClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-conplan transition-all hover:border-marconi hover:text-marconi disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-slate-300 disabled:hover:text-conplan";

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <h2 className="font-serif text-2xl font-semibold text-conplan sm:text-3xl">
          Mais notícias
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          {/* Setas só no desktop: no celular o gesto é a navegação. */}
          <div className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
            <button
              type="button"
              onClick={() => rolar(-1)}
              disabled={noInicio}
              tabIndex={-1}
              className={setaClass}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => rolar(1)}
              disabled={noFim}
              tabIndex={-1}
              className={setaClass}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <Link
            href="/noticias"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-marconi transition-colors hover:text-marconi-dark"
          >
            Ver todas
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* -mx-6/px-6 sangra o trilho até a borda da tela no celular: o card
          seguinte fica "espiando" e revela que dá para arrastar. */}
      <ul
        ref={trilhoRef}
        onScroll={medir}
        className="carrossel -mx-6 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:px-0"
      >
        {items.map((item) => (
          <li
            key={item.id}
            className="w-[74vw] max-w-[300px] shrink-0 snap-start sm:w-[280px]"
          >
            <Link
              href={`/noticias/${item.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-elegant"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                <NewsCover
                  src={item.coverImage}
                  alt={item.title}
                  category={item.category}
                  sizes="300px"
                />
                <span
                  className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryBadgeClasses[item.category]}`}
                >
                  {categoryLabels[item.category]}
                </span>
              </div>

              {/* flex-1 + mt-auto na data: os cards têm títulos de tamanhos
                  diferentes e as datas precisam fechar na mesma linha. */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-3 font-serif text-base font-semibold leading-snug text-conplan transition-colors group-hover:text-marconi">
                  {item.title}
                </h3>
                <time className="mt-auto pt-3 text-xs text-slate-400">
                  {formatarData(item.publishedAt)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
