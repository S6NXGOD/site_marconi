import Link from "next/link";
import AnimatedCounter from "@/components/AnimatedCounter";
import { agoraNoSite, periodoDe, pct, resumo, temDados, variacao } from "@/lib/audiencia";
import AgoraNoSite from "./AgoraNoSite";
import { Delta } from "./Kpi";

/** Resumo de 7 dias da Audiência no Dashboard — o atalho do dia a dia. */
export default async function ResumoDashboard() {
  const periodo = periodoDe("7");
  const [existe, agora, atual, anterior] = await Promise.all([
    temDados(),
    agoraNoSite(),
    resumo(periodo.inicio, periodo.fim),
    resumo(periodo.anteriorInicio, periodo.anteriorFim),
  ]);

  const numeros = [
    { rotulo: "Acessos", valor: atual.acessos, antes: anterior.acessos },
    { rotulo: "Visitantes", valor: atual.visitantes, antes: anterior.visitantes },
    { rotulo: "Leituras", valor: atual.leituras, antes: anterior.leituras },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-conplan">Audiência</h2>
          <p className="text-xs text-slate-500">Últimos 7 dias</p>
        </div>
        <AgoraNoSite inicial={agora} />
      </div>

      {existe ? (
        <dl className="mt-5 grid grid-cols-3 gap-3 sm:gap-6">
          {numeros.map((n) => (
            <div key={n.rotulo} className="min-w-0">
              <dt className="text-xs font-medium text-slate-500">{n.rotulo}</dt>
              <dd className="mt-1 text-2xl font-semibold leading-none text-conplan sm:text-3xl">
                <AnimatedCounter to={n.valor} duration={1.1} margem="0px" />
              </dd>
              <dd className="mt-1.5">
                <Delta valor={variacao(n.valor, n.antes)} titulo={periodo.comparacao} />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          A medição começou — os números aparecem assim que alguém abrir o site.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          {existe && atual.acessosMaterias > 0
            ? `${pct(atual.leituras, atual.acessosMaterias)}% das matérias abertas foram lidas até o fim`
            : "Mais lidas, origem, melhor horário e contatos"}
        </p>
        <Link
          href="/admin/audiencia"
          className="inline-flex items-center gap-1 text-sm font-semibold text-marconi transition-colors hover:text-marconi-dark"
        >
          Ver audiência
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
