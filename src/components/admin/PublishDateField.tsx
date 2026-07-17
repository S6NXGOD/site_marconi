"use client";

import { useEffect, useRef, useState } from "react";
import { ehHoje, formatarData, hojeISO } from "@/lib/datas";

type Props = {
  /** name do input enviado no formulário */
  name: string;
  /** data já salva (notícia existente); vazio = hoje */
  defaultValue?: string;
};

/**
 * Data da notícia: vem preenchida com a data do dia e só vira campo quando a
 * pessoa pede. O caso comum — publicar hoje o que aconteceu hoje — não exige
 * nenhum clique.
 */
export default function PublishDateField({ name, defaultValue }: Props) {
  const hoje = hojeISO();
  const [valor, setValor] = useState(defaultValue || hoje);
  const [editando, setEditando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  // `valor` é "yyyy-mm-dd"; as funções de data resolvem no fuso do Piauí.
  const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const hojeSelecionado = dataValida && valor === hoje;
  const futuro = dataValida && valor > hoje;

  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-conplan"
        htmlFor={editando ? `${name}-input` : undefined}
      >
        Data da notícia
      </label>

      {!editando && <input type="hidden" name={name} value={valor} />}

      <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className="shrink-0 text-slate-400" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>

            {editando ? (
              <input
                id={`${name}-input`}
                ref={inputRef}
                type="date"
                name={name}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setEditando(false);
                  }
                }}
                className="min-w-0 border-b border-marconi/40 bg-transparent py-0.5 text-sm font-medium text-conplan outline-none focus:border-marconi"
              />
            ) : (
              <span className="min-w-0 text-sm font-medium text-conplan">
                {dataValida ? formatarData(`${valor}T12:00:00Z`) : "—"}
              </span>
            )}

            {hojeSelecionado && !editando && (
              <span className="shrink-0 rounded-full bg-marconi/10 px-2 py-0.5 text-[11px] font-semibold text-marconi">
                Hoje
              </span>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
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
                  onClick={() => {
                    setValor(hoje);
                    setEditando(false);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50"
                >
                  Usar hoje
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-marconi transition-colors hover:bg-marconi/10"
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {futuro && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          Data no futuro. A notícia aparece no site assim que for publicada,
          mesmo com esta data.
        </p>
      )}
    </div>
  );
}
