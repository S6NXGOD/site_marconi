"use client";

import { diasAte, formatarDiaPrazo } from "@/lib/datas";

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

/** Sem acento e minúsculo — para a busca casar "iptu", "IPTU", "Íptu". */
function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function AlertsPanel({
  alerts,
  encerrados = [],
}: {
  alerts: AlertItem[];
  /** prazos que já passaram — consulta de referência */
  encerrados?: AlertItem[];
}) {
  const [aba, setAba] = useState<Aba>("avencer");
  const [busca, setBusca] = useState("");

  const lista = aba === "avencer" ? alerts : encerrados;

  // Busca pelo imposto/obrigação: casa no título e na descrição.
  const filtrada = useMemo(() => {
    const q = normalizar(busca.trim());
    if (!q) return lista;
    return lista.filter((a) => normalizar(`${a.title} ${a.description}`).includes(q));
  }, [lista, busca]);

  // Agrupado por dia: se cair mais de um prazo na mesma data, todos aparecem
  // sob o mesmo cabeçalho.
  const groups = useMemo(() => {
    const g = groupByDay(filtrada);
    // Encerrados do mais recente para o mais antigo: o de ontem interessa mais
    // que o do ano passado. `groupByDay` ordena crescente, certo para o futuro.
    return aba === "encerrados" ? [...g].reverse() : g;
  }, [filtrada, aba]);

  const urgentes = useMemo(() => alerts.filter((a) => isUrgent(a.date)).length, [alerts]);
  const temAlgo = alerts.length > 0 || encerrados.length > 0;

  const abas: { valor: Aba; label: string; total: number }[] = [
    { valor: "avencer", label: "A vencer", total: alerts.length },
    { valor: "encerrados", label: "Encerrados", total: encerrados.length },
  ];

  return (
    <aside id="alertas" className="scroll-mt-24">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-elegant">
        {/* ——— Cabeçalho escuro: título compacto + busca + abas ——— */}
        <div className="bg-conplan px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              {urgentes > 0 && aba === "avencer" && (
                <span aria-hidden className="absolute inset-0 rounded-lg bg-marconi/40 animate-soft-ping" />
              )}
              <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-marconi/20 text-marconi-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold leading-tight text-white">
                Calendário de obrigações
              </h3>
              <p className="text-[11px] text-slate-400">
                {urgentes > 0
                  ? `${urgentes} ${urgentes === 1 ? "vence" : "vencem"} nos próximos 7 dias`
                  : "Prefeituras e clientes corporativos"}
              </p>
            </div>
          </div>

          {/* ——— Busca ——— */}
          {temAlgo && (
            <div className="relative mt-4">
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar imposto ou obrigação…"
                aria-label="Buscar prazo por imposto ou obrigação"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-9 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-marconi focus:bg-white/10 [&::-webkit-search-cancel-button]:hidden"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* ——— Abas ——— */}
          {temAlgo && (
            <div className="mt-3 flex gap-1 rounded-full bg-white/5 p-1">
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
                    {ativa && (
                      <motion.span
                        layoutId="aba-alertas"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-marconi shadow-gold"
                      />
                    )}
                    <span className={`relative z-10 ${ativa ? "text-white" : "text-slate-400 hover:text-white"}`}>
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
              {busca ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 11h18" />
                </svg>
              )}
            </span>
            <p className="mt-3 text-sm font-medium text-conplan">
              {busca
                ? "Nenhum prazo encontrado"
                : aba === "encerrados"
                  ? "Nenhum prazo encerrado"
                  : "Nenhum prazo ativo no momento"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {busca ? (
                <>
                  Nada para <strong className="font-semibold text-slate-500">“{busca}”</strong> em{" "}
                  {aba === "avencer" ? "A vencer" : "Encerrados"}.
                </>
              ) : aba === "encerrados" ? (
                "Prazos que passarem da data ficam guardados aqui."
              ) : (
                "Assim que houver um prazo, ele aparece aqui."
              )}
            </p>
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-conplan transition-colors hover:border-marconi hover:text-marconi"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="max-h-[32rem] overflow-y-auto lg:max-h-[34rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.ol
                key={`${aba}-${busca ? "q" : "all"}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="divide-y divide-slate-100"
              >
                {groups.map((group) => {
                  const { text, tone } = deadlineLabel(group.date);
                  const dias = aba === "avencer" ? diasAte(group.date) : 99;
                  const venceHoje = dias === 0;
                  const urgenteMax = dias >= 0 && dias <= 1;

                  return (
                    <li key={group.key} className="relative px-5 py-4 sm:px-6 sm:py-5">
                      <span className={`absolute left-0 top-0 h-full w-1 ${toneBar[tone]}`} aria-hidden />

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${toneStyles[tone]}`}
                        >
                          {urgenteMax && (
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
                            className="group -mx-2 rounded-xl border-l-2 border-slate-100 py-1 pl-3 pr-2 transition-colors hover:border-marconi hover:bg-cloud/60"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold leading-snug text-conplan transition-colors group-hover:text-marconi">
                                {realce(alert.title, busca)}
                              </h4>
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

        {aba === "encerrados" && groups.length > 0 && !busca && (
          <p className="border-t border-slate-100 bg-cloud px-5 py-2.5 text-center text-[11px] text-slate-400 sm:px-6">
            Prazos já vencidos, para consulta.
          </p>
        )}
      </div>
    </aside>
  );
}

/** Destaca o trecho buscado dentro do título. */
function realce(texto: string, busca: string) {
  const q = busca.trim();
  if (!q) return texto;
  const i = normalizar(texto).indexOf(normalizar(q));
  if (i < 0) return texto;
  return (
    <>
      {texto.slice(0, i)}
      <mark className="rounded bg-marconi/20 text-inherit">{texto.slice(i, i + q.length)}</mark>
      {texto.slice(i + q.length)}
    </>
  );
}
