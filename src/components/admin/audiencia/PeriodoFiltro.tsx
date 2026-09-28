"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Opcao = { chave: string; rotulo: string };

/**
 * Filtro de período da Audiência — uma linha só, acima de tudo que ele afeta.
 *
 * Troca pela URL (?p=7), então o link do período pode ser salvo ou mandado. O
 * destaque desliza até a opção clicada na hora; enquanto os números novos
 * chegam, o painel antigo fica esmaecido no lugar — sem piscar nem pular.
 */
export default function PeriodoFiltro({
  opcoes,
  atual,
  children,
}: {
  opcoes: readonly Opcao[];
  atual: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pendente, iniciar] = useTransition();
  const [marcado, setMarcado] = useState(atual);

  useEffect(() => setMarcado(atual), [atual]);

  function escolher(chave: string) {
    if (chave === marcado) return;
    setMarcado(chave);
    iniciar(() => router.push(`${pathname}?p=${chave}`, { scroll: false }));
  }

  return (
    <>
      <div
        role="group"
        aria-label="Período"
        className="grid w-full grid-cols-4 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:inline-grid sm:w-auto"
      >
        {opcoes.map((o) => {
          const ativo = o.chave === marcado;
          return (
            <button
              key={o.chave}
              type="button"
              onClick={() => escolher(o.chave)}
              aria-pressed={ativo}
              className={`relative min-h-9 rounded-full px-3 text-sm font-semibold transition-colors sm:px-5 ${
                ativo ? "text-white" : "text-slate-500 hover:text-conplan"
              }`}
            >
              {ativo && (
                <motion.span
                  layoutId="periodo-ativo"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  className="absolute inset-0 rounded-full bg-conplan shadow"
                />
              )}
              <span className="relative">{o.rotulo}</span>
            </button>
          );
        })}
      </div>

      <div
        aria-busy={pendente}
        className={`transition-opacity duration-300 ${pendente ? "pointer-events-none opacity-50" : ""}`}
      >
        {children}
      </div>
    </>
  );
}
