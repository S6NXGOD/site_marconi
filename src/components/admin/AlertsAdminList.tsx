"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatarDiaPrazo } from "@/lib/datas";
import {
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
} from "@/lib/news";
import type { AlertCategory } from "@prisma/client";
import { deleteAlerts } from "@/app/admin/actions";
import {
  DeleteAlertButton,
  ToggleAlertActiveButton,
} from "./AlertRowActions";

export type AlertRow = {
  id: string;
  title: string;
  description: string;
  date: Date | string;
  category: AlertCategory;
  isActive: boolean;
};

const toneBar = {
  danger: "bg-red-500",
  warning: "bg-amber-500",
  neutral: "bg-slate-300",
} as const;

const toneChip = {
  danger: "bg-red-50 text-red-700 ring-red-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  neutral: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

/**
 * Lista de alertas do painel com SELEÇÃO MÚLTIPLA e exclusão em massa. Mantém
 * as ações por linha (ativar/editar/excluir) e acrescenta os checkboxes + a
 * barra "excluir selecionados" — útil depois de importar a agenda em bloco.
 */
export default function AlertsAdminList({ alerts }: { alerts: AlertRow[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pendente, startTransition] = useTransition();

  const todosMarcados = alerts.length > 0 && sel.size === alerts.length;

  function alternar(id: string) {
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function marcarTodos() {
    setSel(todosMarcados ? new Set() : new Set(alerts.map((a) => a.id)));
  }

  function excluir() {
    const ids = Array.from(sel);
    if (ids.length === 0) return;
    if (!window.confirm(`Excluir ${ids.length} prazo(s)? Esta ação não tem volta.`)) return;
    startTransition(async () => {
      await deleteAlerts(ids);
      setSel(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-2.5">
      {/* Barra de seleção */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-conplan">
          <input
            type="checkbox"
            checked={todosMarcados}
            onChange={marcarTodos}
            className="h-4 w-4 rounded border-slate-300 text-marconi focus:ring-marconi"
          />
          {sel.size > 0 ? `${sel.size} selecionado(s)` : "Selecionar todos"}
        </label>
        {sel.size > 0 && (
          <button
            type="button"
            onClick={excluir}
            disabled={pendente}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
            {pendente ? "Excluindo…" : `Excluir ${sel.size}`}
          </button>
        )}
      </div>

      <ul className="space-y-2.5">
        {alerts.map((a) => {
          const prazo = deadlineLabel(a.date);
          const venceHoje = prazo.days === 0;
          const marcado = sel.has(a.id);

          return (
            <li
              key={a.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                marcado ? "border-marconi ring-1 ring-marconi/30" : "border-slate-200 hover:border-slate-300"
              } ${a.isActive ? "" : "opacity-70"}`}
            >
              <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${toneBar[prazo.tone]}`} />

              <div className="pl-4 pr-3 py-3.5 sm:pl-5 sm:pr-4 sm:py-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(a.id)}
                    aria-label={`Selecionar ${a.title}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-marconi focus:ring-marconi"
                  />

                  <div className="min-w-0 flex-1 lg:flex lg:items-start lg:gap-5">
                    <div className="min-w-0 lg:flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${toneChip[prazo.tone]}`}>
                          {venceHoje && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span aria-hidden className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-soft-ping" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                            </span>
                          )}
                          {prazo.text}
                        </span>
                        <time className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          {formatarDiaPrazo(a.date)}
                        </time>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${alertCategoryBadgeClasses[a.category]}`}>
                          {alertCategoryLabels[a.category]}
                        </span>
                      </div>

                      <Link
                        href={`/admin/alertas/${a.id}/editar`}
                        className="mt-1.5 block text-sm font-semibold leading-snug text-conplan transition-colors hover:text-marconi sm:text-[15px]"
                      >
                        {a.title}
                      </Link>

                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {a.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 lg:mt-0 lg:shrink-0 lg:border-0 lg:pt-0">
                      <ToggleAlertActiveButton id={a.id} isActive={a.isActive} />
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/alertas/${a.id}/editar`}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                          </svg>
                          Editar
                        </Link>
                        <DeleteAlertButton id={a.id} title={a.title} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
