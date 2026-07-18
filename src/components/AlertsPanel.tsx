"use client";

import { formatarDiaPrazo } from "@/lib/datas";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { AlertCategory } from "@prisma/client";
import {
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
  groupByDay,
  isUrgent,
} from "@/lib/news";
import ExpandableText from "./ExpandableText";

export type AlertItem = {
  id: string;
  title: string;
  date: Date | string;
  category: AlertCategory;
  description: string;
};

const toneStyles = {
  danger: "bg-red-50 text-red-700 ring-red-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  neutral: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

const toneBar = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  neutral: "bg-slate-300",
} as const;

type Aba = "avencer" | "encerrados";

export default function AlertsPanel({
  alerts,
  encerrados = [],
}: {
  alerts: AlertItem[];
  /** prazos que já passaram — consulta de referência */
  encerrados?: AlertItem[];
}) {
  const [aba, setAba] = useState<Aba>("avencer");

  const lista = aba === "avencer" ? alerts : encerrados;

  // Agrupado por dia: se cair mais de um prazo na mesma data, todos aparecem
  // sob o mesmo cabeçalho.
  const groups = useMemo(() => {
    const g = groupByDay(lista);
    // Encerrados do mais recente para o mais antigo: o de ontem interessa mais
    // que o do ano passado. `groupByDay` ordena crescente, que é o certo para
    // o que está por vir.
    return aba === "encerrados" ? [...g].reverse() : g;
  }, [lista, aba]);

  const urgentes = useMemo(() => alerts.filter((a) => isUrgent(a.date)).length, [alerts]);
  const temAlgo = alerts.length > 0 || encerrados.length > 0;

  const abas: { valor: Aba; label: string; total: number }[] = [
    { valor: "avencer", label: "A vencer", total: alerts.length },
    { valor: "encerrados", label: "Encerrados", total: encerrados.length },
  ];

  return (
    <aside id="alertas" className="scroll-mt-24">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* ——— Cabeçalho ——— */}
        <div className="bg-conplan px-5 pb-3 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              {/* Mesmo pulso do aviso flutuante, e só quando há urgência de
                  verdade — animação constante vira ruído. */}
              {urgentes > 0 && aba === "avencer" && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-lg bg-marconi/40 animate-soft-ping"
                />
              )}
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-marconi/20 text-marconi-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">
                Alertas &amp; Prazos
              </h2>
              <p className="text-xs text-slate-400">
                {urgentes > 0
                  ? `${urgentes} ${urgentes === 1 ? "vence" : "vencem"} nos próximos 7 dias`
                  : "Prefeituras e clientes corporativos"}
              </p>
            </div>
          </div>

          {/* ——— Abas ——— */}
          {temAlgo && (
            <div className="mt-4 flex gap-1 rounded-full bg-white/5 p-1">
              {abas.map((t) => {
                const ativa = aba === t.valor;
                return (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => setAba(t.valor)}
                    aria-pressed={ativa}
                    className="relative flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors"
                  >
                    {/* A pílula desliza entre as abas em vez de piscar — é o
                        movimento que dá a sensação de troca. */}
                    {ativa && (
                      <motion.span
                        layoutId="aba-alertas"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-marconi shadow-gold"
                      />
                    )}
                    <span
                      className={`relative z-10 ${ativa ? "text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      {t.label}
                    </span>
                    <span
                      className={`relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                        ativa ? "bg-white/25 text-white" : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {t.total}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ——— Lista ——— */}
        {groups.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 11h18" />
              </svg>
            </span>
            <p className="mt-3 text-sm font-medium text-conplan">
              {aba === "encerrados" ? "Nenhum prazo encerrado" : "Nenhum prazo ativo no momento"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {aba === "encerrados"
                ? "Prazos que passarem da data ficam guardados aqui."
                : "Assim que houver um prazo, ele aparece aqui."}
            </p>
          </div>
        ) : (
          /* Rolagem interna: expandir descrições não pode estourar a tela,
             já que o painel é sticky. */
          <div className="lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto">
            {/* mode="wait": a lista some antes da outra entrar, em vez de as
                duas se sobreporem no meio da troca */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.ol
                key={aba}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="divide-y divide-slate-100"
              >
                {groups.map((group) => {
                  const { text, tone } = deadlineLabel(group.date);
                  const venceHoje = aba === "avencer" && text === "Vence hoje";

                  return (
                    <li key={group.key} className="relative px-5 py-4 sm:px-6 sm:py-5">
                      <span
                        className={`absolute left-0 top-0 h-full w-1 ${toneBar[tone]}`}
                        aria-hidden
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${toneStyles[tone]}`}
                        >
                          {venceHoje && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span aria-hidden className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-soft-ping" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                            </span>
                          )}
                          {text}
                        </span>
                        <time className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {formatarDiaPrazo(group.date)}
                        </time>
                        {group.items.length > 1 && (
                          <span className="rounded-full bg-conplan-soft px-2 py-0.5 text-[10px] font-semibold text-conplan">
                            {group.items.length} prazos
                          </span>
                        )}
                      </div>

                      <ul className="mt-3 space-y-3">
                        {group.items.map((alert) => (
                          <li
                            key={alert.id}
                            className="group border-l-2 border-slate-100 pl-3 transition-colors hover:border-marconi"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold leading-snug text-conplan transition-colors group-hover:text-marconi">
                                {alert.title}
                              </h3>
                              <span
                                className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${alertCategoryBadgeClasses[alert.category]}`}
                                title={alertCategoryLabels[alert.category]}
                              >
                                {alert.category === "PUBLICO" ? "Pública" : "Privado"}
                              </span>
                            </div>

                            <div className="mt-1">
                              <ExpandableText
                                text={alert.description}
                                lines={2}
                                className="text-xs leading-relaxed text-slate-500"
                                buttonClassName="text-[11px] text-marconi hover:text-marconi-dark"
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </motion.ol>
            </AnimatePresence>
          </div>
        )}

        {aba === "encerrados" && groups.length > 0 && (
          <p className="border-t border-slate-100 bg-cloud px-5 py-2.5 text-center text-[11px] text-slate-400 sm:px-6">
            Prazos já vencidos, para consulta.
          </p>
        )}
      </div>
    </aside>
  );
}
