"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  alternarPergunta,
  excluirPergunta,
  moverPergunta,
} from "@/app/admin/perguntas/actions";

export type PerguntaAdmin = {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
};

const seta =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-marconi hover:text-marconi disabled:pointer-events-none disabled:opacity-30";

/**
 * Lista das Perguntas frequentes no painel.
 *
 * Reage na hora — sobe, desce, oculta, some — e o servidor confirma em
 * seguida; quando a página volta do servidor, vale o que veio de lá. Cada
 * item desliza para a nova posição (layout do framer-motion).
 */
export default function PerguntasLista({ itens }: { itens: PerguntaAdmin[] }) {
  const [lista, setLista] = useState(itens);
  const [, iniciar] = useTransition();

  useEffect(() => setLista(itens), [itens]);

  function mover(i: number, direcao: "cima" | "baixo") {
    const j = direcao === "cima" ? i - 1 : i + 1;
    if (j < 0 || j >= lista.length) return;
    const nova = [...lista];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setLista(nova);
    iniciar(() => moverPergunta(lista[i].id, direcao));
  }

  function alternar(p: PerguntaAdmin) {
    setLista((l) => l.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
    iniciar(() => alternarPergunta(p.id, !p.isActive));
  }

  function excluir(p: PerguntaAdmin) {
    if (!confirm(`Excluir a pergunta "${p.question}"? Esta ação não pode ser desfeita.`)) return;
    setLista((l) => l.filter((x) => x.id !== p.id));
    iniciar(() => excluirPergunta(p.id));
  }

  return (
    <ul className="divide-y divide-slate-100">
      <AnimatePresence initial={false}>
        {lista.map((p, i) => (
          <motion.li
            key={p.id}
            layout
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 500, damping: 42 }}
            className="flex gap-3 bg-white px-4 py-4 sm:gap-4 sm:px-6"
          >
            {/* Ordem */}
            <div className="flex shrink-0 flex-col gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => mover(i, "cima")}
                disabled={i === 0}
                aria-label={`Subir "${p.question}"`}
                title="Subir"
                className={seta}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => mover(i, "baixo")}
                disabled={i === lista.length - 1}
                aria-label={`Descer "${p.question}"`}
                title="Descer"
                className={seta}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            <div className={`min-w-0 flex-1 transition-opacity ${p.isActive ? "" : "opacity-60"}`}>
              <Link
                href={`/admin/perguntas/${p.id}/editar`}
                className="text-sm font-semibold leading-snug text-conplan transition-colors hover:text-marconi sm:text-base"
              >
                {p.question}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{p.answer}</p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => alternar(p)}
                  title={p.isActive ? "Clique para ocultar do site" : "Clique para exibir no site"}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    p.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {p.isActive ? "No site" : "Oculta"}
                </button>
                <Link
                  href={`/admin/perguntas/${p.id}/editar`}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => excluir(p)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
