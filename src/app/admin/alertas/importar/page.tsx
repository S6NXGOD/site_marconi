import Link from "next/link";
import AlertsImport from "@/components/admin/AlertsImport";

export default function ImportarAlertasPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/alertas"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi"
        >
          ← Voltar para Alertas
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">
          Importar alertas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastre vários prazos de uma vez a partir de uma planilha.
        </p>
      </div>

      <AlertsImport />
    </div>
  );
}
