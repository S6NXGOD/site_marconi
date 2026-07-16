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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Alertas & Prazos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie os prazos exibidos no portal para prefeituras e empresas.
          </p>
        </div>
        <Link
          href="/admin/alertas/novo"
          className="inline-flex items-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-cloud text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Título</th>
                  <th className="px-6 py-3 font-semibold">Categoria</th>
                  <th className="px-6 py-3 font-semibold">Data limite</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => {
                  const deadline = deadlineLabel(a.date);
                  return (
                    <tr key={a.id} className="hover:bg-cloud/60">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/alertas/${a.id}/editar`}
                          className="font-medium text-conplan hover:text-marconi"
                        >
                          {a.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${alertCategoryBadgeClasses[a.category]}`}
                        >
                          {alertCategoryLabels[a.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{dateFmt.format(a.date)}</span>
                        <span className={`ml-2 text-xs font-semibold ${toneClasses[deadline.tone]}`}>
                          {deadline.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ToggleAlertActiveButton id={a.id} isActive={a.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/alertas/${a.id}/editar`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                            </svg>
                            Editar
                          </Link>
                          <DeleteAlertButton id={a.id} title={a.title} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
