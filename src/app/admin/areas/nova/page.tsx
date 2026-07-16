import Link from "next/link";
import { createArea } from "@/app/admin/actions";
import AreaForm from "@/components/admin/AreaForm";

export default function NovaAreaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/areas" className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi">
          ← Voltar para Áreas de Atuação
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Nova área</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <AreaForm action={createArea} submitLabel="Criar área" />
      </div>
    </div>
  );
}
