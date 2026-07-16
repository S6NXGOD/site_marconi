"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { AlertCategory } from "@prisma/client";
import {
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
  groupByDay,
} from "@/lib/news";
import ExpandableText from "./ExpandableText";

export type AlertItem = {
  id: string;
  title: string;
  date: Date | string;
  category: AlertCategory;
  description: string;
};

const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

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

export default function AlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  // Agrupado por dia: se cair mais de um prazo na mesma data,
  // todos aparecem sob o mesmo cabeçalho.
  const groups = useMemo(() => groupByDay(alerts), [alerts]);

  return (
    <aside id="alertas" className="lg:sticky lg:top-28 lg:self-start">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-conplan px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marconi/20 text-marconi-light">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">
              Alertas &amp; Prazos
            </h2>
            <p className="text-xs text-slate-400">
              Prefeituras e clientes corporativos
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">
            Nenhum prazo ativo no momento.
          </p>
        ) : (
          /* rolagem interna: expandir descrições não pode estourar a tela,
             já que o painel é sticky */
          <ol className="divide-y divide-slate-100 lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto">
            {groups.map((group, index) => {
              const { text, tone } = deadlineLabel(group.date);

              return (
                <motion.li
                  key={group.key}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: index * 0.07 }}
                  className="relative px-6 py-5"
                >
                  {/* barra de urgência do dia */}
                  <span
                    className={`absolute left-0 top-0 h-full w-1 ${toneBar[tone]}`}
                    aria-hidden
                  />

                  {/* Cabeçalho do dia */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${toneStyles[tone]}`}
                    >
                      {text}
                    </span>
                    <time className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {dayFmt.format(group.date)}
                    </time>
                    {group.items.length > 1 && (
                      <span className="rounded-full bg-conplan-soft px-2 py-0.5 text-[10px] font-semibold text-conplan">
                        {group.items.length} prazos
                      </span>
                    )}
                  </div>

                  {/* Prazos daquele dia */}
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

                        {/* Descrição legível por inteiro, sem corte seco */}
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
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}
