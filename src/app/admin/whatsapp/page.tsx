import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/lib/icons";
import {
  DeleteWhatsappButton,
  ToggleWhatsappButton,
} from "@/components/admin/RowActions";

const okMessages: Record<string, string> = {
  created: "Contato criado com sucesso.",
  updated: "Contato atualizado com sucesso.",
};

/** 5586999998888 → (86) 99999-8888 */
function exibirTelefone(digits: string) {
  const d = digits.replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export default async function WhatsappPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const contatos = await prisma.whatsappContact.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  const semNumeroReal = contatos.some((c) => c.phone.includes("90000000"));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">WhatsApp</h1>
          <p className="mt-1 text-sm text-slate-500">
            Opções do botão flutuante que aparece em todas as páginas do site.
          </p>
        </div>
        <Link
          href="/admin/whatsapp/novo"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Novo contato
        </Link>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      {semNumeroReal && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <strong className="font-semibold">Atenção:</strong> ainda há número de
          exemplo cadastrado (90000-0000). Quem clicar no site não vai falar com
          ninguém — troque pelos números reais.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {contatos.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-slate-500">
              Nenhum contato — o botão flutuante não aparece no site.
            </p>
            <Link href="/admin/whatsapp/novo" className="mt-3 inline-block text-sm font-semibold text-marconi hover:underline">
              Cadastrar o primeiro
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contatos.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marconi/10 text-marconi">
                  <Icon name={c.icon} size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/whatsapp/${c.id}/editar`}
                    className="text-sm font-semibold text-conplan hover:text-marconi"
                  >
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate-400">{c.subtitle}</p>
                  <p className="mt-0.5 text-xs font-medium text-[#128C7E]">
                    {exibirTelefone(c.phone)}
                  </p>
                </div>

                <ToggleWhatsappButton id={c.id} ativo={c.isActive} />

                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/whatsapp/${c.id}/editar`}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                  >
                    Editar
                  </Link>
                  <DeleteWhatsappButton id={c.id} nome={c.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
