import Link from "next/link";
import { createSource } from "@/app/admin/actions";
import SourceForm from "@/components/admin/SourceForm";

export default function NovaFontePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/fontes"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Fontes
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Nova fonte</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre um site e onde estão os dados no HTML dele.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SourceForm action={createSource} submitLabel="Criar fonte" />
      </div>
    </div>
  );
}
