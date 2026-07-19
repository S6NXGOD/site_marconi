"use client";

import { useMemo, useRef, useState } from "react";
import { limparNomeTag } from "@/lib/tags";
import { slugify } from "@/lib/slugify";
import { sugerirAssuntos } from "@/lib/sugerir-assuntos";
import type { TagRank } from "@/lib/get-tags";

type Props = {
  /** name do input escondido enviado no formulário (JSON dos nomes) */
  name: string;
  /** tags já atribuídas à notícia */
  defaultValue?: string[];
  /** tags que já existem no sistema (com contagem de uso), para sugerir/reusar */
  suggestions?: TagRank[];
  /** título + corpo da notícia — alimenta a sugestão automática de assuntos */
  texto?: string;
};

/**
 * Campo de assuntos (tags): chips removíveis + digitar para adicionar.
 *
 * - Reúso em primeiro lugar: o dropdown mostra as tags que já existem,
 *   ranqueadas por uso, com o contador — para não nascer "IRPF 2026" e
 *   "irpf 2026" como duas.
 * - Navegação por teclado (↑ ↓ Enter Esc) e uma linha explícita para CRIAR uma
 *   tag nova quando o que se digitou ainda não existe.
 * - Abaixo, SUGESTÕES automáticas lidas do texto da notícia: as que já existem
 *   e as candidatas novas. Um clique adiciona.
 */
