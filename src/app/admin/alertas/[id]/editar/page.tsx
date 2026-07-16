import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateAlert } from "@/app/admin/actions";
import AlertForm from "@/components/admin/AlertForm";

export default async function EditarAlertaPage({
  params,
}: {
  params: { id: string };
}) {
  const alert = await prisma.alert.findUnique({ where: { id: params.id } });
  if (!alert) notFound();

  const action = updateAlert.bind(null, alert.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/alertas"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Alertas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Editar alerta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Atualize o prazo, a categoria ou o status de exibição.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <AlertForm
          action={action}
          submitLabel="Salvar alterações"
          initial={{
            title: alert.title,
            date: alert.date,
            category: alert.category,
            description: alert.description,
            isActive: alert.isActive,
          }}
        />
      </div>
    </div>
  );
}
