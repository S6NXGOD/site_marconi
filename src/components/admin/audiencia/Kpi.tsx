import AnimatedCounter from "@/components/AnimatedCounter";

/**
 * Variação contra o período anterior: seta + número + cor. Cor nunca sozinha —
 * a seta e o sinal dizem a direção para quem não distingue verde de vermelho.
 *
 * `absoluto` mostra a diferença em unidades ("+8") em vez de percentual: em
 * número pequeno, sair de 5 para 13 viraria um "+160%" que assusta à toa.
 */
export function Delta({
  valor,
  titulo,
  absoluto = false,
}: {
  valor: number | null;
  titulo: string;
  absoluto?: boolean;
}) {
  if (valor === null) {
    if (absoluto) return null;
    return (
      <span title={titulo} className="text-xs text-slate-400">
        sem base de comparação
      </span>
    );
  }
  const sobe = valor > 0;
  const igual = valor === 0;
  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        igual ? "text-slate-500" : sobe ? "text-emerald-700" : "text-rose-600"
      }`}
    >
      {!igual && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={sobe ? "" : "rotate-180"}>
          <path d="M12 5l7 9H5z" />
        </svg>
      )}
      {igual ? "igual" : `${sobe ? "+" : "−"}${Math.abs(valor).toLocaleString("pt-BR")}${absoluto ? "" : "%"}`}
    </span>
  );
}

/** Bloco de número do topo da Audiência. */
export default function Kpi({
  rotulo,
  valor,
  formato,
  delta,
  comparacao,
  detalhe,
}: {
  rotulo: string;
  valor: number;
  /** texto pronto no lugar do número animado (ex.: "1 min 20 s") */
  formato?: string;
  /** omitido = sem comparação (ex.: página de uma matéria) */
  delta?: number | null;
  comparacao?: string;
  detalhe?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-slate-500 sm:text-sm">{rotulo}</p>
      <p className="mt-2 text-[1.7rem] font-semibold leading-none tracking-tight text-conplan sm:text-[2rem]">
        {formato ?? <AnimatedCounter to={valor} duration={1.1} margem="0px" />}
      </p>
      {(delta !== undefined || detalhe) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta !== undefined && <Delta valor={delta} titulo={comparacao ?? ""} />}
          {detalhe && <span className="text-xs text-slate-500">{detalhe}</span>}
        </div>
      )}
    </div>
  );
}
