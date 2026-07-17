import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSource } from "@/app/admin/actions";
import SourceForm from "@/components/admin/SourceForm";

export default async function EditarFontePage({
  params,
}: {
  params: { id: string };
}) {
  const fonte = await prisma.scrapeSource.findUnique({ where: { id: params.id } });
  if (!fonte) notFound();

  const action = updateSource.bind(null, fonte.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/fontes"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Fontes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Editar fonte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Se o site mudou de layout, é aqui que os seletores são corrigidos.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SourceForm
          action={action}
          submitLabel="Salvar alterações"
          initial={{
            name: fonte.name,
            url: fonte.url,
            category: fonte.category,
            itemSelector: fonte.itemSelector,
            titleSelector: fonte.titleSelector,
            linkSelector: fonte.linkSelector,
            dateSelector: fonte.dateSelector,
            imageSelector: fonte.imageSelector,
            excerptSelector: fonte.excerptSelector,
            contentSelector: fonte.contentSelector,
            isActive: fonte.isActive,
          }}
        />
      </div>
    </div>
  );
}
