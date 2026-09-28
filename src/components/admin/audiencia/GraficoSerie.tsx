"use client";

import { useRef, useState } from "react";
import type { PontoSerie } from "@/lib/audiencia";

/** Azul da marca para dados (validado contra o branco do card). */
const COR = "#1d4f91";
const W = 1000;
const H = 200;

/**
 * Topo "redondo" para o eixo: 7 → 8, 23 → 24, 102 → 120. Degraus finos de
 * propósito (com só 1-2-5, um pico de 102 pulava para 200 e metade do gráfico
 * ficava vazia) e sempre com metade inteira — a linha do meio nunca mostra
 * "7,5 acessos".
 */
function teto(v: number): number {
  if (v <= 4) return 4;
  const base = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.2, 1.6, 2, 2.4, 3, 4, 6, 8, 10]) {
    const t = m * base;
    if (t >= v && Number.isInteger(t / 2)) return t;
  }
  return 10 * base;
}

/** Índices com rótulo no eixo X: no máximo `max`, sempre o primeiro e o último. */
function rotulados(n: number, max: number): Set<number> {
  const passo = Math.max(1, Math.ceil(n / max));
  const s = new Set<number>();
  for (let i = 0; i < n; i += passo) s.add(i);
  // O último sempre aparece; se colar no anterior, o anterior sai.
  const ultimo = n - 1;
  const anterior = ultimo - (ultimo % passo);
  if (anterior !== ultimo && ultimo - anterior < passo / 2) s.delete(anterior);
  s.add(ultimo);
  return s;
}

const num = (v: number) => v.toLocaleString("pt-BR");

/**
 * Acessos no tempo (por dia, ou por hora em "Hoje"). Uma série só — a área é
 * o volume; leituras e visitantes vêm na dica e na tabela.
 *
 * A linha vertical acompanha o dedo/mouse e "gruda" no dia mais próximo; no
 * teclado, as setas andam dia a dia. A tabela logo abaixo tem os mesmos
 * números, para quem prefere ler do que apontar.
 */
