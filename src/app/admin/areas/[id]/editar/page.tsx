import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArea } from "@/app/admin/actions";
import AreaForm from "@/components/admin/AreaForm";

export default async function EditarAreaPage({
  params,
}: {
  params: { id: string };
}) {
  const a = await prisma.businessArea.findUnique({
    where: { id: params.id },
    include: { services: { orderBy: { order: "asc" } } },
  });
  if (!a) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/areas" className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi">
          ← Voltar para Áreas de Atuação
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Editar área</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <AreaForm
          action={updateArea.bind(null, a.id)}
          submitLabel="Salvar alterações"
          initial={{
            tabLabel: a.tabLabel,
            eyebrow: a.eyebrow,
            headline: a.headline,
            description: a.description,
            image: a.image,
            imageAlt: a.imageAlt,
            accent: a.accent,
            ctaLabel: a.ctaLabel,
            ctaHref: a.ctaHref,
            order: a.order,
            isActive: a.isActive,
            services: a.services.map((s) => ({ name: s.name, icon: s.icon })),
          }}
        />
      </div>
    </div>
  );
}
