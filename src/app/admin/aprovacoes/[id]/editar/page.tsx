import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateApproval } from "@/app/admin/actions";
import ApprovalForm from "@/components/admin/ApprovalForm";

export default async function EditarAprovacaoPage({
  params,
}: {
  params: { id: string };
}) {
  const approval = await prisma.approval.findUnique({ where: { id: params.id } });
  if (!approval) notFound();

  const action = updateApproval.bind(null, approval.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/aprovacoes"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Contas Aprovadas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Editar card</h1>
        <p className="mt-1 text-sm text-slate-500">
          Atualize o município, o vídeo ou a exibição no site.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ApprovalForm
          action={action}
          submitLabel="Salvar alterações"
          initial={{
            municipality: approval.municipality,
            label: approval.label,
            embedUrl: approval.embedUrl,
            order: approval.order,
            isActive: approval.isActive,
          }}
        />
      </div>
    </div>
  );
}
