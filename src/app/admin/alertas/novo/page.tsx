import Link from "next/link";
import { createAlert } from "@/app/admin/actions";
import AlertForm from "@/components/admin/AlertForm";

export default function NovoAlertaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/alertas"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Alertas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Novo alerta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre um prazo para prefeituras ou clientes corporativos.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <AlertForm action={createAlert} submitLabel="Criar alerta" />
      </div>
    </div>
  );
}
