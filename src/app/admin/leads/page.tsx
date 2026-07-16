import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  leadStatusLabels,
  leadStatusClasses,
  leadStatusOrder,
  toWhatsApp,
} from "@/lib/leads";
import {
  LeadStatusSwitcher,
  DeleteLeadButton,
} from "@/components/admin/LeadActions";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const filters: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "novos", label: "Novos" },
  { value: "contato", label: "Em contato" },
  { value: "concluidos", label: "Concluídos" },
];

const filterMap: Record<string, LeadStatus> = {
  novos: "NEW",
  contato: "CONTACTED",
  concluidos: "CLOSED",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const active =
    searchParams.status && filterMap[searchParams.status]
      ? searchParams.status
      : "todos";
  const statusFilter = filterMap[active];

  const [leads, counts] = await Promise.all([
    prisma.commercialLead.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      orderBy: { createdAt: "desc" },
    }),
    prisma.commercialLead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countOf = (s: LeadStatus) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((n, c) => n + c._count._all, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-conplan">
          Leads — Fale Conosco
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Contatos enviados pelo formulário do site, com todos os dados
          informados.
        </p>
      </header>

      {/* Resumo por status */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-1 font-serif text-3xl font-bold text-conplan">{total}</p>
        </div>
        {leadStatusOrder.map((s) => (
          <div
            key={s}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {leadStatusLabels[s]}
            </p>
            <p className="mt-1 font-serif text-3xl font-bold text-conplan">
              {countOf(s)}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros (links reais — funcionam sem JS) */}
      <div className="flex flex-wrap gap-1.5 rounded-full border border-slate-200 bg-white p-1.5">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === "todos" ? "/admin/leads" : `/admin/leads?status=${f.value}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === f.value
                ? "bg-conplan text-white"
                : "text-conplan/70 hover:bg-conplan-soft"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
          Nenhum lead nesta visão.
        </p>
      ) : (
        <ul className="space-y-4">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              {/* topo: nome + status + data */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-conplan">
                      {lead.name}
                    </h2>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${leadStatusClasses[lead.status]}`}
                    >
                      {leadStatusLabels[lead.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Protocolo{" "}
                    <span className="font-mono font-semibold text-slate-600">
                      #{lead.id.slice(-6).toUpperCase()}
                    </span>
                  </p>
                </div>

                <time className="shrink-0 text-xs text-slate-400">
                  {dateFmt.format(lead.createdAt)}
                </time>
              </div>

              {/* dados informados */}
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Empresa / Município
                  </dt>
                  <dd className="mt-0.5 text-sm text-conplan">{lead.company}</dd>
                </div>

                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Telefone
                  </dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-conplan">{lead.phone}</span>
                    <a
                      href={`https://wa.me/${toWhatsApp(lead.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2 py-0.5 text-[11px] font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/20"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z" />
                      </svg>
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${lead.phone.replace(/\D/g, "")}`}
                      className="inline-flex items-center gap-1 rounded-full bg-conplan-soft px-2 py-0.5 text-[11px] font-semibold text-conplan transition-colors hover:bg-conplan/10"
                    >
                      Ligar
                    </a>
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Necessidade
                  </dt>
                  <dd className="mt-1 whitespace-pre-line rounded-xl bg-cloud px-4 py-3 text-sm leading-relaxed text-slate-700">
                    {lead.need}
                  </dd>
                </div>
              </dl>

              {/* ações */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </p>
                  <LeadStatusSwitcher id={lead.id} current={lead.status} />
                </div>
                <DeleteLeadButton id={lead.id} name={lead.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
