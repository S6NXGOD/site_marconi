import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toEmbedUrl } from "@/lib/embed";
import {
  DeleteApprovalButton,
  ToggleApprovalButton,
} from "@/components/admin/ApprovalActions";

const okMessages: Record<string, string> = {
  created: "Card criado com sucesso.",
  updated: "Card atualizado com sucesso.",
};

export default async function AprovacoesPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const approvals = await prisma.approval.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">
            Contas Aprovadas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Reels dos municípios exibidos na seção “Resultados na Prática” da
            home.
          </p>
        </div>
        <Link
          href="/admin/aprovacoes/novo"
          className="inline-flex items-center gap-2 rounded-full bg-marconi px-5 py-2.5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Novo card
        </Link>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {approvals.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-slate-500">
              Nenhum card cadastrado — a seção não aparece no site enquanto
              estiver vazia.
            </p>
            <Link
              href="/admin/aprovacoes/novo"
              className="mt-3 inline-block text-sm font-semibold text-marconi hover:underline"
            >
              Cadastrar o primeiro
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-cloud text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Município</th>
                  <th className="px-6 py-3 font-semibold">Publicação</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvals.map((a) => {
                  const embed = toEmbedUrl(a.embedUrl);

                  return (
                    <tr key={a.id} className="hover:bg-cloud/60">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/aprovacoes/${a.id}/editar`}
                          className="font-medium text-conplan hover:text-marconi"
                        >
                          {a.municipality}
                        </Link>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {a.label} · ordem {a.order}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {embed ? (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
                            Publicação OK
                          </span>
                        ) : a.embedUrl ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                            Link não reconhecido
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            Sem publicação
                          </span>
                        )}
                        {/* O card É a publicação: sem link válido, não há o que exibir. */}
                        {!embed && (
                          <span className="mt-1 block text-[11px] font-medium text-amber-600">
                            Não aparece no site
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ToggleApprovalButton id={a.id} isActive={a.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/aprovacoes/${a.id}/editar`}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                            </svg>
                            Editar
                          </Link>
                          <DeleteApprovalButton id={a.id} name={a.municipality} />
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