export default function GraficoSerie({
  pontos,
  unidade = "dia",
}: {
  pontos: PontoSerie[];
  unidade?: "dia" | "hora";
}) {
  const [foco, setFoco] = useState<number | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const n = pontos.length;
  const maximo = teto(Math.max(0, ...pontos.map((p) => p.acessos)));
  const fx = (i: number) => (n === 1 ? 0.5 : i / (n - 1));
  const fy = (v: number) => 1 - v / maximo;
  const vazio = pontos.every((p) => p.acessos === 0);

  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${fx(i) * W},${fy(p.acessos) * H}`).join(" ");
  const area = `${linha} L${fx(n - 1) * W},${H} L${fx(0) * W},${H} Z`;
  // Dados novos (outro período) redesenham a linha do zero.
  const chaveAnimacao = `${n}-${pontos[0]?.rotulo}-${pontos.reduce((s, p) => s + p.acessos, 0)}`;

  const noCelular = rotulados(n, 4);
  const noComputador = rotulados(n, 7);

  function indicePor(clientX: number): number {
    const r = caixa.current?.getBoundingClientRect();
    if (!r || n <= 1) return 0;
    const f = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    return Math.round(f * (n - 1));
  }

  function teclado(e: React.KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const atual = foco ?? n - 1;
    setFoco(Math.min(Math.max(atual + (e.key === "ArrowRight" ? 1 : -1), 0), n - 1));
  }

  const p = foco !== null ? pontos[foco] : null;
  const px = foco !== null ? fx(foco) : 0;

  return (
    <div>
      <div
        ref={caixa}
        tabIndex={0}
        role="group"
        aria-label={`Acessos por ${unidade}. Use as setas para ver cada ${unidade}.`}
        onPointerMove={(e) => setFoco(indicePor(e.clientX))}
        onPointerDown={(e) => setFoco(indicePor(e.clientX))}
        onPointerLeave={() => setFoco(null)}
        onFocus={() => setFoco((f) => f ?? n - 1)}
        onBlur={() => setFoco(null)}
        onKeyDown={teclado}
        className="relative mt-5 h-40 touch-pan-y select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-conplan/20 sm:h-52"
      >
        {/* Grade: três linhas finas, com o valor em cima de cada uma. */}
        {[1, 0.5, 0].map((f) => (
          <div
            key={f}
            className="pointer-events-none absolute inset-x-0 border-t border-slate-100"
            style={{ top: `${(1 - f) * 100}%` }}
          >
            {f > 0 && (
              <span className="absolute left-0 -translate-y-full pb-0.5 text-[10px] tabular-nums text-slate-400">
                {num(maximo * f)}
              </span>
            )}
          </div>
        ))}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {n > 1 && (
            <g key={chaveAnimacao}>
              <path d={area} fill={COR} fillOpacity={0.1} className="animate-aparecer" />
              <path
                d={linha}
                fill="none"
                stroke={COR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray={1}
                className="animate-desenhar"
              />
            </g>
          )}
        </svg>

        {/* Um ponto só (primeira hora do dia): o marcador fica sempre visível. */}
        {n === 1 && (
          <span
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
            style={{ left: "50%", top: `${fy(pontos[0].acessos) * 100}%`, background: COR }}
          />
        )}

        {vazio && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            Nenhum acesso neste período
          </p>
        )}

        {/* Mira: linha vertical, marcador e a dica do ponto mais próximo. */}
        {p && (
          <>
            <span
              className="pointer-events-none absolute inset-y-0 w-px bg-slate-300"
              style={{ left: `${px * 100}%` }}
            />
            <span
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
              style={{ left: `${px * 100}%`, top: `${fy(p.acessos) * 100}%`, background: COR }}
            />
            <div
              role="status"
              className="pointer-events-none absolute top-0 z-10 w-max max-w-[12rem] rounded-xl bg-conplan px-3 py-2 shadow-lg"
              style={{
                left: `${px * 100}%`,
                transform: `translateX(${px < 0.2 ? "8px" : px > 0.8 ? "calc(-100% - 8px)" : "-50%"})`,
              }}
            >
              <p className="text-[11px] font-medium text-slate-300">{p.dica}</p>
              <p className="text-base font-semibold leading-tight text-white">
                {num(p.acessos)} <span className="text-xs font-normal text-slate-300">acessos</span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {num(p.leituras)} leituras · {num(p.visitantes)} visitantes
              </p>
            </div>
          </>
        )}
      </div>

      {/* Eixo X */}
      <div className="relative mt-2 h-4 text-[11px] tabular-nums text-slate-400">
        {pontos.map((pt, i) => {
          const m = noCelular.has(i);
          const d = noComputador.has(i);
          if (!m && !d) return null;
          const f = fx(i);
          return (
            <span
              key={i}
              className={`absolute top-0 whitespace-nowrap ${m ? "block" : "hidden"} ${d ? "sm:block" : "sm:hidden"}`}
              style={{
                left: `${f * 100}%`,
                transform: `translateX(${f === 0 && n > 1 ? "0" : f === 1 ? "-100%" : "-50%"})`,
              }}
            >
              {pt.rotulo}
            </span>
          );
        })}
      </div>

      {/* Os mesmos números em tabela. */}
      <details className="group mt-4 border-t border-slate-100 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-conplan">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
          Ver os números {unidade === "hora" ? "hora a hora" : "dia a dia"}
        </summary>
        <div className="mt-3 max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-1.5 font-semibold">{unidade === "hora" ? "Hora" : "Dia"}</th>
                <th className="py-1.5 text-right font-semibold">Acessos</th>
                <th className="py-1.5 text-right font-semibold">Leituras</th>
                <th className="py-1.5 text-right font-semibold">Visitantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {[...pontos].reverse().map((pt) => (
                <tr key={pt.dica} className="text-slate-600">
                  <td className="py-1.5">{pt.dica}</td>
                  <td className="py-1.5 text-right font-semibold text-conplan">{num(pt.acessos)}</td>
                  <td className="py-1.5 text-right">{num(pt.leituras)}</td>
                  <td className="py-1.5 text-right">{num(pt.visitantes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
