import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { atualizarPergunta } from "@/app/admin/perguntas/actions";
import PerguntaForm from "@/components/admin/PerguntaForm";

export default async function EditarPerguntaPage({
  params,
}: {
  params: { id: string };
}) {
  const p = await prisma.faqItem.findUnique({ where: { id: params.id } });
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/perguntas"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Perguntas frequentes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Editar pergunta</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <PerguntaForm
          action={atualizarPergunta.bind(null, p.id)}
          submitLabel="Salvar alterações"
          initial={{ question: p.question, answer: p.answer, isActive: p.isActive }}
        />
      </div>
    </div>
  );
}
