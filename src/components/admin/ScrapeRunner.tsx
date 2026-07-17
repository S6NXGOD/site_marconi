"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatarData } from "@/lib/datas";
import { categoryLabels, categoryBadgeClasses } from "@/lib/news";
import type { NewsCategory } from "@prisma/client";

type Fonte = { id: string; name: string; category: NewsCategory };

type Item = {
  title: string;
  link: string;
  date: string;
  excerpt: string;
  imageUrl: string;
  jaImportada: boolean;
};

type Busca = {
  itens: Item[];
  total: number;
  noPeriodo: number;
  novas: number;
  fonte: Fonte;
};

type Criada = { title: string; slug: string };
type Falha = { title: string; motivo: string };

const PERIODOS = [
  { valor: 7, label: "Últimos 7 dias" },
  { valor: 15, label: "Últimos 15 dias" },
  { valor: 30, label: "Últimos 30 dias" },
  { valor: 0, label: "Tudo que estiver na página" },
];

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors focus:border-marconi focus:ring-2 focus:ring-marconi/20";

export default function ScrapeRunner({ fontes }: { fontes: Fonte[] }) {
  const [sourceId, setSourceId] = useState(fontes[0]?.id ?? "");
  const [dias, setDias] = useState(7);

  const [buscando, setBuscando] = useState(false);
  const [busca, setBusca] = useState<Busca | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ criadas: Criada[]; falhas: Falha[] } | null>(null);

  async function buscar() {
    setBuscando(true);
    setErro(null);
    setBusca(null);
    setResultado(null);
    setMarcados(new Set());
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, dias }),
      });
      const data = await res.json();
      if (!res.ok) setErro(data.error ?? "Falha na busca.");
      else setBusca(data);
    } catch {
      setErro("Não consegui contatar o servidor.");
    } finally {
      setBuscando(false);
    }
  }

  async function importar() {
    if (!busca || marcados.size === 0) return;
    setImportando(true);
    setErro(null);
    try {
      const itens = busca.itens.filter((i) => marcados.has(i.link));
      const res = await fetch("/api/admin/scrape/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, itens }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha na importação.");
        return;
      }
      setResultado(data);
      // Marca as importadas na lista, para a tela refletir o novo estado sem
      // exigir uma nova busca.
      const ok = new Set(data.criadas.map((c: Criada) => c.title));
      setBusca({
        ...busca,
        itens: busca.itens.map((i) =>
          ok.has(i.title) ? { ...i, jaImportada: true } : i
        ),
      });
      setMarcados(new Set());
    } catch {
      setErro("Não consegui contatar o servidor.");
    } finally {
      setImportando(false);
    }
  }

  function alternar(link: string) {
    setMarcados((s) => {
      const novo = new Set(s);
      if (novo.has(link)) novo.delete(link);
      else novo.add(link);
      return novo;
    });
  }

  const disponiveis = busca?.itens.filter((i) => !i.jaImportada) ?? [];
  const todasMarcadas = disponiveis.length > 0 && disponiveis.every((i) => marcados.has(i.link));

  function alternarTodas() {
    setMarcados(todasMarcadas ? new Set() : new Set(disponiveis.map((i) => i.link)));
  }

  return (
    <div className="space-y-6">
      {/* ═══ PASSO 1 ═══ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marconi text-[11px] font-bold text-white">
            1
          </span>
          <h2 className="font-semibold text-conplan">Escolha a fonte e o período</h2>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fonte" className="mb-1.5 block text-sm font-medium text-conplan">
              Fonte
            </label>
            <select
              id="fonte"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className={fieldClass}
            >
              {fontes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="periodo" className="mb-1.5 block text-sm font-medium text-conplan">
              Período
            </label>
            <select
              id="periodo"
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
              className={fieldClass}
            >
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={buscar}
          disabled={buscando || !sourceId}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-6 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
        >
          {buscando ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Buscando no site...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              Buscar notícias
            </>
          )}
        </button>

        <p className="mt-2 text-xs text-slate-400">
          A busca só lê o site. Nada é salvo até você escolher no passo 2.
        </p>
      </section>

      {erro && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {erro}
        </div>
      )}

      {/* ═══ Resultado da importação ═══ */}
      {resultado && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-800">
            {resultado.criadas.length === 0
              ? "Nenhuma notícia importada."
              : `${resultado.criadas.length} ${resultado.criadas.length === 1 ? "notícia importada" : "notícias importadas"} como rascunho.`}
          </p>

          {resultado.criadas.length > 0 && (
            <>
              <ul className="mt-3 space-y-1.5">
                {resultado.criadas.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/admin/noticias`}
                      className="text-sm text-emerald-900 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-600"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/noticias"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                Editar e publicar em Notícias
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </>
          )}

          {resultado.falhas.length > 0 && (
            <div className="mt-4 border-t border-emerald-200 pt-3">
              <p className="text-xs font-semibold text-amber-800">
                {resultado.falhas.length} não {resultado.falhas.length === 1 ? "entrou" : "entraram"}:
              </p>
              <ul className="mt-1.5 space-y-1">
                {resultado.falhas.map((f, i) => (
                  <li key={i} className="text-xs text-amber-800">
                    <span className="font-medium">{f.title.slice(0, 46)}</span> — {f.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ═══ PASSO 2 ═══ */}
      {busca && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marconi text-[11px] font-bold text-white">
              2
            </span>
            <h2 className="font-semibold text-conplan">Escolha o que importar</h2>
          </div>

          {busca.itens.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="font-serif text-lg text-conplan">Nada no período</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                A página tem {busca.total}{" "}
                {busca.total === 1 ? "notícia" : "notícias"}, mas nenhuma dentro
                do período escolhido. Tente um intervalo maior.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-500">
                {busca.noPeriodo} no período · {busca.novas}{" "}
                {busca.novas === 1 ? "nova" : "novas"} ·{" "}
                {busca.noPeriodo - busca.novas} já {busca.noPeriodo - busca.novas === 1 ? "importada" : "importadas"}
              </p>

              {disponiveis.length > 0 && (
                <div className="mt-4 flex items-center justify-between gap-3 border-y border-slate-100 py-2.5">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={todasMarcadas}
                      onChange={alternarTodas}
                      className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
                    />
                    <span className="text-sm font-medium text-conplan">
                      Selecionar todas as novas
                    </span>
                  </label>
                  <span className="shrink-0 text-xs tabular-nums text-slate-400">
                    {marcados.size} de {disponiveis.length}
                  </span>
                </div>
              )}

              <ul className="mt-3 space-y-2">
                {busca.itens.map((item) => {
                  const marcada = marcados.has(item.link);
                  return (
                    <li
                      key={item.link}
                      className={`rounded-xl border transition-colors ${
                        item.jaImportada
                          ? "border-slate-200 bg-slate-50"
                          : marcada
                            ? "border-marconi bg-marconi/5"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <label
                        className={`flex gap-3 p-3 ${item.jaImportada ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          checked={marcada}
                          disabled={item.jaImportada}
                          onChange={() => alternar(item.link)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-marconi focus:ring-marconi disabled:opacity-40"
                        />

                        {/* A miniatura vem do site de origem e ainda não passou
                            pelo nosso pipeline, então é <img> comum: o
                            next/image recusa host externo de propósito. */}
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            loading="lazy"
                            className="hidden h-16 w-24 shrink-0 rounded-lg object-cover sm:block"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-semibold leading-snug ${
                              item.jaImportada ? "text-slate-400" : "text-conplan"
                            }`}
                          >
                            {item.title}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            {item.date && (
                              <span className="text-xs text-slate-500">
                                {formatarData(`${item.date}T12:00:00Z`)}
                              </span>
                            )}
                            {item.jaImportada && (
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Já importada
                              </span>
                            )}
                            {!item.imageUrl && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                sem imagem
                              </span>
                            )}
                          </div>

                          {item.excerpt && !item.jaImportada && (
                            <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">
                              {item.excerpt}
                            </p>
                          )}

                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-marconi"
                          >
                            ver no site de origem
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M7 17L17 7M9 7h8v8" />
                            </svg>
                          </a>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {/* Barra fixa no celular: com a lista longa, o botão ficaria no
                  fim da rolagem e a pessoa não veria a contagem subir. */}
              <div className="sticky bottom-0 -mx-5 mt-4 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
                <button
                  type="button"
                  onClick={importar}
                  disabled={importando || marcados.size === 0}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-conplan px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-conplan/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  {importando ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Importando — baixando texto e imagens...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                      Importar {marcados.size > 0 ? marcados.size : ""}{" "}
                      {marcados.size === 1 ? "selecionada" : "selecionadas"}
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-slate-400">
                  Entram como rascunho. Nada vai ao ar sem você publicar.
                </p>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
