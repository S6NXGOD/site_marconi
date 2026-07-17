import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatarDiaPrazo, inicioDeHoje } from "@/lib/datas";
import {
  alertCategoryLabels,
  alertCategoryBadgeClasses,
  deadlineLabel,
  isUrgent,
} from "@/lib/news";
import {
  DeleteAlertButton,
  ToggleAlertActiveButton,
} from "@/components/admin/AlertRowActions";

const okMessages: Record<string, string> = {
  created: "Alerta criado com sucesso.",
  updated: "Alerta atualizado com sucesso.",
};

/** Mensagem da importação — precisa dos números, então não cabe no mapa acima. */
function mensagemImportacao(n: string | undefined, ign: string | undefined): string {
  const criados = Number(n ?? 0);
  const ignorados = Number(ign ?? 0);
  const base =
    criados === 0
      ? "Nenhum alerta novo — todos já estavam cadastrados."
      : `${criados} ${criados === 1 ? "alerta importado" : "alertas importados"} com sucesso.`;
  if (criados > 0 && ignorados > 0) {
    return `${base} ${ignorados} ${ignorados === 1 ? "linha ignorada" : "linhas ignoradas"} (repetida ou com erro).`;
  }
  return base;
}

/** Cor da barra lateral do card — é o que dá a leitura da lista de relance. */
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

type Aba = "avencer" | "vencidos";

export default async function AlertasAdminPage({
  searchParams,
}: {
  searchParams: { ok?: string; n?: string; ign?: string; aba?: string };
}) {
  const aba: Aba = searchParams.aba === "vencidos" ? "vencidos" : "avencer";
  const hoje = inicioDeHoje();

  // Duas consultas em vez de filtrar em memória: a lista de vencidos só cresce
  // com o tempo e não há motivo para trazê-la ao abrir a tela.
  const [alerts, totalAVencer, totalVencidos] = await Promise.all([
    prisma.alert.findMany({
      where: aba === "vencidos" ? { date: { lt: hoje } } : { date: { gte: hoje } },
      // Vencidos: do mais recente para o mais antigo — o de ontem interessa
      // mais que o do ano passado. A vencer: o mais próximo primeiro.
      orderBy: { date: aba === "vencidos" ? "desc" : "asc" },
    }),
    prisma.alert.count({ where: { date: { gte: hoje } } }),
    prisma.alert.count({ where: { date: { lt: hoje } } }),
  ]);

  const okMessage =
    searchParams.ok === "imported"
      ? mensagemImportacao(searchParams.n, searchParams.ign)
      : searchParams.ok
        ? okMessages[searchParams.ok]
        : undefined;

  const daSemana = aba === "avencer" ? alerts.filter((a) => isUrgent(a.date)).length : 0;
  const inativos = alerts.filter((a) => !a.isActive).length;

  const abas: { valor: Aba; label: string; total: number }[] = [
    { valor: "avencer", label: "A vencer", total: totalAVencer },
    { valor: "vencidos", label: "Vencidos", total: totalVencidos },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Alertas &amp; Prazos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie os prazos exibidos no portal para prefeituras e empresas.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/admin/alertas/importar"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-semibold text-conplan transition-colors hover:border-marconi hover:text-marconi sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Importar CSV
          </Link>
          <Link
            href="/admin/alertas/novo"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Novo alerta
          </Link>
        </div>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      {/* ——— Abas ——— links reais: dá para compartilhar e voltar pelo histórico */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1 rounded-full border border-slate-200 bg-white p-1">
          {abas.map((t) => (
            <Link
              key={t.valor}
              href={t.valor === "avencer" ? "/admin/alertas" : "/admin/alertas?aba=vencidos"}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                aba === t.valor
                  ? "bg-conplan text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-conplan"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  aba === t.valor ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.total}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ——— Resumo ——— só quando há o que resumir */}
      {aba === "avencer" && (daSemana > 0 || inativos > 0) && (
        <div className="flex flex-wrap gap-2">
          {daSemana > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
              {/* mesmo pulso do aviso no site, sem exagero */}
              <span className="relative flex h-2 w-2">
                <span aria-hidden className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-soft-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              {daSemana} {daSemana === 1 ? "vence" : "vencem"} nos próximos 7 dias
            </span>
          )}
          {inativos > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              {inativos} {inativos === 1 ? "não aparece" : "não aparecem"} no site
            </span>
          )}
        </div>
      )}

      {/* ——— Lista ——— */}
      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
          </span>
          <p className="mt-4 font-serif text-lg text-conplan">
            {aba === "vencidos" ? "Nenhum prazo vencido" : "Nenhum prazo a vencer"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {aba === "vencidos"
              ? "Prazos que passarem da data aparecem aqui automaticamente."
              : "Cadastre um por vez ou importe uma planilha de uma só vez."}
          </p>
          {aba === "avencer" && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/admin/alertas/novo"
                className="rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-colors hover:bg-marconi-dark"
              >
                Novo alerta
              </Link>
              <Link
                href="/admin/alertas/importar"
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-conplan transition-colors hover:bg-slate-50"
              >
                Importar CSV
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {alerts.map((a) => {
            const prazo = deadlineLabel(a.date);
            const venceHoje = prazo.days === 0;

            return (
              <li
                key={a.id}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md ${
                  a.isActive ? "" : "opacity-70"
                }`}
              >
                {/* Barra de urgência: dá a leitura da lista de relance, antes
                    mesmo de ler o texto. */}
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 w-1 ${toneBar[prazo.tone]}`}
                />

                <div className="pl-4 pr-3 py-3.5 sm:pl-5 sm:pr-4 sm:py-4">
                  <div className="lg:flex lg:items-start lg:gap-5">
                    <div className="min-w-0 lg:flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${toneChip[prazo.tone]}`}
                        >
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
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${alertCategoryBadgeClasses[a.category]}`}
                        >
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
              </li>
            );
          })}
        </ul>
      )}

      {aba === "vencidos" && alerts.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          Prazos vencidos deixam de aparecer no site sozinhos — não precisa
          desativar nem excluir.
        </p>
      )}
    </div>
  );
}
