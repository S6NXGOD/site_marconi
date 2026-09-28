"use client";

import { useCallback, useState } from "react";
import { ehCelular, linkWhatsApp } from "@/lib/share";
import ShareDialog, { WhatsAppIcon } from "@/components/ShareDialog";

/**
 * Compartilhar a notícia direto da lista do painel, sem abrir o site.
 *
 * Mesma mensagem pronta da página da matéria. No celular vai pelo wa.me, que
 * abre o app; no computador abre a janela com o WhatsApp instalado, o
 * WhatsApp Web e o copiar.
 */
export default function ShareNewsButton({ mensagem }: { mensagem: string }) {
  const [aberto, setAberto] = useState(false);
  const fechar = useCallback(() => setAberto(false), []);

  function compartilhar() {
    if (ehCelular()) {
      window.open(linkWhatsApp(mensagem), "_blank", "noopener,noreferrer");
      return;
    }
    setAberto(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={compartilhar}
        aria-label="Compartilhar no WhatsApp"
        title="Compartilhar no WhatsApp"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40"
      >
        <WhatsAppIcon size={14} />
        <span className="hidden sm:inline">Compartilhar</span>
      </button>
      <ShareDialog aberto={aberto} onFechar={fechar} mensagem={mensagem} />
    </>
  );
}
