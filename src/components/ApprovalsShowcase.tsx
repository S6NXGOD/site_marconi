"use client";

import { useEffect, useMemo, useRef } from "react";
import { toEmbedUrl } from "@/lib/embed";
import ShareApprovalButton from "./ShareApprovalButton";

export type ApprovalItem = {
  id: string;
  municipality: string;
  label: string;
  embedUrl: string | null;
};

export default function ApprovalsShowcase({ items }: { items: ApprovalItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausadoRef = useRef(false);
  const retomarRef = useRef<ReturnType<typeof setTimeout>>();

  // Pausa a rolagem automática por um tempo após uma interação manual (arrastar,
  // seta, roda do mouse) e retoma sozinha quando a pessoa para de mexer. É o que
  // impede o auto-scroll de "brigar" com o gesto/seta.
  function pausarPorInteracao(ms = 2500) {
    pausadoRef.current = true;
    clearTimeout(retomarRef.current);
    retomarRef.current = setTimeout(() => {
      pausadoRef.current = false;
    }, ms);
  }

  // Só entram no site os cards com vídeo reconhecido — o card É a publicação.
  const cards = useMemo(
    () =>
      items
        .map((item) => ({ item, embed: toEmbedUrl(item.embedUrl) }))
        .filter((c): c is { item: ApprovalItem; embed: string } => Boolean(c.embed)),
    [items]
  );

  // Para o marquee emendar sem salto, os cards são renderizados DUAS vezes: ao
  // passar da primeira metade, a rolagem volta para o ponto equivalente.
  const loop = cards.length > 1 ? [...cards, ...cards] : cards;

  // ——— Rolagem automática contínua (marquee) ———
  // Anima a posição num acumulador FLOAT e ESCREVE em scrollLeft (não usa +=,
  // que perde o sub-pixel ao reler e trava a rolagem). Tempo-based: velocidade
  // igual em telas de 60 e 120 Hz. Pausa no hover (mouse), toque, arrasto e foco.
  useEffect(() => {
    const el = trackRef.current;
    if (!el || cards.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const VEL = 0.035; // px por ms (~35 px/s) — glide suave
    let raf = 0;
    let pos = el.scrollLeft;
    let ultimo = 0;

    // Período exato do loop = distância do 1º card da 2ª leva até o 1º de todos.
    const medirPeriodo = () => {
      const arts = el.querySelectorAll<HTMLElement>("article");
      return arts.length > cards.length
        ? arts[cards.length].offsetLeft - arts[0].offsetLeft
        : el.scrollWidth / 2;
    };
    let periodo = medirPeriodo();

    const passo = (agora: number) => {
      const dt = ultimo ? Math.min(agora - ultimo, 50) : 16;
      ultimo = agora;
      if (pausadoRef.current || periodo <= 0) {
        pos = el.scrollLeft; // acompanha a rolagem manual enquanto pausado
      } else {
        pos += VEL * dt;
        if (pos >= periodo) pos -= periodo;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);

    // Hover só de MOUSE (no toque o pause é via pausarPorInteracao).
    const entrar = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pausadoRef.current = true;
    };
    const sair = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pausadoRef.current = false;
    };
    const focar = () => (pausadoRef.current = true);
    const desfocar = () => (pausadoRef.current = false);
    const interagir = () => pausarPorInteracao();
    const remedir = () => (periodo = medirPeriodo());

    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointerleave", sair);
    el.addEventListener("focusin", focar);
    el.addEventListener("focusout", desfocar);
    el.addEventListener("touchstart", interagir, { passive: true });
    el.addEventListener("wheel", interagir, { passive: true });
    window.addEventListener("resize", remedir);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointerleave", sair);
      el.removeEventListener("focusin", focar);
      el.removeEventListener("focusout", desfocar);
      el.removeEventListener("touchstart", interagir);
      el.removeEventListener("wheel", interagir);
      window.removeEventListener("resize", remedir);
      clearTimeout(retomarRef.current);
    };
  }, [cards.length]);

  if (cards.length === 0) return null;

  function scroll(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    // Pausa o auto-scroll para ele não sobrescrever o scrollBy suave da seta.
    pausarPorInteracao();
    const card = el.querySelector("article");
    const step = card ? card.clientWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section id="prova-social" className="overflow-hidden bg-cloud py-20 sm:py-24">
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
      </div>

      {/* Trilho (largura total) + desvanecer nas bordas */}
      <div className="relative mt-10">
        <div
          ref={trackRef}
          className="flex gap-6 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loop.map(({ item, embed }, i) => (
            <article
              key={`${item.id}-${i}`}
              // 326px é a largura mínima do embed do Instagram — abaixo disso ele
              // renderiza quebrado.
              className="flex w-[326px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-elegant ring-1 ring-slate-200 sm:w-[340px]"
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
                // lazy: os embeds só carregam quando entram na tela
                loading="lazy"
                scrolling="no"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                className="block h-[560px] w-full border-0 bg-white sm:h-[600px]"
              />

              {/* Rodapé — compartilhar bem visível */}
              <div className="border-t border-slate-100 p-3">
                <ShareApprovalButton approval={item} />
              </div>
            </article>
          ))}
        </div>

        {/* Desvanecer as bordas para dar o ar de "rolagem infinita". */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cloud to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-cloud to-transparent sm:w-16" />
      </div>
    </section>
  );
}
