"use client";

import { diasAte, formatarDiaPrazo } from "@/lib/datas";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { marcarFloat, useOutroFloatAberto, useEhMobile } from "@/lib/floats";
import {
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
  groupByDay,
  isUrgent,
} from "@/lib/news";
import type { AlertItem } from "./AlertsPanel";
import ExpandableText from "./ExpandableText";
import ShareAlertButton from "./ShareAlertButton";

// Marca que a pessoa fechou o aviso NESTA sessão do navegador. Assim ele abre
// sozinho ao entrar no site, mas não volta a abrir se ela fechar e navegar.
const SESSION_KEY = "mn:prazos-fechado";


const toneChip = {
  danger: "bg-red-50 text-red-700 ring-red-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

/**
 * Aviso flutuante dos prazos que vencem em até 7 dias.
 * - Abre sozinho ao entrar no site (uma vez por sessão do navegador).
 * - Quando há prazo HOJE ou AMANHÃ, o sino balança para alertar.
 * - Fechável: recolhe para uma pílula, não some de vez.
 * - Canto inferior ESQUERDO (o WhatsApp fica no direito).
 */
export default function DeadlineFloat({ alerts }: { alerts: AlertItem[] }) {
  const urgent = useMemo(() => alerts.filter((a) => isUrgent(a.date)), [alerts]);
  const groups = useMemo(() => groupByDay(urgent), [urgent]);

  // Há prazo vencendo HOJE ou AMANHÃ? É o que liga a animação de alerta.
  const alertaMaximo = useMemo(
    () => urgent.some((a) => diasAte(a.date) <= 1),
    [urgent]
  );

  /**
   * Começa RECOLHIDO — igual no servidor e no cliente (sem hydration mismatch).
   * O efeito abre sozinho ao entrar no site, a menos que a pessoa já tenha
   * fechado nesta sessão.
   */
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (urgent.length === 0) return;

    let fechado = false;
    try {
      fechado = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* sessionStorage indisponível (aba anônima, etc.) */
    }
    if (fechado) return;

    // Deixa a página assentar antes de aparecer.
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [urgent.length]);

  // Coordenação com o float do WhatsApp: no mobile, só um aparece por vez.
  const mobile = useEhMobile();
  const whatsappAberto = useOutroFloatAberto("prazos");
  useEffect(() => {
    marcarFloat("prazos", open);
    return () => marcarFloat("prazos", false);
  }, [open]);

  if (urgent.length === 0) return null;

  const total = urgent.length;

  function collapse() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignora */
    }
  }

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6 ${
        mobile && whatsappAberto ? "hidden" : ""
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.section
            key="card"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            aria-label="Prazos desta semana"
            className={`w-[calc(100vw-2rem)] max-w-[21.5rem] overflow-hidden rounded-2xl border bg-white shadow-2xl ${
              alertaMaximo ? "border-red-200 ring-1 ring-red-100" : "border-slate-200"
            }`}
          >
            {/* Faixa de topo — vermelha quando há prazo hoje/amanhã. */}
            <div
              aria-hidden
              className={`h-1 w-full ${alertaMaximo ? "bg-red-500" : "bg-marconi"}`}
            />

            {/* Cabeçalho */}
            <div
              className={`flex items-center gap-2.5 border-b px-4 py-3 ${
                alertaMaximo ? "border-red-100 bg-red-50/50" : "border-slate-100"
              }`}
            >
              {/* ícone — sino balança quando há prazo hoje/amanhã; senão, só o
                  anel pulsante discreto */}
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-lg animate-soft-ping ${
                    alertaMaximo ? "bg-red-400/60" : "bg-amber-400/50"
                  }`}
                />
                <span
                  className={`relative flex h-7 w-7 items-center justify-center rounded-lg ${
                    alertaMaximo ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <svg
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={alertaMaximo ? "origin-top animate-sino" : ""}
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-semibold leading-tight text-conplan">
                  Prazos desta semana
                </h2>
                <p className={`text-[11px] ${alertaMaximo ? "font-medium text-red-600" : "text-slate-400"}`}>
                  {alertaMaximo
                    ? "Há prazo vencendo em breve"
                    : `${total} ${total === 1 ? "prazo" : "prazos"} a vencer`}
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
                        {formatarDiaPrazo(group.date)}
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
                            <div className="flex shrink-0 items-center gap-0.5">
                              <span
                                className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${alertCategoryBadgeClasses[alert.category]}`}
                                title={alertCategoryLabels[alert.category]}
                              >
                                {alert.category === "PUBLICO" ? "Pública" : "Privado"}
                              </span>
                              <ShareAlertButton alert={alert} compacto />
                            </div>
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
              className={`relative flex animate-breathe items-center gap-2 rounded-full border bg-white py-2 pl-2.5 pr-4 shadow-lg transition-colors ${
                alertaMaximo
                  ? "border-red-200 ring-1 ring-red-100 hover:border-red-300"
                  : "border-slate-200 hover:border-marconi/40"
              }`}
            >
              {/* ponto de notificação pulsante */}
              <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-soft-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>

              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full ${
                  alertaMaximo ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={alertaMaximo ? "origin-top animate-sino" : ""}
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold text-conplan">
                  {total} {total === 1 ? "prazo" : "prazos"} esta semana
                </span>
                {alertaMaximo && (
                  <span className="text-[10px] font-semibold text-red-600">
                    vence em breve
                  </span>
                )}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
