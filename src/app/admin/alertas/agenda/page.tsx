import Link from "next/link";
import AgendaImport from "@/components/admin/AgendaImport";

export const metadata = { title: "Agenda Tributária — Piauí" };

/**
 * Importa a Agenda Tributária Estadual do Piauí (ICMS) do contadores.cnt.br.
 * Escolhe ano e meses, pré-seleciona os prazos relevantes (destacados) e
 * deixa os de nicho sem destaque — você revisa e importa só o que interessa.
 */
export default function AgendaPage() {
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
          Agenda Tributária — Piauí (ICMS)
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Puxa a agenda estadual do contadores.cnt.br. Os prazos{" "}
          <strong className="font-semibold text-marconi-dark">relevantes</strong>{" "}
          (que interessam à maioria) já vêm marcados; os{" "}
          <strong className="font-semibold text-slate-600">específicos</strong>{" "}
          (combustíveis, energia, telecom…) ficam sem destaque. Você escolhe o
          que importar.
        </p>
      </div>

      <AgendaImport />
    </div>
  );
}
