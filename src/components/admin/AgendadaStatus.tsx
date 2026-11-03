"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cancelarAgendamento, toggleNewsPublish } from "@/app/admin/actions";
import { faltaPara, formatarAgendamento } from "@/lib/datas";

/**
 * Quando a notícia da fila entra no ar e quanto falta. Quando a hora chega,
 * recarrega a lista para a pessoa ver a notícia virar "Publicada" sem precisar
 * atualizar a página.
 */
export function AgendadaHora({ scheduledAt }: { scheduledAt: Date }) {
  const router = useRouter();
  // Só depois de montar: o tempo que falta muda entre o servidor e o navegador.
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    let venceu = false;
    const tique = () => {
      const now = new Date();
      setAgora(now);
      if (now >= scheduledAt) {
        // O publicador gira a cada 30s: recarrega até ela sair da fila.
        if (venceu) router.refresh();
        venceu = true;
      }
    };
    tique();
    const timer = setInterval(tique, 15_000);
    return () => clearInterval(timer);
  }, [scheduledAt, router]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-conplan">
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marconi opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-marconi" />
      </span>
      {formatarAgendamento(scheduledAt)}
      {agora && <span className="font-normal text-slate-500">· {faltaPara(scheduledAt, agora)}</span>}
    </span>
  );
}

/** Mudou de ideia: publica antes da hora, ou tira da fila. */
export function AgendadaAcoes({ id }: { id: string }) {
  return (
    <div className="flex gap-1.5">
      <form action={toggleNewsPublish.bind(null, id, true)}>
        <button
          type="submit"
          className="min-h-8 whitespace-nowrap rounded-full bg-marconi/10 px-3 text-[11px] font-semibold text-marconi transition-colors hover:bg-marconi/20"
        >
          Publicar agora
        </button>
      </form>
      <form action={cancelarAgendamento.bind(null, id)}>
        <button
          type="submit"
          title="A notícia volta a ser rascunho"
          className="min-h-8 rounded-full bg-slate-100 px-3 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-200"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
