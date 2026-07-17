"use client";

import { useState } from "react";
import { linkWhatsApp, mensagemDaNoticia } from "@/lib/share";

type Props = {
  title: string;
  /** resumo da notícia — entra na mensagem compartilhada */
  summary?: string | null;
};

const botaoClass =
  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-white ring-1 backdrop-blur-sm transition-colors";

export default function ShareButton({ title, summary }: Props) {
  const [copied, setCopied] = useState(false);

  function mensagem() {
    return mensagemDaNoticia({ title, summary, url: window.location.href });
  }

  async function onShare() {
    const texto = mensagem();

    if (navigator.share) {
      try {
        // `text` sem `url` de propósito: passando os dois, o iOS entrega só o
        // link ao WhatsApp e a mensagem se perde. Com o link dentro do texto,
        // o card é montado igual e a mensagem chega sempre.
        await navigator.share({ title, text: texto });
        return;
      } catch (err) {
        // Desistir de compartilhar não é erro — não faz sentido copiar o que a
        // pessoa acabou de cancelar.
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  function onWhatsApp() {
    window.open(linkWhatsApp(mensagem()), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onWhatsApp}
        aria-label="Compartilhar no WhatsApp"
        className={`${botaoClass} bg-[#25D366]/90 ring-white/20 hover:bg-[#25D366]`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.18 8.18 0 0 1 5.82 2.42 8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.69 8.23-8.24 8.23z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        className={`${botaoClass} bg-white/10 ring-white/20 hover:bg-white/20`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {copied ? "Copiado!" : "Compartilhar"}
      </button>
    </div>
  );
}
