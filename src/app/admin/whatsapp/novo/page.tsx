import Link from "next/link";
import { createWhatsapp } from "@/app/admin/actions";
import WhatsappForm from "@/components/admin/WhatsappForm";

export default function NovoWhatsappPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/whatsapp" className="text-sm font-medium text-slate-500 transition-colors hover:text-marconi">
          ← Voltar para WhatsApp
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-conplan">Novo contato</h1>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <WhatsappForm action={createWhatsapp} submitLabel="Criar contato" />
      </div>
    </div>
  );
}
