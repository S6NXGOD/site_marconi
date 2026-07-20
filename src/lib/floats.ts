"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Coordenação dos avisos flutuantes (prazos e WhatsApp).
 *
 * No desktop os dois cabem em cantos opostos e convivem. No mobile, cada card
 * ocupa quase a largura inteira — abrir os dois deixava um em cima do outro.
 * Aqui cada float avisa quando está aberto; no mobile, o que está fechado se
 * esconde enquanto o outro está aberto. Resultado: no celular, um por vez.
 */

export type FloatId = "prazos" | "whatsapp";

const abertos = new Set<FloatId>();
const listeners = new Set<() => void>();

function avisar() {
  listeners.forEach((l) => l());
}

/** Marca (ou desmarca) um float como aberto. */
export function marcarFloat(id: FloatId, aberto: boolean) {
  const tinha = abertos.has(id);
  if (aberto) abertos.add(id);
  else abertos.delete(id);
  if (abertos.has(id) !== tinha) avisar();
}

function assinar(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Algum OUTRO float (que não este) está aberto? */
export function useOutroFloatAberto(id: FloatId): boolean {
  return useSyncExternalStore(
    assinar,
    // Há outro aberto se: 2+ abertos, ou exatamente 1 que não é este.
    () => abertos.size >= 2 || (abertos.size === 1 && !abertos.has(id)),
    () => false // no servidor, nada aberto
  );
}

/** True em telas de celular — mesma quebra do `sm` do Tailwind (640px). */
export function useEhMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mobile;
}
