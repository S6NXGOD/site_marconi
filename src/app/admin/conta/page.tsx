import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PasswordForm from "@/components/admin/PasswordForm";

export default async function ContaPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-conplan">Minha conta</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dados de acesso ao painel do Grupo.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Nome
            </dt>
            <dd className="mt-0.5 text-sm text-conplan">{session?.user?.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              E-mail
            </dt>
            <dd className="mt-0.5 text-sm text-conplan">{session?.user?.email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-conplan">Alterar senha</h2>
        <p className="mt-1 text-sm text-slate-500">
          Recomendado no primeiro acesso, já que a senha inicial vem das
          variáveis de ambiente do servidor.
        </p>

        <div className="mt-6">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
