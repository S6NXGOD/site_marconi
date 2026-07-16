import Link from "next/link";
import { createApproval } from "@/app/admin/actions";
import ApprovalForm from "@/components/admin/ApprovalForm";

export default function NovaAprovacaoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/aprovacoes"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Contas Aprovadas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Novo card</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cole o link do reel do Instagram — o site monta o player sozinho.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ApprovalForm action={createApproval} submitLabel="Criar card" />
      </div>
    </div>
  );
}
