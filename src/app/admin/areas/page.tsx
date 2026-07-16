import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Icon } from "@/lib/icons";
import { DeleteAreaButton, ToggleAreaButton } from "@/components/admin/RowActions";

const okMessages: Record<string, string> = {
  created: "Área criada com sucesso.",
  updated: "Área atualizada com sucesso.",
};

export default async function AreasPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const areas = await prisma.businessArea.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { services: { orderBy: { order: "asc" } } },
  });
  const okMessage = searchParams.ok ? okMessages[searchParams.ok] : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-conplan">Áreas de Atuação</h1>
          <p className="mt-1 text-sm text-slate-500">
            Seção “Duas vertentes, uma excelência” — cada área é uma aba na home.
          </p>
        </div>
        <Link
          href="/admin/areas/nova"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-marconi px-5 text-sm font-semibold text-white shadow-gold transition-all hover:-translate-y-0.5 hover:bg-marconi-dark sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          Nova área
        </Link>
      </header>

      {okMessage && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          {okMessage}
        </div>
      )}

      {areas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-500">
            Nenhuma área — a seção não aparece no site enquanto estiver vazia.
          </p>
          <Link href="/admin/areas/nova" className="mt-3 inline-block text-sm font-semibold text-marconi hover:underline">
            Cadastrar a primeira
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {areas.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-conplan-soft">
                {a.image ? (
                  <Image src={a.image} alt="" fill sizes="(max-width:1024px) 100vw, 40vw" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-400">
                    sem foto
                  </span>
                )}
                <span className="absolute left-3 top-3">
                  <ToggleAreaButton id={a.id} ativo={a.isActive} />
                </span>
              </div>

              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-marconi">
                  {a.eyebrow}
                </p>
                <h2 className="mt-1 font-serif text-lg font-semibold text-conplan">
                  {a.headline}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Aba: {a.tabLabel} · ordem {a.order}
                </p>

                <ul className="mt-3 space-y-1.5">
                  {a.services.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-marconi/10 text-marconi">
                        <Icon name={s.icon} size={13} />
                      </span>
                      {s.name}
                    </li>
                  ))}
                  {a.services.length === 0 && (
                    <li className="text-xs text-slate-400">Nenhum serviço cadastrado.</li>
                  )}
                </ul>

                <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                  <Link
                    href={`/admin/areas/${a.id}/editar`}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-conplan transition-colors hover:bg-conplan-soft"
                  >
                    Editar
                  </Link>
                  <DeleteAreaButton id={a.id} nome={a.eyebrow} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
