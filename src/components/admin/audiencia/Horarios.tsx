import { melhorJanela } from "@/lib/audiencia";

/** Pico no dourado da marca; o resto em cinza — o destaque é a janela boa. */
const COR_PICO = "#b8942e";
const COR_BASE = "#cbd5e1";

/** Abaixo disso, apontar "o melhor horário" seria chute. */
const MINIMO = 20;

/**
 * A que horas os leitores chegam — e, com dado suficiente, a janela de 3 horas
 * com mais acessos: o melhor momento para mandar as notícias no WhatsApp.
 */
export default function Horarios({ horas }: { horas: number[] }) {
  const total = horas.reduce((s, v) => s + v, 0);
  const maior = Math.max(1, ...horas);
  const janela = total >= MINIMO ? melhorJanela(horas) : null;
  const noPico = (h: number) => janela !== null && h >= janela.inicio && h < janela.fim;

  return (
    <>
      <p className="text-sm leading-relaxed text-slate-600">
        {janela ? (
          <>
            Seus leitores chegam mais entre{" "}
            <strong className="font-semibold text-conplan">
              {janela.inicio}h e {janela.fim}h
            </strong>
            {" "}— um bom horário para mandar as notícias no WhatsApp.
          </>
        ) : (
          "Ainda há poucos acessos neste período para apontar o melhor horário."
        )}
      </p>

      <div className="mt-6 flex h-28 items-end gap-[2px]">
        {horas.map((v, h) => (
          <div
            key={h}
            tabIndex={0}
            aria-label={`${h}h: ${v} acessos`}
            className="group relative flex h-full flex-1 items-end justify-center outline-none"
          >
            <div
              className="w-full max-w-[24px] origin-bottom animate-crescer-y rounded-t-[3px] transition-opacity group-hover:opacity-80"
              style={{
                height: `${v > 0 ? Math.max((v / maior) * 100, 3) : 0}%`,
                background: noPico(h) ? COR_PICO : COR_BASE,
                animationDelay: `${h * 18}ms`,
              }}
            />
            <span
              className={`pointer-events-none absolute bottom-full z-10 mb-1.5 hidden whitespace-nowrap rounded-lg bg-conplan px-2 py-1 text-[11px] font-medium text-white shadow group-hover:block group-focus-visible:block ${
                h < 3 ? "left-0" : h > 20 ? "right-0" : "left-1/2 -translate-x-1/2"
              }`}
            >
              {h}h · {v.toLocaleString("pt-BR")} {v === 1 ? "acesso" : "acessos"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-400">
        <span>0h</span>
        <span>6h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
    </>
  );
}
