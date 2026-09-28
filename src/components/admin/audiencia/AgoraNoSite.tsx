"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * "N pessoas no site agora" — quem abriu alguma página nos últimos 5 minutos.
 *
 * Atualiza sozinho a cada 20 segundos (só com a aba visível, para não gastar à
 * toa). O número troca deslizando, e o ponto verde pulsa enquanto há gente.
 */
export default function AgoraNoSite({ inicial }: { inicial: number }) {
  const [agora, setAgora] = useState(inicial);

  useEffect(() => {
    let ativo = true;
    const buscar = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/admin/audiencia/agora", { cache: "no-store" });
        if (r.ok && ativo) setAgora((await r.json()).agora);
      } catch {
        /* sem rede: mantém o último número */
      }
    };
    const relogio = setInterval(buscar, 20_000);
    document.addEventListener("visibilitychange", buscar);
    return () => {
      ativo = false;
      clearInterval(relogio);
      document.removeEventListener("visibilitychange", buscar);
    };
  }, []);

  const tem = agora > 0;

  return (
    <div
      title="Pessoas que abriram alguma página do site nos últimos 5 minutos"
      className="inline-flex min-h-10 items-center gap-2.5 rounded-full bg-white px-4 text-sm shadow-sm ring-1 ring-slate-200"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {tem && (
          <span className="absolute inline-flex h-full w-full animate-soft-ping rounded-full bg-emerald-500" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tem ? "bg-emerald-500" : "bg-slate-300"}`}
        />
      </span>

      <span className="relative inline-flex h-5 min-w-[1ch] items-center overflow-hidden font-semibold text-conplan">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={agora}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {agora.toLocaleString("pt-BR")}
          </motion.span>
        </AnimatePresence>
      </span>

      <span className="text-slate-500">{agora === 1 ? "pessoa no site agora" : "no site agora"}</span>
    </div>
  );
}
