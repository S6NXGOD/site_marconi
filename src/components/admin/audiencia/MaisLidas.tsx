import Link from "next/link";
import { pct, type ItemRanking } from "@/lib/audiencia";

const COR = "#1d4f91";

const num = (v: number) => v.toLocaleString("pt-BR");

/**
 * Ranking do período por leituras. Cada matéria traz a TAXA DE LEITURA — de
 * quem abriu, quantos leram até o fim —, que diz mais sobre a matéria do que
 * o número de cliques: título chamativo com taxa baixa não entregou o que
 * prometeu.
 */
export default function MaisLidas({ itens }: { itens: ItemRanking[] }) {
  if (itens.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">Nenhuma matéria aberta neste período.</p>
    );
  }

  return (
    <ol className="divide-y divide-slate-100">
      {itens.map((it, i) => {
        const taxa = pct(it.leituras, it.acessos);
        return (
          <li key={it.id} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex gap-3">
              <span className="w-5 shrink-0 pt-px text-right text-sm font-semibold tabular-nums text-slate-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/audiencia/${it.id}`}
                  className="line-clamp-2 text-sm font-semibold leading-snug text-conplan transition-colors hover:text-marconi"
                >
                  {it.title}
                </Link>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  <span>
                    <strong className="font-semibold text-slate-700">{num(it.acessos)}</strong>{" "}
                    {it.acessos === 1 ? "acesso" : "acessos"}
                  </span>
                  <span>
                    <strong className="font-semibold text-slate-700">{num(it.leituras)}</strong>{" "}
                    {it.leituras === 1 ? "leitura" : "leituras"}
                  </span>
                  {it.compartilhamentos > 0 && (
                    <span>
                      <strong className="font-semibold text-slate-700">{num(it.compartilhamentos)}</strong>{" "}
                      compart.
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2.5">
                  {/* Medidor: trilho num tom claro do mesmo azul. */}
                  <div className="h-1.5 flex-1 rounded-full bg-[#e6edf7]">
                    <div
                      className="h-full origin-left animate-crescer-x rounded-full"
                      style={{ width: `${taxa}%`, background: COR, animationDelay: `${i * 60}ms` }}
                    />
                  </div>
                  <span className="w-[4.5rem] shrink-0 text-right text-[11px] tabular-nums text-slate-500">
                    {taxa}% leram
                  </span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
