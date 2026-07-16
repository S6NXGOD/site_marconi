"use client";

import { useMemo, useRef } from "react";
import { toEmbedUrl } from "@/lib/embed";

export type ApprovalItem = {
  id: string;
  municipality: string;
  label: string;
  embedUrl: string | null;
};

export default function ApprovalsShowcase({ items }: { items: ApprovalItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Só entram no site os cards com vídeo reconhecido — o card É a publicação.
  const cards = useMemo(
    () =>
      items
        .map((item) => ({ item, embed: toEmbedUrl(item.embedUrl) }))
        .filter((c): c is { item: ApprovalItem; embed: string } => Boolean(c.embed)),
    [items]
  );

  if (cards.length === 0) return null;

  function scroll(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? card.clientWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section id="prova-social" className="bg-cloud py-20 sm:py-24">
      <div className="section-shell">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-marconi">
              Prova Social · CONPLAN
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-conplan sm:text-4xl">
              Resultados na Prática:{" "}
              <span className="italic text-marconi">
                Gestão Pública de Excelência
              </span>
            </h2>
            <p className="mt-4 text-slate-600">
              Confira os pronunciamentos e decretos de Contas Aprovadas dos
              municípios parceiros da CONPLAN em todo o Piauí.
            </p>
          </div>

          {/* Setas (no mobile o gesto é arrastar) */}
          <div className="hidden shrink-0 gap-2 md:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Ver anteriores"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-conplan transition-colors hover:border-marconi hover:text-marconi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Ver próximos"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-conplan transition-colors hover:border-marconi hover:text-marconi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Trilho */}
        <div
          ref={trackRef}
          className="-mx-6 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cards.map(({ item, embed }) => (
            <article
              key={item.id}
              // 326px é a largura mínima do embed do Instagram —
              // abaixo disso ele renderiza quebrado.
              className="w-[326px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-elegant ring-1 ring-slate-200 sm:w-[340px]"
            >
              {/* Faixa da marca */}
              <div className="flex items-start justify-between gap-3 bg-conplan px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-serif text-sm font-semibold text-white">
                    {item.municipality}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-marconi-light">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {item.label}
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-marconi/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-marconi-light">
                  <span className="h-1 w-1 rounded-full bg-marconi-light" />
                  CONPLAN
                </span>
              </div>

              {/* A publicação real do Instagram */}
              <iframe
                src={embed}
                title={`Publicação — ${item.municipality}`}
                // lazy: os embeds só carregam quando a seção entra na tela
                loading="lazy"
                scrolling="no"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="block h-[560px] w-full border-0 bg-white sm:h-[600px]"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
