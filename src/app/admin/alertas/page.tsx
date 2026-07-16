import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { alertCategoryLabels, alertCategoryBadgeClasses, deadlineLabel } from "@/lib/news";
import {
  DeleteAlertButton,
  ToggleAlertActiveButton,
} from "@/components/admin/AlertRowActions";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const okMessages: Record<string, string> = {
  created: "Alerta criado com sucesso.",
  updated: "Alerta atualizado com sucesso.",
};

const toneClasses = {
  danger: "text-red-600",
  warning: "text-amber-600",
  neutral: "text-slate-400",
} as const;

export default async function AlertasAdminPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const alerts = await prisma.alert.findMany({ orderBy: { date: "asc" } });
  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Alertas & Prazos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie os prazos exibidos no portal para prefeituras e empresas.
          </p>
        </div>
        <Link
          href="/admin/alertas/novo"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo alerta
        </Link>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {alerts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">
            Nenhum alerta cadastrado.{" "}
            <Link href="/admin/alertas/novo" className="font-semibold text-marconi hover:underline">
              Criar o primeiro
            </Link>
            .
          </p>
        ) : (
          /* Cards — sem tabela e sem scroll horizontal no celular. */
          <ul className="divide-y divide-slate-100">
            {alerts.map((a) => {
              const deadline = deadlineLabel(a.date);
              return (
                <li key={a.id} className="p-4 transition-colors hover:bg-cloud/60 sm:p-5">
                  <div className="lg:flex lg:items-center lg:gap-6">
                    <div className="min-w-0 lg:flex-1">
                      <Link
                        href={`/admin/alertas/${a.id}/editar`}
                        className="block text-sm font-semibold leading-snug text-conplan hover:text-marconi sm:text-base"
                      >
                        {a.title}
                      </Link>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${alertCategoryBadgeClasses[a.category]}`}
                        >
                          {alertCategoryLabels[a.category]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {dateFmt.format(a.date)}
                        </span>
                        <span className={`text-xs font-semibold ${toneClasses[deadline.tone]}`}>
                          {deadline.text}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 lg:mt-0 lg:shrink-0 lg:justify-end lg:border-0 lg:pt-0">
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