export default function TagField({
  name,
  defaultValue = [],
  suggestions = [],
  texto = "",
}: Props) {
  const [tags, setTags] = useState<string[]>(() => dedup(defaultValue));
  const [entrada, setEntrada] = useState("");
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const slugsAtuais = useMemo(() => new Set(tags.map((t) => slugify(t))), [tags]);

  // Sugestões do dropdown: existentes ainda não escolhidas que casam com o
  // que está sendo digitado (já vêm ranqueadas por uso do servidor).
  const filtradas = useMemo(() => {
    const q = slugify(entrada);
    return suggestions
      .filter((s) => !slugsAtuais.has(slugify(s.name)))
      .filter((s) => !q || slugify(s.name).includes(q))
      .slice(0, 8);
  }, [entrada, suggestions, slugsAtuais]);

  // "Criar «x»" aparece quando o texto digitado ainda não é uma tag existente
  // nem já escolhida.
  const nomeDigitado = limparNomeTag(entrada);
  const slugDigitado = slugify(nomeDigitado);
  const podeCriar =
    !!slugDigitado &&
    !slugsAtuais.has(slugDigitado) &&
    !suggestions.some((s) => slugify(s.name) === slugDigitado);

  // Lista navegável = sugestões filtradas (+ criar, se couber).
  const opcoes = useMemo(
    () => [
      ...filtradas.map((s) => ({ tipo: "existente" as const, nome: s.name, count: s.count })),
      ...(podeCriar ? [{ tipo: "criar" as const, nome: nomeDigitado, count: 0 }] : []),
    ],
    [filtradas, podeCriar, nomeDigitado]
  );

  // Sugestões automáticas pelo conteúdo da notícia.
  const autoSugestoes = useMemo(
    () => sugerirAssuntos(texto, suggestions, tags),
    [texto, suggestions, tags]
  );

  function adicionar(bruto: string) {
    const nome = limparNomeTag(bruto);
    const slug = slugify(nome);
    if (!nome || !slug || slugsAtuais.has(slug)) {
      setEntrada("");
      return;
    }
    setTags((t) => [...t, nome]);
    setEntrada("");
    setDestaque(0);
  }

  function remover(i: number) {
    setTags((t) => t.filter((_, idx) => idx !== i));
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setDestaque((d) => Math.min(d + 1, Math.max(opcoes.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const escolha = opcoes[destaque];
      adicionar(escolha ? escolha.nome : entrada);
    } else if (e.key === "Escape") {
      setAberto(false);
    } else if (e.key === "Backspace" && !entrada && tags.length) {
      remover(tags.length - 1);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-conplan">
        Assuntos{" "}
        <span className="font-normal text-slate-400">(tags — ex.: IRPF 2026, Impostos)</span>
      </label>

      {/* JSON com os nomes; a server action normaliza e reaproveita por slug. */}
      <input type="hidden" name={name} value={JSON.stringify(tags)} />

      <div className="rounded-xl border border-slate-300 bg-white px-2 py-2 transition-colors focus-within:border-marconi focus-within:ring-2 focus-within:ring-marconi/20">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-marconi/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-marconi-dark"
            >
              {t}
              <button
                type="button"
                onClick={() => remover(i)}
                aria-label={`Remover ${t}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-marconi/70 transition-colors hover:bg-marconi/20 hover:text-marconi-dark"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          <div className="relative min-w-[8rem] flex-1">
            <input
              ref={inputRef}
              type="text"
              value={entrada}
              onChange={(e) => {
                setEntrada(e.target.value);
                setAberto(true);
                setDestaque(0);
              }}
              onKeyDown={onKeyDown}
              onFocus={() => setAberto(true)}
              // Fecha depois do clique numa sugestão conseguir registrar.
              onBlur={() => setTimeout(() => setAberto(false), 120)}
              placeholder={tags.length ? "Adicionar outro…" : "Digite e tecle Enter…"}
              className="w-full bg-transparent px-1.5 py-1 text-sm text-conplan outline-none placeholder:text-slate-400"
              aria-autocomplete="list"
              aria-expanded={aberto}
            />

            {/* Dropdown: existentes (com contador) + criar. */}
            {aberto && opcoes.length > 0 && (
              <ul className="absolute left-0 top-full z-20 mt-1 max-h-56 w-max min-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {opcoes.map((o, idx) => (
                  <li key={`${o.tipo}-${o.nome}`}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setDestaque(idx)}
                      onClick={() => adicionar(o.nome)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                        idx === destaque ? "bg-marconi/10 text-marconi-dark" : "text-conplan"
                      }`}
                    >
                      {o.tipo === "criar" ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-marconi">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          <span>
                            Criar <strong className="font-semibold">“{o.nome}”</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="flex-1">{o.nome}</span>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {o.count > 0 ? `${o.count} ${o.count === 1 ? "notícia" : "notícias"}` : "não usada"}
                          </span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Sugestões automáticas lidas do texto da notícia. */}
      {autoSugestoes.length > 0 && (
        <div className="mt-2 rounded-xl border border-dashed border-marconi/30 bg-marconi/[0.03] px-3 py-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-marconi-dark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
            </svg>
            Sugeridos para esta notícia
          </p>
          <div className="flex flex-wrap gap-1.5">
            {autoSugestoes.map((s) => (
              <button
                key={s.nome}
                type="button"
                onClick={() => adicionar(s.nome)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-2 pr-2.5 text-xs font-medium text-conplan shadow-sm transition-colors hover:border-marconi hover:bg-marconi/5"
                title={s.tipo === "novo" ? "Assunto novo, criado ao salvar" : `Já usado em ${s.count} ${s.count === 1 ? "notícia" : "notícias"}`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-marconi">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {s.nome}
                {s.tipo === "novo" ? (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-600">novo</span>
                ) : (
                  <span className="text-[10px] text-slate-400">{s.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-1.5 text-xs text-slate-400">
        Tecle Enter ou vírgula para adicionar. As tags são reaproveitadas entre
        as notícias — gerencie todas em{" "}
        <a href="/admin/assuntos" className="font-medium text-marconi hover:text-marconi-dark">
          Assuntos
        </a>
        .
      </p>
    </div>
  );
}

function dedup(nomes: string[]): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const n of nomes) {
    const nome = limparNomeTag(n);
    const slug = slugify(nome);
    if (nome && slug && !vistos.has(slug)) {
      vistos.add(slug);
      out.push(nome);
    }
  }
  return out;
}
