const COR_CELULAR = "#1d4f91";
const COR_COMPUTADOR = "#b8942e";

/** Celular x computador: uma barra dividida, com o percentual escrito ao lado de cada cor. */
export default function Dispositivos({ celular, computador }: { celular: number; computador: number }) {
  const total = celular + computador;
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Nenhum acesso neste período.</p>;
  }
  const pCelular = Math.round((celular / total) * 100);
  const partes = [
    { rotulo: "Celular", valor: celular, pct: pCelular, cor: COR_CELULAR },
    { rotulo: "Computador", valor: computador, pct: 100 - pCelular, cor: COR_COMPUTADOR },
  ];

  return (
    <>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-white">
        {partes.map(
          (p, i) =>
            p.valor > 0 && (
              <div
                key={p.rotulo}
                className="h-full origin-left animate-crescer-x"
                style={{ width: `${(p.valor / total) * 100}%`, background: p.cor, animationDelay: `${i * 120}ms` }}
              />
            )
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {partes.map((p) => (
          <div key={p.rotulo}>
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ background: p.cor }} aria-hidden="true" />
              {p.rotulo}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-conplan">
              {p.pct}%{" "}
              <span className="text-xs font-normal tabular-nums text-slate-400">
                {p.valor.toLocaleString("pt-BR")}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      {pCelular >= 60 && (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {Math.round(pCelular / 10)} em cada 10 leem pelo celular: título curto e foto boa fazem
          diferença.
        </p>
      )}
    </>
  );
}
