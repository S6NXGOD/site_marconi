"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_SLUG, slugify, slugOtimizado } from "@/lib/slugify";

type Props = {
  /** name do input enviado no formulário */
  name: string;
  /** título atual do formulário — alimenta o slug automático */
  title: string;
  /** slug já salvo (notícia existente) */
  defaultValue?: string;
  /** ex.: https://marconinunes.com.br — só para exibir o endereço completo */
  siteUrl?: string;
};

/**
 * Endereço da notícia: mostra sempre o preview e só vira campo editável
 * quando a pessoa pede.
 *
 * Enquanto está no automático, acompanha o título em tempo real. Ao editar,
 * passa a manual e para de acompanhar — senão o que foi digitado à mão seria
 * sobrescrito na próxima letra do título.
 */
export default function SlugField({ name, title, defaultValue, siteUrl }: Props) {
  const original = defaultValue ?? "";
  // Notícia que já existe entra em manual: o slug dela já está publicado e
  // não pode mudar sozinho porque alguém ajustou o título.
  const [manual, setManual] = useState(Boolean(original));
  const [valor, setValor] = useState(original);
  const [editando, setEditando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const automatico = slugOtimizado(title);
  const slug = manual ? valor : automatico;

  useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  function abrirEdicao() {
    setValor(slug);
    setManual(true);
    setEditando(true);
  }

  function voltarAoAutomatico() {
    setManual(false);
    setEditando(false);
  }

  const prefixo = (siteUrl ?? "").replace(/^https?:\/\//, "");
  const mudouDoOriginal = Boolean(original) && slug !== original;
  const longo = slug.length > MAX_SLUG;

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-conplan"
        htmlFor={editando ? `${name}-input` : undefined}
      >
        Endereço da notícia
      </label>

      <input type="hidden" name={name} value={slug} />

      <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
          <span className="shrink-0 text-xs text-slate-400">
            {prefixo}/noticias/
          </span>

          {editando ? (
            <input
              id={`${name}-input`}
              ref={inputRef}
              type="text"
              value={valor}
              // Normaliza a cada tecla: o preview tem que ser o endereço real,
              // não uma promessa do que o servidor vai fazer com o texto.
              onChange={(e) => setValor(slugify(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setEditando(false);
                }
                if (e.key === "Escape") voltarAoAutomatico();
              }}
              placeholder={automatico || "endereco-da-noticia"}
              className="min-w-0 flex-1 border-b border-marconi/40 bg-transparent py-0.5 text-sm font-medium text-conplan outline-none focus:border-marconi"
            />
          ) : (
            <span
              className={`min-w-0 break-all text-sm font-medium ${
                slug ? "text-conplan" : "text-slate-400"
              }`}
            >
              {slug || "defina o título primeiro"}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex gap-1">
            {editando ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-marconi transition-colors hover:bg-marconi/10"
                >
                  Concluir
                </button>
                <button
                  type="button"
                  onClick={voltarAoAutomatico}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                >
                  Gerar do título
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={abrirEdicao}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-marconi transition-colors hover:bg-marconi/10"
                >
                  Editar
                </button>
                {manual && (
                  <button
                    type="button"
                    onClick={voltarAoAutomatico}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    Gerar do título
                  </button>
                )}
              </>
            )}
          </div>

          <span
            className={`shrink-0 text-xs tabular-nums ${
              longo ? "font-semibold text-amber-600" : "text-slate-400"
            }`}
          >
            {slug.length}/{MAX_SLUG}
          </span>
        </div>
      </div>

      {mudouDoOriginal && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          O endereço vai mudar. Quem já tiver o link antigo — inclusive quem
          recebeu por WhatsApp — vai cair numa página de erro.
        </p>
      )}

      {!manual && (
        <p className="mt-2 text-xs text-slate-400">
          Gerado do título, sem as palavras que não ajudam na busca.
        </p>
      )}
    </div>
  );
}
