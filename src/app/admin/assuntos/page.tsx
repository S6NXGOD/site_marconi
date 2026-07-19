import { getTagsComContagem } from "@/lib/get-tags";
import AssuntosManager from "@/components/admin/AssuntosManager";

export const metadata = { title: "Assuntos" };

/**
 * Central de Assuntos: onde as tags viram gestão de verdade — ver o uso de
 * cada uma, renomear, mesclar duplicadas e limpar as que ninguém usa.
 */
export default async function AssuntosPage() {
  const tags = await getTagsComContagem();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-conplan">Assuntos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Os assuntos (tags) que organizam as notícias. Renomeie, junte grafias
          repetidas e remova o que virou lixo — tudo reflete no site na hora.
        </p>
      </div>

      <AssuntosManager
        tags={tags.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          count: t.count,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
