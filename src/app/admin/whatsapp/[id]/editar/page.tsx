import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateWhatsapp } from "@/app/admin/actions";
import WhatsappForm from "@/components/admin/WhatsappForm";

export default async function EditarWhatsappPage({
  params,
}: {
  params: { id: string };
}) {
  const c = await prisma.whatsappContact.findUnique({ where: { id: params.id } });
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/whatsapp" className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi">
          ← Voltar para WhatsApp
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Editar contato</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <WhatsappForm
          action={updateWhatsapp.bind(null, c.id)}
          submitLabel="Salvar alterações"
          initial={{
            title: c.title,
            subtitle: c.subtitle,
            phone: c.phone,
            message: c.message,
            icon: c.icon,
            order: c.order,
            isActive: c.isActive,
          }}
        />
      </div>
    </div>
  );
}
