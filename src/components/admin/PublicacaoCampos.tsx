"use client";

import { faltaPara, hojeISO, inputDeInstante, instanteDeInput } from "@/lib/datas";

export type ModoPublicacao = "rascunho" | "agora" | "agendar";

type Props = {
  modo: ModoPublicacao;
  onModo: (modo: ModoPublicacao) => void;
  /** "yyyy-mm-ddThh:mm", na hora do Piauí */
  quando: string;
  onQuando: (quando: string) => void;
  /** Texto da opção "agora" — numa notícia já publicada, ela vira "No ar". */
  rotuloAgora?: string;
  /** Publicada não oferece agendar: agendar seria tirá-la do site até lá. */
  semAgendar?: boolean;
  /** Hora do pico de acessos (ver `melhorHoraParaPublicar`), quando houver dado. */
  melhorHora?: number | null;
  /** Na barra fixa da importação a tela é curta: sem rótulo e sem o "vai ao ar". */
  compacto?: boolean;
  erro?: string;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-conplan outline-none transition-colors focus:border-marconi focus:ring-2 focus:ring-marconi/20";

const pad = (n: number) => String(n).padStart(2, "0");

/** A próxima vez que o relógio do Piauí marca esta hora: hoje, ou senão amanhã. */
function proximaHora(hora: number): string {
  const hoje = `${hojeISO()}T${pad(hora)}:00`;
  if ((instanteDeInput(hoje)?.getTime() ?? 0) > Date.now()) return hoje;
  return amanhaAs(hora);
}

function amanhaAs(hora: number): string {
  const amanha = new Date(Date.now() + 86_400_000);
  return `${inputDeInstante(amanha).slice(0, 10)}T${pad(hora)}:00`;
}

/** Marcar o horário no celular dá trabalho: o caso comum sai em um toque. */
function atalhos(melhorHora?: number | null): { rotulo: string; valor: string }[] {
  const lista: { rotulo: string; valor: string }[] = [];
  if (melhorHora != null) {
    lista.push({
      rotulo: `Melhor horário · ${pad(melhorHora)}:00`,
      valor: proximaHora(melhorHora),
    });
  }
  const dezoito = `${hojeISO()}T18:00`;
  if ((instanteDeInput(dezoito)?.getTime() ?? 0) > Date.now()) {
    lista.push({ rotulo: "Hoje 18:00", valor: dezoito });
  }
  lista.push({ rotulo: "Amanhã 08:00", valor: amanhaAs(8) });
  return lista;
}

/** Rascunho, publicar agora ou agendar — o mesmo controle no formulário e na importação. */
export default function PublicacaoCampos({
  modo,
  onModo,
  quando,
  onQuando,
  rotuloAgora = "Publicar agora",
  semAgendar = false,
  melhorHora,
  compacto = false,
  erro,
}: Props) {
  const opcoes: { valor: ModoPublicacao; rotulo: string }[] = [
    { valor: "rascunho", rotulo: "Rascunho" },
    { valor: "agora", rotulo: rotuloAgora },
    ...(semAgendar ? [] : [{ valor: "agendar" as const, rotulo: "Agendar" }]),
  ];
  const indice = Math.max(0, opcoes.findIndex((o) => o.valor === modo));
  const instante = instanteDeInput(quando);

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Quando vai ao ar"
        className="relative flex rounded-xl bg-slate-100 p-1"
      >
        {/* A marcação desliza em vez de pular: dá para ver que é uma escolha só. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-200 ease-out"
          style={{
            width: `calc((100% - 0.5rem) / ${opcoes.length})`,
            transform: `translateX(${indice * 100}%)`,
          }}
        />
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={modo === o.valor}
            onClick={() => onModo(o.valor)}
            className={`relative min-h-10 flex-1 rounded-lg px-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              modo === o.valor ? "text-conplan" : "text-slate-500 hover:text-conplan"
            }`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>

      {modo === "agendar" && (
        <div className="mt-3 space-y-2.5">
          <div>
            <label
              htmlFor="quando"
              className={compacto ? "sr-only" : "mb-1.5 block text-sm font-medium text-conplan"}
            >
              Dia e hora <span className="font-normal text-slate-400">(horário do Piauí)</span>
            </label>
            <input
              id="quando"
              type="datetime-local"
              value={quando}
              min={inputDeInstante(new Date())}
              onChange={(e) => onQuando(e.target.value)}
              suppressHydrationWarning
              className={fieldClass}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {atalhos(melhorHora).map((a) => (
              <button
                key={a.rotulo}
                type="button"
                onClick={() => onQuando(a.valor)}
                className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                  quando === a.valor
                    ? "bg-marconi text-white"
                    : "bg-marconi/10 text-marconi hover:bg-marconi/20"
                }`}
              >
                {a.rotulo}
              </button>
            ))}
          </div>

          {!compacto && instante && instante.getTime() > Date.now() && (
            <p suppressHydrationWarning className="flex items-center gap-1.5 text-xs font-medium text-conplan">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marconi opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-marconi" />
              </span>
              Vai ao ar {faltaPara(instante)}
            </p>
          )}
        </div>
      )}

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
