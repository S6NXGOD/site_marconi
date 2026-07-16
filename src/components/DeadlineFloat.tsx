"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
  groupByDay,
  isUrgent,
} from "@/lib/news";
import type { AlertItem } from "./AlertsPanel";
import ExpandableText from "./ExpandableText";

// Guarda a assinatura dos prazos que a pessoa JÁ VIU (não "que ela fechou").
// É o que impede o aviso de reabrir a cada visita.
const STORAGE_KEY = "mn:prazos-vistos";

const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const toneChip = {
  danger: "bg-red-50 text-red-700 ring-red-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

/**
 * Aviso flutuante e discreto dos prazos que vencem em até 7 dias.
 * - Fechável: ao fechar, recolhe para uma pílula (não some de vez).
 * - Lembra a escolha por conjunto de prazos: se surgir um prazo novo,
 *   volta a abrir sozinho.
 * - Canto inferior ESQUERDO (o WhatsApp fica no direito).
 */
export default function DeadlineFloat({ alerts }: { alerts: AlertItem[] }) {
  const urgent = useMemo(() => alerts.filter((a) => isUrgent(a.date)), [alerts]);
  const groups = useMemo(() => groupByDay(urgent), [urgent]);

  // Assinatura do conjunto atual de prazos.
  const signature = useMemo(
    () =>
      urgent
        .map((a) => a.id)
        .sort()
        .join(","),
    [urgent]
  );

  /**
   * Começa RECOLHIDO — igual no servidor e no cliente (sem hydration mismatch
   * e sem o "flash" de abrir e fechar em quem já viu).
   * O efeito abre sozinho só na primeira vez que a pessoa vê estes prazos.
   */
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!signature) return;

    let visto: string | null = null;
    try {
      visto = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* localStorage indisponível (aba anônima, etc.) */
    }

    // Já viu exatamente estes prazos? Fica na pílula e não incomoda.
    if (visto === signature) return;

    // Primeira visita — ou surgiram prazos NOVOS: abre e marca como visto,
    // então nas próximas visitas ele não abre de novo sozinho.
    const t = setTimeout(() => {
      setOpen(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, signature);
      } catch {
        /* ignora */
      }
    }, 900); // deixa a página assentar antes de aparecer

    return () => clearTimeout(t);
  }, [signature]);

  if (urgent.length === 0) return null;

  const total = urgent.length;

  function collapse() {
    setOpen(false);
    // Garante o registro mesmo se o usuário fechar antes do efeito rodar.
    try {
      window.localStorage.setItem(STORAGE_KEY, signature);
    } catch {
      /* ignora */
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.section
            key="card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-label="Prazos desta semana"
            className="w-[calc(100vw-2rem)] max-w-[21.5rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
              {/* ícone com anel pulsante discreto */}
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-lg bg-amber-400/50 animate-soft-ping"
                />
                <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 11h18M12 15v3" />
                  </svg>
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-semibold leading-tight text-conplan">
                  Prazos desta semana
                </h2>
                <p className="text-[11px] text-slate-400">
                  {total} {total === 1 ? "prazo" : "prazos"} a vencer
                </p>
              </div>

              <button
                type="button"
                onClick={collapse}
                aria-label="Fechar aviso de prazos"
                className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Lista agrupada por dia — rola dentro do card se crescer */}
            <ul className="max-h-[min(22rem,55vh)] divide-y divide-slate-100 overflow-y-auto">
              {groups.map((group) => {
                const { text, tone } = deadlineLabel(group.date);

                return (
                  <li key={group.key} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ${toneChip[tone]}`}
                      >
                        {text}
                      </span>
                      <time className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {dayFmt.format(group.date)}
                      </time>
                      {group.items.length > 1 && (
                        <span className="rounded-full bg-conplan-soft px-1.5 py-0.5 text-[10px] font-semibold text-conplan">
                          {group.items.length} no mesmo dia
                        </span>
                      )}
                    </div>

                    {/* todos os prazos do dia ficam visíveis */}
                    <ul className="mt-2 space-y-2.5">
                      {group.items.map((alert) => (
                        <li
                          key={alert.id}
                          className="border-l-2 border-slate-100 pl-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] font-medium leading-snug text-conplan">
                              {alert.title}
                            </p>
                            <span
                              className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${alertCategoryBadgeClasses[alert.category]}`}
                              title={alertCategoryLabels[alert.category]}
                            >
                              {alert.category === "PUBLICO" ? "Pública" : "Privado"}
                            </span>
                          </div>

                          {/* descrição legível, com "Ver mais" quando transborda */}
                          <div className="mt-0.5">
                            <ExpandableText
                              text={alert.description}
                              lines={2}
                              className="text-[11.5px] leading-relaxed text-slate-500"
                              buttonClassName="text-[10.5px] text-marconi hover:text-marconi-dark"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-slate-100 px-4 py-2">
              <a
                href="/#alertas"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-marconi transition-colors hover:text-marconi-dark"
              >
                Ver todos os prazos
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </motion.section>
        ) : (
          /* Recolhido: pílula discreta, ainda acessível.
             O framer anima o wrapper (opacidade/escala de entrada) e o CSS
             anima o botão — se os dois mexessem no transform do mesmo
             elemento, um sobrescreveria o outro. */
          <motion.div
            key="pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`Ver ${total} prazo(s) desta semana`}
              className="relative flex animate-breathe items-center gap-2 rounded-full border border-slate-200 bg-white py-2 pl-3 pr-3.5 shadow-lg transition-colors hover:border-marconi/40"
            >
              {/* ponto de notificação pulsante */}
              <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-soft-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>

              <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 11h18" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-conplan">
                {total} {total === 1 ? "prazo" : "prazos"} esta semana
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
