"use client";

import { useMemo, useRef, useState } from "react";
import { limparNomeTag } from "@/lib/tags";
import { slugify } from "@/lib/slugify";

type Props = {
  /** name do input escondido enviado no formulário (JSON dos nomes) */
  name: string;
  /** tags já atribuídas à notícia */
  defaultValue?: string[];
  /** tags que já existem no sistema, para sugerir/reaproveitar */
  suggestions?: string[];
};

/**
 * Campo de tags de assunto: chips removíveis + digitar para adicionar, com
 * sugestão das tags que já existem (reúso evita "IRPF 2026" e "irpf 2026"
 * viverem como duas).
 *
 * Enter ou vírgula adiciona; Backspace no campo vazio remove a última. O valor
 * enviado é JSON com os nomes — a server action normaliza e reaproveita.
 */
export default function TagField({ name, defaultValue = [], suggestions = [] }: Props) {
  const [tags, setTags] = useState<string[]>(() => dedup(defaultValue));
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const slugsAtuais = useMemo(() => new Set(tags.map((t) => slugify(t))), [tags]);

  // Sugestões que combinam com o que está sendo digitado e ainda não foram
  // escolhidas.
  const filtradas = useMemo(() => {
    const q = slugify(texto);
    return suggestions
      .filter((s) => !slugsAtuais.has(slugify(s)))
      .filter((s) => !q || slugify(s).includes(q))
      .slice(0, 8);
  }, [texto, suggestions, slugsAtuais]);

  function adicionar(bruto: string) {
    const nome = limparNomeTag(bruto);
    if (!nome) return;
    const slug = slugify(nome);
    if (!slug || slugsAtuais.has(slug)) {
      setTexto("");
      return;
    }
    setTags((t) => [...t, nome]);
    setTexto("");
  }

  function remover(i: number) {
    setTags((t) => t.filter((_, idx) => idx !== i));
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      adicionar(texto);
    } else if (e.key === "Backspace" && !texto && tags.length) {
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
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setAberto(true)}
              // Fecha depois do clique numa sugestão conseguir registrar.
              onBlur={() => setTimeout(() => setAberto(false), 120)}
              placeholder={tags.length ? "Adicionar outro…" : "Digite e tecle Enter…"}
              className="w-full bg-transparent px-1.5 py-1 text-sm text-conplan outline-none placeholder:text-slate-400"
            />

            {/* Dropdown de sugestões (tags já existentes). */}
            {aberto && filtradas.length > 0 && (
              <ul className="absolute left-0 top-full z-20 mt-1 max-h-52 w-max min-w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {filtradas.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => adicionar(s)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-conplan transition-colors hover:bg-marconi/5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        Tecle Enter ou vírgula para adicionar. As tags são reaproveitadas entre
        as notícias.
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
