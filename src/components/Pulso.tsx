"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ehAreaInterna,
  enviarPulso,
  noticiaDaPagina,
  origemDaSessao,
  registrarClique,
} from "@/lib/pulso-cliente";

/**
 * Medição de audiência do site público (a área "Audiência" do painel).
 *
 * A cada página aberta: registra a visita e, numa matéria, se ela foi LIDA —
 * não basta abrir: conta como leitura quem passou de 75% do texto e ficou pelo
 * menos 10 segundos com a página visível. Também soma o tempo de tela e manda
 * ao sair. Cliques em elementos com `data-pulso="..."` viram eventos.
 *
 * Não renderiza nada.
 */

const PROGRESSO_LEITURA = 0.75;
const SEGUNDOS_LEITURA = 10;

/** Última visita aberta — evita contar em dobro a mesma página. */
let ultima: { path: string; em: number; id: string } | null = null;

function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Navegador antigo: mesmo formato, gerado à mão.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const TIPOS = ["compartilhar", "contato_whatsapp", "cta_especialista"] as const;

export default function Pulso() {
  const pathname = usePathname();

  // ——— Visita, leitura e tempo ———
  useEffect(() => {
    if (!pathname || ehAreaInterna(pathname)) return;

    // O modo estrito do React (em desenvolvimento) roda este efeito duas vezes
    // seguidas: a segunda reaproveita a visita em vez de abrir outra.
    const agora = Date.now();
    let id: string;
    let espera: number | undefined;
    if (ultima && ultima.path === pathname && agora - ultima.em < 1500) {
      id = ultima.id;
    } else {
      id = novoId();
      ultima = { path: pathname, em: agora, id };

      const registrar = () => {
        const { r, o } = origemDaSessao();
        enviarPulso({ t: "v", id, p: pathname, n: noticiaDaPagina(), r, o });
      };
      // Numa matéria, espera a marcação da notícia aparecer (navegação
      // interna ainda pode estar pintando a página).
      if (/^\/noticias\/[^/]+$/.test(pathname) && !noticiaDaPagina()) {
        espera = window.setTimeout(registrar, 400);
      } else {
        registrar();
      }
    }

    const corpo = () => document.querySelector<HTMLElement>("[data-pulso-corpo]");
    let segundos = 0;
    let enviado = 0;
    let progresso = 0;
    let lida = false;

    const conferirLeitura = () => {
      if (lida || segundos < SEGUNDOS_LEITURA || progresso < PROGRESSO_LEITURA) return;
      if (!corpo()) return;
      lida = true;
      enviarPulso({ t: "l", id });
    };

    const medir = () => {
      const el = corpo();
      if (!el) return;
      const caixa = el.getBoundingClientRect();
      const p = (window.innerHeight - caixa.top) / Math.max(caixa.height, 1);
      if (p > progresso) progresso = p;
      conferirLeitura();
    };

    let quadro = 0;
    const aoRolar = () => {
      if (!quadro)
        quadro = requestAnimationFrame(() => {
          quadro = 0;
          medir();
        });
    };

    // Só conta o tempo com a página visível — aba em segundo plano não é leitura.
    const relogio = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      segundos += 1;
      conferirLeitura();
    }, 1000);

    const mandarTempo = () => {
      if (segundos <= enviado) return;
      enviado = segundos;
      enviarPulso({ t: "s", id, s: segundos });
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "hidden") mandarTempo();
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("pagehide", mandarTempo);
    medir();

    return () => {
      window.clearTimeout(espera);
      window.clearInterval(relogio);
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", aoRolar);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pagehide", mandarTempo);
      mandarTempo();
    };
  }, [pathname]);

  // ——— Cliques marcados com data-pulso ———
  useEffect(() => {
    const aoClicar = (e: MouseEvent) => {
      const alvo = (e.target as Element | null)?.closest?.("[data-pulso]") as HTMLElement | null;
      const tipo = alvo?.dataset.pulso as (typeof TIPOS)[number] | undefined;
      if (tipo && TIPOS.includes(tipo)) registrarClique(tipo);
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, []);

  return null;
}
