import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PerguntasLista from "@/components/admin/PerguntasLista";

const okMessages: Record<string, string> = {
  created: "Pergunta criada — já está no fim da lista.",
  updated: "Pergunta atualizada com sucesso.",
};

export default async function PerguntasPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const perguntas = await prisma.faqItem.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, question: true, answer: true, isActive: true },
  });
  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Perguntas frequentes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aparecem na página inicial, logo antes do Fale Conosco. Use as setas para mudar a
            ordem.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <a
            href="/#perguntas-frequentes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-slate-300 px-5 text-sm font-semibold text-conplan transition-colors hover:bg-white"
          >
            Ver no site
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </a>
          <Link
            href="/admin/perguntas/nova"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Nova pergunta
          </Link>
        </div>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {perguntas.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-slate-500">
              Nenhuma pergunta — a seção não aparece no site.
            </p>
            <Link
              href="/admin/perguntas/nova"
              className="mt-3 inline-block text-sm font-semibold text-marconi hover:underline"
            >
              Cadastrar a primeira
            </Link>
          </div>
        ) : (
          <PerguntasLista itens={perguntas} />
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-slate-500">
        Dica: escreva a pergunta do jeito que o cliente falaria (&quot;Como abro uma empresa?&quot;)
        e comece a resposta pela resposta — é a primeira frase que o Google e as IAs de busca
        costumam citar.
      </p>
    </div>
  );
}
